# Quanting UI Rules (v1)

`docs/design-system-adoption-plan.md`의 Week 1 산출물.

## 1. Size & Touch Target

1. 인터랙션 요소 최소 높이: 36px (`--control-height-md`)
2. 아이콘 전용 버튼 최소 32px (`--control-height-sm`)
3. 밀집 UI에서도 32px 미만 금지

## 2. Typography

1. 본문/라벨 최소 12px
2. 10px는 보조 캡션/메타 정보에만 제한적으로 사용
3. 9px 신규 사용 금지

## 3. Primitive First

다음 UI는 직접 스타일링 대신 `src/components/ui/*` 우선 사용:

1. 버튼: `Button`
2. 입력: `Input`
3. 선택: `Select`
4. 세그먼트: `ToggleGroup` / `Tabs`
5. 토글: `Switch`

## 4. Variant/Size 정책

모든 primitive는 아래 기준으로 사용한다.

1. `size`: `sm | md | lg`
2. `variant`: semantic 기반 (`default`, `secondary`, `outline`, `ghost`, `destructive`)
3. 화면 컴포넌트에서 h/px/text를 직접 지정하기보다 `size`를 먼저 선택

## 5. Accessibility

1. `aria-label` 없는 아이콘 버튼 금지
2. 키보드 포커스 가능한 요소는 `focus-visible:ring-*` 유지
3. 상태색만으로 의미 전달 금지(텍스트/아이콘 병행)

## 6. Composition Rules

1. `style={{ ... }}`는 동적 값이 필요한 경우로 제한
2. 정적 시각 스타일은 class 또는 토큰으로 이동
3. 동일 패턴 3회 이상 반복 시 패턴 컴포넌트 추출 검토

## 7. PR Checklist (UI)

1. 신규 인터랙티브 요소 높이 36px 이상인가
2. 10px/9px 텍스트를 추가하지 않았는가
3. Primitive size/variant를 우선 사용했는가
4. 다크/라이트 모드에서 대비가 유지되는가
5. 키보드 접근(탭 이동, 포커스)이 동작하는가

