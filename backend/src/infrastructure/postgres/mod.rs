mod catalog;
mod genealogy;
mod identity;

pub use catalog::PgCatalog;
pub use genealogy::PgGenealogy;
pub use identity::PgIdentity;

use crate::domain::error::DomainError;

pub(crate) fn unexpected(err: sqlx::Error) -> DomainError {
    let text = err.to_string();
    if text.contains("postgres://") || text.contains("postgresql://") {
        DomainError::unexpected("lỗi cơ sở dữ liệu")
    } else {
        DomainError::unexpected(text)
    }
}

pub(crate) fn is_unique(err: &sqlx::Error) -> bool {
    match err {
        sqlx::Error::Database(db) => db.code().as_deref() == Some("23505"),
        _ => false,
    }
}
