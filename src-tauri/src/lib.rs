mod api_client;
mod cache;
mod commands;
mod models;
mod ta_engine;

use api_client::{BinanceClient, YahooClient};
use cache::CacheDb;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BinanceClient::new())
        .manage(YahooClient::new())
        .manage(CacheDb::new().expect("Failed to initialize cache database"))
        .invoke_handler(tauri::generate_handler![
            commands::analysis::fetch_analysis,
            commands::analysis::fetch_watchlist_snapshots,
            commands::analysis::fetch_fundamentals
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
