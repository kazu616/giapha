use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::catalog::{CatalogRepository, ClanEvent, NewsArticle};
use crate::domain::error::DomainError;

use super::unexpected;

#[derive(Clone)]
pub struct PgCatalog {
    pool: PgPool,
}

impl PgCatalog {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl CatalogRepository for PgCatalog {
    async fn list_news(&self) -> Result<Vec<NewsArticle>, DomainError> {
        #[derive(sqlx::FromRow)]
        struct Row {
            id: Uuid,
            title: String,
            body: String,
            author_id: Uuid,
            published_at: DateTime<Utc>,
        }
        let rows = sqlx::query_as::<_, Row>(
            "SELECT id, title, body, author_id, published_at FROM news ORDER BY published_at DESC, id",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(unexpected)?;
        Ok(rows
            .into_iter()
            .map(|row| NewsArticle {
                id: row.id,
                title: row.title,
                body: row.body,
                author_id: row.author_id,
                published_at: row.published_at,
            })
            .collect())
    }

    async fn add_news(
        &self,
        id: Uuid,
        title: &str,
        body: &str,
        author_id: Uuid,
        published_at: DateTime<Utc>,
    ) -> Result<NewsArticle, DomainError> {
        #[derive(sqlx::FromRow)]
        struct Row {
            id: Uuid,
            title: String,
            body: String,
            author_id: Uuid,
            published_at: DateTime<Utc>,
        }
        let row = sqlx::query_as::<_, Row>(
            "INSERT INTO news (id, title, body, author_id, published_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, title, body, author_id, published_at",
        )
        .bind(id)
        .bind(title)
        .bind(body)
        .bind(author_id)
        .bind(published_at)
        .fetch_one(&self.pool)
        .await
        .map_err(unexpected)?;
        Ok(NewsArticle {
            id: row.id,
            title: row.title,
            body: row.body,
            author_id: row.author_id,
            published_at: row.published_at,
        })
    }

    async fn list_events(&self) -> Result<Vec<ClanEvent>, DomainError> {
        #[derive(sqlx::FromRow)]
        struct Row {
            id: Uuid,
            title: String,
            kind: String,
            event_date: NaiveDate,
            place: String,
            body: String,
        }
        let rows = sqlx::query_as::<_, Row>(
            "SELECT id, title, kind, event_date, place, body FROM events ORDER BY event_date, id",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(unexpected)?;
        Ok(rows
            .into_iter()
            .map(|row| ClanEvent {
                id: row.id,
                title: row.title,
                kind: row.kind,
                event_date: row.event_date,
                place: row.place,
                body: row.body,
            })
            .collect())
    }

    async fn add_event(
        &self,
        id: Uuid,
        title: &str,
        kind: &str,
        event_date: NaiveDate,
        place: &str,
        body: &str,
    ) -> Result<ClanEvent, DomainError> {
        #[derive(sqlx::FromRow)]
        struct Row {
            id: Uuid,
            title: String,
            kind: String,
            event_date: NaiveDate,
            place: String,
            body: String,
        }
        let row = sqlx::query_as::<_, Row>(
            "INSERT INTO events (id, title, kind, event_date, place, body)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, title, kind, event_date, place, body",
        )
        .bind(id)
        .bind(title)
        .bind(kind)
        .bind(event_date)
        .bind(place)
        .bind(body)
        .fetch_one(&self.pool)
        .await
        .map_err(unexpected)?;
        Ok(ClanEvent {
            id: row.id,
            title: row.title,
            kind: row.kind,
            event_date: row.event_date,
            place: row.place,
            body: row.body,
        })
    }
}
