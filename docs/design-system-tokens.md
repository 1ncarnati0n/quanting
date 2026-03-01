# Quanting Design Tokens (v1)

`docs/design-system-adoption-plan.md`의 Week 1 산출물.

## 목적

디자인 결정을 컴포넌트 코드에서 분리하고, 화면별 스타일 편차를 줄이기 위해 공통 토큰 기준을 정의한다.

## 1. Color Tokens

기반 파일: `src/index.css`

1. `--background`, `--foreground`
2. `--card`, `--card-foreground`
3. `--primary`, `--primary-foreground`
4. `--secondary`, `--secondary-foreground`
5. `--muted`, `--muted-foreground`
6. `--destructive`, `--destructive-foreground`
7. `--border`, `--input`, `--ring`
8. 보조: `--success`, `--warning`, `--accent-glow`, `--shadow-elevated`

## 2. Typography Tokens

기반 파일: `src/index.css`

1. `--font-size-caption: 10px`
2. `--font-size-body-sm: 12px`
3. `--font-size-body: 13px`
4. `--font-size-subtitle: 14px`
5. `--font-size-title: 16px`
6. `--font-size-price: 20px`
7. `--font-size-price-lg: 24px`

권장 사용:

1. 캡션 제외 최소 12px
2. 컨트롤/설정 UI 기본 폰트 13~14px
3. 숫자/가격은 tabular/mono 우선

## 3. Radius Tokens

1. `--radius-sm: 0.375rem`
2. `--radius-md: 0.5rem`
3. `--radius-lg: 0.625rem`
4. `--radius-xl: 0.75rem`

## 4. Spacing/Control Tokens (v1 도입)

도입 목적:
- `h-7/h-8` 남용 감소
- 버튼/입력 최소 터치 타겟 확보

권장 값:

1. `--space-1: 0.25rem`
2. `--space-2: 0.5rem`
3. `--space-3: 0.75rem`
4. `--space-4: 1rem`
5. `--space-5: 1.25rem`
6. `--space-6: 1.5rem`
7. `--space-8: 2rem`
8. `--control-height-sm: 2rem` (32px)
9. `--control-height-md: 2.25rem` (36px)
10. `--control-height-lg: 2.5rem` (40px)

## 5. Mapping Rule

1. Primitive(`button/input/select/toggle/tabs`)는 토큰 기반 높이 우선
2. Screen 컴포넌트는 `px` 고정치보다 primitive `size` prop 우선
3. 예외가 필요하면 `className` override를 허용하되 사유를 PR에 기록

