//! Xưng hô. `relate_mau` bám `js/kinship.js`: đường cha đi lên, tổ chung,
//! nhánh so `path[1]` (con của tổ, đường ancestor-first).
//! `relate_lien` bám `js/lienho.js`: `path[0]` là người, `path[a]` là tổ,
//! nhánh so `pathX[a - 1]` và `pathY[b - 1]`.

use std::collections::{HashMap, HashSet};

use serde_json::Value;

#[derive(Clone, Debug)]
pub struct Person {
    pub id: String,
    pub gender: String,
    pub father_id: Option<String>,
    pub mother_id: Option<String>,
    pub spouse_id: Option<String>,
    pub order: Option<i32>,
}

#[derive(Clone, Debug)]
pub struct LienRule {
    pub term: String,
    pub spouse: String,
    pub inlaw: String,
}

#[derive(Debug)]
pub struct MauRel {
    pub dong_toc: bool,
    pub ancestor_id: Option<String>,
    pub a: Option<i32>,
    pub b: Option<i32>,
    pub branch: Option<String>,
    pub term_goc: Option<String>,
    pub reverse_goc: Option<String>,
    pub term: Option<String>,
    pub reverse_term: Option<String>,
}

#[derive(Debug)]
pub struct LienRel {
    pub term: Option<String>,
    pub kind: &'static str,
    pub side: Option<String>,
    pub a: Option<i32>,
    pub b: Option<i32>,
    pub ancestor_id: Option<String>,
}

struct OrderedMap<V> {
    keys: Vec<String>,
    values: HashMap<String, V>,
}

impl<V> OrderedMap<V> {
    fn new() -> Self {
        Self {
            keys: Vec::new(),
            values: HashMap::new(),
        }
    }

    fn insert(&mut self, key: String, value: V) {
        if !self.values.contains_key(&key) {
            self.keys.push(key.clone());
        }
        self.values.insert(key, value);
    }

    fn get(&self, key: &str) -> Option<&V> {
        self.values.get(key)
    }

    fn is_empty(&self) -> bool {
        self.values.is_empty()
    }

    fn iter(&self) -> impl Iterator<Item = (&str, &V)> {
        self.keys
            .iter()
            .filter_map(|key| self.values.get(key).map(|value| (key.as_str(), value)))
    }
}

struct BloodHit {
    a: i32,
    b: i32,
    ancestor_id: String,
    term: String,
    spouse: String,
    inlaw: String,
    score: i32,
    side: String,
}

struct Wedding {
    score: i32,
    kind: &'static str,
    term: String,
}

fn replace_first(source: &str, from: &str, to: &str) -> String {
    match source.find(from) {
        Some(index) => {
            let mut out = String::with_capacity(source.len() - from.len() + to.len());
            out.push_str(&source[..index]);
            out.push_str(to);
            out.push_str(&source[index + from.len()..]);
            out
        }
        None => source.to_string(),
    }
}

/// `String.prototype.replace` của kinship.js: mẫu chuỗi chỉ thay lần đầu,
/// `/^Cô$/` và `/^Mẹ$/` chỉ khi cả chuỗi khớp.
pub fn regionalize(term: &str, region: &str) -> String {
    if term.is_empty() {
        return String::new();
    }
    if region == "trung" {
        let step = replace_first(term, "Bác (nữ)*", "Bác");
        let step = if step == "Cô" {
            "O".to_string()
        } else {
            step
        };
        let step = replace_first(&step, "Bố (cha)", "Ba");
        if step == "Mẹ" {
            "Mạ".to_string()
        } else {
            step
        }
    } else if region == "nam" {
        let step = replace_first(term, "Bác (nữ)*", "Cô");
        let step = replace_first(&step, "Bố (cha)", "Ba");
        if step == "Mẹ" {
            "Má".to_string()
        } else {
            step
        }
    } else {
        let step = replace_first(term, "Bác (nữ)*", "Bác");
        replace_first(&step, "Bố (cha)", "Bố")
    }
}

fn term_for(a: i32, b: i32, gender: &str, elder: bool) -> String {
    let d = a - b;
    let male = gender == "Nam";
    if d < 0 {
        let down = -d;
        if a == 0 {
            let pair = match down {
                1 => Some(("Con trai", "Con gái")),
                2 => Some(("Cháu nội trai", "Cháu nội gái")),
                3 => Some(("Chắt trai", "Chắt gái")),
                4 => Some(("Chút trai", "Chút gái")),
                5 => Some(("Chít trai", "Chít gái")),
                _ => None,
            };
            if let Some((boy, girl)) = pair {
                return (if male { boy } else { girl }).to_string();
            }
            return if male {
                format!("Hậu duệ đời thứ {down} (trai)")
            } else {
                format!("Hậu duệ đời thứ {down} (gái)")
            };
        }
        if down == 1 || down == 2 {
            return (if male { "Cháu trai" } else { "Cháu gái" }).to_string();
        }
        if let Some(label) = match down {
            3 => Some("chắt"),
            4 => Some("chút"),
            5 => Some("chít"),
            _ => None,
        } {
            return if male {
                format!("Cháu trai (bậc {label})")
            } else {
                format!("Cháu gái (bậc {label})")
            };
        }
        return if male {
            format!("Cháu trai (bậc xa, {down} đời dưới)")
        } else {
            format!("Cháu gái (bậc xa, {down} đời dưới)")
        };
    }
    if d == 0 {
        if a == 1 {
            return (if male {
                if elder { "Anh ruột" } else { "Em trai ruột" }
            } else if elder {
                "Chị ruột"
            } else {
                "Em gái ruột"
            })
            .to_string();
        }
        let suffix = if a >= 5 { " họ (đồng tộc)" } else { " họ" };
        let head = if male {
            if elder { "Anh" } else { "Em trai" }
        } else if elder {
            "Chị"
        } else {
            "Em gái"
        };
        return format!("{head}{suffix}");
    }
    if b == 0 {
        if d == 1 {
            return (if male { "Bố (cha)" } else { "Mẹ" }).to_string();
        }
        if d == 2 {
            return (if male { "Ông nội" } else { "Bà nội" }).to_string();
        }
        if d == 3 {
            return (if male { "Cụ ông" } else { "Cụ bà" }).to_string();
        }
        if d == 4 {
            return (if male { "Kỵ ông" } else { "Kỵ bà" }).to_string();
        }
        return if male {
            format!("Ông tổ ({d} đời trên)")
        } else {
            format!("Bà tổ ({d} đời trên)")
        };
    }
    if d == 1 {
        return (if male {
            if elder { "Bác" } else { "Chú" }
        } else if elder {
            "Bác (nữ)*"
        } else {
            "Cô"
        })
        .to_string();
    }
    if d == 2 {
        return (if male {
            if elder { "Ông bác" } else { "Ông chú" }
        } else {
            "Bà cô"
        })
        .to_string();
    }
    if d == 3 {
        return (if male { "Cụ ông" } else { "Cụ bà" }).to_string();
    }
    if d == 4 {
        return (if male { "Kỵ ông" } else { "Kỵ bà" }).to_string();
    }
    if male {
        format!("Ông tổ bậc {d}")
    } else {
        format!("Bà tổ bậc {d}")
    }
}

fn chain(by_id: &HashMap<String, Person>, start: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut seen = HashSet::new();
    let mut id = start.to_string();
    while by_id.contains_key(&id) && seen.insert(id.clone()) {
        out.push(id.clone());
        match by_id.get(&id).and_then(|person| person.father_id.clone()) {
            Some(next) if !next.is_empty() => id = next,
            _ => break,
        }
    }
    out
}

/// Ancestor đứng đầu, giống `pathFrom` trong kinship.js.
fn path_from(by_id: &HashMap<String, Person>, ancestor_id: &str, id: &str) -> Option<Vec<String>> {
    let up = chain(by_id, id);
    let index = up.iter().position(|item| item == ancestor_id)?;
    let mut path = up[..=index].to_vec();
    path.reverse();
    Some(path)
}

pub fn relate_mau(by_id: &HashMap<String, Person>, x_id: &str, y_id: &str, region: &str) -> Option<MauRel> {
    let x = by_id.get(x_id)?;
    let y = by_id.get(y_id)?;
    if x_id == y_id {
        let goc = "Chính mình".to_string();
        let spoken = regionalize(&goc, region);
        return Some(MauRel {
            dong_toc: true,
            ancestor_id: Some(x_id.to_string()),
            a: Some(0),
            b: Some(0),
            branch: None,
            term_goc: Some(goc.clone()),
            reverse_goc: Some(goc),
            term: Some(spoken.clone()),
            reverse_term: Some(spoken),
        });
    }
    let x_ids: HashSet<String> = chain(by_id, x.id.as_str()).into_iter().collect();
    let Some(ancestor_id) = chain(by_id, y.id.as_str())
        .into_iter()
        .find(|id| x_ids.contains(id))
    else {
        return Some(MauRel {
            dong_toc: false,
            ancestor_id: None,
            a: None,
            b: None,
            branch: None,
            term_goc: None,
            reverse_goc: None,
            term: None,
            reverse_term: None,
        });
    };
    let Some(path_x) = path_from(by_id, &ancestor_id, x_id) else {
        return Some(empty_mau());
    };
    let Some(path_y) = path_from(by_id, &ancestor_id, y_id) else {
        return Some(empty_mau());
    };
    let a = path_x.len() as i32 - 1;
    let b = path_y.len() as i32 - 1;
    let d = a - b;
    let mut branch = None;
    let mut uncertain = false;
    if a >= 1 && b >= 1 {
        match (
            path_x.get(1).and_then(|id| by_id.get(id)).and_then(|person| person.order),
            path_y.get(1).and_then(|id| by_id.get(id)).and_then(|person| person.order),
        ) {
            (Some(order_x), Some(order_y)) if order_y < order_x => branch = Some("Lớn hơn".to_string()),
            (Some(order_x), Some(order_y)) if order_y > order_x => branch = Some("Nhỏ hơn".to_string()),
            _ => uncertain = true,
        }
    }
    let branch_matters = a >= 1 && b >= 1 && d >= 0;
    let elder = branch.as_deref() == Some("Lớn hơn");
    let term_goc = if branch_matters && uncertain {
        None
    } else {
        Some(term_for(a, b, &y.gender, elder))
    };
    let reverse_matters = b >= 1 && a >= 1 && b - a >= 0;
    let reverse_goc = if reverse_matters && uncertain {
        None
    } else {
        Some(term_for(b, a, &x.gender, branch.as_deref() == Some("Nhỏ hơn")))
    };
    Some(MauRel {
        dong_toc: true,
        ancestor_id: Some(ancestor_id),
        a: Some(a),
        b: Some(b),
        branch,
        term: term_goc.as_deref().map(|term| regionalize(term, region)),
        reverse_term: reverse_goc.as_deref().map(|term| regionalize(term, region)),
        term_goc,
        reverse_goc,
    })
}

fn empty_mau() -> MauRel {
    MauRel {
        dong_toc: false,
        ancestor_id: None,
        a: None,
        b: None,
        branch: None,
        term_goc: None,
        reverse_goc: None,
        term: None,
        reverse_term: None,
    }
}

fn real_id(value: &Option<String>) -> Option<&str> {
    value.as_deref().filter(|id| !id.is_empty())
}

fn search(
    by_id: &HashMap<String, Person>,
    start: &str,
) -> (OrderedMap<i32>, HashMap<String, Option<String>>) {
    let mut dist = OrderedMap::new();
    dist.insert(start.to_string(), 0);
    let mut pred = HashMap::new();
    pred.insert(start.to_string(), None);
    let mut stack = vec![start.to_string()];
    while let Some(current) = stack.pop() {
        let Some(person) = by_id.get(&current) else {
            continue;
        };
        for next in [person.father_id.as_deref(), person.mother_id.as_deref()]
            .into_iter()
            .flatten()
        {
            if next.is_empty() || !by_id.contains_key(next) {
                continue;
            }
            let Some(current_distance) = dist.get(&current).copied() else {
                continue;
            };
            let next_distance = current_distance + 1;
            let improved = match dist.get(next) {
                None => true,
                Some(old) => next_distance < *old,
            };
            if improved {
                dist.insert(next.to_string(), next_distance);
                pred.insert(next.to_string(), Some(current.clone()));
                stack.push(next.to_string());
            }
        }
    }
    (dist, pred)
}

/// `path[0]` là `start`, phần tử cuối là `target`.
fn path_between(
    pred: &HashMap<String, Option<String>>,
    start: &str,
    target: &str,
) -> Option<Vec<String>> {
    let mut path = vec![target.to_string()];
    let mut current = target.to_string();
    let mut seen = HashSet::new();
    while current != start {
        let next = pred.get(&current).and_then(|value| value.clone())?;
        if !seen.insert(next.clone()) {
            return None;
        }
        path.push(next.clone());
        current = next;
    }
    path.reverse();
    Some(path)
}

fn gender_at(by_id: &HashMap<String, Person>, path: &[String], index: i32) -> Option<String> {
    if index < 0 {
        return None;
    }
    let id = path.get(index as usize)?;
    Some(by_id.get(id)?.gender.clone())
}

fn connector(
    by_id: &HashMap<String, Person>,
    path_x: &[String],
    path_y: &[String],
    a: i32,
    b: i32,
) -> Option<String> {
    let d = a - b;
    if a == 0 && b >= 1 {
        return gender_at(by_id, path_y, b - 1);
    }
    if d > 0 {
        return gender_at(by_id, path_x, a - b);
    }
    if d == 0 && a >= 2 {
        return gender_at(by_id, path_y, b - 1);
    }
    Some("Nam".to_string())
}

fn branch_of(
    by_id: &HashMap<String, Person>,
    path_x: &[String],
    path_y: &[String],
    a: i32,
    b: i32,
) -> String {
    if a < 1 || b < 1 {
        return "Lớn hơn".to_string();
    }
    let order_x = path_x
        .get((a - 1) as usize)
        .and_then(|id| by_id.get(id))
        .and_then(|person| person.order);
    let order_y = path_y
        .get((b - 1) as usize)
        .and_then(|id| by_id.get(id))
        .and_then(|person| person.order);
    match (order_x, order_y) {
        (Some(left), Some(right)) if right < left => "Lớn hơn".to_string(),
        (Some(left), Some(right)) if right > left => "Nhỏ hơn".to_string(),
        _ => "Lớn hơn".to_string(),
    }
}

fn blood(
    by_id: &HashMap<String, Person>,
    rules: &HashMap<String, LienRule>,
    x_id: &str,
    y_id: &str,
    side: &str,
) -> Option<BloodHit> {
    let x = by_id.get(x_id)?;
    let y = by_id.get(y_id)?;
    if x_id == y_id {
        return None;
    }
    let entry = if side == "Nội" {
        real_id(&x.father_id)
    } else {
        real_id(&x.mother_id)
    };
    let (mut dist, mut pred) = if let Some(entry_id) = entry.filter(|id| by_id.contains_key(*id)) {
        search(by_id, entry_id)
    } else {
        (OrderedMap::new(), HashMap::new())
    };
    if side == "Nội" {
        dist.insert(x_id.to_string(), -1);
        pred.insert(x_id.to_string(), None);
    }
    if dist.is_empty() {
        return None;
    }
    let (down_dist, down_pred) = search(by_id, y_id);
    let mut best: Option<(i32, i32, i32, String)> = None;
    for (ancestor, distance) in dist.iter() {
        let Some(b) = down_dist.get(ancestor).copied() else {
            continue;
        };
        let a = if ancestor == x_id { 0 } else { distance + 1 };
        let score = a + b;
        let replace = match &best {
            None => true,
            Some((best_score, best_a, _, _)) => score < *best_score || (score == *best_score && a < *best_a),
        };
        if replace {
            best = Some((score, a, b, ancestor.to_string()));
        }
    }
    let (score, a, b, ancestor_id) = best?;
    let path_x = if ancestor_id == x_id {
        vec![x_id.to_string()]
    } else {
        let Some(entry_id) = entry else {
            return None;
        };
        let mut path = vec![x_id.to_string()];
        path.extend(path_between(&pred, entry_id, &ancestor_id).unwrap_or_default());
        path
    };
    let path_y = path_between(&down_pred, y_id, &ancestor_id)?;
    if path_x.len() as i32 - 1 != a || path_y.len() as i32 - 1 != b {
        return None;
    }
    let noi = connector(by_id, &path_x, &path_y, a, b)?;
    let branch = branch_of(by_id, &path_x, &path_y, a, b);
    let gender = y.gender.as_str();
    let key = format!("{a}|{b}|{side}|{noi}|{gender}|{branch}");
    let rule = rules.get(&key)?;
    Some(BloodHit {
        a,
        b,
        ancestor_id,
        term: rule.term.clone(),
        spouse: rule.spouse.clone(),
        inlaw: rule.inlaw.clone(),
        score,
        side: side.to_string(),
    })
}

fn choose(
    by_id: &HashMap<String, Person>,
    rules: &HashMap<String, LienRule>,
    x_id: &str,
    y_id: &str,
    prefer: &str,
) -> Option<BloodHit> {
    let noi = blood(by_id, rules, x_id, y_id, "Nội");
    let ngoai = blood(by_id, rules, x_id, y_id, "Ngoại");
    if prefer == "noi" {
        noi.or(ngoai)
    } else if prefer == "ngoai" {
        ngoai.or(noi)
    } else {
        match (noi, ngoai) {
            (Some(noi_hit), Some(ngoai_hit)) => {
                if ngoai_hit.score < noi_hit.score {
                    Some(ngoai_hit)
                } else {
                    Some(noi_hit)
                }
            }
            (noi_hit, ngoai_hit) => noi_hit.or(ngoai_hit),
        }
    }
}

fn marriage(
    by_id: &HashMap<String, Person>,
    rules: &HashMap<String, LienRule>,
    x_id: &str,
    y_id: &str,
) -> Option<Wedding> {
    let x = by_id.get(x_id)?;
    let y = by_id.get(y_id)?;
    let mut found = Vec::new();
    if let Some(spouse) = real_id(&y.spouse_id) {
        if spouse != x_id && by_id.contains_key(spouse) {
            if let Some(hit) = choose(by_id, rules, x_id, spouse, "gan") {
                if !hit.spouse.is_empty() {
                    found.push(Wedding {
                        score: hit.score,
                        kind: "A",
                        term: hit.spouse,
                    });
                }
            }
        }
    }
    if let Some(spouse) = real_id(&x.spouse_id) {
        if spouse != y_id && by_id.contains_key(spouse) {
            if let Some(hit) = choose(by_id, rules, spouse, y_id, "gan") {
                if !hit.inlaw.is_empty() {
                    found.push(Wedding {
                        score: hit.score,
                        kind: "B",
                        term: hit.inlaw,
                    });
                }
            }
        }
    }
    found.sort_by(|left, right| {
        left.score.cmp(&right.score).then_with(|| {
            let rank = |kind: &str| if kind == "A" { 0 } else { 1 };
            rank(left.kind).cmp(&rank(right.kind))
        })
    });
    found.into_iter().next()
}

pub fn relate_lien(
    by_id: &HashMap<String, Person>,
    rules: &HashMap<String, LienRule>,
    x_id: &str,
    y_id: &str,
    prefer: &str,
) -> Option<LienRel> {
    let x = by_id.get(x_id)?;
    let y = by_id.get(y_id)?;
    let prefer = if prefer.is_empty() { "gan" } else { prefer };
    if x_id == y_id {
        return Some(LienRel {
            term: Some("Chính mình".to_string()),
            kind: "self",
            side: None,
            a: Some(0),
            b: Some(0),
            ancestor_id: Some(x_id.to_string()),
        });
    }
    if let Some(hit) = choose(by_id, rules, x_id, y_id, prefer) {
        return Some(LienRel {
            term: Some(hit.term),
            kind: "blood",
            side: Some(hit.side),
            a: Some(hit.a),
            b: Some(hit.b),
            ancestor_id: Some(hit.ancestor_id),
        });
    }
    if real_id(&x.spouse_id) == Some(y_id) {
        let term = if y.gender == "Nữ" { "Vợ" } else { "Chồng" };
        return Some(LienRel {
            term: Some(term.to_string()),
            kind: "spouse",
            side: None,
            a: None,
            b: None,
            ancestor_id: None,
        });
    }
    if let Some(wedding) = marriage(by_id, rules, x_id, y_id) {
        return Some(LienRel {
            term: Some(wedding.term),
            kind: "marriage",
            side: None,
            a: None,
            b: None,
            ancestor_id: None,
        });
    }
    Some(LienRel {
        term: None,
        kind: "none",
        side: None,
        a: None,
        b: None,
        ancestor_id: None,
    })
}

pub fn parse_lien_rules(text: &str) -> Result<HashMap<String, LienRule>, String> {
    let raw: HashMap<String, Vec<Value>> = serde_json::from_str(text).map_err(|err| err.to_string())?;
    let mut rules = HashMap::with_capacity(raw.len());
    for (key, row) in raw {
        let Some(term) = row.first().and_then(Value::as_str) else {
            return Err(format!("quy tắc {key} sai kiểu"));
        };
        let Some(spouse) = row.get(1).and_then(Value::as_str) else {
            return Err(format!("quy tắc {key} sai kiểu"));
        };
        let Some(inlaw) = row.get(2).and_then(Value::as_str) else {
            return Err(format!("quy tắc {key} sai kiểu"));
        };
        if row.len() != 3 {
            return Err(format!("quy tắc {key} không đủ 3 giá trị"));
        }
        rules.insert(
            key,
            LienRule {
                term: term.to_string(),
                spouse: spouse.to_string(),
                inlaw: inlaw.to_string(),
            },
        );
    }
    Ok(rules)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Deserialize;

    const MAU_PEOPLE: &str = include_str!("../../../assets/mau-people.json");
    const MAU_TESTS: &str = include_str!("../../../assets/mau-tests.json");
    const LIEN_PEOPLE: &str = include_str!("../../../assets/lien-people.json");
    const LIEN_RULES: &str = include_str!("../../../assets/lien-rules.json");

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct RawPerson {
        id: String,
        gender: String,
        #[serde(default)]
        father_id: Option<String>,
        #[serde(default)]
        mother_id: Option<String>,
        #[serde(default)]
        spouse_id: Option<String>,
        #[serde(default)]
        order: Option<i32>,
    }

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct MauCase {
        x: String,
        y: String,
        ancestor: String,
        a: i32,
        b: i32,
        branch: String,
        x_calls_y: String,
        y_calls_x: String,
    }

    fn load_people(text: &str) -> HashMap<String, Person> {
        let rows: Vec<RawPerson> = serde_json::from_str(text).expect("people json");
        rows.into_iter()
            .map(|row| {
                (
                    row.id.clone(),
                    Person {
                        id: row.id,
                        gender: row.gender,
                        father_id: row.father_id,
                        mother_id: row.mother_id,
                        spouse_id: row.spouse_id,
                        order: row.order,
                    },
                )
            })
            .collect()
    }

    #[test]
    fn mau_cases_match_bac() {
        let people = load_people(MAU_PEOPLE);
        let cases: Vec<MauCase> = serde_json::from_str(MAU_TESTS).expect("mau tests");
        assert_eq!(cases.len(), 12);
        let mut fails = Vec::new();
        for case in &cases {
            let Some(rel) = relate_mau(&people, &case.x, &case.y, "bac") else {
                fails.push(format!("{}→{} missing", case.x, case.y));
                continue;
            };
            let branch = rel.branch.clone().unwrap_or_else(|| "-".to_string());
            let ok = rel.ancestor_id.as_deref() == Some(case.ancestor.as_str())
                && rel.a == Some(case.a)
                && rel.b == Some(case.b)
                && branch == case.branch
                && rel.term_goc.as_deref() == Some(case.x_calls_y.as_str())
                && rel.reverse_goc.as_deref() == Some(case.y_calls_x.as_str())
                && rel.term.as_deref() == Some(case.x_calls_y.as_str())
                && rel.reverse_term.as_deref() == Some(case.y_calls_x.as_str());
            if !ok {
                fails.push(format!(
                    "{}→{} got ancestor={:?} a={:?} b={:?} branch={} termGoc={:?} reverse={:?}",
                    case.x,
                    case.y,
                    rel.ancestor_id,
                    rel.a,
                    rel.b,
                    branch,
                    rel.term_goc,
                    rel.reverse_term
                ));
            }
        }
        assert!(fails.is_empty(), "{fails:?}");
    }

    #[test]
    fn lien_checks_match_minh() {
        let people = load_people(LIEN_PEOPLE);
        let rules = parse_lien_rules(LIEN_RULES).expect("lien rules");
        let ego = "N07";
        let expect = [
            ("N01", "Cụ ông nội", "Nội"),
            ("N02", "Ông nội", "Nội"),
            ("N03", "Ông chú (bên nội)", "Nội"),
            ("N04", "Bà cô (bên nội)", "Nội"),
            ("N05", "Bố (cha)", "Nội"),
            ("N06", "Cô", "Nội"),
            ("N08", "Em trai ruột", "Nội"),
            ("N09", "Chú", "Nội"),
            ("N10", "Em trai họ (họ 2 đời, bên nội)", "Nội"),
            ("N11", "Cháu trai", "Ngoại"),
            ("N12", "Cháu gái", "Ngoại"),
            ("D01", "Ông ngoại", "Ngoại"),
            ("D02", "Cậu", "Ngoại"),
            ("D03", "Mẹ", "Ngoại"),
            ("D04", "Cậu", "Ngoại"),
            ("D05", "Anh họ (con cậu)", "Ngoại"),
            ("D06", "Chị họ (con cậu)", "Ngoại"),
            ("D07", "Em gái họ (con cậu)", "Ngoại"),
        ];
        let back = [
            ("N01", "Chắt nội trai"),
            ("N02", "Cháu nội trai"),
            ("N03", "Cháu trai"),
            ("N04", "Cháu trai"),
            ("N05", "Con trai"),
            ("N06", "Cháu trai"),
            ("N08", "Anh ruột"),
            ("N09", "Cháu trai"),
            ("N10", "Anh họ (họ 2 đời, bên nội)"),
            ("N11", "Cậu"),
            ("N12", "Cậu"),
            ("D01", "Cháu ngoại trai"),
            ("D02", "Cháu trai"),
            ("D03", "Con trai"),
            ("D04", "Cháu trai"),
            ("D05", "Em trai họ (con cô)"),
            ("D06", "Em trai họ (con cô)"),
            ("D07", "Anh họ (con cô)"),
        ];
        let mut fails = Vec::new();
        for (id, term, side) in expect {
            let rel = relate_lien(&people, &rules, ego, id, "gan");
            if rel.as_ref().and_then(|item| item.term.as_deref()) != Some(term)
                || rel.as_ref().and_then(|item| item.side.as_deref()) != Some(side)
            {
                fails.push(format!("{ego}→{id}"));
            }
            let reverse_term = back
                .iter()
                .find(|(key, _)| *key == id)
                .map(|(_, term)| *term);
            let rev = relate_lien(&people, &rules, id, ego, "gan");
            if rev.as_ref().and_then(|item| item.term.as_deref()) != reverse_term {
                fails.push(format!("{id}→{ego}"));
            }
        }
        let marriage_rows = [
            ("D05", "N05", "Dượng (chú)"),
            ("D06", "N05", "Dượng (chú)"),
            ("N05", "D05", "Cháu trai (theo vợ/chồng)"),
            ("N05", "D02", "Anh (anh của vợ/chồng)"),
            ("N10", "D05", "Anh (anh của vợ/chồng)"),
            ("N10", "D03", "Cô (theo vợ/chồng)"),
            ("N05", "D03", "Vợ"),
            ("D03", "N05", "Chồng"),
        ];
        for (x, y, term) in marriage_rows {
            let rel = relate_lien(&people, &rules, x, y, "gan");
            if rel.as_ref().and_then(|item| item.term.as_deref()) != Some(term) {
                fails.push(format!("{x}→{y}"));
            }
        }
        let quan = relate_lien(&people, &rules, "N11", "N07", "noi");
        if quan.as_ref().and_then(|item| item.side.as_deref()) != Some("Nội")
            || quan.as_ref().and_then(|item| item.term.as_deref()) != Some("Bác")
        {
            fails.push("N11→N07 nội".to_string());
        }
        assert!(fails.is_empty(), "{fails:?}");
    }

    #[test]
    fn regionalize_matches_kinship_js() {
        assert_eq!(regionalize("Bố (cha)", "bac"), "Bố");
        assert_eq!(regionalize("Bố (cha)", "trung"), "Ba");
        assert_eq!(regionalize("Bố (cha)", "nam"), "Ba");
        assert_eq!(regionalize("Mẹ", "bac"), "Mẹ");
        assert_eq!(regionalize("Mẹ", "trung"), "Mạ");
        assert_eq!(regionalize("Mẹ", "nam"), "Má");
        assert_eq!(regionalize("Cô", "bac"), "Cô");
        assert_eq!(regionalize("Cô", "trung"), "O");
        assert_eq!(regionalize("Cô", "nam"), "Cô");
        assert_eq!(regionalize("Bác (nữ)*", "bac"), "Bác");
        assert_eq!(regionalize("Bác (nữ)*", "trung"), "Bác");
        assert_eq!(regionalize("Bác (nữ)*", "nam"), "Cô");
        assert_eq!(
            regionalize("Bác (nữ)* (theo vợ/chồng)", "nam"),
            "Cô (theo vợ/chồng)"
        );
        assert_eq!(
            regionalize("Bố (cha) (theo vợ/chồng)", "trung"),
            "Ba (theo vợ/chồng)"
        );
        assert_eq!(regionalize("Mẹ (theo vợ/chồng)", "nam"), "Mẹ (theo vợ/chồng)");
        assert_eq!(regionalize("Cô (theo vợ/chồng)", "trung"), "Cô (theo vợ/chồng)");
    }
}
