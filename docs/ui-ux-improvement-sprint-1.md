# UI/UX 개선 실행 계획 및 결과 (Sprint 1)

기준 문서: `docs/design-system-adoption-plan.md`

## 목표

P0 범위인 아래 3개를 실제 코드에 반영한다.

1. 토큰/규칙/인벤토리 문서화
2. 핵심 UI primitive size 정책 통일
3. 인터벌/타임레인지/설정패널의 소형 UI 스케일 상향

## 실행 범위

1. 문서
   - `docs/design-system-tokens.md`
   - `docs/design-system-rules.md`
   - `docs/ui-audit-inventory.md`
2. Foundation
   - `src/index.css`: spacing/control/weight 토큰 추가
3. Primitive
   - `src/components/ui/button.tsx`
   - `src/components/ui/input.tsx`
   - `src/components/ui/select.tsx`
   - `src/components/ui/toggle-group.tsx`
4. Screen
   - `src/components/IntervalSelector.tsx`
   - `src/components/TimeRangeBar.tsx`
   - `src/components/SettingsPanel.tsx`

## 상세 계획

1. Week 1 산출물 문서 3종 작성
2. `size` 기준(`sm/md/lg`)으로 primitive 높이/폰트 표준화
3. SettingsPanel의 `9/10/11px`, `h-7/h-8` 축소 스타일 제거
4. 핵심 컨트롤은 primitive `size` prop으로 교체
5. 빌드 검증 후 변경 리포트 작성

## 실행 결과

완료:

1. 문서 3종 생성 완료
2. 토큰(`--space-*`, `--control-height-*`, `--font-weight-*`) 추가 완료
3. `Input`, `Select`, `ToggleGroup`에 `size` prop 적용 완료
4. `Button` 사이즈를 토큰 기반 높이로 정렬 완료
5. `IntervalSelector`, `TimeRangeBar`를 size 기반으로 정리 완료
6. `SettingsPanel` 내 소형 폰트/컨트롤 다수 상향 완료

잔여 (Sprint 2 권장):

1. `WatchlistSidebar`, `SymbolSearch` 동일 기준 마이그레이션
2. `PanelHeader`, `SettingRow` 패턴 컴포넌트 추출
3. 인라인 스타일 고빈도 블록을 class/token 기반으로 치환

