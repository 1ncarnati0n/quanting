# UI Audit Inventory (2026-03-01)

`docs/design-system-adoption-plan.md`의 Week 1 산출물.

## 1. 요약 지표

1. 소형 스타일(`text-[9|10|11px]`, `h-7/h-8`) 사용: 약 171건
2. 인라인 스타일(`style={{...}}`) 사용: 약 250건
3. UI primitive import 사용 컴포넌트: 26개 파일

## 2. Hotspot (우선 리팩토링 대상)

소형 스타일 사용 상위:

1. `src/components/SettingsPanel.tsx` (42)
2. `src/components/WatchlistSidebar.tsx` (27)
3. `src/components/SymbolSearch.tsx` (23)
4. `src/components/MarketHeader.tsx` (9)

인라인 스타일 사용 상위:

1. `src/components/SettingsPanel.tsx` (49)
2. `src/components/WatchlistSidebar.tsx` (33)
3. `src/components/SymbolSearch.tsx` (22)
4. `src/components/MarketHeader.tsx` (18)

## 3. Primitive Coverage

이미 공통화된 primitive:

1. `Button`
2. `Input`
3. `Select`
4. `ToggleGroup`
5. `Tabs`
6. `Switch`
7. `Dialog`, `Sheet`, `Accordion`, `ScrollArea` 등

개선 필요:

1. primitive 내부 size 정책 불균일 (`h-8`, `text-xs` 편중)
2. screen 컴포넌트에서 개별 h/text override가 과다

## 4. 1차 실행 범위 (P0)

1. 문서화: tokens/rules/inventory 완료
2. primitive 표준화: `button/input/select/toggle-group` size 정렬
3. 화면 적용: `SettingsPanel`, `IntervalSelector`, `TimeRangeBar`

## 5. 2차 실행 범위 (P1)

1. `WatchlistSidebar`, `SymbolSearch` 버튼/입력 스케일 상향
2. `PanelHeader`, `SettingRow` 패턴 추출
3. 정적 인라인 스타일의 class/token 이동

