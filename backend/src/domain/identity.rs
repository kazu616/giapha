use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::error::DomainError;

/// Tài khoản đã công khai. Mật khẩu không nằm ở đây.
#[derive(Debug, Clone)]
pub struct Account {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub role: String,
    pub person_id: Option<String>,
    pub person_name: Option<String>,
    pub clan_id: Option<String>,
    pub clan_kind: Option<String>,
}

#[derive(Debug, Clone)]
pub struct Credential {
    pub id: Uuid,
    pub password_hash: String,
}

#[derive(Debug, Clone)]
pub struct Session {
    pub token: String,
    pub account: Account,
}

#[derive(Debug, Clone)]
pub struct AncestorNode {
    pub id: String,
    pub name: String,
    pub father_id: Option<String>,
    pub generation: Option<i32>,
    pub clan_id: String,
    pub clan_kind: String,
}

#[derive(Debug, Clone)]
pub struct Place {
    pub person_id: String,
    pub name: String,
    pub clan_id: String,
    pub clan_kind: String,
    pub generation: Option<i32>,
    pub path: Vec<PlaceStep>,
}

#[derive(Debug, Clone)]
pub struct PlaceStep {
    pub id: String,
    pub name: String,
    pub generation: Option<i32>,
}

#[derive(Debug, Clone)]
pub struct OpenPerson {
    pub id: String,
    pub name: String,
    pub generation: Option<i32>,
    pub clan_id: String,
    pub clan_name: String,
}

pub fn can_publish(role: &str) -> bool {
    role == "editor" || role == "admin"
}

pub fn normalize_email(raw: &str) -> Result<String, DomainError> {
    let email = raw.trim().to_lowercase();
    if email.len() < 3 || email.len() > 254 || email.chars().any(char::is_whitespace) || !email.is_ascii() {
        return Err(DomainError::invalid("Email không hợp lệ"));
    }
    let Some((local, domain)) = email.split_once('@') else {
        return Err(DomainError::invalid("Email không hợp lệ"));
    };
    if local.is_empty()
        || domain.len() < 3
        || !domain.contains('.')
        || domain.starts_with('.')
        || domain.ends_with('.')
        || domain.contains('@')
    {
        return Err(DomainError::invalid("Email không hợp lệ"));
    }
    Ok(email)
}

pub fn check_password(password: &str) -> Result<(), DomainError> {
    let len = password.chars().count();
    if !(8..=128).contains(&len) {
        return Err(DomainError::invalid("Mật khẩu phải từ 8 đến 128 ký tự"));
    }
    Ok(())
}

pub fn require_text(raw: &str, label: &str, max_chars: usize) -> Result<String, DomainError> {
    let text = raw.trim();
    let len = text.chars().count();
    if len == 0 || len > max_chars {
        return Err(DomainError::invalid(format!("{label} không hợp lệ")));
    }
    Ok(text.to_string())
}

/// Cổng lưu tài khoản. Hiện thực nằm ở infrastructure.
#[async_trait]
pub trait IdentityRepository: Send + Sync {
    async fn person_exists(&self, person_id: &str) -> Result<bool, DomainError>;
    async fn person_claimed(&self, person_id: &str) -> Result<bool, DomainError>;
    async fn insert_member(
        &self,
        id: Uuid,
        email: &str,
        name: &str,
        password_hash: &str,
        person_id: &str,
    ) -> Result<(), DomainError>;
    async fn credential_by_email(&self, email: &str) -> Result<Option<Credential>, DomainError>;
    async fn account_by_id(&self, id: Uuid) -> Result<Option<Account>, DomainError>;
    async fn rename(&self, id: Uuid, name: &str) -> Result<(), DomainError>;
    async fn ancestor(&self, id: &str) -> Result<Option<AncestorNode>, DomainError>;
    async fn unclaimed_people(&self) -> Result<Vec<OpenPerson>, DomainError>;
}

pub trait PasswordDigest: Send + Sync {
    fn hash(&self, password: &str) -> Result<String, DomainError>;
    fn verify(&self, password: &str, encoded: &str) -> bool;
}

pub trait SessionTokens: Send + Sync {
    fn issue(&self, user_id: Uuid) -> Result<String, DomainError>;
    fn subject(&self, token: &str) -> Result<Uuid, DomainError>;
}
