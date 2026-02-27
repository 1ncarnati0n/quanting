# Product Requirements Document

## BB-RSI Checker

**Bollinger Bands & RSI Technical Analysis Desktop Application**

| 항목 | 내용 |
|---|---|
| Version | 1.0 |
| Date | 2026-02-27 |
| Status | Draft |
| Tech Stack | Tauri 2.x + Rust + React/TypeScript |

---

## 1. Executive Summary

BB-RSI Checker는 Tauri(Rust) 기반의 경량 데스크톱 애플리케이션으로, 볼린저밴드(Bollinger Bands)와 RSI(Relative Strength Index)를 결합한 기술적 분석 도구이다. 사용자는 실시간 또는 과거 가격 데이터를 기반으로 두 지표의 복합 시그널을 시각적으로 확인하고, 과매수/과매도 구간을 신속히 판별할 수 있다.

기존 웹 기반 차트 서비스(TradingView 등)와 달리, 로컬에서 구동되어 빠른 연산 속도와 데이터 프라이버시를 보장하며, Rust의 고성능 연산 엔진을 통해 대량의 캔들 데이터를 밀리초 단위로 처리한다.

---

## 2. Problem Statement

### 2.1 현재 문제

기존 기술적 분석 도구들은 다음과 같은 한계를 가진다.

- **웹 의존성**: TradingView, Investing.com 등은 브라우저 기반으로, 네트워크 지연과 무거운 UI로 인해 반응성이 떨어진다.
- **구독 비용**: 고급 지표 조합이나 실시간 알림 기능은 대부분 유료 플랜에 포함되어 있다.
- **커스터마이징 제한**: BB와 RSI를 결합한 복합 시그널 로직을 사용자가 직접 정의하기 어렵다.
- **데이터 프라이버시**: 사용자의 분석 패턴과 관심 종목이 외부 서버에 노출된다.

### 2.2 해결 방향

로컬 실행 가능한 경량 네이티브 앱을 통해, 빠른 연산·커스텀 시그널·오프라인 분석을 동시에 제공한다.

---

## 3. Target Users

### 3.1 Primary User

| 항목 | 설명 |
|---|---|
| 프로필 | 개인 투자자 (주식/암호화폐) |
| 기술 수준 | 기술적 분석 기초 이해, 볼린저밴드와 RSI의 의미를 알고 있는 사용자 |
| 니즈 | 빠른 시그널 확인, 복합 지표 기반 진입/이탈 판단 |
| 사용 환경 | Windows / macOS / Linux 데스크톱 |

### 3.2 Secondary User

| 항목 | 설명 |
|---|---|
| 프로필 | 기술적 분석 학습자, 알고리즘 트레이딩 연구자 |
| 니즈 | 지표 파라미터 조정 실험, 과거 데이터 백테스팅 |

---

## 4. Technical Architecture

```
┌──────────────────────────────────────────────┐
│           Frontend (Tauri WebView)            │
│     React 18 + TypeScript + TailwindCSS      │
│     lightweight-charts (TradingView OSS)      │
├──────────────────────────────────────────────┤
│              Tauri IPC Bridge                 │
│         invoke() / event system              │
├──────────────────────────────────────────────┤
│            Backend (Rust Core)                │
│  ┌─────────────┐  ┌──────────────────────┐   │
│  │ API Client   │  │ TA Engine            │   │
│  │ (reqwest +   │  │ - Bollinger Bands    │   │
│  │  tokio)      │  │ - RSI                │   │
│  └─────────────┘  │ - Signal Generator   │   │
│  ┌─────────────┐  └──────────────────────┘   │
│  │ Local Cache  │  ┌──────────────────────┐   │
│  │ (rusqlite)   │  │ WebSocket Stream     │   │
│  └─────────────┘  │ (tokio-tungstenite)  │   │
│                    └──────────────────────┘   │
└──────────────────────────────────────────────┘
```

### 4.1 데이터 흐름

1. 사용자가 프론트엔드에서 종목(symbol)과 시간 간격(interval)을 선택한다.
2. Tauri IPC `invoke("fetch_analysis", { symbol, interval })`를 통해 Rust 백엔드를 호출한다.
3. Rust 백엔드가 외부 API에서 캔들 데이터를 수집하고 로컬 SQLite에 캐싱한다.
4. TA Engine이 볼린저밴드와 RSI를 계산하고, 복합 시그널을 생성한다.
5. 결과를 JSON으로 직렬화하여 프론트엔드에 반환한다.
6. 프론트엔드가 lightweight-charts로 캔들차트, 볼린저밴드, RSI 서브차트를 렌더링한다.

---

## 5. Tech Stack

### 5.1 Backend (Rust)

| 구성 요소 | 기술 | 버전 | 용도 |
|---|---|---|---|
| 프레임워크 | Tauri | 2.x | 데스크톱 앱 프레임워크 |
| HTTP Client | reqwest | latest | REST API 호출 |
| Async Runtime | tokio | 1.x | 비동기 처리 (Tauri 내장) |
| WebSocket | tokio-tungstenite | latest | 실시간 데이터 스트림 |
| Serialization | serde / serde_json | latest | JSON 직렬화/역직렬화 |
| Local DB | rusqlite | latest | 캔들 데이터 캐싱 |
| TA 계산 | 직접 구현 | - | 볼린저밴드, RSI 연산 |

### 5.2 Frontend (React/TypeScript)

| 구성 요소 | 기술 | 용도 |
|---|---|---|
| UI Framework | React 18 + TypeScript | 컴포넌트 기반 UI |
| Styling | TailwindCSS | 유틸리티 퍼스트 스타일링 |
| Chart Library | lightweight-charts (TradingView) | 캔들차트, 라인차트 렌더링 |
| State Management | Zustand 또는 Jotai | 경량 상태 관리 |
| IPC | @tauri-apps/api | Rust 백엔드 통신 |

### 5.3 기술 선정 근거

**Tauri vs Electron**: Tauri는 시스템 웹뷰를 사용하여 번들 크기가 약 2~10MB로 Electron(100MB+) 대비 크게 작다. Rust 백엔드를 통해 CPU 집약적 TA 연산에서 성능 이점이 있다.

> 출처: Tauri 공식 문서 — https://v2.tauri.app/start/

**lightweight-charts**: TradingView가 Apache 2.0 라이선스로 공개한 금융 차트 라이브러리로, 캔들스틱·라인·히스토그램 시리즈를 기본 지원하며 번들 크기가 약 45KB(gzip)로 가볍다.

> 출처: lightweight-charts GitHub — https://github.com/nicehash/lightweight-charts

**TA 직접 구현 vs `ta` crate**: `ta` crate(https://crates.io/crates/ta)도 사용 가능하나, 커스텀 시그널 조합과 파라미터 제어의 유연성을 위해 직접 구현을 권장한다.

---

## 6. Core Features (MVP)

### 6.1 Feature Priority Matrix

| 우선순위 | Feature | 설명 | Phase |
|---|---|---|---|
| P0 | 캔들차트 표시 | OHLCV 캔들스틱 차트 렌더링 | MVP |
| P0 | 볼린저밴드 오버레이 | 상단/중간/하단 밴드를 캔들차트 위에 표시 | MVP |
| P0 | RSI 서브차트 | 메인 차트 하단에 RSI 라인과 30/70 기준선 표시 | MVP |
| P0 | 복합 시그널 표시 | BB + RSI 조합 시그널을 차트에 마커로 표시 | MVP |
| P1 | 종목 검색 | 심볼 검색 및 선택 기능 | MVP |
| P1 | 시간 간격 선택 | 1m, 5m, 15m, 1h, 4h, 1d 등 인터벌 전환 | MVP |
| P1 | 파라미터 커스터마이징 | BB 기간/배수, RSI 기간 사용자 조정 | MVP |
| P2 | 실시간 데이터 스트림 | WebSocket 기반 실시간 가격 업데이트 | v1.1 |
| P2 | 알림 기능 | 시그널 발생 시 시스템 알림 | v1.1 |
| P2 | 워치리스트 | 다중 종목 모니터링 | v1.1 |
| P3 | 백테스팅 | 과거 데이터 기반 시그널 정확도 검증 | v2.0 |
| P3 | 추가 지표 | MACD, 스토캐스틱 등 확장 | v2.0 |

### 6.2 Feature Detail — 복합 시그널 판정 로직

볼린저밴드와 RSI를 조합하여 다음 네 가지 시그널을 생성한다.

| 시그널 | 조건 | 의미 |
|---|---|---|
| **Strong Buy** | 종가 ≤ BB 하단 AND RSI < 30 | 과매도 구간 진입, 반등 가능성 |
| **Weak Buy** | 종가 ≤ BB 하단 AND 30 ≤ RSI < 50 | 밴드 하단 접근, 관찰 필요 |
| **Strong Sell** | 종가 ≥ BB 상단 AND RSI > 70 | 과매수 구간 진입, 하락 가능성 |
| **Weak Sell** | 종가 ≥ BB 상단 AND 50 < RSI ≤ 70 | 밴드 상단 접근, 관찰 필요 |

> ⚠️ 본 시그널은 참고용 기술적 분석 도구이며, 투자 조언을 구성하지 않는다.

---

## 7. Technical Indicator Specifications

### 7.1 Bollinger Bands

| 파라미터 | 기본값 | 범위 | 설명 |
|---|---|---|---|
| Period (N) | 20 | 5–100 | SMA 계산 기간 |
| Multiplier (K) | 2.0 | 0.5–4.0 | 표준편차 배수 |

**계산 공식**:

- Middle Band = SMA(Close, N)
- Upper Band = SMA(Close, N) + K × σ(Close, N)
- Lower Band = SMA(Close, N) − K × σ(Close, N)
- σ = 모집단 표준편차 (population standard deviation)

> 출처: John Bollinger, *Bollinger on Bollinger Bands* (McGraw-Hill, 2001). 표준 정의는 20일 SMA ± 2σ이다.

### 7.2 RSI (Relative Strength Index)

| 파라미터 | 기본값 | 범위 | 설명 |
|---|---|---|---|
| Period | 14 | 2–50 | RSI 계산 기간 |
| Overbought Level | 70 | 50–90 | 과매수 기준선 |
| Oversold Level | 30 | 10–50 | 과매도 기준선 |

**계산 공식**:

- RS = Average Gain / Average Loss
- RSI = 100 − (100 / (1 + RS))
- 첫 번째 평균: SMA 방식 (단순 산술 평균)
- 이후: Wilder's Smoothing Method — Avg Gain = (Prev Avg Gain × (N−1) + Current Gain) / N

> 출처: J. Welles Wilder Jr., *New Concepts in Technical Trading Systems* (Trend Research, 1978). RSI 원저자가 정의한 Smoothing Method를 적용한다.

---

## 8. Data Sources

### 8.1 지원 데이터 소스

| 데이터 소스 | 대상 자산 | 인증 | 비용 | 우선순위 |
|---|---|---|---|---|
| Binance REST API | 암호화폐 | API Key (선택) | 무료 | Primary |
| Binance WebSocket | 암호화폐 (실시간) | 불필요 | 무료 | Primary |
| Yahoo Finance (비공식) | 글로벌 주식, ETF | 불필요 | 무료 | Secondary |
| KRX 공공데이터 | 한국 주식 | API Key 필요 | 무료 | Secondary |
| Alpha Vantage | 글로벌 주식 | API Key 필요 | 무료 티어 | Tertiary |

### 8.2 MVP 데이터 소스: Binance

MVP에서는 Binance REST API를 primary 데이터 소스로 사용한다.

**엔드포인트**: `GET https://api.binance.com/api/v3/klines`

| 파라미터 | 설명 | 예시 |
|---|---|---|
| symbol | 거래 쌍 | BTCUSDT |
| interval | 캔들 간격 | 1d, 4h, 1h, 15m |
| limit | 반환 캔들 수 | 100 (max 1000) |

> 출처: Binance API Docs — https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints

### 8.3 데이터 캐싱 전략

- SQLite(rusqlite)를 사용하여 로컬에 캔들 데이터를 캐싱한다.
- 캐시 유효 기간: 인터벌에 따라 차등 설정 (1d: 24시간, 1h: 1시간, 1m: 60초).
- 캐시 적중 시 API 호출을 생략하여 네트워크 부하를 줄인다.

---

## 9. Non-Functional Requirements

### 9.1 Performance

| 항목 | 목표 | 비고 |
|---|---|---|
| 앱 시작 시간 | < 2초 | Cold start 기준 |
| TA 연산 시간 | < 50ms | 1,000개 캔들 기준 BB + RSI |
| 차트 렌더링 | < 200ms | 초기 로드 후 인터랙션 |
| 메모리 사용량 | < 100MB | 일반 사용 시 |
| 번들 크기 | < 15MB | 설치 파일 기준 |

### 9.2 Compatibility

| 플랫폼 | 최소 버전 |
|---|---|
| Windows | 10 (1803+) |
| macOS | 11 (Big Sur+) |
| Linux | Ubuntu 22.04 / Fedora 38+ |

> 출처: Tauri v2 System Requirements — https://v2.tauri.app/start/prerequisites/

### 9.3 Security

- API 키는 시스템 키체인(keychain/credential manager)에 저장하며, 평문으로 디스크에 기록하지 않는다.
- 모든 외부 API 통신은 HTTPS(TLS 1.2+)를 사용한다.
- WebView의 외부 URL 탐색을 차단하여 피싱 공격을 방지한다.

### 9.4 Reliability

- 네트워크 단절 시 캐싱된 데이터로 오프라인 분석을 지원한다.
- API 호출 실패 시 최대 3회 재시도(exponential backoff)를 수행한다.

---

## 10. User Interface Design

### 10.1 화면 구성

```
┌──────────────────────────────────────────────┐
│  Toolbar                                     │
│  [종목 검색] [인터벌 선택] [설정 ⚙️]           │
├──────────────────────────────────────────────┤
│                                              │
│  Main Chart Area (약 70%)                     │
│  - 캔들스틱 차트                               │
│  - 볼린저밴드 오버레이 (상단/중간/하단)          │
│  - 시그널 마커 (Buy/Sell 아이콘)               │
│                                              │
├──────────────────────────────────────────────┤
│  RSI Sub-Chart (약 25%)                       │
│  - RSI 라인                                   │
│  - 70/30 기준선 (대시 라인)                     │
│  - 과매수/과매도 영역 색상 표시                  │
├──────────────────────────────────────────────┤
│  Status Bar                                  │
│  [현재가] [시그널 상태] [마지막 업데이트 시간]    │
└──────────────────────────────────────────────┘
```

### 10.2 시그널 표시 규칙

| 시그널 | 마커 | 색상 | 위치 |
|---|---|---|---|
| Strong Buy | ▲ | Green (#22C55E) | 캔들 하단 |
| Weak Buy | △ | Light Green (#86EFAC) | 캔들 하단 |
| Strong Sell | ▼ | Red (#EF4444) | 캔들 상단 |
| Weak Sell | ▽ | Light Red (#FCA5A5) | 캔들 상단 |

### 10.3 파라미터 설정 패널

사용자가 사이드 패널 또는 모달을 통해 다음 파라미터를 조정할 수 있다.

- BB Period (기본 20, 슬라이더: 5–100)
- BB Multiplier (기본 2.0, 슬라이더: 0.5–4.0, 0.1 단위)
- RSI Period (기본 14, 슬라이더: 2–50)
- RSI Overbought (기본 70, 슬라이더: 50–90)
- RSI Oversold (기본 30, 슬라이더: 10–50)

파라미터 변경 시 차트가 실시간으로 업데이트된다 (debounce: 300ms).

---

## 11. Development Roadmap

### Phase 1 — MVP (4주)

| 주차 | 작업 항목 |
|---|---|
| Week 1 | Tauri 프로젝트 초기화, Rust 백엔드 스캐폴딩, Binance API 클라이언트 구현 |
| Week 2 | BB/RSI 계산 엔진 구현 및 단위 테스트, SQLite 캐싱 레이어 |
| Week 3 | React 프론트엔드 구축, lightweight-charts 통합, Tauri IPC 연결 |
| Week 4 | 복합 시그널 로직, UI 마무리, 통합 테스트, 크로스 플랫폼 빌드 |

### Phase 2 — Enhanced (v1.1, +3주)

| 작업 항목 | 설명 |
|---|---|
| WebSocket 실시간 스트림 | Binance WebSocket 연동, 실시간 캔들 업데이트 |
| 시스템 알림 | 시그널 발생 시 OS 네이티브 알림 (Tauri notification plugin) |
| 워치리스트 | 다중 종목 등록 및 대시보드 뷰 |
| 다크/라이트 테마 | 사용자 테마 전환 |

### Phase 3 — Advanced (v2.0, +4주)

| 작업 항목 | 설명 |
|---|---|
| 백테스팅 엔진 | 과거 데이터 기반 시그널 정확도 검증 |
| 추가 지표 | MACD, 스토캐스틱, 이동평균 크로스 등 |
| 추가 데이터 소스 | Yahoo Finance, KRX 공공데이터, Alpha Vantage |
| 자동 업데이트 | Tauri updater plugin 연동 |

---

## 12. Risk Assessment

| 리스크 | 확률 | 영향 | 대응 방안 |
|---|---|---|---|
| Binance API 정책 변경/차단 | 중 | 높음 | 다중 데이터 소스 추상화 레이어 설계, 폴백 API 준비 |
| 비공식 API(Yahoo Finance) 불안정성 | 높음 | 중 | 공식 API 우선 사용, 에러 핸들링 강화 |
| 크로스 플랫폼 WebView 렌더링 차이 | 중 | 중 | Tauri 호환성 테스트 매트릭스 운용, WebView 최소 버전 지정 |
| TA 계산 정확도 오류 | 낮음 | 높음 | TradingView/Binance 결과값과 교차 검증, 단위 테스트 커버리지 90%+ |
| Tauri v2 안정성 이슈 | 낮음 | 중 | Tauri stable release 추적, 이슈 트래커 모니터링 |

---

## 13. Success Metrics

### 13.1 기술 지표

| Metric | 목표 | 측정 방법 |
|---|---|---|
| TA 연산 정확도 | TradingView 대비 오차 < 0.01% | 동일 데이터셋 교차 검증 |
| 테스트 커버리지 | Rust 코어 90%+ | cargo tarpaulin |
| 앱 크래시율 | < 0.1% | Sentry 또는 자체 로깅 |
| 빌드 성공률 | 3개 플랫폼 100% | CI/CD (GitHub Actions) |

### 13.2 사용자 지표 (v1.1 이후)

| Metric | 목표 | 비고 |
|---|---|---|
| 일일 활성 사용자(DAU) | 100+ | 오픈 소스 배포 기준 |
| GitHub Stars | 500+ (6개월) | 커뮤니티 관심도 |
| 평균 세션 시간 | 10분+ | 분석 도구 특성상 의미 있는 사용 |

---

## 14. References

| # | 출처 | URL |
|---|---|---|
| 1 | Tauri v2 공식 문서 | https://v2.tauri.app/start/ |
| 2 | Binance Spot API Documentation | https://developers.binance.com/docs/binance-spot-api-docs/rest-api |
| 3 | lightweight-charts (TradingView OSS) | https://github.com/nicehash/lightweight-charts |
| 4 | John Bollinger, *Bollinger on Bollinger Bands* (2001) | McGraw-Hill |
| 5 | J. Welles Wilder Jr., *New Concepts in Technical Trading Systems* (1978) | Trend Research |
| 6 | `ta` Rust crate | https://crates.io/crates/ta |
| 7 | reqwest HTTP client | https://crates.io/crates/reqwest |
| 8 | rusqlite SQLite binding | https://crates.io/crates/rusqlite |
| 9 | tokio-tungstenite WebSocket | https://crates.io/crates/tokio-tungstenite |

---

*이 문서는 기술적 분석 도구의 제품 요구사항을 정의한 것이며, 투자 조언을 구성하지 않습니다.*
