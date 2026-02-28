# Quanting

멀티마켓(미국/한국/코인) 기술적 분석을 위한 Tauri 데스크톱 앱입니다.  
현재 버전은 **단일 차트 기반 멀티 지표 시각화**, **퀀트 신호 필터**, **프로 트레이딩 UI 패턴**을 중심으로 개선되어 있습니다.

## 핵심 기능

- 멀티마켓 지원: US 주식, KR 주식, Crypto
- 멀티 지표 분석: BB, RSI, SMA, EMA, MACD, Stochastic, Volume, OBV
- 신호 생성: BB+RSI 기본 신호 + MACD/Stochastic 보조 신호
- 퀀트 필터: Regime, Momentum, Volatility 필터 적용
- 차트 타입 전환: Candlestick / Heikin Ashi
- 단일 차트 내 지표 통합: 오실레이터를 분리 스케일로 같은 캔버스에서 표시
- 워치리스트 강화: 실시간 스냅샷(가격/등락/H/L) + 스파크라인
- UI/UX: Market Header, 접이식 사이드바, 탭형 설정 패널, 다크/라이트 테마
- 한국어 UI 기본화

## 최근 구현 요약

- 앱 브랜딩을 `BB-rsi checker`에서 **Quanting**으로 통합
- `Toolbar` 중심 구조를 `MarketHeader + Chart + StatusBar` 구조로 리팩토링
- 좌/우 패널을 접이식 `CollapsibleSidebar`로 전환 (대형 화면 고정, 그 외 드로어)
- `SettingsPanel`을 `지표 / 레이아웃 / 화면` 탭으로 분리
- 차트 오실레이터 영역에 경계선/라벨 오버레이 추가
- 하단 상태바를 신호 중심 정보로 정리 (헤더와 중복 제거)
- 워치리스트 카드에 가격/등락률/고저가/스파크라인 표시
- 백엔드에 `fetch_watchlist_snapshots` IPC 추가

## 오픈소스 기술 스택

| 레이어 | 기술 |
|---|---|
| Desktop Shell | Tauri 2, `@tauri-apps/api`, `@tauri-apps/cli`, `tauri-plugin-shell` |
| Frontend | React 18, TypeScript 5, Vite 6 |
| Styling | Tailwind CSS 4 + CSS Design Tokens |
| State | Zustand 5 |
| Chart | TradingView `lightweight-charts` 5 |
| Backend | Rust (Edition 2021), Tokio, reqwest |
| Serialization | serde, serde_json |
| Cache | rusqlite (in-memory SQLite), chrono(TTL) |
| Data Source | Binance REST API, Yahoo Finance v8 |

## 아키텍처

```text
React UI (App, MarketHeader, MainChart, WatchlistSidebar, SettingsPanel)
  -> Zustand Stores (useSettingsStore, useChartStore)
  -> Tauri IPC invoke
    -> Rust Commands
       - fetch_analysis
       - fetch_watchlist_snapshots
          -> API Client (Binance / Yahoo)
          -> Cache (SQLite in-memory, interval TTL)
          -> TA Engine
             - Bollinger, RSI, SMA, EMA, MACD, Stochastic, OBV
             - Signal Detection (BB+RSI, MACD, Stochastic)
             - Quant Filter (Regime/Momentum/Volatility)
          -> Frontend Response (analysis + watchlist snapshots)
```

## 데이터 플로우

### 1) 분석 차트 요청

1. 프론트에서 심볼/인터벌/지표 파라미터 변경
2. `fetch_analysis` 호출
3. 백엔드 캐시 조회 후 미스 시 외부 API 조회
4. TA 엔진에서 지표/신호/필터 처리
5. 프론트에서 단일 차트에 오버레이 + 오실레이터 스케일 렌더링

### 2) 워치리스트 스냅샷 요청

1. 화면에 보이는 상위 워치리스트 심볼 묶음 생성
2. `fetch_watchlist_snapshots` 호출
3. 각 심볼 최근 캔들로 가격/등락률/H/L/스파크라인 계산
4. 카드형 워치리스트에 즉시 반영

## 프로젝트 구조

```text
src/
  App.tsx
  components/
    MarketHeader.tsx
    ChartContainer.tsx
    MainChart.tsx
    WatchlistSidebar.tsx
    SettingsPanel.tsx
    CollapsibleSidebar.tsx
    StatusBar.tsx
    SymbolSearch.tsx
    IntervalSelector.tsx
  stores/
    useSettingsStore.ts
    useChartStore.ts
  services/
    tauriApi.ts
  utils/
    constants.ts
    formatters.ts
  types/
    index.ts

src-tauri/src/
  commands/
    analysis.rs
  ta_engine/
    bollinger.rs
    rsi.rs
    sma.rs
    ema.rs
    macd.rs
    stochastic.rs
    obv.rs
    signal.rs
  api_client/
    binance.rs
    yahoo.rs
  cache/
    sqlite.rs
  models/
    candle.rs
    indicator.rs
    signal.rs
    params.rs
    watchlist.rs
  lib.rs
  main.rs
```

## 주요 지표/신호

- 기본 신호: `strongBuy`, `weakBuy`, `strongSell`, `weakSell`
- 보조 신호: `macdBullish`, `macdBearish`, `stochOversold`, `stochOverbought`
- 퀀트 필터 옵션:
  - `applyRegimeFilter`
  - `applyMomentumFilter`
  - `applyVolatilityFilter`
  - 강신호 유지 옵션(`keepStrongCounterTrend`, `keepStrongInHighVol`)

## 단축키

- `Cmd/Ctrl + B`: 좌측 패널 토글(대형 화면) 또는 워치리스트 드로어
- `Cmd/Ctrl + ,`: 우측 패널 토글(대형 화면) 또는 설정 드로어
- `Cmd/Ctrl + K`: 심볼 검색 열기
- `Esc`: 열린 패널/드로어 닫기

## 실행 방법

### Prerequisites

- Node.js 18+
- Rust stable (`rustup`)

### Development

```bash
npm install
npm run tauri dev
```

### Build / Check

```bash
npm run build
npm run check
npm run tauri build
```

## 참고 문서

- UI 개선 계획: `docs/ui-pro-trading-plan.md`
- UI 레퍼런스: `docs/ui.html`
