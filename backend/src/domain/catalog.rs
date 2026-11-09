use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, Utc};
use uuid::Uuid;

use crate::domain::error::DomainError;

#[derive(Debug, Clone)]
pub struct NewsArticle {
    pub id: Uuid,
    pub title: String,
    pub body: String,
    pub author_id: Uuid,
    pub published_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct ClanEvent {
    pub id: Uuid,
    pub title: String,
    pub kind: String,
    pub event_date: NaiveDate,
    pub place: String,
    pub body: String,
}

#[async_trait]
pub trait CatalogRepository: Send + Sync {
    async fn list_news(&self) -> Result<Vec<NewsArticle>, DomainError>;
    async fn add_news(
        &self,
        id: Uuid,
        title: &str,
        body: &str,
        author_id: Uuid,
        published_at: DateTime<Utc>,
    ) -> Result<NewsArticle, DomainError>;
    async fn list_events(&self) -> Result<Vec<ClanEvent>, DomainError>;
    async fn add_event(
        &self,
        id: Uuid,
        title: &str,
        kind: &str,
        event_date: NaiveDate,
        place: &str,
        body: &str,
    ) -> Result<ClanEvent, DomainError>;
}
