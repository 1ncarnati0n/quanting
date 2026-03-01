# UI/UX 개선 실행 계획 및 결과 (Sprint 2)

기준 문서: `docs/design-system-adoption-plan.md`

## 목표

Sprint 1에서 정한 P1 우선순위 중 아래를 선반영한다.

1. `WatchlistSidebar`, `SymbolSearch` 컨트롤 사이즈 상향
2. primitive `size` 사용으로 하드코딩 높이 축소
3. 소형 타이포 패턴(`9/10/11px`) 제거

## 실행 범위

1. `src/components/SymbolSearch.tsx`
2. `src/components/WatchlistSidebar.tsx`

## 적용 내용

1. `SymbolSearch`
   - 상단 액션 버튼의 고정 높이 제거(`Button size` 활용)
   - 필터 버튼/즐겨찾기 버튼의 작은 높이(`h-6`) 제거
   - 즐겨찾기 아이콘 버튼(`h-7 w-7`) 제거
   - 직접 입력 영역 `Input size="sm"` 적용
2. `WatchlistSidebar`
   - 헤더 아이콘 버튼 고정 높이 제거
   - 검색 입력 `Input size="md"` 적용
   - 마켓 필터/스크리너 액션 버튼 패딩 상향
   - 프리셋 입력 `Input size="sm"` 적용
   - 리스트 내 즐겨찾기 버튼 클릭 영역 확장
3. 타이포
   - `text-[9|10|11px]` -> `text-xs`/`text-sm`로 통일

## 검증

1. `npm run build` 통과
2. 기존과 동일하게 번들 크기 경고만 존재

## 다음 작업 (권장)

1. `PanelHeader`, `SettingRow` 패턴 컴포넌트 추출
2. `style={{...}}` 고빈도 영역을 class/token으로 이전
3. 스크린샷 기반 시각 회귀 점검 루틴 도입

