# Phase 6 Quality Checklist

## Automated Gate
- Run `npm run check`
- Expect:
  - Frontend build success (`tsc`, `vite build`)
  - Rust backend check success (`cargo check`)

## Manual QA (Visual + UX)
- Theme parity:
  - Dark and Light mode both readable (text/border/chart grid contrast)
  - No washed-out controls in light mode
- Responsive breakpoints:
  - `1280px+`: left watchlist + center chart + right settings visible
  - `1024px`: left visible, right settings via drawer
  - `768px`: both side panels via drawer, chart always visible
- Chart stability:
  - Resize window continuously for 10s
  - Chart remains visible and responsive
  - No heavy jitter/flicker during resize
- Interaction:
  - `Esc`: closes drawers
  - `Ctrl/Cmd+B`: watchlist toggle
  - `Ctrl/Cmd+,`: settings toggle
  - `Ctrl/Cmd+K`: symbol search open
- Indicator controls:
  - Section collapse state persists after reload
  - Layout presets (`Balanced`, `Oscillator Focus`, `Volume Focus`) apply correctly
  - Sliders/toggles keyboard focus visible

## Performance Spot Checks
- Switch symbol 5 times:
  - No frozen UI
  - Chart updates without losing visibility
- Toggle 4+ indicators on/off repeatedly:
  - No console error
  - Frame pacing remains smooth

## Release Notes Template
- UI:
  - 3-panel workspace and responsive drawers
  - Market header + signal-focused status bar
- Accessibility:
  - ARIA on collapsible settings sections
  - Keyboard shortcuts for major actions
- Reliability:
  - Chart container sizing fix
  - Resize observer throttling and fit-content scope guard
