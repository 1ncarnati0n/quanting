use rusqlite::Connection;
use std::sync::Mutex;

use crate::models::Candle;

pub struct CacheDb {
    conn: Mutex<Connection>,
}

impl CacheDb {
    pub fn new() -> Result<Self, String> {
        let conn =
            Connection::open_in_memory().map_err(|e| format!("Failed to open cache db: {}", e))?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS kline_cache (
                cache_key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                cached_at INTEGER NOT NULL
            );",
        )
        .map_err(|e| format!("Failed to create cache table: {}", e))?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn get(&self, symbol: &str, interval: &str) -> Option<Vec<Candle>> {
        let conn = self.conn.lock().ok()?;
        let key = format!("{}:{}", symbol, interval);
        let ttl = Self::ttl_seconds(interval);
        let now = chrono::Utc::now().timestamp();

        let mut stmt = conn
            .prepare("SELECT data, cached_at FROM kline_cache WHERE cache_key = ?1")
            .ok()?;

        let result: Option<(String, i64)> = stmt
            .query_row(rusqlite::params![key], |row| Ok((row.get(0)?, row.get(1)?)))
            .ok();

        match result {
            Some((data, cached_at)) if now - cached_at < ttl => serde_json::from_str(&data).ok(),
            _ => None,
        }
    }

    pub fn set(&self, symbol: &str, interval: &str, candles: &[Candle]) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let key = format!("{}:{}", symbol, interval);
        let data = serde_json::to_string(candles).map_err(|e| e.to_string())?;
        let now = chrono::Utc::now().timestamp();

        conn.execute(
            "INSERT OR REPLACE INTO kline_cache (cache_key, data, cached_at) VALUES (?1, ?2, ?3)",
            rusqlite::params![key, data, now],
        )
        .map_err(|e| format!("Cache write error: {}", e))?;

        Ok(())
    }

    fn ttl_seconds(interval: &str) -> i64 {
        if interval == "1M" {
            return 2_592_000;
        }

        let mut digits = String::new();
        let mut unit: Option<char> = None;
        for ch in interval.chars() {
            if ch.is_ascii_digit() {
                digits.push(ch);
            } else {
                unit = Some(ch);
                break;
            }
        }

        let value = digits.parse::<i64>().ok().unwrap_or(0);
        let seconds = match unit {
            Some('m') if value > 0 => value * 60,
            Some('h') if value > 0 => value * 3_600,
            Some('d') if value > 0 => value * 86_400,
            Some('w') if value > 0 => value * 604_800,
            _ => 3_600,
        };

        seconds.clamp(60, 2_592_000)
    }
}
