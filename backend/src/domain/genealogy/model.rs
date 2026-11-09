#[derive(Debug, Clone)]
pub struct Clan {
    pub id: String,
    pub name: String,
    pub kind: String,
}

#[derive(Debug, Clone)]
pub struct Member {
    pub id: String,
    pub clan_id: String,
    pub name: String,
    pub gender: String,
    pub father_id: Option<String>,
    pub mother_id: Option<String>,
    pub spouse_id: Option<String>,
    pub order: Option<i32>,
    pub generation: Option<i32>,
    pub note: String,
}

#[derive(Debug, Clone)]
pub struct KinshipAnswer {
    pub term: Option<String>,
    pub term_goc: Option<String>,
    pub reverse_term: Option<String>,
    pub side: Option<String>,
    pub kind: String,
    pub a: Option<i32>,
    pub b: Option<i32>,
    pub ancestor_id: Option<String>,
}

pub fn blank(value: Option<String>) -> Option<String> {
    value.filter(|item| !item.is_empty())
}
