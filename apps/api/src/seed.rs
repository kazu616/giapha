use std::ops::DerefMut;
use std::path::Path;

use anyhow::Context;
use chrono::{DateTime, NaiveDate, TimeZone, Utc};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth;

const ADMIN_EMAIL: &str = "admin@giapha.local";
const ADMIN_NAME: &str = "Quản trị";
const ADMIN_PASSWORD: &str = "Admin@12345";
const MEMBER_EMAIL: &str = "minh@giapha.local";
const MEMBER_NAME: &str = "Nguyễn Văn Minh";
const MEMBER_PASSWORD: &str = "Member@12345";
const MEMBER_PERSON: &str = "P09";

pub async fn seed(pool: &PgPool, assets_dir: &Path) -> anyhow::Result<()> {
    seed_admin(pool).await?;
    seed_clans_and_people(pool, assets_dir).await?;
    seed_member(pool).await?;
    seed_news(pool).await?;
    seed_events(pool).await?;
    Ok(())
}

pub fn read_asset(dir: &Path, name: &str) -> anyhow::Result<String> {
    let path = dir.join(name);
    std::fs::read_to_string(&path).with_context(|| format!("không đọc được {}", path.display()))
}

async fn seed_admin(pool: &PgPool) -> anyhow::Result<()> {
    let existing: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM users")
        .fetch_one(pool)
        .await?;
    if existing > 0 {
        return Ok(());
    }
    let password_hash = auth::hash_password(ADMIN_PASSWORD)?;
    let mut tx = pool.begin().await?;
    sqlx::query("LOCK TABLE users IN EXCLUSIVE MODE")
        .execute(tx.deref_mut())
        .await?;
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM users")
        .fetch_one(tx.deref_mut())
        .await?;
    if count > 0 {
        tx.rollback().await?;
        return Ok(());
    }
    sqlx::query(
        "INSERT INTO users (id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, 'admin')",
    )
    .bind(Uuid::new_v4())
    .bind(ADMIN_EMAIL)
    .bind(ADMIN_NAME)
    .bind(password_hash)
    .execute(tx.deref_mut())
    .await?;
    tx.commit().await?;
    tracing::info!("đã tạo tài khoản quản trị");
    Ok(())
}

async fn seed_member(pool: &PgPool) -> anyhow::Result<()> {
    let existing: Option<uuid::Uuid> =
        sqlx::query_scalar("SELECT id FROM users WHERE email = $1")
            .bind(MEMBER_EMAIL)
            .fetch_optional(pool)
            .await?;
    if existing.is_some() {
        return Ok(());
    }
    let person: Option<String> = sqlx::query_scalar("SELECT id FROM people WHERE id = $1")
        .bind(MEMBER_PERSON)
        .fetch_optional(pool)
        .await?;
    if person.is_none() {
        return Ok(());
    }
    let password_hash = auth::hash_password(MEMBER_PASSWORD)?;
    sqlx::query(
        "INSERT INTO users (id, email, name, password_hash, role, person_id)
         VALUES ($1, $2, $3, $4, 'member', $5)",
    )
    .bind(Uuid::new_v4())
    .bind(MEMBER_EMAIL)
    .bind(MEMBER_NAME)
    .bind(password_hash)
    .bind(MEMBER_PERSON)
    .execute(pool)
    .await?;
    tracing::info!("đã tạo tài khoản thành viên gắn với {MEMBER_PERSON}");
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct MauSeed {
    id: String,
    name: String,
    gender: String,
    #[serde(default)]
    father_id: Option<String>,
    #[serde(default)]
    order: Option<i32>,
    #[serde(default)]
    generation: Option<i32>,
    #[serde(default)]
    note: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LienSeed {
    id: String,
    name: String,
    clan: String,
    gender: String,
    #[serde(default)]
    father_id: Option<String>,
    #[serde(default)]
    mother_id: Option<String>,
    #[serde(default)]
    spouse_id: Option<String>,
    #[serde(default)]
    order: Option<i32>,
    #[serde(default)]
    generation: Option<i32>,
    #[serde(default)]
    note: Option<String>,
}

async fn seed_clans_and_people(pool: &PgPool, assets_dir: &Path) -> anyhow::Result<()> {
    let existing: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM clans")
        .fetch_one(pool)
        .await?;
    if existing > 0 {
        return Ok(());
    }
    let mau: Vec<MauSeed> = serde_json::from_str(&read_asset(assets_dir, "mau-people.json")?)?;
    let lien: Vec<LienSeed> = serde_json::from_str(&read_asset(assets_dir, "lien-people.json")?)?;
    let mut tx = pool.begin().await?;
    sqlx::query("LOCK TABLE clans IN EXCLUSIVE MODE")
        .execute(tx.deref_mut())
        .await?;
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM clans")
        .fetch_one(tx.deref_mut())
        .await?;
    if count > 0 {
        tx.rollback().await?;
        return Ok(());
    }
    for (id, name, kind) in [
        ("nguyen-mau", "Dòng họ Nguyễn", "mau"),
        ("nguyen", "Họ Nguyễn", "lien"),
        ("duong", "Họ Dương", "lien"),
    ] {
        sqlx::query("INSERT INTO clans (id, name, kind) VALUES ($1, $2, $3)")
            .bind(id)
            .bind(name)
            .bind(kind)
            .execute(tx.deref_mut())
            .await?;
    }
    for person in &mau {
        insert_person(
            tx.deref_mut(),
            &person.id,
            "nguyen-mau",
            &person.name,
            &person.gender,
            person.father_id.as_deref(),
            None,
            None,
            person.order,
            person.generation,
            person.note.as_deref(),
        )
        .await?;
    }
    for person in &lien {
        let clan_id = match person.clan.as_str() {
            "Nguyễn" => "nguyen",
            "Dương" => "duong",
            other => anyhow::bail!("dòng họ liên họ không nhận ra: {other}"),
        };
        insert_person(
            tx.deref_mut(),
            &person.id,
            clan_id,
            &person.name,
            &person.gender,
            person.father_id.as_deref(),
            person.mother_id.as_deref(),
            person.spouse_id.as_deref(),
            person.order,
            person.generation,
            person.note.as_deref(),
        )
        .await?;
    }
    tx.commit().await?;
    tracing::info!(mau = mau.len(), lien = lien.len(), "đã nạp dòng họ và thành viên");
    Ok(())
}

async fn insert_person(
    tx: &mut sqlx::PgConnection,
    id: &str,
    clan_id: &str,
    name: &str,
    gender: &str,
    father_id: Option<&str>,
    mother_id: Option<&str>,
    spouse_id: Option<&str>,
    birth_order: Option<i32>,
    generation: Option<i32>,
    note: Option<&str>,
) -> anyhow::Result<()> {
    sqlx::query(
        "INSERT INTO people
            (id, clan_id, name, gender, father_id, mother_id, spouse_id, birth_order, generation, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
    )
    .bind(id)
    .bind(clan_id)
    .bind(name)
    .bind(gender)
    .bind(empty_as_none(father_id))
    .bind(empty_as_none(mother_id))
    .bind(empty_as_none(spouse_id))
    .bind(birth_order)
    .bind(generation)
    .bind(note.unwrap_or(""))
    .execute(&mut *tx)
    .await?;
    Ok(())
}

fn empty_as_none(value: Option<&str>) -> Option<&str> {
    value.filter(|item| !item.is_empty())
}

async fn seed_news(pool: &PgPool) -> anyhow::Result<()> {
    let mut tx = pool.begin().await?;
    sqlx::query("LOCK TABLE news IN EXCLUSIVE MODE")
        .execute(tx.deref_mut())
        .await?;
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM news")
        .fetch_one(tx.deref_mut())
        .await?;
    if count > 0 {
        tx.rollback().await?;
        return Ok(());
    }
    let admin_id: Option<Uuid> = sqlx::query_scalar(
        "SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1",
    )
    .fetch_optional(tx.deref_mut())
    .await?;
    let Some(admin_id) = admin_id else {
        anyhow::bail!("không có tài khoản admin để ghi tin tức");
    };
    let rows = [
        (
            "Thông báo họp họ",
            "Ban liên lạc mời con cháu về họp họ để bàn việc ghi chép gia phả, lịch giỗ chung và công việc của dòng họ. Địa điểm cụ thể được chốt tại cuộc họp.",
            at_utc(2026, 1, 15)?,
        ),
        (
            "Cập nhật phả đồ",
            "Phả đồ mẫu phụ hệ và phả đồ liên họ đã được đưa lên hệ thống. Con cháu có thể xem các đời và cách xưng hô theo miền Bắc, Trung, Nam.",
            at_utc(2026, 2, 2)?,
        ),
    ];
    for (title, body, published_at) in rows {
        sqlx::query(
            "INSERT INTO news (id, title, body, author_id, published_at) VALUES ($1, $2, $3, $4, $5)",
        )
        .bind(Uuid::new_v4())
        .bind(title)
        .bind(body)
        .bind(admin_id)
        .bind(published_at)
        .execute(tx.deref_mut())
        .await?;
    }
    tx.commit().await?;
    tracing::info!("đã nạp tin tức");
    Ok(())
}

async fn seed_events(pool: &PgPool) -> anyhow::Result<()> {
    let mut tx = pool.begin().await?;
    sqlx::query("LOCK TABLE events IN EXCLUSIVE MODE")
        .execute(tx.deref_mut())
        .await?;
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM events")
        .fetch_one(tx.deref_mut())
        .await?;
    if count > 0 {
        tx.rollback().await?;
        return Ok(());
    }
    let rows = [
        (
            "Giỗ tổ",
            "giỗ",
            NaiveDate::from_ymd_opt(2026, 3, 15).context("ngày giỗ")?,
            "Nhà thờ họ",
            "Con cháu sum vầy trong ngày giỗ chung của dòng họ. Buổi lễ không gắn với tên riêng của một vị tổ.",
        ),
        (
            "Họp họ cuối năm",
            "họp họ",
            NaiveDate::from_ymd_opt(2026, 11, 22).context("ngày họp họ")?,
            "Đình làng",
            "Họp mặt cuối năm để thống nhất việc ghi phả và lịch giỗ của năm sau.",
        ),
    ];
    for (title, kind, event_date, place, body) in rows {
        sqlx::query(
            "INSERT INTO events (id, title, kind, event_date, place, body) VALUES ($1, $2, $3, $4, $5, $6)",
        )
        .bind(Uuid::new_v4())
        .bind(title)
        .bind(kind)
        .bind(event_date)
        .bind(place)
        .bind(body)
        .execute(tx.deref_mut())
        .await?;
    }
    tx.commit().await?;
    tracing::info!("đã nạp sự kiện");
    Ok(())
}

fn at_utc(year: i32, month: u32, day: u32) -> anyhow::Result<DateTime<Utc>> {
    let naive = NaiveDate::from_ymd_opt(year, month, day)
        .and_then(|date| date.and_hms_opt(8, 0, 0))
        .context("ngày seed không hợp lệ")?;
    Ok(Utc.from_utc_datetime(&naive))
}
