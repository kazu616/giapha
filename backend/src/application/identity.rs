use std::sync::Arc;

use uuid::Uuid;

use crate::domain::error::DomainError;
use crate::domain::identity::{
    check_password, normalize_email, require_text, Account, IdentityRepository, PasswordDigest, Place, PlaceStep,
    Session, SessionTokens,
};

pub struct RegisterCommand {
    pub email: String,
    pub password: String,
    pub name: String,
    pub person_id: String,
}

#[derive(Clone)]
pub struct IdentityApplication {
    accounts: Arc<dyn IdentityRepository>,
    passwords: Arc<dyn PasswordDigest>,
    tokens: Arc<dyn SessionTokens>,
    dummy_hash: String,
}

impl IdentityApplication {
    pub fn new(
        accounts: Arc<dyn IdentityRepository>,
        passwords: Arc<dyn PasswordDigest>,
        tokens: Arc<dyn SessionTokens>,
        dummy_hash: String,
    ) -> Self {
        Self {
            accounts,
            passwords,
            tokens,
            dummy_hash,
        }
    }

    pub async fn register(&self, command: RegisterCommand) -> Result<Session, DomainError> {
        let email = normalize_email(&command.email)?;
        check_password(&command.password)?;
        let name = require_text(&command.name, "Tên", 120)?;
        let person_id = require_text(&command.person_id, "Người trên gia phả", 40)?;
        if !self.accounts.person_exists(&person_id).await? {
            return Err(DomainError::invalid("Không có người này trên gia phả"));
        }
        if self.accounts.person_claimed(&person_id).await? {
            return Err(DomainError::conflict("Người này đã có tài khoản"));
        }
        let password_hash = self.passwords.hash(&command.password)?;
        let user_id = Uuid::new_v4();
        self.accounts
            .insert_member(user_id, &email, &name, &password_hash, &person_id)
            .await?;
        let account = self
            .accounts
            .account_by_id(user_id)
            .await?
            .ok_or_else(|| DomainError::missing("Không thấy tài khoản"))?;
        let token = self.tokens.issue(account.id)?;
        tracing::info!(user_id = %account.id, "đã đăng ký");
        Ok(Session { token, account })
    }

    pub async fn login(&self, email: &str, password: &str) -> Result<Session, DomainError> {
        let email = normalize_email(email)?;
        check_password(password)?;
        let credential = self.accounts.credential_by_email(&email).await?;
        let valid = match &credential {
            Some(user) => self.passwords.verify(password, &user.password_hash),
            None => {
                let _ = self.passwords.verify(password, &self.dummy_hash);
                false
            }
        };
        let Some(credential) = credential.filter(|_| valid) else {
            return Err(DomainError::unauthenticated("Email hoặc mật khẩu không đúng"));
        };
        let token = self.tokens.issue(credential.id)?;
        let account = self
            .accounts
            .account_by_id(credential.id)
            .await?
            .ok_or_else(|| DomainError::unauthenticated("Email hoặc mật khẩu không đúng"))?;
        Ok(Session { token, account })
    }

    pub async fn account_from_bearer(&self, header: Option<&str>) -> Result<Account, DomainError> {
        let header = header.ok_or_else(|| DomainError::unauthenticated("Thiếu token"))?;
        let token = header
            .strip_prefix("Bearer ")
            .ok_or_else(|| DomainError::unauthenticated("Thiếu token"))?;
        if token.is_empty() || token.len() > 4096 {
            return Err(DomainError::unauthenticated("Phiên đăng nhập không hợp lệ"));
        }
        let user_id = self.tokens.subject(token)?;
        self.accounts
            .account_by_id(user_id)
            .await?
            .ok_or_else(|| DomainError::unauthenticated("Phiên đăng nhập không hợp lệ"))
    }

    pub async fn rename(&self, account: &Account, name: &str) -> Result<Account, DomainError> {
        let name = require_text(name, "Tên", 120)?;
        self.accounts.rename(account.id, &name).await?;
        self.accounts
            .account_by_id(account.id)
            .await?
            .ok_or_else(|| DomainError::missing("Không thấy tài khoản"))
    }

    pub async fn place_of(&self, account: &Account) -> Result<crate::domain::identity::Place, DomainError> {
        let Some(person_id) = account.person_id.clone() else {
            return Err(DomainError::missing("Tài khoản chưa gắn với người trên gia phả"));
        };
        let mut cursor = person_id;
        let mut chain = Vec::new();
        for _ in 0..32 {
            let Some(node) = self.accounts.ancestor(&cursor).await? else {
                return Err(DomainError::missing("Không thấy người này trên gia phả"));
            };
            let next = node.father_id.clone();
            chain.push(node);
            match next {
                Some(father) => cursor = father,
                None => break,
            }
        }
        chain.reverse();
        let Some(self_node) = chain.last() else {
            return Err(DomainError::missing("Không thấy người này trên gia phả"));
        };
        let path = chain
            .iter()
            .map(|node| PlaceStep {
                id: node.id.clone(),
                name: node.name.clone(),
                generation: node.generation,
            })
            .collect();
        Ok(Place {
            person_id: self_node.id.clone(),
            name: self_node.name.clone(),
            clan_id: self_node.clan_id.clone(),
            clan_kind: self_node.clan_kind.clone(),
            generation: self_node.generation,
            path,
        })
    }

    pub async fn unclaimed(&self) -> Result<Vec<crate::domain::identity::OpenPerson>, DomainError> {
        self.accounts.unclaimed_people().await
    }
}
