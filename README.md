# Quanting

`Quanting`은 Tauri 기반 멀티마켓 트레이딩 워크스페이스입니다.  
React/TypeScript 프론트엔드와 Rust 백엔드를 조합해 차트 분석, 관심종목 관리, 스크리닝, 전략 연구를 하나의 데스크톱 앱으로 제공합니다.

## 워크스페이스

### 1. Dashboard

- US 주식, KR 주식, Crypto, Forex 단일 UI 지원
- 차트 타입: `Candlestick`, `Heikin Ashi`, `Line`, `Area`, `Bar`
- 비교 심볼 오버레이, 가격 스케일(기본/로그), 전체화면, 크로스헤어 레전드
- 바 리플레이, 가격 알림, 재무 오버레이, 시그널 존, 볼륨 프로파일
- 드로잉 도구: 수평선, 추세선, 피보나치, 측정, 직사각형, 텍스트, 채널, 피치포크, 갠 팬, 엘리엇, 하모닉

### 2. Watchlist & Screener

- 즐겨찾기, 최근 심볼, 커스텀 심볼 관리
- Yahoo 기반 심볼 검색
- 프리셋 카테고리 기반 마켓 브라우징
- 스냅샷 카드: 현재가, 등락, 고가/저가, 스파크라인
- 스크리너 조건 조합: `ANY(OR)` / `ALL(AND)`
- 스크리너 프리셋 저장 및 정렬 옵션

### 3. Strategy Lab

- `Strategy A`: GEM + Faber TAA + Sector Timing 조합의 월간 리밸런싱 백테스트
- `Strategy B`: MACD + Bollinger 기반 액티브 신호, 페어 트레이딩 분석
- `Strategy ORB`: 프리마켓 스캐너와 Opening Range Breakout 워크플로우
- 멀티 심볼 캔들 수집, 성과 지표, 시그널 카드, Z-Score/에쿼티 커브 시각화

### 4. 생산성 기능

- `Command Center`를 통한 빠른 액션 실행
- 워크스페이스 스냅샷 저장/복원
- 워크스페이스 JSON import/export
- 키보드 단축키 도움말 모달

## 지표와 신호

### 코어 지표

- Bollinger Bands, RSI
- SMA, EMA, HMA
- MACD, Stochastic
- Volume, OBV, VWAP, ATR
- Ichimoku, Supertrend, Parabolic SAR
- Donchian, Keltner
- MFI, CMF, Choppiness, Williams %R, ADX
- CVD, RVOL, STC
- SMC 이벤트, Anchored VWAP, Auto Fibonacci

### 퀀트 신호 전략

- Supertrend + ADX
- EMA Crossover
- Stochastic + RSI
- CMF + OBV Flow
- TTM Squeeze
- VWAP Breakout
- Parabolic SAR reversal
- MACD Histogram reversal
- IBS Mean Reversion
- RSI Divergence

## 지원 마켓과 데이터 소스

| 마켓 | 데이터 소스 | 비고 |
| --- | --- | --- |
| Crypto | Binance REST / WebSocket | 실시간 캔들 갱신 지원 |
| US 주식 / ETF | Yahoo Finance | 차트, 검색, 재무 데이터 |
| Forex | Yahoo Finance | 차트, 검색 |
| KR 주식 / ETF | Yahoo Finance + 한국투자증권 Open API | 일봉/주봉/월봉은 KIS 자격 증명 필요 |

참고:

- `fetch_fundamentals`는 Crypto 심볼에서는 동작하지 않습니다.
- KR 마켓은 분봉 계열과 장기 봉에서 사용하는 데이터 소스가 다를 수 있습니다.
- 원본 API가 요청 인터벌을 직접 지원하지 않으면 백엔드가 하위 인터벌 캔들을 리샘플링합니다.

## 지원 인터벌

UI 기준 지원 인터벌:

- `1m`, `3m`, `5m`, `10m`, `15m`, `30m`, `1h`, `2h`, `4h`, `1d`, `1w`, `1M`

참고:

- `10m`, `2h`, `4h` 같은 구간은 마켓별로 리샘플링 경로를 탈 수 있습니다.
- Crypto WebSocket 실시간 반영은 Binance 네이티브 스트림 인터벌에서만 사용됩니다.

## 기술 스택

| 레이어 | 기술 |
| --- | --- |
| Desktop Shell | Tauri 2, `@tauri-apps/api`, `@tauri-apps/cli`, `tauri-plugin-shell` |
| Frontend | React 19, TypeScript 5, Vite 7 |
| Styling | Tailwind CSS 4, shadcn/ui 패턴, 커스텀 토큰 기반 CSS |
| State | Zustand 5 |
| Chart | TradingView `lightweight-charts` 5 |
| Backend | Rust 2021, Tokio, reqwest |
| Cache | rusqlite 기반 in-memory SQLite |
| Data | Binance, Yahoo Finance, 한국투자증권 Open API |

## 아키텍처 개요

```text
React UI
  ├─ Dashboard Workspace
  │   ├─ MarketHeader / ChartContainer / MainChart
  │   ├─ WatchlistSidebar / SettingsPanel / CommandCenter
  │   └─ Drawing / Replay / Alert / Fundamentals overlays
  ├─ Strategy Lab
  │   ├─ Strategy A (monthly allocation backtest)
  │   ├─ Strategy B (active signals / pair trading)
  │   └─ Strategy ORB (premarket scanner)
  └─ Zustand stores
      ├─ useSettingsStore
      ├─ useChartStore
      ├─ useDrawingStore
      ├─ useReplayStore
      └─ useStrategyStore
          ↓
      Tauri IPC invoke
          ↓
      Rust commands
        ├─ fetch_analysis
        ├─ fetch_watchlist_snapshots
        ├─ fetch_fundamentals
        ├─ fetch_multi_symbol_candles
        ├─ fetch_premarket_snapshots
        └─ search_symbols
          ↓
      API clients + cache + TA engine
```

## 시작하기

### 요구 사항

- Node.js `^20.19.0 || >=22.12.0`
- Rust stable
- 운영체제별 Tauri 빌드 전제 조건
- KR 일봉/주봉/월봉 조회 시 한국투자증권 Open API 자격 증명

### 설치

```bash
npm install
```

### 환경 변수

한국 주식의 일봉/주봉/월봉 데이터를 사용하려면 `.env` 또는 사용자 홈 디렉터리 설정 파일 중 하나를 준비해야 합니다.

`.env` 예시:

```bash
KIS_APP_KEY=your_app_key_here
KIS_APP_SECRET=your_app_secret_here
```

또는 `~/.quanting/kis_config.json`:

```json
{
  "app_key": "your_app_key_here",
  "app_secret": "your_app_secret_here"
}
```

### 개발 실행

데스크톱 앱 실행:

```bash
npm run tauri dev
```

프론트엔드만 실행:

```bash
npm run dev
```

### 빌드와 검증

```bash
npm run build
npm run check
npm run ux:verify
npm run tauri build
```

## 주요 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | Vite 개발 서버 실행 |
| `npm run tauri dev` | Tauri 데스크톱 앱 개발 실행 |
| `npm run build` | TypeScript 컴파일 + 프론트엔드 빌드 |
| `npm run check` | 프론트엔드 빌드 + Rust `cargo check` |
| `npm run ux:verify` | UX gate + 접근성 점검 + 빌드 |
| `npm run ux:gate` | UX 기준 점검 |
| `npm run a11y:audit` | 접근성 감사 |
| `npm run a11y:scenario` | 시나리오 기반 접근성 감사 |
| `npm run perf:sim` | 실시간 차트 성능 시뮬레이션 |
| `npm run perf:list-sim` | 워치리스트 성능 시뮬레이션 |
| `npm run ux:qa-gate` | QA 기준 점검 |
| `npm run ux:kpi` | UX KPI 재측정 |

## 프로젝트 구조

```text
src/
  App.tsx
  components/
    strategy/
      strategyA/
      strategyB/
      strategyORB/
    ui/
  services/
    tauriApi.ts
  stores/
    useChartStore.ts
    useCrosshairStore.ts
    useDrawingStore.ts
    useReplayStore.ts
    useSettingsStore.ts
    useStrategyStore.ts
  utils/
    strategyA/
    strategyB/
    strategyORB/

src-tauri/src/
  api_client/
    binance.rs
    yahoo.rs
    kis.rs
  cache/
  commands/
    analysis.rs
    search.rs
    strategy.rs
  models/
  ta_engine/

scripts/
  ux-gate.mjs
  a11y-audit.mjs
  a11y-scenario-audit.mjs
  perf-realtime-sim.mjs
  perf-watchlist-sim.mjs
  ux-qa-gate.mjs
  ux-kpi-remeasure.mjs

docs/
  UI/
    ui.html
```

## 자주 쓰는 단축키

- `Ctrl/Cmd + B`: 관심종목 패널 열기/닫기
- `Ctrl/Cmd + ,`: 설정 패널 열기/닫기
- `Ctrl/Cmd + J`: Command Center 열기
- `Ctrl/Cmd + K` 또는 `Ctrl/Cmd + /`: 심볼 검색 열기
- `Home`: 차트 맞춤
- `R`: 바 리플레이 시작/종료
- `F`: 전체화면 전환
- `?`: 단축키 도움말 열기

## 참고

- UI 시안/프로토타입은 `docs/UI/ui.html`에서 확인할 수 있습니다.
- README 내용은 현재 저장소 코드 기준으로 정리되어 있으며, 새 전략이나 지표가 추가되면 함께 갱신하는 것을 권장합니다.
