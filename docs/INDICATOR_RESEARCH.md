# Quanting - Technical Indicator Research

> Last updated: 2026-03-01
> Status: Review pending

---

## Table of Contents

1. [Current Implementation Status](#1-current-implementation-status)
2. [Tier 1: Highest Priority Additions](#2-tier-1-highest-priority-additions)
3. [Tier 2: High Impact Additions](#3-tier-2-high-impact-additions)
4. [Tier 3: Medium Impact Additions](#4-tier-3-medium-impact-additions)
5. [Advanced Volume Analysis](#5-advanced-volume-analysis)
6. [Volatility Indicators](#6-volatility-indicators)
7. [Momentum & Trend-Following](#7-momentum--trend-following)
8. [Market Microstructure](#8-market-microstructure)
9. [Multi-Timeframe Analysis](#9-multi-timeframe-analysis)
10. [ML & Alternative Data (Future)](#10-ml--alternative-data-future)
11. [Recent Research Papers](#11-recent-research-papers-2025-2026)
12. [Implementation Architecture Notes](#12-implementation-architecture-notes)

---

## 1. Current Implementation Status

### Charting Library
- **lightweight-charts** v5.1.0 (TradingView)

### Chart Types (5)
| Type | Status |
|------|--------|
| Candlestick | Implemented |
| Heikin-Ashi | Implemented |
| Line | Implemented |
| Area | Implemented |
| Bar (OHLC) | Implemented |

### Implemented Indicators (14)

| Category | Indicator | Parameters |
|----------|-----------|------------|
| **Trend** | SMA | periods: [20, 50, 200] |
| **Trend** | EMA | periods: [12, 26] |
| **Momentum** | RSI | period: 14, OB: 70, OS: 30 |
| **Momentum** | MACD | fast: 12, slow: 26, signal: 9 |
| **Momentum** | Stochastic | K: 14, D: 3, smooth: 3 |
| **Volatility** | Bollinger Bands | period: 20, mult: 2.0 |
| **Volatility** | ATR | configurable period |
| **Volume** | Volume | color-coded up/down |
| **Volume** | OBV | cumulative |
| **Volume** | VWAP | daily / cumulative |
| **Trend** | Ichimoku Cloud | full 5-component |
| **Trend** | Supertrend | period + multiplier |
| **Trend** | Parabolic SAR | step + maxStep |
| **Volume** | Volume Profile | session-based |

### Signal System
- Signal types: strongBuy, weakBuy, strongSell, weakSell, MACD crossovers, Stochastic extremes
- Filters: Regime (200-period), Momentum (63-period), Volatility (20/120-period rank)

### Supported Markets
- US Stocks, Korean Stocks, Crypto, Forex

---

## 2. Tier 1: Highest Priority Additions

이 지표들은 현재 앱의 가장 큰 gap을 채우며, 커뮤니티 수요가 가장 높은 항목.

### 2.1 Keltner Channels
- **Type:** Volatility band overlay
- **Parameters:** EMA period (20), ATR multiplier (2.0), ATR period (10)
- **Calculation:**
  - Middle = EMA(close, period)
  - Upper = Middle + multiplier × ATR(period)
  - Lower = Middle - multiplier × ATR(period)
- **Why priority:** Bollinger Bands와 결합해 **BB Squeeze** 감지 가능. TradingView에서 가장 인기 있는 전략 중 하나. BB가 Keltner 안으로 수축하면 변동성 압축 → 이후 강한 방향성 움직임 예고.
- **Implementation:** BB와 유사한 렌더링 로직. ATR은 이미 구현됨.
- **Effort:** Low — 기존 BB + ATR 코드 재사용

### 2.2 ADX / DI+ / DI-
- **Type:** Trend strength oscillator (별도 패널)
- **Parameters:** period (14)
- **Calculation:**
  - +DI = 100 × Smoothed(+DM) / ATR
  - -DI = 100 × Smoothed(-DM) / ATR
  - ADX = Smoothed(|+DI − -DI| / (+DI + -DI)) × 100
- **Why priority:** 트렌드 강도 측정의 표준. ADX > 25이면 강한 추세, < 20이면 횡보. 다른 지표의 필터로도 사용 가능 (예: 추세 전략은 ADX > 25일 때만 실행).
- **Rendering:** RSI와 유사한 3-line oscillator (ADX, +DI, -DI)
- **Effort:** Medium — 새 oscillator 패널 필요

### 2.3 Anchored VWAP
- **Type:** Price overlay (사용자가 앵커 포인트 선택)
- **Mechanism:** 특정 시점(어닝, 스윙 고/저점, IPO 등)부터 누적 VWAP 계산
- **Why priority:** 기관 투자자의 평균 매수가를 추적. 기존 VWAP의 한계(세션 기반)를 극복. TradingView 상위 요청 기능.
- **Implementation considerations:**
  - UI: 차트에서 클릭하여 앵커 포인트 지정 (drawing tool과 연계)
  - 계산: `Σ(price × volume) / Σ(volume)` from anchor point
- **Effort:** Medium-High — 앵커 포인트 선택 UI 필요

### 2.4 Smart Money Concepts (SMC)
- **Type:** Price action overlay
- **Components:**
  - **Order Blocks:** 대형 플레이어가 매수/매도 시작한 가격 존 (rectangle overlay)
  - **Fair Value Gaps (FVG):** 3-candle imbalance 영역 (box overlay)
  - **Break of Structure (BOS):** 구조 이탈 감지 (label/line)
  - **Change of Character (CHoCH):** 추세 전환 감지 (label/line)
- **Why priority:** TradingView에서 **#1 인기 지표** (LuxAlgo SMC). Price action 트레이더들의 핵심 도구.
- **Reference:** [smart-money-concepts Python pkg](https://github.com/joshyattridge/smart-money-concepts)
- **Effort:** High — 복합 오버레이, 스윙 감지 로직 필요

### 2.5 Multi-Timeframe (MTF) Indicator Overlay
- **Type:** System feature
- **Concept:** 현재 차트 타임프레임에 상위 타임프레임 지표를 오버레이. 예: 15분 차트에 일봉 RSI 표시.
- **Why priority:** TradingView 최다 요청 기능 카테고리. 전문 트레이더의 핵심 분석 기법.
- **Implementation considerations:**
  - 상위 타임프레임 데이터를 별도 fetch
  - 현재 타임프레임에 맞게 시간 매핑 (step function 형태)
  - Settings에서 각 지표별 MTF 소스 타임프레임 선택 UI
- **Effort:** High — 아키텍처 변경 필요 (데이터 fetching, 시간 매핑)

---

## 3. Tier 2: High Impact Additions

### 3.1 Donchian Channels
- **Type:** Volatility band overlay
- **Parameters:** period (20)
- **Calculation:** Upper = Highest High(N), Lower = Lowest Low(N), Middle = (Upper + Lower) / 2
- **Note:** Turtle Traders 전략의 핵심. 브레이크아웃 감지에 최적.
- **Effort:** Low

### 3.2 Chaikin Money Flow (CMF)
- **Type:** Oscillator (별도 패널)
- **Parameters:** period (20)
- **Calculation:** `Σ[((C - L) - (H - C)) / (H - L) × V] / Σ(V)` over period
- **Note:** 양수 = 매수 압력, 음수 = 매도 압력. 기관 자금 흐름 추적.
- **Effort:** Low

### 3.3 Money Flow Index (MFI)
- **Type:** Oscillator (0-100, 별도 패널)
- **Parameters:** period (14)
- **Calculation:** Volume-weighted RSI. `Typical Price = (H+L+C)/3`, 이후 RSI와 동일한 로직에 volume 가중.
- **Note:** "Volume RSI"라 불림. 기존 RSI보다 신뢰도 높은 과매수/과매도 신호.
- **Effort:** Low — RSI 코드 재사용

### 3.4 Cumulative Volume Delta (CVD)
- **Type:** Line/Histogram (별도 패널)
- **Calculation:** 매수 볼륨(up-tick)과 매도 볼륨(down-tick)의 누적 차이
- **Note:** 가격과 CVD 다이버전스 → 소진 신호. 간이 방식: close > open이면 up volume.
- **Effort:** Medium

### 3.5 Hull Moving Average (HMA)
- **Type:** Moving average overlay
- **Parameters:** period (20)
- **Calculation:** `HMA = WMA(2 × WMA(n/2) − WMA(n), √n)`
- **Note:** EMA보다 lag 최소화하면서 smoothness 유지. 빠른 트렌드 신호.
- **Effort:** Low

### 3.6 Choppiness Index
- **Type:** Oscillator (0-100, 별도 패널)
- **Parameters:** period (14)
- **Calculation:** `100 × LOG10(Σ ATR(1) / (Highest − Lowest)) / LOG10(period)`
- **Note:** 100 근처 = 횡보/choppy, 0 근처 = 강한 추세. ADX의 보완 지표.
- **Effort:** Low

### 3.7 Schaff Trend Cycle (STC)
- **Type:** Oscillator (0-100, 별도 패널)
- **Parameters:** TCLen (10), FastMA (23), SlowMA (50)
- **Calculation:** MACD → Stochastic → Double Stochastic smoothing
- **Note:** MACD보다 빠른 신호, Stochastic보다 적은 false signal.
- **Effort:** Medium

---

## 4. Tier 3: Medium Impact Additions

| Indicator | Type | Effort | Note |
|-----------|------|--------|------|
| Williams %R | Oscillator | Low | Stochastic의 inverted 버전, 더 빠른 신호 |
| CCI | Oscillator | Low | 주기적 시장에서 효과적 |
| Aroon Oscillator | Oscillator | Low | 시간 기반 모멘텀 측정 |
| Vortex Indicator | Oscillator | Low | 추세 방향 감지 |
| Auto Fibonacci | Overlay | Medium | 스윙 포인트 자동 감지 + 피보나치 레벨 |
| Liquidity Zones | Overlay | Medium | 스탑로스 클러스터 존 표시 |
| HA Smoothed Oscillators | Oscillator | Low | RSI/MACD에 하이킨아시 스무딩 적용 |
| KST (Know Sure Thing) | Oscillator | Low | 다중 타임프레임 ROC 합산 |
| TRIX | Oscillator | Low | Triple EMA 변화율, 노이즈 필터 |
| Klinger Oscillator | Oscillator | Medium | 장기 볼륨 기반 지표 |

---

## 5. Advanced Volume Analysis

| Indicator | Priority | Description |
|-----------|----------|-------------|
| **Anchored VWAP** | Very High | 사용자 선택 앵커 포인트부터 VWAP 계산 (Tier 1 참조) |
| **CVD** | High | 매수/매도 볼륨 차이 누적 (Tier 2 참조) |
| **MFI** | High | Volume-weighted RSI (Tier 2 참조) |
| **CMF** | High | 매수/매도 압력 측정 (Tier 2 참조) |
| **Volume Profile Fixed Range** | High | 세션 기반이 아닌 사용자 선택 기간의 볼륨 프로파일 |
| **A/D Line** | Medium | OBV와 유사하나 close의 high-low 범위 내 위치 가중 |
| **Volume Imbalance** | Medium | 특정 가격 레벨의 bid/ask 볼륨 불균형 감지 |
| **EOM (Ease of Movement)** | Low | 가격 변화 대비 볼륨 효율성 측정 |

---

## 6. Volatility Indicators

| Indicator | Priority | Description |
|-----------|----------|-------------|
| **Keltner Channels** | Very High | BB Squeeze 구현의 핵심 (Tier 1 참조) |
| **Donchian Channels** | High | Turtle Trading 브레이크아웃 (Tier 2 참조) |
| **Choppiness Index** | High | 추세 vs 횡보 분류기 (Tier 2 참조) |
| **RVI (Relative Volatility Index)** | Medium | 변동성 방향 측정 (>50 상승, <50 하락) |
| **Chaikin Volatility** | Medium | 거래 범위의 변화율 |
| **HV Percentile** | Medium | 현재 역사적 변동성의 백분위 순위 |
| **Standard Deviation Channel** | Medium | 선형 회귀 + 표준편차 밴드 |
| **ATR Bands** | Low | ATR 기반 밴드 (Supertrend와 유사) |

---

## 7. Momentum & Trend-Following

| Indicator | Priority | Description |
|-----------|----------|-------------|
| **ADX / DI+ / DI-** | Very High | 트렌드 강도 + 방향성 (Tier 1 참조) |
| **HMA** | High | 최소 lag 이동평균 (Tier 2 참조) |
| **STC** | High | MACD + Stochastic 하이브리드 (Tier 2 참조) |
| **Aroon** | Medium | 시간 기반 모멘텀 |
| **Vortex Indicator** | Medium | True range 기반 추세 감지 |
| **TRIX** | Medium | Triple EMA 기반 노이즈 필터 |
| **KST** | Medium | 다중 ROC 가중 합산 |
| **ROC** | Low | 단순 모멘텀 비율 |
| **Coppock Curve** | Low | 장기 바닥 감지 (월간 차트) |

---

## 8. Market Microstructure

| Indicator | Priority | Description |
|-----------|----------|-------------|
| **SMC (Order Blocks, FVG, BOS, CHoCH)** | Very High | Tier 1 참조. TradingView #1 지표 |
| **Market Structure Shifts** | High | HH/HL → LH/LL 전환 자동 감지 |
| **Liquidity Zones** | High | 스탑로스 클러스터 영역 시각화 |
| **Order Flow Imbalance** | Medium | 매수/매도 주문 불균형 (tick 데이터 필요) |
| **Bid-Ask Spread** | Low | 실시간 스프레드 표시 (L2 데이터 필요) |

---

## 9. Multi-Timeframe Analysis

| Technique | Priority | Description |
|-----------|----------|-------------|
| **MTF Indicator Overlay** | Very High | 상위 타임프레임 지표를 현재 차트에 표시 (Tier 1 참조) |
| **MTF Confluence Zones** | High | 다중 타임프레임 지지/저항 수렴 영역 |
| **Timeframe Momentum Divergence** | High | 타임프레임 간 모멘텀 다이버전스 감지 |
| **Elder Triple Screen** | Medium | 3-타임프레임 시스템 자동화 |

---

## 10. ML & Alternative Data (Future)

> 센티먼트/외부 데이터 연동은 추후 별도 결정 예정.

### ML-Based Indicators
| Technique | Feasibility | Description |
|-----------|-------------|-------------|
| ML Moving Average (Gaussian Process) | Medium | 시장 상황에 적응하는 이동평균 |
| SuperTrend AI (K-Means Clustering) | Medium | ATR 멀티플라이어 동적 최적화 |
| HMM Regime Detection | High | 확률적 시장 레짐 분류 (현재 필터의 업그레이드) |
| FinBERT Sentiment Overlay | API 필요 | 금융 텍스트 감성 분석 오버레이 |
| LSTM Prediction Bands | Low | 순방향 신뢰 구간 밴드 |

### Alternative Data Sources
| Source | Type | Notes |
|--------|------|-------|
| Social Sentiment Index | API | Twitter/Reddit/StockTwits 집계 (Santiment, Quiver Quant) |
| Fear & Greed Index | API | CNN 7-component composite → 배경 색상 오버레이 |
| Put/Call Ratio | 데이터 피드 | CBOE 옵션 데이터 필요 |
| GEX (Gamma Exposure) | 데이터 피드 | 옵션 체인 데이터 필요 |
| Dark Pool Activity | FINRA 데이터 | 다크풀 거래 비율 |

---

## 11. Recent Research Papers (2025-2026)

| Paper | Key Innovation | Source |
|-------|----------------|--------|
| Hybrid AI Trading System (2026.01) | EMA/MACD + RSI/BB + FinBERT + XGBoost + volatility regime | [arXiv 2601.19504](https://arxiv.org/abs/2601.19504) |
| Agentic Trading Framework (2025.12) | 자율 AI 에이전트 기반 트레이딩 아키텍처 | [arXiv 2512.02227](https://arxiv.org/abs/2512.02227) |
| Finance-Grounded Optimization (2025.09) | Sharpe/PnL/MDD 기반 ML 손실 함수 | [arXiv 2509.04541](https://arxiv.org/abs/2509.04541) |
| LLM-Guided RL Trading (2025.10) | LLM이 RL 에이전트에 전략 가이드 제공 | [arXiv 2508.02366](https://arxiv.org/html/2508.02366v2) |
| Network Momentum (2025.01) | 자산 간 lead-lag 관계 기반 모멘텀 스필오버 | [arXiv 2501.07135](https://arxiv.org/html/2501.07135v1) |
| TrendFolios Framework (2025) | 트렌드 팔로잉 포트폴리오 최적화 | [arXiv 2506.09330](https://arxiv.org/html/2506.09330v1) |

### Emerging Techniques
- **Fractal Market Geometry:** 프랙탈 분석 + 하모닉 패턴 + 피보나치 + 엘리엇 파동 + 와이코프 통합
- **Heikin Ashi Smoothed Oscillators:** RSI/MACD에 HA 스무딩 적용으로 노이즈 감소
- **Wyckoff Phase Auto-Detection:** 축적/마크업/분배/마크다운 자동 감지
- **Dynamic Fibonacci Zones:** 새 스윙 포인트 형성 시 자동 적응 + 볼륨 가중

---

## 12. Implementation Architecture Notes

### Current Architecture Flow
```
Settings Store → AnalysisParams → Tauri Backend (Rust) → AnalysisResponse → MainChart Rendering
```

### Adding a New Indicator (Checklist)
1. `useSettingsStore.ts` — `IndicatorConfig`에 파라미터 추가
2. `types/index.ts` — Request/Response 타입 정의
3. `src-tauri/` — Rust 백엔드 계산 로직 구현
4. `MainChart.tsx` — `chart.addSeries()` 기반 렌더링 추가
5. `SettingsPanel.tsx` — UI 컨트롤 추가
6. `constants.ts` — 색상 및 기본값 정의

### Rendering Patterns
- **Overlay** (SMA, BB, Keltner 등): Price 차트에 직접 오버레이
- **Oscillator** (RSI, MACD, ADX 등): 별도 밴드/패널에 렌더링
- **Histogram** (Volume, CVD): 막대 차트 형태
- **Complex overlay** (SMC, Fibonacci): 커스텀 primitives 또는 canvas 오버레이

### Priority Implementation Roadmap

```
Phase 1 (Quick wins - Low effort, High value)
├── Keltner Channels + BB Squeeze detection
├── Donchian Channels
├── HMA (Hull Moving Average)
├── CMF, MFI
└── Choppiness Index

Phase 2 (Core additions - Medium effort)
├── ADX / DI+ / DI-
├── CVD (Cumulative Volume Delta)
├── STC (Schaff Trend Cycle)
└── Market Structure (BOS/CHoCH)

Phase 3 (Advanced features - Higher effort)
├── Smart Money Concepts (full)
├── Anchored VWAP
├── MTF Indicator Overlay
├── Volume Profile Fixed Range
└── Auto Fibonacci

Phase 4 (Future - Requires external data/ML)
├── ML-based indicators
├── Sentiment overlay
├── Alternative data integration
└── HMM Regime Detection upgrade
```

---

## References

- [LuxAlgo Smart Money Concepts](https://www.luxalgo.com/library/indicator/smart-money-concepts-smc/)
- [Quantified Strategies: 100 Best Trading Indicators](https://www.quantifiedstrategies.com/trading-indicators/)
- [TradingView Indicator Library](https://www.tradingview.com/scripts/)
- [arXiv Quantitative Finance](https://arxiv.org/list/q-fin/recent)
- [smart-money-concepts (Python)](https://github.com/joshyattridge/smart-money-concepts)
