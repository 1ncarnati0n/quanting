use crate::models::{Candle, FundamentalsResponse, MarketType};
use serde_json::Value;

pub struct YahooClient {
    client: reqwest::Client,
}

impl YahooClient {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());

        Self { client }
    }

    pub async fn fetch_klines(
        &self,
        symbol: &str,
        interval: &str,
        _limit: u32,
    ) -> Result<Vec<Candle>, String> {
        let range = Self::interval_to_range(interval);
        let yahoo_interval = Self::map_interval(interval);

        let url = format!(
            "https://query1.finance.yahoo.com/v8/finance/chart/{}?interval={}&range={}",
            symbol, yahoo_interval, range
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
            return Err(format!("Yahoo Finance API error ({}): {}", status, body));
        }

        let json: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        Self::parse_chart_response(&json)
    }

    pub async fn fetch_fundamentals(
        &self,
        symbol: &str,
        market: MarketType,
    ) -> Result<FundamentalsResponse, String> {
        let url = format!(
            "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{}?modules=price,summaryDetail,defaultKeyStatistics,financialData",
            symbol
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
            return Err(format!("Yahoo Finance API error ({}): {}", status, body));
        }

        let json: Value = resp
            .json()
            .await
            .map_err(|e| format!("Parse error: {}", e))?;

        let result = json
            .get("quoteSummary")
            .and_then(|summary| summary.get("result"))
            .and_then(|entries| entries.get(0))
            .ok_or("Invalid Yahoo Fundamentals response structure")?;

        Ok(FundamentalsResponse {
            symbol: symbol.to_string(),
            market,
            short_name: Self::first_string(
                result,
                &[
                    &["price", "shortName"],
                    &["price", "longName"],
                    &["price", "displayName"],
                ],
            ),
            currency: Self::first_string(result, &[&["price", "currency"]]),
            market_cap: Self::first_number(
                result,
                &[
                    &["price", "marketCap"],
                    &["defaultKeyStatistics", "marketCap"],
                ],
            ),
            trailing_pe: Self::first_number(
                result,
                &[
                    &["summaryDetail", "trailingPE"],
                    &["defaultKeyStatistics", "trailingPE"],
                ],
            ),
            forward_pe: Self::first_number(
                result,
                &[
                    &["defaultKeyStatistics", "forwardPE"],
                    &["financialData", "forwardPE"],
                ],
            ),
            price_to_book: Self::first_number(result, &[&["defaultKeyStatistics", "priceToBook"]]),
            trailing_eps: Self::first_number(
                result,
                &[
                    &["defaultKeyStatistics", "trailingEps"],
                    &["summaryDetail", "trailingEps"],
                ],
            ),
            forward_eps: Self::first_number(result, &[&["defaultKeyStatistics", "forwardEps"]]),
            dividend_yield: Self::first_number(result, &[&["summaryDetail", "dividendYield"]]),
            return_on_equity: Self::first_number(result, &[&["financialData", "returnOnEquity"]]),
            debt_to_equity: Self::first_number(result, &[&["financialData", "debtToEquity"]]),
            revenue_growth: Self::first_number(result, &[&["financialData", "revenueGrowth"]]),
            gross_margins: Self::first_number(result, &[&["financialData", "grossMargins"]]),
            operating_margins: Self::first_number(result, &[&["financialData", "operatingMargins"]]),
            profit_margins: Self::first_number(
                result,
                &[
                    &["financialData", "profitMargins"],
                    &["defaultKeyStatistics", "profitMargins"],
                ],
            ),
            fifty_two_week_high: Self::first_number(result, &[&["summaryDetail", "fiftyTwoWeekHigh"]]),
            fifty_two_week_low: Self::first_number(result, &[&["summaryDetail", "fiftyTwoWeekLow"]]),
            average_volume: Self::first_number(
                result,
                &[
                    &["summaryDetail", "averageVolume"],
                    &["price", "averageDailyVolume10Day"],
                ],
            ),
        })
    }

    fn parse_chart_response(json: &serde_json::Value) -> Result<Vec<Candle>, String> {
        let result = json
            .get("chart")
            .and_then(|c| c.get("result"))
            .and_then(|r| r.get(0))
            .ok_or("Invalid Yahoo Finance response structure")?;

        let timestamps = result
            .get("timestamp")
            .and_then(|t| t.as_array())
            .ok_or("No timestamp data")?;

        let indicators = result
            .get("indicators")
            .and_then(|i| i.get("quote"))
            .and_then(|q| q.get(0))
            .ok_or("No quote data")?;

        let opens = indicators.get("open").and_then(|v| v.as_array());
        let highs = indicators.get("high").and_then(|v| v.as_array());
        let lows = indicators.get("low").and_then(|v| v.as_array());
        let closes = indicators.get("close").and_then(|v| v.as_array());
        let volumes = indicators.get("volume").and_then(|v| v.as_array());

        let (opens, highs, lows, closes, volumes) = match (opens, highs, lows, closes, volumes) {
            (Some(o), Some(h), Some(l), Some(c), Some(v)) => (o, h, l, c, v),
            _ => return Err("Missing OHLCV data fields".to_string()),
        };

        let candles: Vec<Candle> = timestamps
            .iter()
            .enumerate()
            .filter_map(|(i, ts)| {
                let time = ts.as_i64()?;
                let open = opens.get(i)?.as_f64()?;
                let high = highs.get(i)?.as_f64()?;
                let low = lows.get(i)?.as_f64()?;
                let close = closes.get(i)?.as_f64()?;
                let volume = volumes.get(i)?.as_f64().unwrap_or(0.0);

                Some(Candle {
                    time,
                    open,
                    high,
                    low,
                    close,
                    volume,
                })
            })
            .collect();

        if candles.is_empty() {
            return Err("No valid candle data from Yahoo Finance".to_string());
        }

        Ok(candles)
    }

    fn interval_to_range(interval: &str) -> &'static str {
        match interval {
            "1m" => "7d",
            "5m" | "15m" => "60d",
            "1h" => "2y",
            "1d" => "2y",
            "1w" => "10y",
            "1M" => "max",
            _ => "2y",
        }
    }

    fn map_interval(interval: &str) -> &'static str {
        match interval {
            "1m" => "1m",
            "5m" => "5m",
            "15m" => "15m",
            "1h" => "1h",
            "1d" => "1d",
            "1w" => "1wk",
            "1M" => "1mo",
            _ => "1d",
        }
    }

    fn first_number(root: &Value, paths: &[&[&str]]) -> Option<f64> {
        paths.iter().find_map(|path| Self::read_number(root, path))
    }

    fn first_string(root: &Value, paths: &[&[&str]]) -> Option<String> {
        paths.iter().find_map(|path| Self::read_string(root, path))
    }

    fn read_number(root: &Value, path: &[&str]) -> Option<f64> {
        let value = Self::value_at(root, path)?;
        if let Some(n) = value.as_f64() {
            return Some(n);
        }
        if let Some(n) = value.as_i64() {
            return Some(n as f64);
        }
        if let Some(raw) = value.get("raw").and_then(Value::as_f64) {
            return Some(raw);
        }
        if let Some(raw) = value.get("raw").and_then(Value::as_i64) {
            return Some(raw as f64);
        }
        None
    }

    fn read_string(root: &Value, path: &[&str]) -> Option<String> {
        let value = Self::value_at(root, path)?;
        if let Some(text) = value.as_str() {
            return Some(text.to_string());
        }
        if let Some(text) = value.get("fmt").and_then(Value::as_str) {
            return Some(text.to_string());
        }
        if let Some(text) = value.get("longFmt").and_then(Value::as_str) {
            return Some(text.to_string());
        }
        None
    }

    fn value_at<'a>(root: &'a Value, path: &[&str]) -> Option<&'a Value> {
        let mut current = root;
        for key in path {
            current = current.get(*key)?;
        }
        Some(current)
    }
}
