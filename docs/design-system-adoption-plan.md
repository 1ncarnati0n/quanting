# Quanting 디자인 시스템 도입 계획

## 1. 목표

현재 프로젝트의 UI/UX 일관성을 높이고, 기능 확장 시 디자인 부채를 줄이기 위해 **토큰 기반 디자인 시스템**을 도입한다.  
핵심 목표는 아래 3가지다.

1. 일관성: 동일한 의미의 UI가 화면마다 같은 스타일/동작을 갖도록 표준화
2. 사용성: 버튼/입력/탭의 클릭 영역과 가독성 개선(특히 소형 텍스트/버튼)
3. 생산성: 신규 기능 개발 시 재사용 가능한 컴포넌트로 구현 속도 향상

---

## 2. 현재 상태 진단 (코드베이스 기준)

### 강점

1. 이미 `src/components/ui/*`에 공통 프리미티브가 존재
2. `src/index.css`에 테마 토큰(`--primary`, `--border`, `--font-size-*`)이 정의되어 있음
3. Tailwind + shadcn 패턴으로 확장 가능한 기반이 있음

### 개선 포인트

1. 화면 컴포넌트(`src/components/*`)에 작은 폰트/버튼 클래스가 광범위하게 사용됨
2. `style={{ ... }}` 인라인 스타일 사용 비중이 높아 규칙 통제가 어려움
3. 동일한 의미의 컨트롤(필터/세그먼트/토글)이 화면별로 크기/간격이 다름
4. 접근성 기준(최소 터치 타겟, 포커스 상태, 대비)에 대한 공통 규칙이 문서화되어 있지 않음

### 빠른 진단 지표 (2026-03-01 기준)

1. `text-[9|10|11px]`, `h-7/h-8` 등 소형 스타일 사용: 약 171건
2. `style={{ ... }}` 인라인 스타일 사용: 약 250건
3. `var(--*)` 커스텀 토큰 참조: 약 337건

---

## 3. 도입 전략

### 전략 A: Foundation -> Primitive -> Pattern -> Screen 순차 도입

1. **Foundation(토큰)**부터 고정하고
2. **Primitive(ui 컴포넌트)** API를 통일한 뒤
3. **Pattern(조합 컴포넌트)**를 표준화하고
4. 마지막으로 **Screen 단위 마이그레이션**을 진행한다.

이 순서를 지키면, 화면 수정 시 매번 스타일 결정을 다시 하지 않아도 된다.

### 전략 B: 빅뱅 전환 금지, 기능 단위 점진 마이그레이션

한 번에 전면 교체하지 않고, 사용자가 가장 많이 쓰는 영역부터 우선 적용한다.

1. 헤더(인터벌/타임레인지)
2. 사이드바(종목/필터)
3. 설정창(지표/레이아웃/화면)
4. 차트 툴바/오버레이

### 전략 C: 디자인 규칙을 코드 규칙으로 강제

문서만 두지 않고 컴포넌트/토큰/린트 규칙으로 제약을 건다.

---

## 4. 디자인 시스템 구조안

### 4.1 Foundation (Design Tokens)

`src/index.css` 토큰을 유지하되, 아래 레이어로 체계화한다.

1. 색상
   - `--color-bg-surface`, `--color-bg-elevated`, `--color-text-primary`, `--color-text-muted`
   - `--color-border-default`, `--color-border-strong`, `--color-focus-ring`
2. 타이포그래피
   - `--font-size-caption`, `--font-size-body-sm`, `--font-size-body`, `--font-size-title`
   - `--font-weight-regular`, `--font-weight-medium`, `--font-weight-semibold`
3. 간격/치수
   - `--space-1..8`, `--radius-sm/md/lg`, `--control-height-sm/md/lg`
4. 모션
   - `--duration-fast/normal`, `--easing-standard`

권장 원칙:
- 폰트 기본 크기는 최소 12px(캡션 예외)
- 인터랙션 가능한 요소 높이는 최소 36px, 권장 40px
- 포커스 링은 모든 인터랙티브 요소에서 시각적으로 동일

### 4.2 Primitive (ui 컴포넌트)

대상: `src/components/ui/*`

표준 props 제안:

1. `size`: `sm | md | lg`
2. `variant`: 컴포넌트 의미별(`default | subtle | outline | ghost | destructive`)
3. `state`: `loading | disabled | active`

우선 정비 대상:

1. `button.tsx`
2. `input.tsx`
3. `select.tsx`
4. `toggle-group.tsx`
5. `tabs.tsx`
6. `switch.tsx`

### 4.3 Pattern (조합 컴포넌트)

화면에 반복되는 묶음을 패턴 컴포넌트로 승격한다.

1. `SegmentControl` (인터벌/타임레인지 공통)
2. `PanelHeader` (좌우 액션 + 타이틀 + 검색/필터 슬롯)
3. `SettingRow` (라벨 + 컨트롤 + 설명)
4. `MetricTile` (지표 값 카드)

권장 위치:
- `src/components/patterns/*`

### 4.4 Screen 가이드

핵심 화면별 레이아웃/컴포넌트 사용 규칙을 문서화한다.

1. `MarketHeader`: 컨트롤 높이 통일, 1차 정보 우선순위 규칙
2. `WatchlistSidebar`: 검색/필터/행 간격 규칙
3. `SettingsPanel`: 탭/폼/토글 밀도 규칙
4. `ChartToolbar`: 아이콘 버튼 그룹 규칙

---

## 5. 상세 실행 계획 (4주)

### Week 1: 감사(Audit) + 토큰 계약

목표: 기준선 확정 및 규칙 문서화

작업:

1. UI 인벤토리 작성
   - 대상 파일: `src/components/*.tsx`, `src/components/ui/*.tsx`
   - 결과물: 컴포넌트 목록, 중복 패턴, 우선순위 맵
2. 토큰 명세 문서 작성
   - 색상/타이포/간격/반경/모션 토큰 표
3. 접근성 규칙 정의
   - 최소 터치 타겟, 대비, 포커스, 키보드 탐색
4. 베이스라인 캡처
   - 주요 화면 스크린샷 + 문제 목록

산출물:

1. `docs/design-system-tokens.md`
2. `docs/design-system-rules.md`
3. `docs/ui-audit-inventory.md`

### Week 2: Primitive 정비

목표: UI 기본 빌딩블록 API 표준화

작업:

1. `button/input/select/toggle-group/tabs/switch`에 `size`, `variant` 정리
2. 공통 높이/패딩/텍스트 스케일을 토큰 기반으로 교체
3. 포커스/호버/비활성 상태 스타일 통일
4. Breaking change 목록 작성 및 마이그레이션 가이드 작성

산출물:

1. `docs/design-system-primitives.md`
2. `docs/design-system-migration-guide.md`

### Week 3: 핵심 화면 마이그레이션

목표: 사용자 체감이 큰 영역부터 적용

우선순위:

1. `MarketHeader` + `IntervalSelector` + `TimeRangeBar`
2. `WatchlistSidebar` + `SymbolSearch`
3. `SettingsPanel` (지표설정/종목설정/화면설정)

작업:

1. 소형 버튼/텍스트를 DS 스케일로 상향
2. 인라인 스타일을 의미 기반 클래스/토큰으로 이동
3. 패턴 컴포넌트(`SegmentControl`, `PanelHeader`) 도입

산출물:

1. 주요 화면 before/after 비교 문서
2. 컴포넌트별 적용률 리포트

### Week 4: 정리 + 가드레일

목표: 재발 방지 및 운영 체계 구축

작업:

1. 금지 규칙 정의
   - 예: 임의 `text-[10px]`, 임의 `h-7` 신규 사용 제한
2. 리뷰 체크리스트 도입
   - PR 템플릿에 DS 항목 추가
3. 회귀 점검
   - 다크/라이트, 주요 해상도, 키보드 접근성
4. 문서 완성
   - 팀 온보딩용 사용법/예시 정리

산출물:

1. `docs/design-system-checklist.md`
2. `docs/design-system-governance.md`

---

## 6. 구현 백로그 (우선순위)

P0 (즉시):

1. 토큰 명세 문서 작성
2. `ui` 프리미티브 API 통일 (`size`, `variant`)
3. 인터벌/타임레인지/설정 패널 버튼 스케일 상향

P1 (단기):

1. `WatchlistSidebar`, `SymbolSearch` 패턴 정리
2. `PanelHeader`, `SettingRow` 패턴 컴포넌트화
3. 인라인 스타일 고빈도 영역 치환

P2 (중기):

1. 차트 툴바/오버레이 규칙 통일
2. 시각 회귀 테스트 체계(스크린샷 비교) 도입
3. 디자인 가이드 샘플 페이지(내부) 구성

---

## 7. 성공 지표 (KPI)

1. UI 일관성
   - 핵심 화면에서 공통 컴포넌트 사용률 80% 이상
2. 접근성
   - 주요 컨트롤 최소 높이 36px 이상 100% 달성
3. 유지보수성
   - 인라인 스타일 사용량 40% 이상 감소
4. 개발 생산성
   - 신규 화면/기능 PR에서 UI 스타일 관련 리뷰 코멘트 감소

---

## 8. 리스크와 대응

1. 리스크: 전면 변경으로 회귀 증가
   - 대응: 빅뱅 금지, 기능 단위 단계적 마이그레이션
2. 리스크: 컴포넌트 API 변경으로 충돌
   - 대응: 마이그레이션 가이드 + 점진 릴리즈
3. 리스크: 문서만 있고 실제 적용이 느림
   - 대응: 매 주 적용률 지표와 P0/P1 완료 기준 운영

---

## 9. 즉시 실행 액션 (다음 스텝)

1. `Week 1` 산출물 3개 문서 생성
2. `button/input/select/toggle-group` API 표준안 확정
3. `SettingsPanel`을 첫 번째 대규모 마이그레이션 대상으로 지정
4. 완료 후 `before/after` 스냅샷으로 체감 품질 검증
