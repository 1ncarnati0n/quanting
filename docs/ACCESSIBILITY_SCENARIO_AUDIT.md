# Accessibility Scenario Audit

## 개요
- 목적: 핵심 키보드 중심 접근성 시나리오가 코드 레벨에서 회귀되지 않도록 계약(Contract) 점검을 자동화한다.
- 실행 스크립트: `npm run a11y:scenario`
- 구현 파일: `scripts/a11y-scenario-audit.mjs`

## 점검 시나리오(Contract)
1. 전역 단축키 충돌 가드
- 입력 포커스/모달 레이어에서 전역 단축키를 차단하는 조건 존재 여부 점검

2. `Esc` 종료 경로
- 사이드바 닫기 및 `quanting:close-sidebars` 이벤트 발행 경로 점검

3. 종목 검색 진입 단축키
- `Ctrl/Cmd+K`, `Ctrl/Cmd+/` 경로와 `quanting:open-symbol-search` 이벤트 점검

4. 명령 허브 진입 단축키
- `Ctrl/Cmd+J` 경로와 `quanting:open-command-center` 이벤트 점검

5. 워치리스트 항목 선택 접근성
- `role="button"`, `tabIndex={0}`, `Enter/Space` 선택 경로 점검

6. 워치리스트 방향키 탐색
- `ArrowUp/ArrowDown/Home/End` 이동 경로 및 `aria-keyshortcuts` 선언 점검

7. 라이브 리전 상태 안내
- 스냅샷 상태 텍스트의 `role="status"`/`aria-live="polite"` 존재 점검

## 실행 결과
- 실행일: 2026-03-02
- 결과: PASS
- 요약: `a11y scenario audit passed. Checked 7 scenario contracts.`

## 운영 규칙
- UI/단축키/패널 상호작용을 변경하는 PR은 `npm run a11y:scenario`를 반드시 통과해야 한다.
- 통합 검증은 `npm run ux:verify`로 실행한다.
