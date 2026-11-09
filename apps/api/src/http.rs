use std::collections::HashMap;

use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{Query, State};
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::Instrument;
use uuid::Uuid;

use crate::auth;
use crate::error::{is_unique_violation, AppError};
use crate::kinship::{self, Person};
use crate::AppState;

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
    if raw
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_')
    {
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

#[derive(Debug, Serialize, sqlx::FromRow, Clone)]
#[serde(rename_all = "camelCase")]
struct UserPublic {
    id: Uuid,
    email: String,
    name: String,
    role: String,
    person_id: Option<String>,
    person_name: Option<String>,
    clan_id: Option<String>,
    clan_kind: Option<String>,
}

const USER_SQL: &str = "SELECT u.id, u.email, u.name, u.role, u.person_id, p.name AS person_name, p.clan_id, c.kind AS clan_kind
         FROM users u
         LEFT JOIN people p ON p.id = u.person_id
         LEFT JOIN clans c ON c.id = p.clan_id";

#[derive(Debug, sqlx::FromRow)]
struct UserAuth {
    id: Uuid,
    email: String,
    name: String,
    password_hash: String,
    role: String,
}

#[derive(Serialize)]
struct AuthResponse {
    token: String,
    user: UserPublic,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RegisterBody {
    email: String,
    password: String,
    name: String,
    person_id: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct OpenPerson {
    id: String,
    name: String,
    generation: Option<i32>,
    clan_id: String,
    clan_name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PlaceStep {
    id: String,
    name: String,
    generation: Option<i32>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PlaceOut {
    person_id: String,
    name: String,
    clan_id: String,
    clan_kind: String,
    generation: Option<i32>,
    path: Vec<PlaceStep>,
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
struct KinshipOut {
    term: Option<String>,
    term_goc: Option<String>,
    reverse_term: Option<String>,
    side: Option<String>,
    kind: String,
    a: Option<i32>,
    b: Option<i32>,
    ancestor_id: Option<String>,
}

#[derive(Deserialize)]
struct PeopleQuery {
    clan: String,
}

#[derive(Deserialize)]
struct RulesQuery {
    a: i32,
    b: i32,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
struct ClanOut {
    id: String,
    name: String,
    kind: String,
}

#[derive(Debug, sqlx::FromRow)]
struct PersonRow {
    id: String,
    clan_id: String,
    name: String,
    gender: String,
    father_id: Option<String>,
    mother_id: Option<String>,
    spouse_id: Option<String>,
    birth_order: Option<i32>,
    generation: Option<i32>,
    note: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PersonOut {
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

#[derive(Deserialize)]
struct NewsBody {
    title: String,
    body: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct NewsOut {
    id: Uuid,
    title: String,
    body: String,
    author_id: Uuid,
    published_at: DateTime<Utc>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EventBody {
    title: String,
    kind: String,
    event_date: String,
    place: String,
    body: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct EventOut {
    id: Uuid,
    title: String,
    kind: String,
    event_date: NaiveDate,
    place: String,
    body: String,
}

fn auth_json<T: Serialize>(status: StatusCode, body: T) -> Response {
    let mut response = (status, Json(body)).into_response();
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    response
}

async fn register(
    State(state): State<AppState>,
    payload: Result<Json<RegisterBody>, JsonRejection>,
) -> Result<Response, AppError> {
    let Json(body) = payload.map_err(|_| AppError::bad_request("Dữ liệu không hợp lệ"))?;
    let email = normalize_email(&body.email)?;
    check_password(&body.password)?;
    let name = require_text(&body.name, "Tên", 120)?;
    let person_id = require_text(&body.person_id, "Người trên gia phả", 40)?;
    let exists: Option<String> = sqlx::query_scalar("SELECT id FROM people WHERE id = $1")
        .bind(&person_id)
        .fetch_optional(&state.pool)
        .await?;
    if exists.is_none() {
        return Err(AppError::bad_request("Không có người này trên gia phả"));
    }
    let taken: Option<Uuid> = sqlx::query_scalar("SELECT id FROM users WHERE person_id = $1")
        .bind(&person_id)
        .fetch_optional(&state.pool)
        .await?;
    if taken.is_some() {
        return Err(AppError::conflict("Người này đã có tài khoản"));
    }
    let password_hash = auth::hash_password(&body.password)?;
    let user_id = Uuid::new_v4();
    let inserted = sqlx::query(
        "INSERT INTO users (id, email, name, password_hash, role, person_id) VALUES ($1, $2, $3, $4, 'member', $5)",
    )
    .bind(user_id)
    .bind(&email)
    .bind(&name)
    .bind(&password_hash)
    .bind(&person_id)
    .execute(&state.pool)
    .await;
    if let Err(err) = inserted {
        if is_unique_violation(&err) {
            return Err(AppError::conflict("Email đã được đăng ký hoặc người này đã có tài khoản"));
        }
        return Err(err.into());
    }
    let user = load_user(&state, user_id).await?;
    let token = auth::issue_token(&state.jwt_secret, user.id)?;
    tracing::info!(user_id = %user.id, "đã đăng ký");
    Ok(auth_json(
        StatusCode::CREATED,
        AuthResponse { token, user },
    ))
}

async fn login(
    State(state): State<AppState>,
    payload: Result<Json<LoginBody>, JsonRejection>,
) -> Result<Response, AppError> {
    let Json(body) = payload.map_err(|_| AppError::bad_request("Dữ liệu không hợp lệ"))?;
    let email = normalize_email(&body.email)?;
    check_password(&body.password)?;
    let user = sqlx::query_as::<_, UserAuth>(
        "SELECT id, email, name, password_hash, role FROM users WHERE email = $1",
    )
    .bind(&email)
    .fetch_optional(&state.pool)
    .await?;
    let valid = match &user {
        Some(user) => auth::verify_password(&body.password, &user.password_hash),
        None => {
            let _ = auth::verify_password(&body.password, &state.dummy_hash);
            false
        }
    };
    let Some(user) = user.filter(|_| valid) else {
        return Err(AppError::unauthorized("Email hoặc mật khẩu không đúng"));
    };
    let token = auth::issue_token(&state.jwt_secret, user.id)?;
    let public = load_user(&state, user.id).await?;
    Ok(auth_json(StatusCode::OK, AuthResponse { token, user: public }))
}

async fn me(State(state): State<AppState>, headers: HeaderMap) -> Result<Response, AppError> {
    let user = current_user(&state, &headers).await?;
    Ok(auth_json(StatusCode::OK, user))
}

async fn patch_me(
    State(state): State<AppState>,
    headers: HeaderMap,
    payload: Result<Json<PatchBody>, JsonRejection>,
) -> Result<Response, AppError> {
    let user = current_user(&state, &headers).await?;
    let Json(body) = payload.map_err(|_| AppError::bad_request("Dữ liệu không hợp lệ"))?;
    let name = require_text(&body.name, "Tên", 120)?;
    sqlx::query("UPDATE users SET name = $1 WHERE id = $2")
        .bind(&name)
        .bind(user.id)
        .execute(&state.pool)
        .await?;
    let updated = load_user(&state, user.id).await?;
    Ok(auth_json(StatusCode::OK, updated))
}

async fn clans(State(state): State<AppState>) -> Result<Json<Vec<ClanOut>>, AppError> {
    let rows = sqlx::query_as::<_, ClanOut>(
        "SELECT id, name, kind FROM clans
         ORDER BY CASE id WHEN 'nguyen-mau' THEN 0 WHEN 'nguyen' THEN 1 WHEN 'duong' THEN 2 ELSE 3 END, id",
    )
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(rows))
}

async fn people(
    State(state): State<AppState>,
    query: Result<Query<PeopleQuery>, QueryRejection>,
) -> Result<Json<Vec<PersonOut>>, AppError> {
    let Query(query) = query.map_err(|_| AppError::bad_request("Thiếu hoặc sai tham số clan"))?;
    let clan = query.clan.trim();
    if clan.is_empty() || clan.len() > 64 {
        return Err(AppError::bad_request("clan không hợp lệ"));
    }
    let exists: bool = sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM clans WHERE id = $1)")
        .bind(clan)
        .fetch_one(&state.pool)
        .await?;
    if !exists {
        return Err(AppError::not_found("Không tìm thấy dòng họ"));
    }
    let rows = load_people(&state, clan, clan).await?;
    Ok(Json(rows.into_iter().map(person_out).collect()))
}

async fn kinship_route(
    State(state): State<AppState>,
    payload: Result<Json<KinshipBody>, JsonRejection>,
) -> Result<Json<KinshipOut>, AppError> {
    let Json(body) = payload.map_err(|_| AppError::bad_request("Dữ liệu không hợp lệ"))?;
    let from_id = require_id(&body.from_id, "fromId")?;
    let to_id = require_id(&body.to_id, "toId")?;
    let region = body.region.unwrap_or_else(|| "bac".to_string());
    let region = region.trim().to_ascii_lowercase();
    if !matches!(region.as_str(), "bac" | "trung" | "nam") {
        return Err(AppError::bad_request("region phải là bac, trung hoặc nam"));
    }
    let graph = body.graph.trim().to_ascii_lowercase();
    let prefer = body.prefer.unwrap_or_else(|| "gan".to_string());
    let prefer = prefer.trim().to_ascii_lowercase();
    if !matches!(prefer.as_str(), "gan" | "noi" | "ngoai") {
        return Err(AppError::bad_request("prefer phải là gan, noi hoặc ngoai"));
    }
    match graph.as_str() {
        "mau" => kinship_mau(&state, &from_id, &to_id, &region).await,
        "lien" => kinship_lien(&state, &from_id, &to_id, &region, &prefer).await,
        _ => Err(AppError::bad_request("graph phải là mau hoặc lien")),
    }
}

async fn kinship_mau(
    state: &AppState,
    from_id: &str,
    to_id: &str,
    region: &str,
) -> Result<Json<KinshipOut>, AppError> {
    let rows = load_people(state, "nguyen-mau", "nguyen-mau").await?;
    let graph = graph_from_rows(rows);
    let Some(rel) = kinship::relate_mau(&graph, from_id, to_id, region) else {
        return Err(AppError::not_found("Không tìm thấy người trong phả đồ này"));
    };
    if !rel.dong_toc {
        return Ok(Json(KinshipOut {
            term: None,
            term_goc: None,
            reverse_term: None,
            side: None,
            kind: "none".to_string(),
            a: None,
            b: None,
            ancestor_id: None,
        }));
    }
    Ok(Json(KinshipOut {
        term: rel.term,
        term_goc: rel.term_goc,
        reverse_term: rel.reverse_term,
        side: None,
        kind: "blood".to_string(),
        a: rel.a,
        b: rel.b,
        ancestor_id: rel.ancestor_id,
    }))
}

async fn kinship_lien(
    state: &AppState,
    from_id: &str,
    to_id: &str,
    region: &str,
    prefer: &str,
) -> Result<Json<KinshipOut>, AppError> {
    let rows = load_people(state, "nguyen", "duong").await?;
    let graph = graph_from_rows(rows);
    let Some(rel) = kinship::relate_lien(&graph, &state.lien_rules, from_id, to_id, prefer) else {
        return Err(AppError::not_found("Không tìm thấy người trong phả đồ này"));
    };
    let reverse = kinship::relate_lien(&graph, &state.lien_rules, to_id, from_id, prefer);
    let reverse_term = reverse
        .and_then(|item| item.term)
        .map(|term| kinship::regionalize(&term, region));
    let term = rel.term.as_deref().map(|term| kinship::regionalize(term, region));
    Ok(Json(KinshipOut {
        term,
        term_goc: rel.term,
        reverse_term,
        side: rel.side,
        kind: rel.kind.to_string(),
        a: rel.a,
        b: rel.b,
        ancestor_id: rel.ancestor_id,
    }))
}

async fn news_list(State(state): State<AppState>) -> Result<Json<Vec<NewsOut>>, AppError> {
    let rows = sqlx::query_as::<_, NewsOut>(
        "SELECT id, title, body, author_id, published_at FROM news ORDER BY published_at DESC, id",
    )
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(rows))
}

async fn news_create(
    State(state): State<AppState>,
    headers: HeaderMap,
    payload: Result<Json<NewsBody>, JsonRejection>,
) -> Result<(StatusCode, Json<NewsOut>), AppError> {
    let user = current_user(&state, &headers).await?;
    ensure_writer(&user)?;
    let Json(payload) = payload.map_err(|_| AppError::bad_request("Dữ liệu không hợp lệ"))?;
    let title = require_text(&payload.title, "Tiêu đề", 200)?;
    let body = require_text(&payload.body, "Nội dung", 20_000)?;
    let created = sqlx::query_as::<_, NewsOut>(
        "INSERT INTO news (id, title, body, author_id, published_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, body, author_id, published_at",
    )
    .bind(Uuid::new_v4())
    .bind(title)
    .bind(body)
    .bind(user.id)
    .bind(Utc::now())
    .fetch_one(&state.pool)
    .await?;
    Ok((StatusCode::CREATED, Json(created)))
}

async fn events_list(State(state): State<AppState>) -> Result<Json<Vec<EventOut>>, AppError> {
    let rows = sqlx::query_as::<_, EventOut>(
        "SELECT id, title, kind, event_date, place, body FROM events ORDER BY event_date, id",
    )
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(rows))
}

async fn events_create(
    State(state): State<AppState>,
    headers: HeaderMap,
    payload: Result<Json<EventBody>, JsonRejection>,
) -> Result<(StatusCode, Json<EventOut>), AppError> {
    let user = current_user(&state, &headers).await?;
    ensure_writer(&user)?;
    let Json(payload) = payload.map_err(|_| AppError::bad_request("Dữ liệu không hợp lệ"))?;
    let title = require_text(&payload.title, "Tiêu đề", 200)?;
    let kind = require_text(&payload.kind, "Loại sự kiện", 80)?;
    let place = require_text(&payload.place, "Địa điểm", 200)?;
    let body = require_text(&payload.body, "Nội dung", 20_000)?;
    let event_date = parse_date(&payload.event_date)?;
    let created = sqlx::query_as::<_, EventOut>(
        "INSERT INTO events (id, title, kind, event_date, place, body)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, kind, event_date, place, body",
    )
    .bind(Uuid::new_v4())
    .bind(title)
    .bind(kind)
    .bind(event_date)
    .bind(place)
    .bind(body)
    .fetch_one(&state.pool)
    .await?;
    Ok((StatusCode::CREATED, Json(created)))
}

async fn rules(
    State(state): State<AppState>,
    query: Result<Query<RulesQuery>, QueryRejection>,
) -> Result<Json<Value>, AppError> {
    let Query(query) = query.map_err(|_| AppError::bad_request("Thiếu hoặc sai a, b"))?;
    let key = format!("{}-{}", query.a, query.b);
    let Some(rule) = state.mau_rules.get(&key) else {
        return Err(AppError::not_found("Không có quy tắc cho cặp a-b này"));
    };
    let Some(object) = rule.as_object() else {
        return Err(AppError::Internal(anyhow::anyhow!("quy tắc {key} không phải object")));
    };
    let mut out = object.clone();
    out.insert("a".to_string(), Value::from(query.a));
    out.insert("b".to_string(), Value::from(query.b));
    Ok(Json(Value::Object(out)))
}

async fn load_people(state: &AppState, first: &str, second: &str) -> Result<Vec<PersonRow>, AppError> {
    let rows = sqlx::query_as::<_, PersonRow>(
        "SELECT id, clan_id, name, gender, father_id, mother_id, spouse_id, birth_order, generation, note
         FROM people
         WHERE clan_id = $1 OR clan_id = $2
         ORDER BY generation NULLS LAST, birth_order NULLS LAST, id",
    )
    .bind(first)
    .bind(second)
    .fetch_all(&state.pool)
    .await?;
    Ok(rows)
}

fn person_out(row: PersonRow) -> PersonOut {
    PersonOut {
        id: row.id,
        clan_id: row.clan_id,
        name: row.name,
        gender: row.gender,
        father_id: blank_owned(row.father_id),
        mother_id: blank_owned(row.mother_id),
        spouse_id: blank_owned(row.spouse_id),
        order: row.birth_order,
        generation: row.generation,
        note: row.note.unwrap_or_default(),
    }
}

fn graph_from_rows(rows: Vec<PersonRow>) -> HashMap<String, Person> {
    rows.into_iter()
        .map(|row| {
            (
                row.id.clone(),
                Person {
                    id: row.id,
                    gender: row.gender,
                    father_id: blank_owned(row.father_id),
                    mother_id: blank_owned(row.mother_id),
                    spouse_id: blank_owned(row.spouse_id),
                    order: row.birth_order,
                },
            )
        })
        .collect()
}

fn blank_owned(value: Option<String>) -> Option<String> {
    value.filter(|item| !item.is_empty())
}

async fn current_user(state: &AppState, headers: &HeaderMap) -> Result<UserPublic, AppError> {
    let header = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| AppError::unauthorized("Thiếu token"))?;
    let token = header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::unauthorized("Thiếu token"))?;
    if token.is_empty() || token.len() > 4096 {
        return Err(AppError::unauthorized("Phiên đăng nhập không hợp lệ"));
    }
    let user_id = auth::user_id_from_token(&state.jwt_secret, token)?;
    load_user(state, user_id).await.map_err(|err| match err {
        AppError::NotFound(_) => AppError::unauthorized("Phiên đăng nhập không hợp lệ"),
        other => other,
    })
}

async fn load_user(state: &AppState, user_id: Uuid) -> Result<UserPublic, AppError> {
    let sql = format!("{USER_SQL} WHERE u.id = $1");
    sqlx::query_as::<_, UserPublic>(&sql)
        .bind(user_id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::not_found("Không thấy tài khoản"))
}

async fn available_people(State(state): State<AppState>) -> Result<Json<Vec<OpenPerson>>, AppError> {
    let rows = sqlx::query_as::<_, OpenPerson>(
        "SELECT p.id, p.name, p.generation, p.clan_id, c.name AS clan_name
         FROM people p
         JOIN clans c ON c.id = p.clan_id
         WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.person_id = p.id)
         ORDER BY c.id, p.generation NULLS LAST, p.birth_order NULLS LAST, p.name",
    )
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(rows))
}

async fn my_place(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<PlaceOut>, AppError> {
    let user = current_user(&state, &headers).await?;
    let Some(person_id) = user.person_id else {
        return Err(AppError::not_found("Tài khoản chưa gắn với người trên gia phả"));
    };
    #[derive(sqlx::FromRow)]
    struct Node {
        id: String,
        name: String,
        father_id: Option<String>,
        generation: Option<i32>,
        clan_id: String,
        clan_kind: String,
    }
    let mut cursor = person_id;
    let mut chain = Vec::new();
    for _ in 0..32 {
        let node = sqlx::query_as::<_, Node>(
            "SELECT p.id, p.name, p.father_id, p.generation, p.clan_id, c.kind AS clan_kind
             FROM people p
             JOIN clans c ON c.id = p.clan_id
             WHERE p.id = $1",
        )
        .bind(&cursor)
        .fetch_optional(&state.pool)
        .await?;
        let Some(node) = node else {
            return Err(AppError::not_found("Không thấy người này trên gia phả"));
        };
        let next = node.father_id.clone().filter(|id| !id.is_empty());
        chain.push(node);
        match next {
            Some(father) => cursor = father,
            None => break,
        }
    }
    chain.reverse();
    let Some(self_node) = chain.last() else {
        return Err(AppError::not_found("Không thấy người này trên gia phả"));
    };
    let path = chain
        .iter()
        .map(|node| PlaceStep {
            id: node.id.clone(),
            name: node.name.clone(),
            generation: node.generation,
        })
        .collect();
    Ok(Json(PlaceOut {
        person_id: self_node.id.clone(),
        name: self_node.name.clone(),
        clan_id: self_node.clan_id.clone(),
        clan_kind: self_node.clan_kind.clone(),
        generation: self_node.generation,
        path,
    }))
}

fn ensure_writer(user: &UserPublic) -> Result<(), AppError> {
    if user.role == "editor" || user.role == "admin" {
        Ok(())
    } else {
        Err(AppError::forbidden("Không có quyền thực hiện"))
    }
}

fn normalize_email(raw: &str) -> Result<String, AppError> {
    let email = raw.trim().to_lowercase();
    if email.len() < 3
        || email.len() > 254
        || email.chars().any(char::is_whitespace)
        || !email.is_ascii()
    {
        return Err(AppError::bad_request("Email không hợp lệ"));
    }
    let Some((local, domain)) = email.split_once('@') else {
        return Err(AppError::bad_request("Email không hợp lệ"));
    };
    if local.is_empty()
        || domain.len() < 3
        || !domain.contains('.')
        || domain.starts_with('.')
        || domain.ends_with('.')
        || domain.contains('@')
    {
        return Err(AppError::bad_request("Email không hợp lệ"));
    }
    Ok(email)
}

fn check_password(password: &str) -> Result<(), AppError> {
    let len = password.chars().count();
    if !(8..=128).contains(&len) {
        return Err(AppError::bad_request("Mật khẩu phải từ 8 đến 128 ký tự"));
    }
    Ok(())
}

fn require_text(raw: &str, label: &str, max_chars: usize) -> Result<String, AppError> {
    let text = raw.trim();
    let len = text.chars().count();
    if len == 0 || len > max_chars {
        return Err(AppError::bad_request(format!("{label} không hợp lệ")));
    }
    Ok(text.to_string())
}

fn require_id(raw: &str, label: &str) -> Result<String, AppError> {
    let id = raw.trim();
    if id.is_empty() || id.len() > 64 {
        return Err(AppError::bad_request(format!("{label} không hợp lệ")));
    }
    Ok(id.to_string())
}

fn parse_date(raw: &str) -> Result<NaiveDate, AppError> {
    let raw = raw.trim();
    if raw.len() != 10 || !raw.is_ascii() || raw.as_bytes().get(4) != Some(&b'-') || raw.as_bytes().get(7) != Some(&b'-')
    {
        return Err(AppError::bad_request("eventDate phải là YYYY-MM-DD"));
    }
    NaiveDate::parse_from_str(raw, "%Y-%m-%d")
        .map_err(|_| AppError::bad_request("eventDate phải là YYYY-MM-DD"))
}
