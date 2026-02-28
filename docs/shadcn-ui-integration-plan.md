# shadcn/ui 통합 계획서 — Quanting

> **작성일**: 2026-02-28
> **대상 프로젝트**: Quanting (React 18 + Vite 6 + Tailwind CSS v4 + Tauri 2)
> **현재 UI 컴포넌트**: 22개 (커스텀 구현)

## 실행 상태 (2026-02-28)

- [x] `@/*` alias 적용 (`tsconfig.json`, `vite.config.ts`)
- [x] `cn()` 유틸 추가 (`src/lib/utils.ts`)
- [x] shadcn 스타일 `ui` 컴포넌트 추가
  - `Button`, `Badge`, `Separator`, `Tooltip`, `ToggleGroup`
- [x] 1차 UI 치환
  - `SignalBadge` → `Badge`
  - `IntervalSelector`, `TimeRangeBar`, `SettingsPanel` 상단 탭 → `ToggleGroup`
  - `CollapsibleSidebar`, `MarketHeader`, `WatchlistSidebar`, `ShortcutsModal` 일부 버튼 → `Button`
  - `ChartToolbar` 리플레이 버튼 → `Tooltip`
- [x] 2차 폼 치환(Phase 3 상당)
  - `SettingsPanel` 슬라이더/스위치/입력/셀렉트 → `Slider`/`Switch`/`Input`/`Select`
  - `PeriodsInput`, `SymbolSearch`, `WatchlistSidebar` 입력 UI → `Input`/`Button`
- [x] 복합 컴포넌트 치환(Phase 4 1차)
  - `ChartContextMenu`(`ContextMenu`) 완료
  - `ChartToolbar`(`DropdownMenu`) 완료
  - `ShortcutsModal`(`Dialog`) 완료
- [x] 복합 컴포넌트 치환(Phase 4 2차)
  - `SymbolSearch`의 `Command` 패턴 전환 완료
  - `WatchlistSidebar` 스크롤 영역 `ScrollArea` 전환 완료
  - `CollapsibleSidebar` `Collapsible` 패턴 적용 완료
- [x] 고급 UI & 레이아웃(Phase 5)
  - `SettingsPanel` 상단 탭 `Tabs` 전환 완료
  - 섹션 접기/펼치기 `Accordion` 전환 완료
  - `Sheet` 기반 모바일 사이드패널 통합 완료

> 참고: 현재 개발 환경에서 npm registry DNS(`ENOTFOUND`) 이슈로 `npx shadcn`/외부 패키지 설치가 불가능하여, 동일한 구조(`src/components/ui/*`)로 로컬 구현을 우선 적용함.

---

## 1. 현재 상태 분석

### 1.1 기술 스택 요약

| 항목 | 현재 값 |
|------|---------|
| React | 18.3.1 |
| Vite | 6.0.0 |
| Tailwind CSS | **4.0** (CSS-first, `@tailwindcss/vite` 플러그인) |
| TypeScript | 5.6.0 (strict mode) |
| 상태관리 | Zustand 5.0 |
| 런타임 | Tauri 2.0 (데스크톱) |

### 1.2 기존 스타일링 현황

- **CSS 디자인 토큰**: `:root`에 30+ 커스텀 프로퍼티 정의 (`--bg-app`, `--accent-primary` 등)
- **커스텀 CSS 클래스**: `.btn-ghost`, `.surface-card`, `.modal-overlay`, `.context-menu` 등
- **Tailwind 유틸리티**: 인라인에서 광범위하게 사용
- **테마**: 다크 모드 기본, CSS 변수 기반 테마 전환 구현

### 1.3 교체 대상 UI 패턴

| 기존 패턴 | 사용 위치 | shadcn/ui 대응 컴포넌트 |
|-----------|----------|------------------------|
| `.modal-overlay` + `.modal-content` | ShortcutsModal, SymbolSearch | `Dialog` |
| `.context-menu` + `.context-menu-item` | ChartContextMenu | `ContextMenu` |
| `.chart-toolbar-dropdown` | ChartToolbar | `DropdownMenu` |
| `.segment-control` + `.segment-button` | SettingsPanel, IntervalSelector | `Tabs` / `ToggleGroup` |
| `.btn-ghost` | 다수 컴포넌트 | `Button` (variant="ghost") |
| `.sidebar-shell` | CollapsibleSidebar | `Sheet` / `Sidebar` |
| 커스텀 input 스타일 | PeriodsInput, SymbolSearch | `Input` |
| 커스텀 toggle/switch | SettingsPanel | `Switch` |
| 커스텀 slider | SettingsPanel (weight 조절) | `Slider` |
| 커스텀 select | IntervalSelector | `Select` |
| 커스텀 tooltip 없음 | 전체 | `Tooltip` (신규) |
| 커스텀 badge | SignalBadge | `Badge` |
| 커스텀 separator | SettingsPanel 섹션 | `Separator` |
| 커스텀 scroll area | WatchlistSidebar | `ScrollArea` |

---

## 2. 사전 요구사항 & 환경 설정

### 2.1 필수 의존성 설치

```bash
# shadcn/ui 핵심 의존성
npm install class-variance-authority clsx tailwind-merge

# Radix UI 프리미티브 (shadcn/ui가 내부적으로 사용)
# → shadcn CLI가 컴포넌트별로 자동 설치

# 아이콘 (shadcn/ui 기본)
npm install lucide-react

# shadcn/ui CLI (Tailwind v4 지원 버전)
npx shadcn@latest init
```

### 2.2 Tailwind CSS v4 호환성 주의사항

shadcn/ui는 Tailwind v4의 CSS-first 설정 방식을 지원합니다. 기존 `tailwind.config.js`가 없으므로 (v4는 CSS 기반), 다음과 같이 설정합니다:

```css
/* src/index.css — Tailwind v4 + shadcn/ui 통합 */
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* shadcn/ui 필수 CSS 변수 → 기존 토큰 매핑 */
  --color-background: var(--bg-app);
  --color-foreground: var(--text-primary);
  --color-card: var(--bg-card);
  --color-card-foreground: var(--text-primary);
  --color-primary: var(--accent-primary);
  --color-primary-foreground: var(--accent-contrast);
  --color-secondary: var(--bg-input);
  --color-secondary-foreground: var(--text-primary);
  --color-muted: var(--bg-elevated);
  --color-muted-foreground: var(--text-secondary);
  --color-accent: var(--bg-card-hover);
  --color-accent-foreground: var(--text-primary);
  --color-destructive: var(--danger-color);
  --color-border: var(--border-color);
  --color-input: var(--bg-input);
  --color-ring: var(--accent-primary);
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;
  --radius-xl: 0.75rem;
}
```

### 2.3 TypeScript 경로 별칭 설정

shadcn/ui 컴포넌트 경로를 위한 alias 추가가 필요합니다.

**tsconfig.json:**
```jsonc
{
  "compilerOptions": {
    // ... 기존 설정 유지
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**vite.config.ts:**
```ts
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ... 기존 설정
});
```

### 2.4 cn() 유틸리티 생성

```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 3. 컴포넌트 마이그레이션 전략

### 3.1 Phase 1: 기반 설치 (영향도: 없음)

**목표**: shadcn/ui 인프라 구축, 기존 UI 영향 없음

| 작업 | 설명 |
|------|------|
| CLI 초기화 | `npx shadcn@latest init` 실행 |
| 유틸리티 설정 | `cn()` 함수, path alias 설정 |
| CSS 변수 매핑 | 기존 디자인 토큰 → shadcn 변수 브릿지 |
| 기본 컴포넌트 설치 | `Button`, `Badge`, `Separator` |

**설치할 컴포넌트:**
```bash
npx shadcn@latest add button badge separator
```

### 3.2 Phase 2: 독립 컴포넌트 교체 (영향도: 낮음)

**목표**: 다른 컴포넌트에 의존하지 않는 단순 UI 요소부터 교체

| 기존 | 교체 대상 | shadcn/ui 컴포넌트 | 비고 |
|------|----------|-------------------|------|
| `.btn-ghost` 버튼들 | 다수 | `Button` | variant 매핑 |
| SignalBadge 스타일 | SignalBadge.tsx | `Badge` | 커스텀 variant 추가 |
| 섹션 구분선 | SettingsPanel.tsx | `Separator` | 직접 교체 |
| 없음 (신규) | 전체 | `Tooltip` | UX 개선 |

**설치할 컴포넌트:**
```bash
npx shadcn@latest add tooltip
```

### 3.3 Phase 3: 폼 & 인터랙션 (영향도: 중간)

**목표**: 사용자 입력 관련 컴포넌트 교체

| 기존 | 교체 대상 | shadcn/ui 컴포넌트 |
|------|----------|-------------------|
| 커스텀 input | PeriodsInput, SymbolSearch | `Input` |
| 커스텀 toggle | SettingsPanel 토글 | `Switch` |
| 커스텀 slider | SettingsPanel 가중치 | `Slider` |
| 커스텀 select | IntervalSelector | `Select` |
| `.segment-control` | IntervalSelector, SettingsPanel | `ToggleGroup` |

**설치할 컴포넌트:**
```bash
npx shadcn@latest add input switch slider select toggle-group label
```

### 3.4 Phase 4: 복합 컴포넌트 (영향도: 높음)

**목표**: 여러 하위 컴포넌트로 구성된 복합 UI 교체

| 기존 | 교체 대상 | shadcn/ui 컴포넌트 |
|------|----------|-------------------|
| `.modal-overlay` | ShortcutsModal | `Dialog` |
| SymbolSearch 모달 | SymbolSearch | `Command` (cmdk 기반) |
| `.context-menu` | ChartContextMenu | `ContextMenu` |
| `.chart-toolbar-dropdown` | ChartToolbar | `DropdownMenu` |
| `.sidebar-shell` | CollapsibleSidebar | `Sheet` 또는 `Collapsible` |
| 커스텀 scrollbar | WatchlistSidebar | `ScrollArea` |

**설치할 컴포넌트:**
```bash
npx shadcn@latest add dialog command context-menu dropdown-menu sheet collapsible scroll-area
```

> **SymbolSearch → Command 전환**: 기존 `SymbolSearch`는 커스텀 필터링 + 모달인데, shadcn/ui의 `Command` (cmdk 기반)로 전환하면 키보드 네비게이션, 퍼지 검색, 그룹핑이 무료로 제공됩니다. Cmd+K 패턴과도 자연스럽게 통합됩니다.

### 3.5 Phase 5: 고급 UI & 레이아웃 (영향도: 높음)

**목표**: Settings 패널 탭 구조와 사이드바 레이아웃 개선

| 기존 | 교체 대상 | shadcn/ui 컴포넌트 |
|------|----------|-------------------|
| 커스텀 탭 | SettingsPanel 탭 | `Tabs` |
| 섹션 접기/펼치기 | SettingsPanel 섹션 | `Collapsible` 또는 `Accordion` |
| 사이드바 전체 | CollapsibleSidebar | `Sidebar` (shadcn sidebar) |

**설치할 컴포넌트:**
```bash
npx shadcn@latest add tabs accordion sidebar
```

---

## 4. CSS 디자인 토큰 매핑 전략

### 4.1 매핑 테이블 (기존 → shadcn)

```
기존 토큰                    →  shadcn/ui 변수
─────────────────────────────────────────────────
--bg-app                     →  --background
--bg-card                    →  --card
--bg-card-hover              →  --accent
--bg-input                   →  --input, --secondary
--bg-elevated                →  --muted
--text-primary               →  --foreground, --card-foreground
--text-secondary             →  --muted-foreground
--border-color               →  --border
--accent-primary             →  --primary, --ring
--accent-contrast            →  --primary-foreground
--danger-color               →  --destructive
--success-color              →  (커스텀: --success)
--warning-color              →  (커스텀: --warning)
--accent-glow                →  (커스텀: 유지)
--accent-soft                →  (커스텀: 유지)
```

### 4.2 기존 토큰 유지 여부

- **유지**: `--success-color`, `--warning-color`, `--accent-glow`, `--accent-soft`, `--font-size-*`, `--panel-shadow` — 트레이딩 UI 특화 토큰
- **매핑 후 점진적 제거**: `--bg-*`, `--text-*`, `--border-color` — shadcn 변수로 대체
- **즉시 제거 안 함**: 기존 커스텀 CSS 클래스들은 마이그레이션 완료 후 단계적 정리

### 4.3 다크/라이트 테마 통합

```css
/* 기존 다크 테마가 :root 기본값이므로 */
:root {
  /* shadcn 변수 = 기존 다크 토큰 */
  --background: var(--bg-app);
  --foreground: var(--text-primary);
  /* ... */
}

/* 라이트 테마 (기존 테마 전환 로직 활용) */
:root.light {
  --bg-app: #f8fafc;
  --bg-card: #ffffff;
  /* shadcn 변수도 자동으로 따라감 (cascade) */
}
```

---

## 5. 마이그레이션 세부 가이드

### 5.1 Button 마이그레이션 예시

**Before:**
```tsx
<button className="btn-ghost" onClick={onToggle}>
  <ChevronIcon />
</button>
```

**After:**
```tsx
import { Button } from "@/components/ui/button";

<Button variant="ghost" size="icon" onClick={onToggle}>
  <ChevronIcon />
</Button>
```

### 5.2 Modal → Dialog 마이그레이션 예시

**Before (ShortcutsModal):**
```tsx
<div className="modal-overlay" onClick={() => setOpen(false)}>
  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
    {/* content */}
  </div>
</div>
```

**After:**
```tsx
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>단축키</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

### 5.3 SymbolSearch → Command 마이그레이션 예시

**After:**
```tsx
import {
  CommandDialog, CommandInput, CommandList,
  CommandGroup, CommandItem, CommandEmpty
} from "@/components/ui/command";

<CommandDialog open={isOpen} onOpenChange={setIsOpen}>
  <CommandInput placeholder="심볼 검색..." />
  <CommandList>
    <CommandEmpty>결과 없음</CommandEmpty>
    <CommandGroup heading="암호화폐">
      {cryptoSymbols.map(s => (
        <CommandItem key={s.symbol} onSelect={() => handleSelect(s)}>
          {s.label}
        </CommandItem>
      ))}
    </CommandGroup>
    {/* 더 많은 그룹... */}
  </CommandList>
</CommandDialog>
```

### 5.4 ContextMenu 마이그레이션 예시

**After:**
```tsx
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent,
  ContextMenuItem, ContextMenuSeparator
} from "@/components/ui/context-menu";

<ContextMenu>
  <ContextMenuTrigger asChild>
    <div data-chart-area>{/* 차트 영역 */}</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={() => dispatch("chart:fit")}>
      차트 맞춤
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem onClick={() => dispatch("chart:screenshot")}>
      스크린샷
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

## 6. 디렉토리 구조 변경

```
src/
├── components/
│   ├── ui/                    ← 🆕 shadcn/ui 컴포넌트 (CLI가 자동 생성)
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── command.tsx
│   │   ├── context-menu.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── switch.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   ├── toggle-group.tsx
│   │   ├── tooltip.tsx
│   │   ├── separator.tsx
│   │   ├── scroll-area.tsx
│   │   ├── sheet.tsx
│   │   ├── collapsible.tsx
│   │   ├── accordion.tsx
│   │   └── sidebar.tsx
│   ├── MainChart.tsx          ← 기존 컴포넌트 (점진적 마이그레이션)
│   ├── SettingsPanel.tsx
│   ├── ...
│   └── ...
├── lib/
│   └── utils.ts               ← 🆕 cn() 유틸리티
└── ...
```

---

## 7. 위험 요소 & 대응 방안

### 7.1 Tailwind v4 호환성

| 위험 | 영향도 | 대응 |
|------|--------|------|
| shadcn CLI가 v4 설정을 제대로 인식 못할 수 있음 | 중간 | `--style new-york` 옵션 사용, 수동 설정 대비 |
| `@theme` 블록과 기존 `:root` 변수 충돌 | 낮음 | 매핑 레이어로 분리, cascade 활용 |
| `class-variance-authority`의 Tailwind v4 호환 | 낮음 | 최신 버전은 v4 지원 확인됨 |

### 7.2 기존 기능 보존

| 위험 | 영향도 | 대응 |
|------|--------|------|
| 차트 영역 이벤트 충돌 (Radix Portal) | 높음 | ContextMenu의 `modal` prop 활용, 이벤트 버블링 테스트 |
| Tauri 윈도우와 Dialog/Sheet 포지셔닝 | 중간 | `container` prop으로 렌더링 범위 제한 |
| 기존 키보드 단축키와 Command 컴포넌트 충돌 | 중간 | Command의 키 핸들러와 기존 글로벌 핸들러 우선순위 조정 |
| lightweight-charts 캔버스 위 오버레이 z-index | 중간 | shadcn 컴포넌트 z-index 레이어 정리 |

### 7.3 번들 사이즈

| 패키지 | 예상 추가 크기 (gzip) |
|--------|---------------------|
| `@radix-ui/*` (전체) | ~30-40KB |
| `cmdk` | ~5KB |
| `lucide-react` (tree-shaken) | 아이콘당 ~200B |
| `class-variance-authority` | ~2KB |
| `clsx` + `tailwind-merge` | ~4KB |
| **총 예상 추가** | **~45-55KB** |

> Tauri 데스크톱 앱이므로 번들 크기 영향은 웹 대비 미미합니다.

---

## 8. 실행 타임라인

```
Phase 1: 기반 설치          ───────  (1일)
Phase 2: 독립 컴포넌트      ─────────  (1-2일)
Phase 3: 폼 & 인터랙션      ──────────────  (2-3일)
Phase 4: 복합 컴포넌트      ──────────────────  (3-4일)
Phase 5: 고급 UI & 정리     ────────────────────  (2-3일)
                            ─────────────────────────────
                            총 예상: 9-13일
```

### Phase별 검증 체크리스트

- [ ] **Phase 1 완료**: `cn()` 함수 동작, Button 렌더링, 기존 UI 변경 없음
- [ ] **Phase 2 완료**: 모든 ghost 버튼 → `Button`, Badge 적용, Tooltip 동작
- [ ] **Phase 3 완료**: Input/Switch/Slider/Select 교체, 설정값 정상 반영
- [ ] **Phase 4 완료**: Dialog/Command/ContextMenu/DropdownMenu 교체, 단축키 정상
- [ ] **Phase 5 완료**: Tabs/Accordion/Sidebar 교체, 기존 CSS 클래스 정리

---

## 9. shadcn/ui 커스터마이징 가이드

### 9.1 트레이딩 UI 특화 variant 추가

shadcn/ui 컴포넌트를 설치한 후, 프로젝트에 맞게 커스터마이징합니다:

```tsx
// src/components/ui/badge.tsx 커스터마이징 예시
const badgeVariants = cva("...", {
  variants: {
    variant: {
      default: "...",
      // 트레이딩 시그널용 커스텀 variant
      strongBuy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      strongSell: "bg-red-500/20 text-red-400 border-red-500/30",
      weakBuy: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
      weakSell: "bg-red-500/10 text-red-300 border-red-500/20",
      neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    },
  },
});
```

### 9.2 글로벌 스타일 오버라이드

```css
/* shadcn Dialog를 프로젝트 톤에 맞게 조정 */
[data-radix-dialog-overlay] {
  backdrop-filter: blur(2px);
}

[data-radix-dialog-content] {
  box-shadow: var(--panel-shadow);
}
```

---

## 10. 결정 필요 사항

마이그레이션 시작 전 확인이 필요한 항목:

1. **스타일 프리셋**: `default` vs `new-york` — 트레이딩 앱에는 `new-york`이 더 compact하고 적합
2. **아이콘 전환**: 기존 인라인 SVG → `lucide-react`로 통일할지 여부
3. **SymbolSearch 전환 범위**: 단순 Dialog 래핑 vs Command(cmdk) 완전 전환
4. **사이드바 전략**: `Sheet`(오버레이) vs `Sidebar`(영구 레이아웃) vs `Collapsible`(현재 동작 유지)
5. **Phase 실행 순서**: 순차 진행 vs 특정 Phase 우선 진행

---

## 부록: 관련 명령어 Quick Reference

```bash
# 초기 설정
npx shadcn@latest init

# 컴포넌트 추가 (개별)
npx shadcn@latest add button dialog command

# 컴포넌트 목록 확인
npx shadcn@latest diff

# 설치된 컴포넌트 업데이트
npx shadcn@latest add button --overwrite
```
