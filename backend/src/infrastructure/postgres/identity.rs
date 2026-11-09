use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::error::DomainError;
use crate::domain::identity::{Account, AncestorNode, Credential, IdentityRepository, OpenPerson};

use super::{is_unique, unexpected};

const ACCOUNT_SQL: &str = "SELECT u.id, u.email, u.name, u.role, u.person_id, p.name AS person_name, p.clan_id, c.kind AS clan_kind
         FROM users u
         LEFT JOIN people p ON p.id = u.person_id
         LEFT JOIN clans c ON c.id = p.clan_id";

#[derive(Clone)]
pub struct PgIdentity {
    pool: PgPool,
}

impl PgIdentity {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct AccountRow {
    id: Uuid,
    email: String,
    name: String,
    role: String,
    person_id: Option<String>,
    person_name: Option<String>,
    clan_id: Option<String>,
    clan_kind: Option<String>,
}

impl From<AccountRow> for Account {
    fn from(row: AccountRow) -> Self {
        Self {
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            person_id: row.person_id,
            person_name: row.person_name,
            clan_id: row.clan_id,
            clan_kind: row.clan_kind,
        }
    }
}

#[async_trait]
impl IdentityRepository for PgIdentity {
    async fn person_exists(&self, person_id: &str) -> Result<bool, DomainError> {
        let id: Option<String> = sqlx::query_scalar("SELECT id FROM people WHERE id = $1")
            .bind(person_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(unexpected)?;
        Ok(id.is_some())
    }

    async fn person_claimed(&self, person_id: &str) -> Result<bool, DomainError> {
        let id: Option<Uuid> = sqlx::query_scalar("SELECT id FROM users WHERE person_id = $1")
            .bind(person_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(unexpected)?;
        Ok(id.is_some())
    }

    async fn insert_member(
        &self,
        id: Uuid,
        email: &str,
        name: &str,
        password_hash: &str,
        person_id: &str,
    ) -> Result<(), DomainError> {
        let inserted = sqlx::query(
            "INSERT INTO users (id, email, name, password_hash, role, person_id) VALUES ($1, $2, $3, $4, 'member', $5)",
        )
        .bind(id)
        .bind(email)
        .bind(name)
        .bind(password_hash)
        .bind(person_id)
        .execute(&self.pool)
        .await;
        match inserted {
            Ok(_) => Ok(()),
            Err(err) if is_unique(&err) => {
                Err(DomainError::conflict("Email đã được đăng ký hoặc người này đã có tài khoản"))
            }
            Err(err) => Err(unexpected(err)),
        }
    }

    async fn credential_by_email(&self, email: &str) -> Result<Option<Credential>, DomainError> {
        #[derive(sqlx::FromRow)]
        struct Row {
            id: Uuid,
            password_hash: String,
        }
        let row = sqlx::query_as::<_, Row>("SELECT id, password_hash FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(&self.pool)
            .await
            .map_err(unexpected)?;
        Ok(row.map(|row| Credential {
            id: row.id,
            password_hash: row.password_hash,
        }))
    }

    async fn account_by_id(&self, id: Uuid) -> Result<Option<Account>, DomainError> {
        let sql = format!("{ACCOUNT_SQL} WHERE u.id = $1");
        let row = sqlx::query_as::<_, AccountRow>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(unexpected)?;
        Ok(row.map(Account::from))
    }

    async fn rename(&self, id: Uuid, name: &str) -> Result<(), DomainError> {
        sqlx::query("UPDATE users SET name = $1 WHERE id = $2")
            .bind(name)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(unexpected)?;
        Ok(())
    }

    async fn ancestor(&self, id: &str) -> Result<Option<AncestorNode>, DomainError> {
        #[derive(sqlx::FromRow)]
        struct Row {
            id: String,
            name: String,
            father_id: Option<String>,
            generation: Option<i32>,
            clan_id: String,
            clan_kind: String,
        }
        let row = sqlx::query_as::<_, Row>(
            "SELECT p.id, p.name, p.father_id, p.generation, p.clan_id, c.kind AS clan_kind
             FROM people p
             JOIN clans c ON c.id = p.clan_id
             WHERE p.id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(unexpected)?;
        Ok(row.map(|row| AncestorNode {
            id: row.id,
            name: row.name,
            father_id: row.father_id.filter(|value| !value.is_empty()),
            generation: row.generation,
            clan_id: row.clan_id,
            clan_kind: row.clan_kind,
        }))
    }

    async fn unclaimed_people(&self) -> Result<Vec<OpenPerson>, DomainError> {
        #[derive(sqlx::FromRow)]
        struct Row {
            id: String,
            name: String,
            generation: Option<i32>,
            clan_id: String,
            clan_name: String,
        }
        let rows = sqlx::query_as::<_, Row>(
            "SELECT p.id, p.name, p.generation, p.clan_id, c.name AS clan_name
             FROM people p
             JOIN clans c ON c.id = p.clan_id
             WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.person_id = p.id)
             ORDER BY c.id, p.generation NULLS LAST, p.birth_order NULLS LAST, p.name",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(unexpected)?;
        Ok(rows
            .into_iter()
            .map(|row| OpenPerson {
                id: row.id,
                name: row.name,
                generation: row.generation,
                clan_id: row.clan_id,
                clan_name: row.clan_name,
            })
            .collect())
    }
}
