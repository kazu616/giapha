use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use chrono::Utc;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::error::DomainError;
use crate::domain::identity::{PasswordDigest, SessionTokens};

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    iat: u64,
    exp: u64,
}

pub fn hash_password(password: &str) -> Result<String, DomainError> {
    let salt = SaltString::generate(&mut argon2::password_hash::rand_core::OsRng);
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(|err| DomainError::unexpected(format!("không băm được mật khẩu: {err}")))?;
    Ok(hash.to_string())
}

pub fn verify_password(password: &str, encoded: &str) -> bool {
    let Ok(parsed) = PasswordHash::new(encoded) else {
        return false;
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok()
}

pub fn issue_token(secret: &str, user_id: Uuid) -> Result<String, DomainError> {
    let now = Utc::now().timestamp();
    let now = u64::try_from(now).map_err(|_| DomainError::unexpected("đồng hồ hệ thống"))?;
    let exp = now
        .checked_add(7 * 24 * 60 * 60)
        .ok_or_else(|| DomainError::unexpected("hạn token"))?;
    let claims = Claims {
        sub: user_id.to_string(),
        iat: now,
        exp,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|err| DomainError::unexpected(format!("không ký được token: {err}")))
}

pub fn user_id_from_token(secret: &str, token: &str) -> Result<Uuid, DomainError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|_| DomainError::unauthenticated("Phiên đăng nhập không hợp lệ"))?;
    Uuid::parse_str(&data.claims.sub).map_err(|_| DomainError::unauthenticated("Phiên đăng nhập không hợp lệ"))
}

pub struct ArgonPasswords;

impl PasswordDigest for ArgonPasswords {
    fn hash(&self, password: &str) -> Result<String, DomainError> {
        hash_password(password)
    }

    fn verify(&self, password: &str, encoded: &str) -> bool {
        verify_password(password, encoded)
    }
}

pub struct JwtSessions {
    pub secret: String,
}

impl SessionTokens for JwtSessions {
    fn issue(&self, user_id: Uuid) -> Result<String, DomainError> {
        issue_token(&self.secret, user_id)
    }

    fn subject(&self, token: &str) -> Result<Uuid, DomainError> {
        user_id_from_token(&self.secret, token)
    }
}
