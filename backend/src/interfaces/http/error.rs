use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;

use crate::domain::error::DomainError;

#[derive(Serialize)]
struct ErrorBody {
    error: String,
}

impl IntoResponse for DomainError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            DomainError::Invalid(message) => (StatusCode::BAD_REQUEST, message),
            DomainError::Unauthenticated(message) => (StatusCode::UNAUTHORIZED, message),
            DomainError::Forbidden(message) => (StatusCode::FORBIDDEN, message),
            DomainError::Missing(message) => (StatusCode::NOT_FOUND, message),
            DomainError::Conflict(message) => (StatusCode::CONFLICT, message),
            DomainError::Unexpected(message) => {
                tracing::error!(error = %message, "request failed");
                (StatusCode::INTERNAL_SERVER_ERROR, "Lỗi máy chủ".to_string())
            }
        };
        (status, Json(ErrorBody { error: message })).into_response()
    }
}
