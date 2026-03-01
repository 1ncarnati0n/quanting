# UI/UX 개선 실행 계획 및 결과 (Sprint 3)

기준 문서: `docs/design-system-adoption-plan.md`

## 목표

1. 중복되는 헤더/설정 행 패턴을 컴포넌트로 추출
2. Screen 레벨 구현을 패턴 중심으로 정리
3. 다음 단계(`style` 고빈도 정리)의 기반 확보

## 실행 범위

1. `src/components/patterns/PanelHeader.tsx`
2. `src/components/patterns/SettingRow.tsx`
3. `src/components/SettingsPanel.tsx`
4. `src/components/WatchlistSidebar.tsx`

## 적용 내용

1. `PanelHeader` 신규 추가
   - `title`, `subtitle`, `badgeText/badgeColor`, `actions`, `children` 슬롯 제공
   - 설정 패널/워치리스트 헤더 공통 구조로 사용
2. `SettingRow` 신규 추가
   - `label`, `right`, `children` 슬롯 제공
   - `SettingsPanel`의 `SliderRow`, `ToggleRow`를 공통 행 패턴 기반으로 정리
3. `SettingsPanel` 헤더 마이그레이션
   - 기존 수동 헤더 마크업 제거, `PanelHeader`로 치환
4. `WatchlistSidebar` 헤더 마이그레이션
   - 기존 수동 헤더 마크업 제거, `PanelHeader`로 치환

## 검증

1. `npm run build` 통과
2. 기존과 동일하게 번들 크기 경고만 존재

## 다음 작업 (권장)

1. `style={{...}}` 고빈도 블록을 class/token으로 이전
2. `PanelHeader` 변형(밀도/액션 정렬) 옵션 확장
3. `SettingRow`를 `SymbolSearch`/`WatchlistSidebar` 내부 폼에도 확장 적용

