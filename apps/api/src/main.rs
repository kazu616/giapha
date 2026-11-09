#![forbid(unsafe_code)]

mod auth;
mod error;
mod http;
mod kinship;
mod seed;

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use anyhow::Context;
use serde_json::Value;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

use crate::kinship::LienRule;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub jwt_secret: String,
    pub dummy_hash: String,
    pub mau_rules: Arc<serde_json::Map<String, Value>>,
    pub lien_rules: Arc<HashMap<String, LienRule>>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .json()
        .init();

    if let Err(err) = start().await {
        tracing::error!(error = %err, "không khởi động được");
        eprintln!("giapha-api: {err:#}");
        std::process::exit(1);
    }
}

async fn start() -> anyhow::Result<()> {
    let bind = std::env::var("BIND").unwrap_or_else(|_| "0.0.0.0:8080".to_string());
    let database_url = required_env("DATABASE_URL")?;
    let jwt_secret = required_env("JWT_SECRET")?;
    if jwt_secret.len() < 16 {
        anyhow::bail!("JWT_SECRET phải dài ít nhất 16 ký tự");
    }
    let assets_dir = std::env::var("ASSETS_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("apps/api/assets"));

    let pool = connect_db(&database_url).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    seed::seed(&pool, &assets_dir).await?;

    let mau_rules = load_mau_rules(&assets_dir)?;
    let lien_rules = kinship::parse_lien_rules(&seed::read_asset(&assets_dir, "lien-rules.json")?)
        .map_err(|err| anyhow::anyhow!(err))?;
    let dummy_hash = auth::hash_password(&format!("unused-{}", uuid::Uuid::new_v4()))?;
    let state = AppState {
        pool,
        jwt_secret,
        dummy_hash,
        mau_rules: Arc::new(mau_rules),
        lien_rules: Arc::new(lien_rules),
    };

    let app = http::router(state);
    let listener = tokio::net::TcpListener::bind(&bind)
        .await
        .with_context(|| format!("không mở được {bind}"))?;
    tracing::info!(%bind, assets = %assets_dir.display(), "đang lắng nghe");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

fn required_env(name: &str) -> anyhow::Result<String> {
    match std::env::var(name) {
        Ok(value) if !value.trim().is_empty() => Ok(value),
        _ => anyhow::bail!("{name} là bắt buộc"),
    }
}

fn load_mau_rules(dir: &std::path::Path) -> anyhow::Result<serde_json::Map<String, Value>> {
    let text = seed::read_asset(dir, "mau-rules.json")?;
    let value: Value = serde_json::from_str(&text)?;
    value
        .as_object()
        .cloned()
        .context("mau-rules.json phải là object")
}

async fn connect_db(url: &str) -> anyhow::Result<PgPool> {
    let mut last = String::from("không rõ");
    for attempt in 1..=10 {
        match PgPoolOptions::new()
            .max_connections(10)
            .acquire_timeout(Duration::from_secs(5))
            .idle_timeout(Duration::from_secs(600))
            .max_lifetime(Duration::from_secs(1800))
            .connect(url)
            .await
        {
            Ok(pool) => return Ok(pool),
            Err(err) => {
                tracing::warn!(attempt, "cơ sở dữ liệu chưa sẵn sàng");
                last = safe_db_error(&err);
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
    }
    anyhow::bail!("không kết nối được PostgreSQL sau 10 lần thử: {last}")
}

fn safe_db_error(err: &sqlx::Error) -> String {
    let text = err.to_string();
    if text.contains("postgres://") || text.contains("postgresql://") {
        "lỗi kết nối".to_string()
    } else {
        text
    }
}

async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };
    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(err) => {
                tracing::error!(error = %err, "không đăng ký SIGTERM");
                std::future::pending::<()>().await;
            }
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! {
        _ = ctrl_c => {}
        _ = terminate => {}
    }
    tracing::info!("đang dừng");
}
