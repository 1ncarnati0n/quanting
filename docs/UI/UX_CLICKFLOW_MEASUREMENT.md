# UX Clickflow Measurement

## 목적
- Week 5 목표인 핵심 작업 클릭 수 측정을 위해 로컬 이벤트 계측을 도입한다.
- 사용 흐름별 액션 빈도를 수집하고 내보내기 파일로 개선 전/후를 비교한다.

## 구현 위치
- 계측 유틸: `src/utils/uxMetrics.ts`
- Settings 연동: `src/components/SettingsPanel.tsx`
- Watchlist 연동: `src/components/WatchlistSidebar.tsx`
- SymbolSearch 연동: `src/components/SymbolSearch.tsx`
- CommandHub 연동: `src/components/CommandCenter.tsx`

## 현재 계측 이벤트
- `settings.indicators:set_basic_mode`
- `settings.indicators:set_advanced_mode`
- `settings.indicators:core_enable_all`
- `settings.indicators:core_disable_all`
- `settings.indicators:expand_all_sections`
- `settings.indicators:collapse_all_sections`
- `settings.indicators:open_core_sections`
- `settings.indicators:export_ux_metrics`
- `settings.indicators:reset_ux_metrics`
- `watchlist:select_symbol`
- `watchlist:filter_current_market`
- `watchlist:filter_favorite_only`
- `watchlist:show_all`
- `watchlist:reset_filters`
- `watchlist:run_screener`
- `symbol_search:open_dialog`
- `symbol_search:open_dialog_shortcut`
- `symbol_search:select_symbol`
- `symbol_search:manual_input_apply`
- `symbol_search:filter_market_*`
- `symbol_search:filter_current_market`
- `symbol_search:favorite_only`
- `symbol_search:show_all`
- `symbol_search:reset_filters`
- `symbol_search:favorite_item`
- `symbol_search:unfavorite_item`
- `command_hub:open`
- `command_hub:open_symbol_search`
- `command_hub:toggle_settings`
- `command_hub:toggle_watchlist`
- `command_hub:chart_fit`
- `command_hub:toggle_replay`
- `command_hub:toggle_theme`
- `command_hub:show_shortcuts`
- `command_hub:workspace_save`
- `command_hub:workspace_restore`
- `command_hub:workspace_delete`
- `command_hub:workspace_safe_reset`

## 측정 방법
1. 시나리오별 태스크를 수행한다. (예: 종목 탐색 후 차트 전환, 지표 핵심 설정 등)
2. Settings > 지표 탭의 `UX 지표 내보내기` 버튼으로 JSON을 저장한다.
3. 동일 시나리오를 개선 전/후 버전에서 수행하고 이벤트 카운트를 비교한다.
4. 결과를 `UX_KPI_BASELINE_TABLE.md`에 정리한다.

## 주의사항
- 현재 계측은 로컬스토리지 기반이며 사용자 식별/서버 전송을 하지 않는다.
- 브라우저 스토리지 삭제 시 데이터가 초기화될 수 있다.
