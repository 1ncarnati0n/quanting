# Quanting UI Revamp Plan (based on `docs/ui.html`)

## Goal
- 현재 단순 1열 구조를 `좌측 Watchlist + 중앙 Chart Workspace + 우측 Indicator/Settings`의 3영역 정보 구조로 확장한다.
- 트레이딩/퀀트 분석 앱답게 정보 우선순위(종목 컨텍스트 > 차트 > 지표/신호)를 명확히 한다.
- 다크/라이트 모두 동일한 가독성과 상호작용 품질을 보장한다.

## Reference Mapping
- `docs/ui.html`에서 차용:
  - 좌측 심볼 리스트/검색/상태 요약 패턴
  - 중앙 차트 헤더(심볼, 가격, 변동, 범위 선택, 액션 버튼)
  - 우측 지표 카드형 설정 패턴
  - 카드 단위 표면(`surface`) 계층과 보더 강조
- 현재 프로젝트 제약에 맞게 조정:
  - 과도한 데코레이션 제거, 실데이터 기반 UI 유지
  - Tauri + lightweight-charts 성능 유지

## Phase 1: Information Architecture (1st)
- App shell을 3컬럼으로 재구성:
  - Left: `WatchlistSidebar`
  - Center: `ChartWorkspace`
  - Right: `InspectorPanel` (현재 SettingsPanel 발전형)
- 모바일/좁은 화면 대응:
  - Left/Right를 슬라이드 패널화
  - Center chart는 항상 우선 표시
- 공통 spacing scale 정립:
  - 4/8/12/16/24 spacing token 적용

## Phase 2: Visual System (2nd)
- 테마 토큰 재정의 (`bg/surface/text/border/accent/success/danger`)
- 라이트 모드 대비 강화:
  - 차트 그리드/축/텍스트 대비 기준치 상향
  - panel border + shadow를 미세 조정해 레이어 분리
- 컴포넌트 밀도 2단계 도입:
  - `compact` (기본), `comfortable`

## Phase 3: Core Screens (3rd)
- Toolbar를 `Market Header`로 승격:
  - 심볼명/마켓 뱃지/현재가/변동률/고저가/거래량
  - 타임프레임 세그먼트 그룹 강화
- StatusBar 역할 재정의:
  - 선택된 활성 지표 요약 + 마지막 신호 + 업데이트 시각
- ChartContainer 개선:
  - 상단 floating info chip
  - 로딩/에러 상태를 카드형으로 통일

## Phase 4: Indicator UX (4th)
- SettingsPanel 카드화:
  - Overlay/Oscillator/Quant Filter 그룹을 접기/펼치기
  - 지표별 활성 토글 + 파라미터 + 색상 식별점 고정
- 이번에 추가한 `Chart Layout`(가격영역/지표밴드 비율) 섹션을 고급 설정으로 승격:
  - Preset 제공: `Balanced`, `Oscillator Focus`, `Volume Focus`
  - Reset + 사용자 프리셋 저장

## Phase 5: Interaction & Motion (5th)
- 패널 열고 닫기 애니메이션 통일(200ms ease-out)
- hover/focus/active 상태 규칙 통일
- 키보드 접근성:
  - 심볼 검색, 인터벌 선택, 설정 토글에 명확한 focus ring

## Phase 6: Quality & Rollout (6th)
- Done 기준:
  - 다크/라이트 모두 시인성 통과
  - 1280px, 1024px, 768px 반응형 확인
  - 차트 redraw/resize 시 프레임 드랍 없음
- 점진 배포:
  - Shell 개편 → Header/Sidebar → Panel 개선 순으로 PR 분리
  - 각 단계마다 시각 회귀 체크리스트 실행

## Implementation Backlog (actionable)
1. `LayoutShell` 신규 구성 및 좌/중/우 영역 분리
2. `WatchlistSidebar` 신규 컴포넌트 추가
3. `Toolbar`를 `MarketHeader`로 재작성
4. `SettingsPanel` 그룹 접기/펼치기 추가
5. `Chart Layout Preset` 상태/저장 로직 추가
6. 라이트 모드 대비 토큰 재튜닝
7. 반응형 슬라이드 패널 동작 구현
8. 최종 접근성/성능 점검
