# UX QA Gate Operation Guide

## 목적
- Week 12 릴리즈 게이트를 자동화해 UI/UX 회귀를 배포 전에 차단한다.
- 접근성, 기본 품질, 성능 기준을 단일 명령으로 검증한다.

## 실행 명령
1. `npm run ux:qa-gate`
2. 필요 시 KPI 재측정: `npm run ux:kpi`

## 게이트 구성
- `ux:verify`: 문서 게이트 + 접근성 정적 점검 + 빌드 통과
- `perf:sim`: 실시간 업데이트 경로의 쓰기/호출 감소율 확인
- `perf:list-sim`: 관심종목 리스트 초기 렌더/청크 성능 확인

## 기본 임계치 (v1)
- Realtime writes reduction >= 60%
- Realtime reducer-call reduction >= 20%
- Watchlist initial reduction(min) >= 50%
- Watchlist max lazy chunk <= 1.0ms

## 산출물
- 실행 리포트: [UX_QA_GATE_WEEK12_REPORT.md](./UX_QA_GATE_WEEK12_REPORT.md)
- 실행 데이터: `docs/UX_QA_GATE_WEEK12_REPORT.json`
- KPI 리포트: [UX_KPI_REMEASURE_WEEK12.md](./UX_KPI_REMEASURE_WEEK12.md)
- KPI 데이터: `docs/UX_KPI_REMEASURE_WEEK12.json`

## 운영 규칙
- UI/UX 관련 PR 머지 전 `ux:qa-gate` PASS를 기본 조건으로 둔다.
- FAIL 시 리포트의 실패 항목부터 수정하고 동일 명령으로 재검증한다.
- 임계치 변경 시 본 문서와 스크립트(`scripts/ux-qa-gate.mjs`)를 함께 업데이트한다.
