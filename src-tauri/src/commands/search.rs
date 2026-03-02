use crate::api_client::YahooClient;
use crate::models::{SymbolSearchParams, SymbolSearchResult};
use tauri::State;

#[tauri::command]
pub async fn search_symbols(
    params: SymbolSearchParams,
    yahoo_client: State<'_, YahooClient>,
) -> Result<Vec<SymbolSearchResult>, String> {
    if params.query.len() < 2 {
        return Ok(vec![]);
    }

    yahoo_client
        .search_symbols(&params.query, params.market_filter.as_ref())
        .await
}
