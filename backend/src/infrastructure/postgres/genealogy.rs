use async_trait::async_trait;
use sqlx::PgPool;

use crate::domain::error::DomainError;
use crate::domain::genealogy::model::{blank, Clan, Member};
use crate::domain::genealogy::GenealogyRepository;

use super::unexpected;

#[derive(Clone)]
pub struct PgGenealogy {
    pool: PgPool,
}

impl PgGenealogy {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl GenealogyRepository for PgGenealogy {
    async fn clans(&self) -> Result<Vec<Clan>, DomainError> {
        #[derive(sqlx::FromRow)]
        struct Row {
            id: String,
            name: String,
            kind: String,
        }
        let rows = sqlx::query_as::<_, Row>(
            "SELECT id, name, kind FROM clans
             ORDER BY CASE id WHEN 'nguyen-mau' THEN 0 WHEN 'nguyen' THEN 1 WHEN 'duong' THEN 2 ELSE 3 END, id",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(unexpected)?;
        Ok(rows
            .into_iter()
            .map(|row| Clan {
                id: row.id,
                name: row.name,
                kind: row.kind,
            })
            .collect())
    }

    async fn clan_exists(&self, id: &str) -> Result<bool, DomainError> {
        let exists: bool = sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM clans WHERE id = $1)")
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(unexpected)?;
        Ok(exists)
    }

    async fn members_in(&self, first_clan: &str, second_clan: &str) -> Result<Vec<Member>, DomainError> {
        #[derive(sqlx::FromRow)]
        struct Row {
            id: String,
            clan_id: String,
            name: String,
            gender: String,
            father_id: Option<String>,
            mother_id: Option<String>,
            spouse_id: Option<String>,
            birth_order: Option<i32>,
            generation: Option<i32>,
            note: Option<String>,
        }
        let rows = sqlx::query_as::<_, Row>(
            "SELECT id, clan_id, name, gender, father_id, mother_id, spouse_id, birth_order, generation, note
             FROM people
             WHERE clan_id = $1 OR clan_id = $2
             ORDER BY generation NULLS LAST, birth_order NULLS LAST, id",
        )
        .bind(first_clan)
        .bind(second_clan)
        .fetch_all(&self.pool)
        .await
        .map_err(unexpected)?;
        Ok(rows
            .into_iter()
            .map(|row| Member {
                id: row.id,
                clan_id: row.clan_id,
                name: row.name,
                gender: row.gender,
                father_id: blank(row.father_id),
                mother_id: blank(row.mother_id),
                spouse_id: blank(row.spouse_id),
                order: row.birth_order,
                generation: row.generation,
                note: row.note.unwrap_or_default(),
            })
            .collect())
    }
}
