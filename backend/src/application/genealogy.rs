use std::collections::HashMap;
use std::sync::Arc;

use serde_json::{Map, Value};

use crate::domain::error::DomainError;
use crate::domain::genealogy::kinship::{self, LienRule, Person};
use crate::domain::genealogy::model::{Clan, KinshipAnswer, Member};
use crate::domain::genealogy::GenealogyRepository;

#[derive(Clone)]
pub struct GenealogyApplication {
    people: Arc<dyn GenealogyRepository>,
    mau_rules: Arc<Map<String, Value>>,
    lien_rules: Arc<HashMap<String, LienRule>>,
}

impl GenealogyApplication {
    pub fn new(
        people: Arc<dyn GenealogyRepository>,
        mau_rules: Arc<Map<String, Value>>,
        lien_rules: Arc<HashMap<String, LienRule>>,
    ) -> Self {
        Self {
            people,
            mau_rules,
            lien_rules,
        }
    }

    pub async fn clans(&self) -> Result<Vec<Clan>, DomainError> {
        self.people.clans().await
    }

    pub async fn members_of(&self, clan_id: &str) -> Result<Vec<Member>, DomainError> {
        let clan_id = clan_id.trim();
        if clan_id.is_empty() || clan_id.len() > 64 {
            return Err(DomainError::invalid("clan không hợp lệ"));
        }
        if !self.people.clan_exists(clan_id).await? {
            return Err(DomainError::missing("Không tìm thấy dòng họ"));
        }
        self.people.members_in(clan_id, clan_id).await
    }

    pub async fn relate(
        &self,
        from_id: &str,
        to_id: &str,
        region: &str,
        graph: &str,
        prefer: &str,
    ) -> Result<KinshipAnswer, DomainError> {
        let from_id = require_id(from_id, "fromId")?;
        let to_id = require_id(to_id, "toId")?;
        let region = region.trim().to_ascii_lowercase();
        if !matches!(region.as_str(), "bac" | "trung" | "nam") {
            return Err(DomainError::invalid("region phải là bac, trung hoặc nam"));
        }
        let prefer = prefer.trim().to_ascii_lowercase();
        if !matches!(prefer.as_str(), "gan" | "noi" | "ngoai") {
            return Err(DomainError::invalid("prefer phải là gan, noi hoặc ngoai"));
        }
        match graph.trim().to_ascii_lowercase().as_str() {
            "mau" => self.relate_mau(&from_id, &to_id, &region).await,
            "lien" => self.relate_lien(&from_id, &to_id, &region, &prefer).await,
            _ => Err(DomainError::invalid("graph phải là mau hoặc lien")),
        }
    }

    pub fn rule(&self, a: i32, b: i32) -> Result<Value, DomainError> {
        let key = format!("{a}-{b}");
        let Some(rule) = self.mau_rules.get(&key) else {
            return Err(DomainError::missing("Không có quy tắc cho cặp a-b này"));
        };
        let Some(object) = rule.as_object() else {
            return Err(DomainError::unexpected(format!("quy tắc {key} không phải object")));
        };
        let mut out = object.clone();
        out.insert("a".to_string(), Value::from(a));
        out.insert("b".to_string(), Value::from(b));
        Ok(Value::Object(out))
    }

    async fn relate_mau(&self, from_id: &str, to_id: &str, region: &str) -> Result<KinshipAnswer, DomainError> {
        let rows = self.people.members_in("nguyen-mau", "nguyen-mau").await?;
        let graph = graph_of(&rows);
        let Some(rel) = kinship::relate_mau(&graph, from_id, to_id, region) else {
            return Err(DomainError::missing("Không tìm thấy người trong phả đồ này"));
        };
        if !rel.dong_toc {
            return Ok(KinshipAnswer {
                term: None,
                term_goc: None,
                reverse_term: None,
                side: None,
                kind: "none".to_string(),
                a: None,
                b: None,
                ancestor_id: None,
            });
        }
        Ok(KinshipAnswer {
            term: rel.term,
            term_goc: rel.term_goc,
            reverse_term: rel.reverse_term,
            side: None,
            kind: "blood".to_string(),
            a: rel.a,
            b: rel.b,
            ancestor_id: rel.ancestor_id,
        })
    }

    async fn relate_lien(
        &self,
        from_id: &str,
        to_id: &str,
        region: &str,
        prefer: &str,
    ) -> Result<KinshipAnswer, DomainError> {
        let rows = self.people.members_in("nguyen", "duong").await?;
        let graph = graph_of(&rows);
        let Some(rel) = kinship::relate_lien(&graph, &self.lien_rules, from_id, to_id, prefer) else {
            return Err(DomainError::missing("Không tìm thấy người trong phả đồ này"));
        };
        let reverse = kinship::relate_lien(&graph, &self.lien_rules, to_id, from_id, prefer);
        let reverse_term = reverse
            .and_then(|item| item.term)
            .map(|term| kinship::regionalize(&term, region));
        let term = rel.term.as_deref().map(|term| kinship::regionalize(term, region));
        Ok(KinshipAnswer {
            term,
            term_goc: rel.term,
            reverse_term,
            side: rel.side,
            kind: rel.kind.to_string(),
            a: rel.a,
            b: rel.b,
            ancestor_id: rel.ancestor_id,
        })
    }
}

fn graph_of(rows: &[Member]) -> HashMap<String, Person> {
    rows.iter()
        .map(|row| {
            (
                row.id.clone(),
                Person {
                    id: row.id.clone(),
                    gender: row.gender.clone(),
                    father_id: row.father_id.clone(),
                    mother_id: row.mother_id.clone(),
                    spouse_id: row.spouse_id.clone(),
                    order: row.order,
                },
            )
        })
        .collect()
}

fn require_id(raw: &str, label: &str) -> Result<String, DomainError> {
    let id = raw.trim();
    if id.is_empty() || id.len() > 64 {
        return Err(DomainError::invalid(format!("{label} không hợp lệ")));
    }
    Ok(id.to_string())
}
