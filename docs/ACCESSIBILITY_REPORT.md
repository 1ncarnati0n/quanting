# Accessibility Report

## 리포트 정보
- 작성일: 2026-03-02
- 범위: `Settings`, `Watchlist`, `SymbolSearch`, `ChartToolbar`, `DrawingToolbar`

## 자동 점검 결과
### 실행 명령
- `npm run a11y:audit`
- `npm run a11y:scenario`
- `npm run ux:verify`

### 결과
- 상태: PASS
- 요약:
  - `a11y:audit` PASS (아이콘 버튼 접근성 이름, `role="button"` 키보드 조작성, `CommandInput` 레이블 규칙 통과)
  - `a11y:scenario` PASS (전역 단축키 충돌 가드, `Esc` 종료, 검색/명령 허브 진입, 워치리스트 방향키 탐색 계약 통과)
  - `ux:verify` PASS (`ux:gate + a11y:audit + a11y:scenario + build` 통과)

## 키보드-only 점검 결과
- 참조 문서: [UX_KEYBOARD_ONLY_CHECKLIST.md](./UX_KEYBOARD_ONLY_CHECKLIST.md), [ACCESSIBILITY_SCENARIO_AUDIT.md](./ACCESSIBILITY_SCENARIO_AUDIT.md)
- 상태: 코드 기반 + 핵심 시나리오 자동 계약 점검 완료
- 비고: 브라우저/OS 조합의 수동 점검은 Week 12 릴리즈 게이트에서 표본 점검으로 유지

## 잔여 리스크
- 브라우저/OS 조합별 실제 스크린리더 읽기 순서의 차이는 수동 E2E 점검이 필요
