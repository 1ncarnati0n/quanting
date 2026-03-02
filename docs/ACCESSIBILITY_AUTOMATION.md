# Accessibility Automation

## 개요
- 정적 코드 기반 접근성 점검 스크립트를 도입해 회귀를 조기에 감지한다.
- 실행 스크립트: `npm run a11y:audit`
- 구현 파일: `scripts/a11y-audit.mjs`
- 핵심 시나리오 계약 점검 스크립트: `npm run a11y:scenario`
- 구현 파일: `scripts/a11y-scenario-audit.mjs`

## 자동 점검 항목
1. `Button` 컴포넌트의 아이콘 버튼(`size="icon"`) 접근성 이름 확인
- `aria-label` / `aria-labelledby` / `title` 중 하나 필수

2. 네이티브 `<button>`의 아이콘성 버튼 접근성 이름 확인
- 의미 있는 텍스트가 없으면 `aria-label`/`aria-labelledby`/`title` 필수

3. `role="button"` 요소 키보드 조작성 확인
- `onClick`, `tabIndex`, `onKeyDown` 존재 여부 확인

4. `CommandInput`의 접근성 이름 확인
- `aria-label` 또는 `aria-labelledby` 필수

## 실행 방법
1. `npm run a11y:audit`
2. `npm run a11y:scenario`
3. 실패 시 출력된 파일/라인 기준으로 수정
4. 수정 후 재실행하여 통과 확인

## 운영 규칙
- UI 변경 PR에서는 `a11y:audit` 통과를 기본으로 한다.
- 단축키/탐색/패널 상호작용 변경 PR은 `a11y:scenario`도 기본 통과 조건으로 둔다.
- `ux:verify`를 사용하면 `ux:gate + a11y:audit + a11y:scenario + build`를 한 번에 검증할 수 있다.
