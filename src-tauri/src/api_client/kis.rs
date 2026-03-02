use std::sync::Arc;
use tokio::sync::RwLock;

use chrono::{FixedOffset, NaiveDate, NaiveDateTime, NaiveTime, TimeZone, Utc};
use serde::Deserialize;
use serde_json::Value;

use crate::models::Candle;

const BASE_URL: &str = "https://openapi.koreainvestment.com:9443";
const KST_OFFSET: i32 = 9 * 3600;

// ── Config ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
struct KisConfig {
    app_key: String,
    app_secret: String,
}

#[derive(Debug, Clone)]
struct CachedToken {
    access_token: String,
    expires_at: i64, // unix seconds (UTC)
}

// ── Client ──────────────────────────────────────────────────────────

pub struct KisClient {
    client: reqwest::Client,
    config: Option<KisConfig>,
    token: Arc<RwLock<Option<CachedToken>>>,
}

impl KisClient {
    pub fn new() -> Self {
        let config = Self::load_config();
        Self {
            client: reqwest::Client::new(),
            config,
            token: Arc::new(RwLock::new(None)),
        }
    }

    /// 환경변수 → config 파일 순으로 자격 증명 로드
    fn load_config() -> Option<KisConfig> {
        // 1) 환경변수
        if let (Ok(key), Ok(secret)) = (
            std::env::var("KIS_APP_KEY"),
            std::env::var("KIS_APP_SECRET"),
        ) {
            if !key.is_empty() && !secret.is_empty() {
                return Some(KisConfig {
                    app_key: key,
                    app_secret: secret,
                });
            }
        }

        // 2) ~/.quanting/kis_config.json
        let home = dirs::home_dir()?;
        let path = home.join(".quanting").join("kis_config.json");
        let data = std::fs::read_to_string(path).ok()?;
        serde_json::from_str::<KisConfig>(&data).ok()
    }

    fn config(&self) -> Result<&KisConfig, String> {
        self.config.as_ref().ok_or_else(|| {
            "한국투자증권 API 키가 설정되지 않았습니다. \
             KIS_APP_KEY/KIS_APP_SECRET 환경변수를 설정하거나 \
             ~/.quanting/kis_config.json 파일을 생성해주세요."
                .to_string()
        })
    }

    // ── Token management ────────────────────────────────────────────

    async fn get_token(&self) -> Result<String, String> {
        // Fast path: read lock
        {
            let guard = self.token.read().await;
            if let Some(cached) = guard.as_ref() {
                let now = Utc::now().timestamp();
                if cached.expires_at - now > 300 {
                    // 5분 여유
                    return Ok(cached.access_token.clone());
                }
            }
        }

        // Slow path: write lock & refresh
        let mut guard = self.token.write().await;
        // Double-check after acquiring write lock
        if let Some(cached) = guard.as_ref() {
            let now = Utc::now().timestamp();
            if cached.expires_at - now > 300 {
                return Ok(cached.access_token.clone());
            }
        }

        let cfg = self.config()?;
        let body = serde_json::json!({
            "grant_type": "client_credentials",
            "appkey": cfg.app_key,
            "appsecret": cfg.app_secret,
        });

        let resp = self
            .client
            .post(format!("{}/oauth2/tokenP", BASE_URL))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("KIS token request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("KIS token error ({}): {}", status, text));
        }

        let json: Value = resp
            .json()
            .await
            .map_err(|e| format!("KIS token parse error: {}", e))?;

        let access_token = json["access_token"]
            .as_str()
            .ok_or("KIS token response missing access_token")?
            .to_string();

        // expires_in is seconds from now (typically 86400)
        let expires_in = json["expires_in"].as_i64().unwrap_or(86400);
        let expires_at = Utc::now().timestamp() + expires_in;

        *guard = Some(CachedToken {
            access_token: access_token.clone(),
            expires_at,
        });

        Ok(access_token)
    }

    // ── Public entry point ──────────────────────────────────────────

    pub async fn fetch_klines(
        &self,
        symbol: &str,
        interval: &str,
        limit: u32,
    ) -> Result<Vec<Candle>, String> {
        self.config()?; // fail fast if no credentials

        let (stock_code, _mrkt_div) = parse_symbol(symbol)?;

        match interval {
            "1m" | "5m" | "15m" | "30m" | "1h" => {
                self.fetch_kr_minute_candles(&stock_code, interval, limit)
                    .await
            }
            _ => {
                self.fetch_kr_daily_candles(&stock_code, interval, limit)
                    .await
            }
        }
    }

    // ── Daily candles ───────────────────────────────────────────────
    // tr_id: FHKST03010100  (국내주식기간별시세 일/주/월/년)

    async fn fetch_kr_daily_candles(
        &self,
        stock_code: &str,
        interval: &str,
        limit: u32,
    ) -> Result<Vec<Candle>, String> {
        let token = self.get_token().await?;
        let cfg = self.config()?;

        let period = match interval {
            "1w" => "W",
            "1M" => "M",
            _ => "D",
        };

        let today = Utc::now()
            .with_timezone(&FixedOffset::east_opt(KST_OFFSET).unwrap())
            .format("%Y%m%d")
            .to_string();

        // 시작일: 충분히 과거
        let start_date = match interval {
            "1M" => "19900101",
            "1w" => "20000101",
            _ => "20200101",
        };

        let url = format!(
            "{}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
            BASE_URL
        );

        let resp = self
            .client
            .get(&url)
            .header("authorization", format!("Bearer {}", token))
            .header("appkey", &cfg.app_key)
            .header("appsecret", &cfg.app_secret)
            .header("tr_id", "FHKST03010100")
            .header("content-type", "application/json; charset=utf-8")
            .query(&[
                ("fid_cond_mrkt_div_code", "J"),
                ("fid_input_iscd", stock_code),
                ("fid_input_date_1", start_date),
                ("fid_input_date_2", &today),
                ("fid_period_div_code", period),
                ("fid_org_adj_prc", "0"),
            ])
            .send()
            .await
            .map_err(|e| format!("KIS daily API error: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("KIS daily API error ({}): {}", status, text));
        }

        let json: Value = resp
            .json()
            .await
            .map_err(|e| format!("KIS daily parse error: {}", e))?;

        check_kis_error(&json)?;

        let items = json["output2"]
            .as_array()
            .ok_or("KIS daily API: output2 missing")?;

        let kst = FixedOffset::east_opt(KST_OFFSET).unwrap();
        let mut candles: Vec<Candle> = items
            .iter()
            .filter_map(|item| {
                let date_str = item["stck_bsop_date"].as_str()?;
                let date = NaiveDate::parse_from_str(date_str, "%Y%m%d").ok()?;
                let dt = date.and_hms_opt(9, 0, 0)?; // 장 시작 시각
                let timestamp = kst.from_local_datetime(&dt).single()?.timestamp();

                let open = parse_f64(item["stck_oprc"].as_str()?)?;
                let high = parse_f64(item["stck_hgpr"].as_str()?)?;
                let low = parse_f64(item["stck_lwpr"].as_str()?)?;
                let close = parse_f64(item["stck_clpr"].as_str()?)?;
                let volume = parse_f64(item["acml_vol"].as_str()?)?;

                Some(Candle {
                    time: timestamp,
                    open,
                    high,
                    low,
                    close,
                    volume,
                })
            })
            .collect();

        // API returns newest first → sort ascending
        candles.sort_by_key(|c| c.time);

        // Trim to requested limit
        if candles.len() > limit as usize {
            candles = candles.split_off(candles.len() - limit as usize);
        }

        if candles.is_empty() {
            return Err("KIS daily API: 캔들 데이터가 없습니다".to_string());
        }

        Ok(candles)
    }

    // ── Minute candles ──────────────────────────────────────────────
    // tr_id: FHKST03010200  (국내주식기간별시세 분봉)

    async fn fetch_kr_minute_candles(
        &self,
        stock_code: &str,
        interval: &str,
        limit: u32,
    ) -> Result<Vec<Candle>, String> {
        let token = self.get_token().await?;
        let cfg = self.config()?;

        let tick_unit = match interval {
            "1m" => "1",
            "5m" => "5",
            "15m" => "15",
            "30m" => "30",
            "1h" | "60m" => "60",
            _ => "1",
        };

        let url = format!(
            "{}/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice",
            BASE_URL
        );

        let mut all_candles: Vec<Candle> = Vec::new();
        let mut cursor_time = "160000".to_string(); // 장 마감 후 시작
        let needed = limit as usize;

        // 한 번에 최대 30건, 페이징으로 반복
        for _ in 0..50 {
            // 안전 상한
            if all_candles.len() >= needed {
                break;
            }

            let resp = self
                .client
                .get(&url)
                .header("authorization", format!("Bearer {}", token))
                .header("appkey", &cfg.app_key)
                .header("appsecret", &cfg.app_secret)
                .header("tr_id", "FHKST03010200")
                .header("content-type", "application/json; charset=utf-8")
                .query(&[
                    ("fid_cond_mrkt_div_code", "J"),
                    ("fid_input_iscd", stock_code),
                    ("fid_input_hour_1", cursor_time.as_str()),
                    ("fid_pw_data_incu_yn", "Y"),
                    ("fid_etc_cls_code", tick_unit),
                ])
                .send()
                .await
                .map_err(|e| format!("KIS minute API error: {}", e))?;

            if !resp.status().is_success() {
                let status = resp.status();
                let text = resp.text().await.unwrap_or_default();
                return Err(format!("KIS minute API error ({}): {}", status, text));
            }

            let json: Value = resp
                .json()
                .await
                .map_err(|e| format!("KIS minute parse error: {}", e))?;

            check_kis_error(&json)?;

            let items = match json["output2"].as_array() {
                Some(arr) if !arr.is_empty() => arr,
                _ => break,
            };

            let kst = FixedOffset::east_opt(KST_OFFSET).unwrap();
            let mut batch_last_time: Option<String> = None;
            let mut page_candles = Vec::new();

            for item in items {
                let date_str = match item["stck_bsop_date"].as_str() {
                    Some(s) if s.len() == 8 => s,
                    _ => continue,
                };
                let time_str = match item["stck_cntg_hour"].as_str() {
                    Some(s) if s.len() == 6 => s,
                    _ => continue,
                };

                let date = match NaiveDate::parse_from_str(date_str, "%Y%m%d") {
                    Ok(d) => d,
                    Err(_) => continue,
                };
                let time = match NaiveTime::parse_from_str(time_str, "%H%M%S") {
                    Ok(t) => t,
                    Err(_) => continue,
                };
                let dt = NaiveDateTime::new(date, time);
                let timestamp = match kst.from_local_datetime(&dt).single() {
                    Some(t) => t.timestamp(),
                    None => continue,
                };

                let open = match item["stck_oprc"].as_str().and_then(parse_f64) {
                    Some(v) => v,
                    None => continue,
                };
                let high = match item["stck_hgpr"].as_str().and_then(parse_f64) {
                    Some(v) => v,
                    None => continue,
                };
                let low = match item["stck_lwpr"].as_str().and_then(parse_f64) {
                    Some(v) => v,
                    None => continue,
                };
                let close = match item["stck_prpr"].as_str().and_then(parse_f64) {
                    Some(v) => v,
                    None => continue,
                };
                let volume = item["cntg_vol"]
                    .as_str()
                    .and_then(parse_f64)
                    .unwrap_or(0.0);

                batch_last_time = Some(time_str.to_string());

                page_candles.push(Candle {
                    time: timestamp,
                    open,
                    high,
                    low,
                    close,
                    volume,
                });
            }

            if page_candles.is_empty() {
                break;
            }

            all_candles.extend(page_candles);

            // 다음 페이지 커서 설정
            match batch_last_time {
                Some(t) => cursor_time = t,
                None => break,
            }

            // Rate limit: 50ms delay between calls
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        }

        // Sort ascending by time
        all_candles.sort_by_key(|c| c.time);

        // Deduplicate by timestamp
        all_candles.dedup_by_key(|c| c.time);

        // Trim to limit
        if all_candles.len() > needed {
            all_candles = all_candles.split_off(all_candles.len() - needed);
        }

        if all_candles.is_empty() {
            return Err("KIS minute API: 캔들 데이터가 없습니다".to_string());
        }

        Ok(all_candles)
    }
}

// ── Helpers ─────────────────────────────────────────────────────────

/// "005930.KS" → ("005930", "J"), "035720.KQ" → ("035720", "Q")
fn parse_symbol(symbol: &str) -> Result<(String, String), String> {
    let parts: Vec<&str> = symbol.split('.').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid KR symbol format: {}", symbol));
    }
    let stock_code = parts[0].to_string();
    let mrkt_div = match parts[1] {
        "KS" => "J".to_string(),  // KOSPI
        "KQ" => "Q".to_string(),  // KOSDAQ
        other => other.to_string(),
    };
    Ok((stock_code, mrkt_div))
}

fn parse_f64(s: &str) -> Option<f64> {
    let trimmed = s.trim();
    if trimmed.is_empty() || trimmed == "0" {
        return Some(0.0);
    }
    trimmed.parse::<f64>().ok()
}

fn check_kis_error(json: &Value) -> Result<(), String> {
    let rt_cd = json["rt_cd"].as_str().unwrap_or("1");
    if rt_cd != "0" {
        let msg_cd = json["msg_cd"].as_str().unwrap_or("");
        let msg1 = json["msg1"].as_str().unwrap_or("Unknown error");
        return Err(format!("KIS API error [{}]: {}", msg_cd, msg1));
    }
    Ok(())
}
