# Quanting

멀티마켓(US/KR/Crypto/Forex) 기술적 분석을 위한 Tauri 데스크톱 앱입니다.  
현재 버전은 **단일 차트 기반 멀티 지표 분석**, **퀀트 신호 필터**, **고급 워치리스트/스크리너**, **재무 오버레이**, **커스텀 인터벌 리샘플링**을 지원합니다.

## 핵심 기능

- 멀티마켓: US 주식, KR 주식, Crypto, Forex
- 차트 타입 5종: `Candlestick`, `Heikin Ashi`, `Line`, `Area`, `Bar`
- 지표: BB, RSI, SMA, EMA, MACD, Stochastic, Volume, OBV, VWAP, ATR, Ichimoku, Supertrend, Parabolic SAR
- 신호: BB+RSI 기본 신호 + MACD/Stochastic 확장 신호
- 퀀트 필터: Regime / Momentum / Volatility + 강신호 유지 옵션
- 차트 오버레이: 비교 심볼(Overlay), 볼륨 프로파일, 매수/매도 구간, 재무제표 오버레이
- 가격 스케일: 기본 / 로그 / 퍼센트 + 자동/역전 스케일
- 드로잉/분석: 수평선, 추세선, 피보나치, 측정도구, 고급 패턴(피치포크/갠/엘리엇/하모닉)
- 리플레이/알림: 바 리플레이, 가격 알림선/트리거/히스토리, 시스템 알림
- 워치리스트: 스냅샷(가격/등락/H/L/스파크라인), 즐겨찾기/최근 심볼, 고도화 스크리너
- 스크리너 고도화: 다중 조건, `ANY(OR)`/`ALL(AND)`, 정렬, 프리셋 저장
- 프리셋 확장: 금/은 테마, 한국 ACE ETF 카테고리
- 커스텀 인터벌 리샘플링: API 비지원 주기(`10m`, `45m`, `54m`, `2h`, `3h`, `6h`, `12h` 등) 재집계

## 지원 인터벌

- Crypto: `1m`, `2m`, `3m`, `5m`, `10m`, `15m`, `30m`, `45m`, `54m`, `1h`, `2h`, `3h`, `4h`, `6h`, `12h`, `1d`, `1w`, `1M`
- US/KR/Forex: `1m`, `2m`, `3m`, `5m`, `10m`, `15m`, `30m`, `45m`, `54m`, `1h`, `2h`, `3h`, `4h`, `6h`, `12h`, `1d`, `1w`, `1M`

참고:
- 커스텀 인터벌은 백엔드에서 소스 캔들을 받아 OHLCV 리샘플링합니다.
- Crypto WebSocket 실시간 갱신은 Binance 네이티브 인터벌에서만 사용하며, 커스텀 인터벌은 폴링 경로로 동작합니다.

## 최근 구현 요약

- shadcn/ui 기반 컴포넌트 치환(복합 컴포넌트 포함)
- Forex 지원 추가 (`MarketType.forex`, Yahoo `=X` 심볼)
- 금/은 + 한국 ACE ETF 프리셋 카테고리 추가
- 재무제표 오버레이 추가 (`fetch_fundamentals`)
- 워치리스트 스크리너 고도화(다중 조건/정렬/프리셋 저장)
- 커스텀 인터벌 리샘플링 추가(분석/워치리스트 스냅샷 공통 적용)

## 오픈소스 기술 스택

| 레이어 | 기술 |
|---|---|
| Desktop Shell | Tauri 2, `@tauri-apps/api`, `@tauri-apps/cli`, `tauri-plugin-shell` |
| Frontend | React 18, TypeScript 5, Vite 6 |
| Styling | Tailwind CSS 4 + shadcn/ui 패턴 |
| State | Zustand 5 |
| Chart | TradingView `lightweight-charts` 5 |
| Backend | Rust (Edition 2021), Tokio, reqwest |
| Serialization | serde, serde_json |
| Cache | rusqlite (in-memory SQLite), chrono(TTL) |
| Data Source | Binance REST/WS, Yahoo Finance v8(chart) + v10(quoteSummary) |

## 아키텍처

```text
React UI (MarketHeader, ChartContainer, MainChart, WatchlistSidebar, SettingsPanel)
  -> Zustand Stores (useSettingsStore, useChartStore, useDrawingStore, useReplayStore)
  -> Tauri IPC invoke
    -> Rust Commands
       - fetch_analysis
       - fetch_watchlist_snapshots
       - fetch_fundamentals
          -> API Client (Binance / Yahoo)
          -> Cache (SQLite in-memory, interval TTL)
          -> Interval Resolver + Resampling
          -> TA Engine
             - Indicators (BB/RSI/SMA/EMA/MACD/Stoch/OBV/VWAP/ATR/Ichimoku/Supertrend/PSAR)
             - Signal Detection + Quant Filter
          -> Frontend Response
```

## 데이터 플로우

### 1) 분석 차트 요청

1. 프론트에서 심볼/인터벌/지표 파라미터 변경
2. `fetch_analysis` 호출
3. 백엔드에서 요청 인터벌을 해석하고 소스 인터벌 결정
4. 캐시 조회 후 미스 시 외부 API 조회
5. 필요 시 OHLCV 리샘플링 수행
6. TA 엔진 처리 후 차트 데이터 반환

### 2) 워치리스트 스냅샷 요청

1. 화면 표시 대상 심볼 묶음 생성
2. `fetch_watchlist_snapshots` 호출
3. 인터벌 해석/리샘플링 적용
4. 가격/등락/H/L/스파크라인 계산 후 반환

### 3) 재무 오버레이 요청

1. 오버레이 토글 ON
2. `fetch_fundamentals` 호출
3. Yahoo quoteSummary(`price/summaryDetail/defaultKeyStatistics/financialData`) 파싱
4. 차트 우측 오버레이 카드에 표시

## 주요 IPC 명령

- `fetch_analysis`
- `fetch_watchlist_snapshots`
- `fetch_fundamentals`

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
    SymbolSearch.tsx
    DrawingCanvas.tsx
    DrawingToolbar.tsx
    ReplayControls.tsx
    SignalZonesOverlay.tsx
    VolumeProfileOverlay.tsx
    FundamentalsOverlay.tsx
  stores/
    useSettingsStore.ts
    useChartStore.ts
    useDrawingStore.ts
    useReplayStore.ts
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
    fundamental.rs
  lib.rs
  main.rs
```

## 단축키

- `Cmd/Ctrl + B`: 좌측 패널(워치리스트) 토글
- `Cmd/Ctrl + ,`: 우측 패널(설정) 토글
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

- 기능 갭 분석: `docs/tradingview-feature-gap-analysis.md`
- 구현 계획/진도: `docs/tradingview-feature-implementation-plan.md`
- shadcn/ui 통합 계획: `docs/shadcn-ui-integration-plan.md`
