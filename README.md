# Quanting

Bollinger Bands + RSI 기반 기술적 분석 데스크톱 앱

## Features

- **멀티마켓 지원** — 미국주식, 한국주식, 암호화폐
- **BB + RSI 결합 신호** — 4단계 매수/매도 신호 (StrongBuy · WeakBuy · StrongSell · WeakSell)
- **캔들 차트 + 볼린저밴드 시각화** — lightweight-charts 기반
- **RSI 차트** — 70/30 과매수·과매도 참고선
- **다크/라이트 테마 전환**
- **프리셋 심볼 + 커스텀 입력** — 시장 자동 감지
- **실시간 파라미터 조정** — BB period/multiplier, RSI period
- **SQLite 인메모리 캐시** — TTL 기반 API 응답 캐싱

## Tech Stack

| 레이어 | 기술 |
|---|---|
| Framework | Tauri 2 |
| Frontend | React 18, TypeScript, Vite 6 |
| Styling | TailwindCSS 4 |
| State | Zustand 5 |
| Charts | lightweight-charts 5 |
| Backend | Rust, Tokio, reqwest |
| Cache | rusqlite (in-memory SQLite) |
| API | Binance REST, Yahoo Finance v8 |

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   React UI                       │
│  ┌────────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ MainChart  │ │ RsiChart │ │ SettingsPanel │  │
│  └────────────┘ └──────────┘ └───────────────┘  │
│         │ Zustand Store + useAnalysis hook        │
└─────────┼────────────────────────────────────────┘
          │ Tauri IPC (invoke)
┌─────────┼────────────────────────────────────────┐
│         ▼       Rust Backend                     │
│  ┌─────────────┐  ┌───────────┐  ┌───────────┐  │
│  │ api_client  │  │ ta_engine │  │   cache   │  │
│  │ ├ binance   │  │ ├ bb      │  │ (SQLite)  │  │
│  │ └ yahoo     │  │ ├ rsi     │  └───────────┘  │
│  └─────────────┘  │ └ signal  │                  │
│                    └───────────┘                  │
└──────────────────────────────────────────────────┘
```

## Project Structure

```
src/                          # Frontend (React + TypeScript)
├── components/
│   ├── MainChart.tsx         # 캔들 + 볼린저밴드 차트
│   ├── RsiChart.tsx          # RSI 차트
│   ├── ChartContainer.tsx    # 차트 레이아웃 컨테이너
│   ├── SettingsPanel.tsx     # BB/RSI 파라미터 설정
│   ├── SymbolSearch.tsx      # 심볼 검색 및 프리셋
│   ├── IntervalSelector.tsx  # 시간 간격 선택
│   ├── Toolbar.tsx           # 상단 툴바
│   ├── StatusBar.tsx         # 하단 상태바
│   └── SignalBadge.tsx       # 신호 뱃지 UI
├── hooks/
│   └── useAnalysis.ts        # 분석 데이터 fetch 훅
├── stores/
│   ├── useChartStore.ts      # 차트 상태 (심볼, 인터벌)
│   └── useSettingsStore.ts   # 설정 상태 (파라미터, 테마)
├── services/
│   └── tauriApi.ts           # Tauri IPC 호출 래퍼
├── utils/
│   ├── constants.ts          # 색상, 프리셋, 기본값
│   └── formatters.ts         # 데이터 포맷 유틸
├── types/
│   └── index.ts              # 공유 타입 정의
├── App.tsx
└── main.tsx

src-tauri/src/                # Backend (Rust)
├── api_client/
│   ├── binance.rs            # Binance REST API 클라이언트
│   └── yahoo.rs              # Yahoo Finance v8 클라이언트
├── ta_engine/
│   ├── bollinger.rs          # 볼린저밴드 계산
│   ├── rsi.rs                # RSI 계산
│   └── signal.rs             # BB + RSI 결합 신호 생성
├── cache/
│   └── sqlite.rs             # 인메모리 SQLite 캐시
├── models/
│   ├── candle.rs             # OHLCV 캔들 모델
│   ├── indicator.rs          # BB, RSI 결과 모델
│   ├── signal.rs             # 신호 타입 및 포인트
│   └── params.rs             # 분석 파라미터
├── commands/
│   └── analysis.rs           # Tauri IPC 커맨드 핸들러
├── lib.rs
└── main.rs
```

## Signal Logic

BB 밴드 돌파와 RSI 임계값을 결합하여 4단계 매수/매도 신호를 생성합니다.

| 신호 | 조건 | 의미 |
|---|---|---|
| **StrongBuy** | `close ≤ lower band` **AND** `RSI < 30` | 강한 과매도 — 반등 가능성 높음 |
| **WeakBuy** | `close ≤ lower band` **AND** `30 ≤ RSI < 50` | 약한 과매도 — 관망 후 매수 고려 |
| **StrongSell** | `close ≥ upper band` **AND** `RSI > 70` | 강한 과매수 — 조정 가능성 높음 |
| **WeakSell** | `close ≥ upper band` **AND** `50 < RSI ≤ 70` | 약한 과매수 — 관망 후 매도 고려 |

기본 파라미터: BB Period `20`, BB Multiplier `2.0`, RSI Period `14`

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) (v18+)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run tauri dev

# 프로덕션 빌드
npm run tauri build
```

## Supported Markets

| 카테고리 | 심볼 |
|---|---|
| **US Large Cap** | AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, BRK-B, JPM, V, UNH, JNJ |
| **US ETFs** | SPY, QQQ, IWM, DIA, VOO, VTI, ARKK, XLF, XLK, XLE |
| **Korean Stocks** | 삼성전자, SK하이닉스, LG에너지솔루션, 현대차, NAVER, 카카오, LG화학, 삼성SDI, 삼성물산, KB금융 |
| **Korean ETFs** | KODEX 200, TIGER 200, KODEX 반도체, KODEX 2차전지, KODEX 200선물인버스2X, KODEX 레버리지 |
| **Crypto** | BTC, ETH, BNB, SOL, XRP, ADA, DOGE, DOT |
