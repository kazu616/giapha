use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{Query, State};
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::Instrument;
use uuid::Uuid;

use crate::application::catalog::CatalogApplication;
use crate::application::genealogy::GenealogyApplication;
use crate::application::identity::{IdentityApplication, RegisterCommand};
use crate::domain::catalog::{ClanEvent, NewsArticle};
use crate::domain::error::DomainError;
use crate::domain::genealogy::model::{Clan, KinshipAnswer, Member};
use crate::domain::identity::{Account, OpenPerson, Place, Session};

#[derive(Clone)]
pub struct AppState {
    pub identity: IdentityApplication,
    pub genealogy: GenealogyApplication,
    pub catalog: CatalogApplication,
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/me", get(me).patch(patch_me))
        .route("/auth/me/place", get(my_place))
        .route("/people/available", get(available_people))
        .route("/clans", get(clans))
        .route("/people", get(people))
        .route("/kinship", post(kinship_route))
        .route("/news", get(news_list).post(news_create))
        .route("/events", get(events_list).post(events_create))
        .route("/rules", get(rules))
        .layer(TraceLayer::new_for_http())
        .layer(middleware::from_fn(request_id))
        .layer(cors_layer())
        .with_state(state)
}

fn cors_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
}

async fn request_id(request: axum::extract::Request, next: Next) -> Response {
    let header_id = request
        .headers()
        .get("x-request-id")
        .and_then(|value| value.to_str().ok())
        .and_then(clean_request_id);
    let id = header_id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let method = request.method().clone();
    let path = request.uri().path().to_string();
    let span = tracing::info_span!("http", %method, %path, request_id = %id);
    let mut response = next.run(request).instrument(span).await;
    if let Ok(value) = HeaderValue::from_str(&id) {
        response.headers_mut().insert("x-request-id", value);
    }
    response
}

fn clean_request_id(raw: &str) -> Option<String> {
    if raw.is_empty() || raw.len() > 128 {
        return None;
    }
    if raw.chars().all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_') {
        Some(raw.to_string())
    } else {
        None
    }
}

#[derive(Serialize)]
struct HealthBody {
    ok: bool,
}

async fn health() -> Json<HealthBody> {
    Json(HealthBody { ok: true })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AccountBody {
    id: Uuid,
    email: String,
    name: String,
    role: String,
    person_id: Option<String>,
    person_name: Option<String>,
    clan_id: Option<String>,
    clan_kind: Option<String>,
}

impl From<Account> for AccountBody {
    fn from(account: Account) -> Self {
        Self {
            id: account.id,
            email: account.email,
            name: account.name,
            role: account.role,
            person_id: account.person_id,
            person_name: account.person_name,
            clan_id: account.clan_id,
            clan_kind: account.clan_kind,
        }
    }
}

#[derive(Serialize)]
struct SessionBody {
    token: String,
    user: AccountBody,
}

impl From<Session> for SessionBody {
    fn from(session: Session) -> Self {
        Self {
            token: session.token,
            user: session.account.into(),
        }
    }
}

fn private_json<T: Serialize>(status: StatusCode, body: T) -> Response {
    let mut response = (status, Json(body)).into_response();
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    response
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RegisterBody {
    email: String,
    password: String,
    name: String,
    person_id: String,
}

#[derive(Deserialize)]
struct LoginBody {
    email: String,
    password: String,
}

#[derive(Deserialize)]
struct PatchBody {
    name: String,
}

async fn register(
    State(state): State<AppState>,
    payload: Result<Json<RegisterBody>, JsonRejection>,
) -> Result<Response, DomainError> {
    let Json(body) = payload.map_err(|_| DomainError::invalid("Dữ liệu không hợp lệ"))?;
    let session = state
        .identity
        .register(RegisterCommand {
            email: body.email,
            password: body.password,
            name: body.name,
            person_id: body.person_id,
        })
        .await?;
    Ok(private_json(StatusCode::CREATED, SessionBody::from(session)))
}

async fn login(
    State(state): State<AppState>,
    payload: Result<Json<LoginBody>, JsonRejection>,
) -> Result<Response, DomainError> {
    let Json(body) = payload.map_err(|_| DomainError::invalid("Dữ liệu không hợp lệ"))?;
    let session = state.identity.login(&body.email, &body.password).await?;
    Ok(private_json(StatusCode::OK, SessionBody::from(session)))
}

async fn me(State(state): State<AppState>, headers: HeaderMap) -> Result<Response, DomainError> {
    let account = state
        .identity
        .account_from_bearer(headers.get(header::AUTHORIZATION).and_then(|value| value.to_str().ok()))
        .await?;
    Ok(private_json(StatusCode::OK, AccountBody::from(account)))
}

async fn patch_me(
    State(state): State<AppState>,
    headers: HeaderMap,
    payload: Result<Json<PatchBody>, JsonRejection>,
) -> Result<Response, DomainError> {
    let account = state
        .identity
        .account_from_bearer(headers.get(header::AUTHORIZATION).and_then(|value| value.to_str().ok()))
        .await?;
    let Json(body) = payload.map_err(|_| DomainError::invalid("Dữ liệu không hợp lệ"))?;
    let updated = state.identity.rename(&account, &body.name).await?;
    Ok(private_json(StatusCode::OK, AccountBody::from(updated)))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OpenPersonBody {
    id: String,
    name: String,
    generation: Option<i32>,
    clan_id: String,
    clan_name: String,
}

impl From<OpenPerson> for OpenPersonBody {
    fn from(person: OpenPerson) -> Self {
        Self {
            id: person.id,
            name: person.name,
            generation: person.generation,
            clan_id: person.clan_id,
            clan_name: person.clan_name,
        }
    }
}

async fn available_people(State(state): State<AppState>) -> Result<Json<Vec<OpenPersonBody>>, DomainError> {
    let rows = state.identity.unclaimed().await?;
    Ok(Json(rows.into_iter().map(OpenPersonBody::from).collect()))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PlaceBody {
    person_id: String,
    name: String,
    clan_id: String,
    clan_kind: String,
    generation: Option<i32>,
    path: Vec<PlaceStepBody>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PlaceStepBody {
    id: String,
    name: String,
    generation: Option<i32>,
}

impl From<Place> for PlaceBody {
    fn from(place: Place) -> Self {
        Self {
            person_id: place.person_id,
            name: place.name,
            clan_id: place.clan_id,
            clan_kind: place.clan_kind,
            generation: place.generation,
            path: place
                .path
                .into_iter()
                .map(|step| PlaceStepBody {
                    id: step.id,
                    name: step.name,
                    generation: step.generation,
                })
                .collect(),
        }
    }
}

async fn my_place(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<PlaceBody>, DomainError> {
    let account = state
        .identity
        .account_from_bearer(headers.get(header::AUTHORIZATION).and_then(|value| value.to_str().ok()))
        .await?;
    let place = state.identity.place_of(&account).await?;
    Ok(Json(place.into()))
}

#[derive(Serialize)]
struct ClanBody {
    id: String,
    name: String,
    kind: String,
}

async fn clans(State(state): State<AppState>) -> Result<Json<Vec<ClanBody>>, DomainError> {
    let rows = state.genealogy.clans().await?;
    Ok(Json(
        rows.into_iter()
            .map(|clan: Clan| ClanBody {
                id: clan.id,
                name: clan.name,
                kind: clan.kind,
            })
            .collect(),
    ))
}

#[derive(Deserialize)]
struct PeopleQuery {
    clan: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MemberBody {
    id: String,
    clan_id: String,
    name: String,
    gender: String,
    father_id: Option<String>,
    mother_id: Option<String>,
    spouse_id: Option<String>,
    order: Option<i32>,
    generation: Option<i32>,
    note: String,
}

impl From<Member> for MemberBody {
    fn from(member: Member) -> Self {
        Self {
            id: member.id,
            clan_id: member.clan_id,
            name: member.name,
            gender: member.gender,
            father_id: member.father_id,
            mother_id: member.mother_id,
            spouse_id: member.spouse_id,
            order: member.order,
            generation: member.generation,
            note: member.note,
        }
    }
}

async fn people(
    State(state): State<AppState>,
    query: Result<Query<PeopleQuery>, QueryRejection>,
) -> Result<Json<Vec<MemberBody>>, DomainError> {
    let Query(query) = query.map_err(|_| DomainError::invalid("Thiếu hoặc sai tham số clan"))?;
    let rows = state.genealogy.members_of(&query.clan).await?;
    Ok(Json(rows.into_iter().map(MemberBody::from).collect()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct KinshipBody {
    from_id: String,
    to_id: String,
    region: Option<String>,
    graph: String,
    prefer: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct KinshipBodyOut {
    term: Option<String>,
    term_goc: Option<String>,
    reverse_term: Option<String>,
    side: Option<String>,
    kind: String,
    a: Option<i32>,
    b: Option<i32>,
    ancestor_id: Option<String>,
}

impl From<KinshipAnswer> for KinshipBodyOut {
    fn from(answer: KinshipAnswer) -> Self {
        Self {
            term: answer.term,
            term_goc: answer.term_goc,
            reverse_term: answer.reverse_term,
            side: answer.side,
            kind: answer.kind,
            a: answer.a,
            b: answer.b,
            ancestor_id: answer.ancestor_id,
        }
    }
}

async fn kinship_route(
    State(state): State<AppState>,
    payload: Result<Json<KinshipBody>, JsonRejection>,
) -> Result<Json<KinshipBodyOut>, DomainError> {
    let Json(body) = payload.map_err(|_| DomainError::invalid("Dữ liệu không hợp lệ"))?;
    let answer = state
        .genealogy
        .relate(
            &body.from_id,
            &body.to_id,
            body.region.as_deref().unwrap_or("bac"),
            &body.graph,
            body.prefer.as_deref().unwrap_or("gan"),
        )
        .await?;
    Ok(Json(answer.into()))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NewsBodyOut {
    id: Uuid,
    title: String,
    body: String,
    author_id: Uuid,
    published_at: chrono::DateTime<chrono::Utc>,
}

impl From<NewsArticle> for NewsBodyOut {
    fn from(article: NewsArticle) -> Self {
        Self {
            id: article.id,
            title: article.title,
            body: article.body,
            author_id: article.author_id,
            published_at: article.published_at,
        }
    }
}

async fn news_list(State(state): State<AppState>) -> Result<Json<Vec<NewsBodyOut>>, DomainError> {
    let rows = state.catalog.news().await?;
    Ok(Json(rows.into_iter().map(NewsBodyOut::from).collect()))
}

#[derive(Deserialize)]
struct NewsBodyIn {
    title: String,
    body: String,
}

async fn news_create(
    State(state): State<AppState>,
    headers: HeaderMap,
    payload: Result<Json<NewsBodyIn>, JsonRejection>,
) -> Result<(StatusCode, Json<NewsBodyOut>), DomainError> {
    let account = state
        .identity
        .account_from_bearer(headers.get(header::AUTHORIZATION).and_then(|value| value.to_str().ok()))
        .await?;
    let Json(body) = payload.map_err(|_| DomainError::invalid("Dữ liệu không hợp lệ"))?;
    let created = state.catalog.publish_news(&account, &body.title, &body.body).await?;
    Ok((StatusCode::CREATED, Json(created.into())))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EventBodyOut {
    id: Uuid,
    title: String,
    kind: String,
    event_date: chrono::NaiveDate,
    place: String,
    body: String,
}

impl From<ClanEvent> for EventBodyOut {
    fn from(event: ClanEvent) -> Self {
        Self {
            id: event.id,
            title: event.title,
            kind: event.kind,
            event_date: event.event_date,
            place: event.place,
            body: event.body,
        }
    }
}

async fn events_list(State(state): State<AppState>) -> Result<Json<Vec<EventBodyOut>>, DomainError> {
    let rows = state.catalog.events().await?;
    Ok(Json(rows.into_iter().map(EventBodyOut::from).collect()))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EventBodyIn {
    title: String,
    kind: String,
    event_date: String,
    place: String,
    body: String,
}

async fn events_create(
    State(state): State<AppState>,
    headers: HeaderMap,
    payload: Result<Json<EventBodyIn>, JsonRejection>,
) -> Result<(StatusCode, Json<EventBodyOut>), DomainError> {
    let account = state
        .identity
        .account_from_bearer(headers.get(header::AUTHORIZATION).and_then(|value| value.to_str().ok()))
        .await?;
    let Json(body) = payload.map_err(|_| DomainError::invalid("Dữ liệu không hợp lệ"))?;
    let created = state
        .catalog
        .publish_event(&account, &body.title, &body.kind, &body.event_date, &body.place, &body.body)
        .await?;
    Ok((StatusCode::CREATED, Json(created.into())))
}

#[derive(Deserialize)]
struct RulesQuery {
    a: i32,
    b: i32,
}

async fn rules(
    State(state): State<AppState>,
    query: Result<Query<RulesQuery>, QueryRejection>,
) -> Result<Json<Value>, DomainError> {
    let Query(query) = query.map_err(|_| DomainError::invalid("Thiếu hoặc sai a, b"))?;
    Ok(Json(state.genealogy.rule(query.a, query.b)?))
}
