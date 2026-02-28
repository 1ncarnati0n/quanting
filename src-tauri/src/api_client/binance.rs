use crate::models::Candle;

pub struct BinanceClient {
    client: reqwest::Client,
}

impl BinanceClient {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }

    pub async fn fetch_klines(
        &self,
        symbol: &str,
        interval: &str,
        limit: u32,
    ) -> Result<Vec<Candle>, String> {
        let url = format!(
            "https://api.binance.com/api/v3/klines?symbol={}&interval={}&limit={}",
            symbol.to_uppercase(),
            interval,
            limit
        );

        let resp = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Binance API error ({}): {}", status, body));
        }

        let data: Vec<Vec<serde_json::Value>> = resp
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        let candles: Vec<Candle> = data
            .iter()
            .filter_map(|kline| {
                if kline.len() < 6 {
                    return None;
                }
                // [0] openTime, [1] open, [2] high, [3] low, [4] close, [5] volume
                let time = kline[0].as_i64()? / 1000; // ms → seconds
                let open = kline[1].as_str()?.parse::<f64>().ok()?;
                let high = kline[2].as_str()?.parse::<f64>().ok()?;
                let low = kline[3].as_str()?.parse::<f64>().ok()?;
                let close = kline[4].as_str()?.parse::<f64>().ok()?;
                let volume = kline[5].as_str()?.parse::<f64>().ok()?;

                Some(Candle { time, open, high, low, close, volume })
            })
            .collect();

        if candles.is_empty() {
            return Err("No candle data received from Binance".to_string());
        }

        Ok(candles)
    }
}
