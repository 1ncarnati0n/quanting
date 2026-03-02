mod api_client;
mod cache;
mod commands;
mod models;
mod ta_engine;

use api_client::{BinanceClient, KisClient, YahooClient};
use cache::CacheDb;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // .env 파일에서 환경변수 로드 (파일 없으면 무시)
    let _ = dotenvy::dotenv();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BinanceClient::new())
        .manage(YahooClient::new())
        .manage(KisClient::new())
        .manage(CacheDb::new().expect("Failed to initialize cache database"))
        .invoke_handler(tauri::generate_handler![
            commands::analysis::fetch_analysis,
            commands::analysis::fetch_watchlist_snapshots,
            commands::analysis::fetch_fundamentals,
            commands::strategy::fetch_multi_symbol_candles,
            commands::strategy::fetch_premarket_snapshots,
            commands::search::search_symbols
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
