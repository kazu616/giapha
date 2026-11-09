use std::sync::Arc;

use chrono::{NaiveDate, Utc};
use uuid::Uuid;

use crate::domain::catalog::{CatalogRepository, ClanEvent, NewsArticle};
use crate::domain::error::DomainError;
use crate::domain::identity::{can_publish, require_text, Account};

#[derive(Clone)]
pub struct CatalogApplication {
    repo: Arc<dyn CatalogRepository>,
}

impl CatalogApplication {
    pub fn new(repo: Arc<dyn CatalogRepository>) -> Self {
        Self { repo }
    }

    pub async fn news(&self) -> Result<Vec<NewsArticle>, DomainError> {
        self.repo.list_news().await
    }

    pub async fn publish_news(&self, author: &Account, title: &str, body: &str) -> Result<NewsArticle, DomainError> {
        if !can_publish(&author.role) {
            return Err(DomainError::forbidden("Không có quyền thực hiện"));
        }
        let title = require_text(title, "Tiêu đề", 200)?;
        let body = require_text(body, "Nội dung", 20_000)?;
        self.repo
            .add_news(Uuid::new_v4(), &title, &body, author.id, Utc::now())
            .await
    }

    pub async fn events(&self) -> Result<Vec<ClanEvent>, DomainError> {
        self.repo.list_events().await
    }

    pub async fn publish_event(
        &self,
        author: &Account,
        title: &str,
        kind: &str,
        event_date: &str,
        place: &str,
        body: &str,
    ) -> Result<ClanEvent, DomainError> {
        if !can_publish(&author.role) {
            return Err(DomainError::forbidden("Không có quyền thực hiện"));
        }
        let title = require_text(title, "Tiêu đề", 200)?;
        let kind = require_text(kind, "Loại sự kiện", 80)?;
        let place = require_text(place, "Địa điểm", 200)?;
        let body = require_text(body, "Nội dung", 20_000)?;
        let event_date = parse_date(event_date)?;
        self.repo
            .add_event(Uuid::new_v4(), &title, &kind, event_date, &place, &body)
            .await
    }
}

fn parse_date(raw: &str) -> Result<NaiveDate, DomainError> {
    let raw = raw.trim();
    if raw.len() != 10 || !raw.is_ascii() || raw.as_bytes().get(4) != Some(&b'-') || raw.as_bytes().get(7) != Some(&b'-')
    {
        return Err(DomainError::invalid("eventDate phải là YYYY-MM-DD"));
    }
    NaiveDate::parse_from_str(raw, "%Y-%m-%d").map_err(|_| DomainError::invalid("eventDate phải là YYYY-MM-DD"))
}
