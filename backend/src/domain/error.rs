use thiserror::Error;

/// Lỗi nghiệp vụ. Tầng giao diện mới đổi mã HTTP.
#[derive(Debug, Error)]
pub enum DomainError {
    #[error("{0}")]
    Invalid(String),
    #[error("{0}")]
    Unauthenticated(String),
    #[error("{0}")]
    Forbidden(String),
    #[error("{0}")]
    Missing(String),
    #[error("{0}")]
    Conflict(String),
    #[error("{0}")]
    Unexpected(String),
}

impl DomainError {
    pub fn invalid(message: impl Into<String>) -> Self {
        Self::Invalid(message.into())
    }

    pub fn unauthenticated(message: impl Into<String>) -> Self {
        Self::Unauthenticated(message.into())
    }

    pub fn forbidden(message: impl Into<String>) -> Self {
        Self::Forbidden(message.into())
    }

    pub fn missing(message: impl Into<String>) -> Self {
        Self::Missing(message.into())
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::Conflict(message.into())
    }

    pub fn unexpected(message: impl Into<String>) -> Self {
        Self::Unexpected(message.into())
    }
}
