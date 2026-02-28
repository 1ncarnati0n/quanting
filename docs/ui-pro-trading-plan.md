# Quanting UI 개선 계획서 — 방법론 B: 프로 트레이딩 UI 패턴

> 작성일: 2026-02-28
> 기반: TradingView / Bloomberg Terminal 패턴 분석 + 현재 코드 구조 기반

---

## 1. 현재 상태 진단

### 1.1 구조 분석

```
현재 레이아웃:
┌──────────────────────────────────────────────────┐
│  [≡] Quanting [US] AAPL · Apple  $150  +1.2%    │ ← Toolbar (모든 정보 밀집)
│  [1m] [5m] [15m] [1h] [1d]                       │ ← IntervalSelector
├────────┬─────────────────────────┬───────────────┤
│        │                         │               │
│ Watch  │      MainChart          │   Settings    │
│  list  │    (Candlestick +       │    Panel      │
│        │     Overlays +          │   (24rem)     │
│        │     Oscillators)        │               │
│        │                         │               │
├────────┴─────────────────────────┴───────────────┤
│  [US] AAPL · 1d · 최근 신호 없음      $150.23   │ ← StatusBar
└──────────────────────────────────────────────────┘
```

### 1.2 핵심 문제점

| # | 문제 | 상세 | 영향도 |
|---|------|------|--------|
| 1 | **툴바 과밀** | 브랜드명, 마켓뱃지, 심볼, 가격, 변동률, 고저가, 검색, 테마, 설정, 인터벌 모두 한 영역에 존재 | 높음 |
| 2 | **차트 영역 압박** | 양쪽 사이드바(Watchlist 280px + Settings 384px)가 고정 폭을 점유 | 높음 |
| 3 | **오실레이터 통합** | RSI, MACD, Stochastic, OBV가 모두 MainChart 내부 priceScale로 처리되어 레이아웃 제어 제한적 | 중간 |
| 4 | **정보 중복** | StatusBar와 Toolbar에서 심볼, 마켓, 가격 정보가 중복 표시 | 낮음 |
| 5 | **표면 깊이 부족** | `bg-secondary` 단일 배경으로 Toolbar, Chart, StatusBar 구분 약함 | 중간 |
| 6 | **가격 표시 약함** | 현재가가 text-[11px]로 너무 작고, 다른 정보와 시각적 위계 차이 불명확 | 중간 |

---

## 2. 목표 레이아웃

### 2.1 데스크톱 (≥1280px)

```
┌──────────────────────────────────────────────────────────────┐
│                     Market Header                            │
│  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │ AAPL · Apple Inc.    │  │ [1m] [5m] [15m] [1h] [4h] [1d]│ │
│  │ $150.23  +1.85(+1.2%)│  │                    [☀] [⚙] [🔍]│ │
│  │ H 151.45  L 148.90   │  │                              │  │
│  └──────────────────────┘  └──────────────────────────────┘  │
├─────┬────────────────────────────────────────────┬───────────┤
│     │                                            │           │
│ W   │          Price Chart (Candlestick)          │ Settings  │
│ a   │          + Overlays (BB, SMA, EMA)          │  Tab      │
│ t   │          + Signals                          │  Panel    │
│ c   │                                            │           │
│ h   ├────────────────────────────────────────────┤ [▸][◼][◼] │
│     │          Oscillator Panel (리사이즈)         │           │
│ l   │          RSI / MACD / Stoch (탭 or 스택)    │           │
│ i   │                                            │           │
│ s   ├────────────────────────────────────────────┤           │
│ t   │          Volume Bar                        │           │
│     │                                            │           │
├─────┴────────────────────────────────────────────┴───────────┤
│  신호: Strong Buy @ $148.50 · RSI 32.1 · 14:30    5개 지표   │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 태블릿 (768px~1279px)

```
┌──────────────────────────────────┐
│         Market Header            │
│  AAPL $150.23 +1.2%             │
│  [1m][5m][15m][1h][1d]  [☀][⚙] │
├──────────────────────────────────┤
│                                  │
│       Price Chart                │
│                                  │
├──────────────────────────────────┤
│       Oscillator (접힘 가능)      │
├──────────────────────────────────┤
│  StatusBar                       │
└──────────────────────────────────┘
  ← Watchlist (슬라이드 드로어)
                Settings (슬라이드 드로어) →
```

### 2.3 모바일 (<768px)

```
┌─────────────────────┐
│ [≡] AAPL $150 [⚙]  │
│ [1m][5m][15m][1h]   │
├─────────────────────┤
│                     │
│    Price Chart      │
│   (전체 너비)        │
│                     │
├─────────────────────┤
│ StatusBar (최소)     │
└─────────────────────┘
```

---

## 3. 단계별 구현 계획

### Phase 1: Market Header 분리 (Toolbar 리팩토링)

**현재**: `Toolbar.tsx` 하나에 모든 정보가 `flex-wrap`으로 나열
**목표**: 2행 구조의 전용 Market Header

#### 변경 대상
- `src/components/Toolbar.tsx` → `src/components/MarketHeader.tsx`로 리네임 + 리팩토링

#### 구조 설계

```
MarketHeader
├── Row 1: Symbol Info
│   ├── [Left]  MarketBadge + Symbol + Label
│   ├── [Center] Price Display (큰 폰트) + Change + Change%
│   └── [Right]  H/L/Vol 미니 통계
│
└── Row 2: Controls
    ├── [Left]  IntervalSelector
    └── [Right] SymbolSearch + ThemeToggle + SettingsToggle
```

#### 핵심 디자인 원칙

**가격 정보 강조**
- 현재가: `text-xl font-bold font-mono tabular-nums` (현재 text-[11px]에서 대폭 확대)
- 변동률: 가격 바로 옆에 색상(success/danger) 배지로 표시
- 고저가/거래량: `text-[10px]` 보조 정보로 유지하되 시각적 분리

**인터벌 세그먼트 컨트롤**
- 현재 개별 버튼 나열 → 세그먼트 컨트롤(연결된 버튼 그룹)로 변경
- 활성 상태: `accent-primary` 배경 + 하단 2px 인디케이터 라인
- 비활성: 배경 없음, `text-secondary`

#### CSS 변경

```css
/* 신규 유틸리티 */
.market-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.price-display {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.segment-control {
  display: inline-flex;
  background: var(--bg-tertiary);
  border-radius: 6px;
  padding: 2px;
  gap: 1px;
}

.segment-control button.active {
  background: var(--accent-primary);
  color: var(--accent-contrast);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
```

---

### Phase 2: 사이드바 탭 패널 전환

**현재**: Watchlist/Settings가 고정 폭으로 항상 차트 영역을 압박
**목표**: 접을 수 있는 탭 패널로 전환하여 차트 최대화

#### 변경 대상
- `src/App.tsx` — 레이아웃 구조 변경
- `src/components/WatchlistSidebar.tsx` — 접기/탭 지원
- `src/components/SettingsPanel.tsx` — 접기/탭 지원

#### 동작 설계

```
접힌 상태 (아이콘만):
┌──┐                              ┌──┐
│📋│  ←───── Chart Area ─────→    │⚙ │
│  │                              │📊│
│  │                              │  │
└──┘                              └──┘
 40px                              40px

펼친 상태 (콘텐츠 표시):
┌────────┐                        ┌──┐
│ Watch  │  ←── Chart Area ──→    │⚙ │
│ list   │                        │📊│
│ 260px  │                        │  │
└────────┘                        └──┘
```

#### 핵심 변경

**좌측 사이드바 (Watchlist)**
- 접힌 상태: 40px 아이콘 레일 (목록 아이콘 + 검색 아이콘)
- 펼친 상태: 260px (현재 280px에서 축소)
- 전환 애니메이션: `width` transition 200ms ease-out
- 상태 저장: `localStorage` key `quanting-sidebar-left`

**우측 사이드바 (Settings)**
- 접힌 상태: 40px 아이콘 레일 (설정, 지표, 레이아웃 아이콘)
- 펼친 상태: 320px (현재 384px에서 축소)
- 탭 구조:
  - **지표 탭**: 오버레이 + 오실레이터 설정 (현재 SettingsPanel 콘텐츠)
  - **레이아웃 탭**: 차트 레이아웃 프리셋 + 비율 슬라이더
  - **화면 탭**: 테마 + 차트 타입

#### App.tsx 레이아웃 변경

```tsx
// 현재 구조
<div className="flex gap-2">
  <WatchlistSidebar />     {/* 항상 고정 폭 */}
  <main>...</main>
  <SettingsPanel />        {/* 항상 고정 폭 */}
</div>

// 개선 구조
<div className="flex gap-0">
  <CollapsibleSidebar side="left" defaultOpen={true}>
    <WatchlistSidebar />
  </CollapsibleSidebar>
  <main className="flex-1 min-w-0">...</main>
  <CollapsibleSidebar side="right" defaultOpen={false}>
    <SettingsPanel />
  </CollapsibleSidebar>
</div>
```

#### 신규 컴포넌트: `CollapsibleSidebar`

```
Props:
  - side: "left" | "right"
  - defaultOpen: boolean
  - width: number (펼친 상태 너비)
  - icons: { icon: ReactNode, label: string, onClick?: () => void }[]

State:
  - isOpen: boolean (localStorage 연동)

Render:
  - 접힌 상태: 아이콘 레일 (40px)
  - 펼친 상태: 전체 패널 (width px)
  - 전환: CSS transition on width
```

---

### Phase 3: 오실레이터 분리 패널

**현재**: RSI, MACD, Stochastic, OBV가 모두 `MainChart.tsx` 내부에서 `priceScale` 분리로 처리
**목표**: 오실레이터를 별도 시각 영역으로 분리하여 차트 가독성 향상

#### 접근 방식

lightweight-charts의 priceScale 분리 방식은 유지하되, **시각적 구분**을 강화합니다.

#### 변경 대상
- `src/components/MainChart.tsx` — 오실레이터 영역 시각적 구분 강화
- `src/index.css` — 오실레이터 영역 스타일

#### 구현 방안

**방안: CSS 오버레이로 영역 구분 (lightweight-charts 구조 유지)**

```
현재: 하나의 캔버스에 모든 지표가 연속 배치
      ┌─────────────────────┐
      │    Candlestick      │
      │    + BB, SMA, EMA   │
      │                     │  ← 경계 불명확
      │    RSI              │
      │    MACD             │
      └─────────────────────┘

개선: CSS 오버레이로 시각적 분리선 추가
      ┌─────────────────────┐
      │    Candlestick      │
      │    + BB, SMA, EMA   │
      ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤ ← 점선 구분 + 레이블 오버레이
      │  RSI (14)     45.2  │ ← 레이블/값 오버레이
      ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
      │  MACD        -0.32  │
      └─────────────────────┘
```

**오실레이터 레이블 오버레이**
- 각 오실레이터 영역 좌상단에 이름 + 현재값 표시
- 반투명 배경 (`bg-primary/60 + backdrop-blur`)
- `position: absolute`로 차트 위에 오버레이
- 위치 계산: `layout.priceAreaRatio`와 각 weight 값으로 top 위치 계산

**영역 구분선**
- 가격 영역과 오실레이터 사이에 `border-top: 1px dashed var(--border-color)` 오버레이
- 각 오실레이터 간에도 미묘한 구분선

---

### Phase 4: Design Token 정밀화

**현재 문제**: 13개 CSS 변수로 모든 상황을 커버하려다 보니 표면 간 구분이 약함
**목표**: 계층별 역할이 명확한 토큰 체계

#### 4.1 배경 토큰 확장

```css
/* 현재: 4단계 */
--bg-primary:       #0d1421   /* 앱 배경 */
--bg-secondary:     #161f31   /* 카드/패널 */
--bg-tertiary:      #1c2940   /* 인풋/호버 */
--surface-elevated: #22314a   /* 드롭다운 */

/* 개선: 6단계 + 역할 명시 */
--bg-app:           #0a0f1a   /* 앱 최외곽 배경 (더 어둡게) */
--bg-surface:       #111827   /* 메인 콘텐츠 표면 */
--bg-card:          #1a2332   /* 카드/패널 배경 */
--bg-card-hover:    #1f2b3d   /* 카드 호버 상태 */
--bg-input:         #243044   /* 인풋/컨트롤 배경 */
--bg-elevated:      #2a3a52   /* 드롭다운/팝오버 */
```

#### 4.2 타이포그래피 스케일 정의

```css
/* 현재: text-[9px] ~ text-sm 임의 사용 */
/* 개선: 명확한 역할 기반 스케일 */

--font-size-caption:  10px;   /* 보조 레이블, 타임스탬프 */
--font-size-body-sm:  12px;   /* 일반 텍스트, 설정값 */
--font-size-body:     13px;   /* 기본 본문 */
--font-size-subtitle: 14px;   /* 섹션 제목, 심볼명 */
--font-size-title:    16px;   /* 패널 제목 */
--font-size-price:    20px;   /* 현재가 (핵심 정보) */
--font-size-price-lg: 24px;   /* 현재가 강조 (Market Header) */
```

#### 4.3 간격(Spacing) 시스템

```css
/* 4px 기반 간격 체계 */
--space-1: 4px;    /* 인라인 요소 간 최소 간격 */
--space-2: 8px;    /* 관련 요소 간 간격 */
--space-3: 12px;   /* 섹션 내 요소 간격 */
--space-4: 16px;   /* 섹션 패딩, 컴포넌트 간격 */
--space-5: 20px;   /* 그룹 간 간격 */
--space-6: 24px;   /* 패널 패딩 */
--space-8: 32px;   /* 주요 영역 간 간격 */
```

#### 4.4 Accent 강화

```css
/* 현재: 단색 accent */
--accent-primary: #2f7cff;

/* 개선: accent 계층 */
--accent-primary:    #2f7cff;
--accent-hover:      #4a91ff;   /* 호버 시 밝아짐 */
--accent-active:     #1a6aef;   /* 클릭 시 어두워짐 */
--accent-glow:       0 0 12px rgba(47, 124, 255, 0.25);  /* 활성 요소 glow */
--accent-soft:       rgba(47, 124, 255, 0.10);            /* 연한 배경 */
--accent-border:     rgba(47, 124, 255, 0.30);            /* 활성 테두리 */
```

---

### Phase 5: 컴포넌트별 디테일 개선

#### 5.1 Market Header 가격 표시

```
현재:                              개선:
┌──────────────────────┐          ┌──────────────────────────────┐
│ AAPL · Apple  $150   │          │ AAPL                         │
│ +1.85 (+1.2%)        │          │ Apple Inc.      NAS · Market │
│                      │          │                              │
│                      │          │ $150.23         ▲ +1.85      │
│                      │          │ ██████████████  (+1.24%)     │
└──────────────────────┘          └──────────────────────────────┘
                                   ↑ text-xl       ↑ 색상 배지
```

#### 5.2 Watchlist 미니 차트 강화

```
현재:                          개선:
┌─────────────────────┐       ┌─────────────────────────┐
│ AAPL     $150.23    │       │ AAPL          $150.23   │
│ Apple    +1.2%      │       │ Apple Inc.    ▲ +1.24%  │
│ ~~~~ (sparkline)    │       │ ▂▃▅▆▇█▇▅▆▇   H 151.45  │
└─────────────────────┘       │               L 148.90  │
                              └─────────────────────────┘
                               ↑ sparkline 높이 증가
                               ↑ 고저가 추가
```

#### 5.3 IntervalSelector 세그먼트 컨트롤

```
현재:                                개선:
[1m] [5m] [15m] [1h] [4h] [1d]     ┌──────────────────────────────┐
(개별 분리 버튼)                     │ 1m │ 5m │ 15m │ 1h │ 4h │1D │
                                    └──────────────────────────────┘
                                     ↑ 연결된 세그먼트 컨트롤
                                     ↑ 활성 탭에 하단 인디케이터
```

#### 5.4 StatusBar 정보 재배치

```
현재:
[US] AAPL · Apple · 1d · 최근 신호 없음 · [BB][RSI][SMA] · $150.23

개선:
┌────────────────────────────────────────────────────────────────┐
│ ● Strong Buy @ $148.50 · RSI 32.1 · 14:30  │  BB RSI SMA EMA │
│   최근 신호                                  │  활성 지표 5개   │
└────────────────────────────────────────────────────────────────┘
  ↑ 신호 정보 강조 (좌측)                        ↑ 지표 pills (우측)
  ↑ 심볼/마켓 정보는 MarketHeader로 이동
```

#### 5.5 Settings Panel 탭 구조

```
현재:                              개선:
┌──────────────────┐              ┌──────────────────┐
│ 지표 설정         │              │ [지표] [레이아웃] [화면] │ ← 탭
├──────────────────┤              ├──────────────────┤
│ ▼ 화면            │              │ ● 볼린저 밴드    ⬤ │ ← 지표 탭
│   테마: [다크][라이트] │          │   기간: ──●── 20  │
│   캔들: [캔들][HA] │              │   승수: ──●── 2.0 │
│ ▼ 차트 레이아웃    │              │                  │
│   프리셋: [균형]... │              │ ● SMA           ⬤ │
│ ▼ 오버레이 지표    │              │   [20] [50] [+]   │
│   볼린저/SMA/EMA  │              │                  │
│ ▼ 오실레이터      │              │ ○ EMA           ⬤ │
│   RSI/MACD/Stoch │              │   비활성 (회색)    │
│ ▼ 퀀트 필터       │              ├──────────────────┤
│ ▼ 거래량/자금흐름  │              │ + 지표 추가       │ ← 하단 액션
└──────────────────┘              └──────────────────┘
  ↑ 6개 아코디언 섹션                ↑ 3개 탭으로 분류
  ↑ 스크롤 필요 많음                 ↑ 각 탭 내 컴팩트
```

---

## 4. 파일 변경 매트릭스

| 파일 | Phase | 변경 유형 | 변경 범위 |
|------|-------|----------|----------|
| `src/index.css` | 4 | 수정 | CSS 변수 확장, 유틸리티 클래스 추가 |
| `src/App.tsx` | 2 | 수정 | 레이아웃 구조 변경 (CollapsibleSidebar 적용) |
| `src/components/Toolbar.tsx` | 1 | 리네임+리팩토링 | → `MarketHeader.tsx` (2행 구조) |
| `src/components/IntervalSelector.tsx` | 1 | 수정 | 세그먼트 컨트롤 스타일 |
| `src/components/StatusBar.tsx` | 5 | 수정 | 정보 재배치, 심볼 중복 제거 |
| `src/components/SettingsPanel.tsx` | 5 | 수정 | 탭 구조 전환 |
| `src/components/WatchlistSidebar.tsx` | 2, 5 | 수정 | 접기 지원, 미니차트 강화 |
| `src/components/MainChart.tsx` | 3 | 수정 | 오실레이터 레이블 오버레이 |
| `src/components/ChartContainer.tsx` | 3 | 수정 | 오버레이 레이블 컨테이너 |
| `src/components/CollapsibleSidebar.tsx` | 2 | **신규** | 접기/펼치기 사이드바 래퍼 |
| `src/utils/constants.ts` | 4 | 수정 | THEME_COLORS 토큰 확장 |
| `src/stores/useSettingsStore.ts` | 2 | 수정 | 사이드바 상태 추가 |

---

## 5. 구현 순서 및 의존성

```
Phase 4: Design Token
    │     (CSS 변수 확장 — 모든 Phase의 기반)
    │
    ▼
Phase 1: Market Header
    │     (Toolbar → MarketHeader 리팩토링)
    │     (IntervalSelector 스타일 변경)
    │
    ▼
Phase 2: Collapsible Sidebar
    │     (App.tsx 레이아웃 + 신규 컴포넌트)
    │     (Watchlist/Settings 접기 지원)
    │
    ▼
Phase 3: Oscillator Panel
    │     (MainChart 오버레이 레이블)
    │     (ChartContainer 구분선)
    │
    ▼
Phase 5: Component Details
          (StatusBar 재배치)
          (SettingsPanel 탭화)
          (Watchlist 미니차트 강화)
```

> **권장 실행 순서**: Phase 4 → 1 → 2 → 3 → 5
> 각 Phase는 독립적으로 커밋/PR 가능하도록 설계

---

## 6. 품질 체크리스트

### 각 Phase 완료 시 확인 항목

- [ ] 다크/라이트 모드 모두 시인성 확보
- [ ] 반응형 브레이크포인트별 레이아웃 확인 (768 / 1280 / 1536px)
- [ ] 차트 리사이즈 시 프레임 드롭 없음
- [ ] 키보드 단축키 동작 유지 (Cmd+B, Cmd+K, Cmd+,, Escape)
- [ ] 사이드바 상태 localStorage 유지
- [ ] 모바일 드로어 동작 유지
- [ ] 접근성: focus-visible 링, aria 속성 유지

### 최종 완료 기준

- [ ] TradingView 수준의 차트 영역 비율 (전체 화면의 70%+ 가능)
- [ ] 가격 정보가 3초 내 시각적으로 인식 가능
- [ ] 사이드바 접힘 시 차트 전체화면에 가까운 경험
- [ ] 설정 변경 시 차트 즉시 반영 (200ms 이내)
- [ ] 오실레이터 영역이 시각적으로 명확히 구분

---

## 7. 참고 자료

### 벤치마크 앱

| 앱 | 참고 포인트 |
|---|---|
| **TradingView** | 차트 최대화 레이아웃, 사이드바 접기, 오실레이터 분리 |
| **Bloomberg Terminal** | 정보 밀도와 가독성 균형, 가격 표시 위계 |
| **Binance Pro** | 다크 테마 색상 체계, 세그먼트 인터벌 셀렉터 |
| **Yahoo Finance** | Market Header 가격 표시 패턴 |

### 디자인 원칙

1. **차트가 주인공** — 모든 UI 요소는 차트를 보조한다
2. **가격이 최우선** — 현재가는 항상 가장 크고 명확하게
3. **점진적 공개** — 고급 설정은 숨기고 필요할 때 노출
4. **일관된 리듬** — 4px 배수 간격, 역할 기반 색상
5. **최소 클릭** — 자주 쓰는 기능(인터벌, 심볼 전환)은 1클릭 접근
