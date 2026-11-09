pub mod kinship;
pub mod model;

use async_trait::async_trait;

use crate::domain::error::DomainError;
use crate::domain::genealogy::model::Member;

#[async_trait]
pub trait GenealogyRepository: Send + Sync {
    async fn clans(&self) -> Result<Vec<model::Clan>, DomainError>;
    async fn clan_exists(&self, id: &str) -> Result<bool, DomainError>;
    async fn members_in(&self, first_clan: &str, second_clan: &str) -> Result<Vec<Member>, DomainError>;
}
