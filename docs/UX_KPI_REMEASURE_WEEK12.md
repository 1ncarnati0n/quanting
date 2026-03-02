# UX KPI Remeasure Week 12

## 실행 정보
- 실행 시각: 2026-03-02T10:01:22.430Z
- 실행 명령: `npm run ux:verify`, `npm run perf:sim`, `npm run perf:list-sim`

## KPI 결과 요약
- PASS: 2
- FAIL: 0
- Blocked: 3

| KPI | Target | Actual | Status | Source |
| --- | --- | --- | --- | --- |
| 핵심 작업 완료 시간 30% 단축 | 30%+ | 66.9% (watchlist 초기 렌더 최소 개선) | PASS | `npm run perf:list-sim` |
| 설정 변경 후 되돌림/재시도율 40% 감소 | 40%+ | 실사용 오류/재시도 텔레메트리 부재로 자동 산출 불가 | Blocked | 런타임 UX 이벤트(추가 계측 필요) |
| 단축키/고급 조작 사용률 25% 이상 | 25%+ | 측정 파일 없음 (artifacts/ux-metrics/*.json) | Blocked | 로컬 UX Metrics Export JSON |
| 접근성 자동 점검 기준 통과 | PASS | PASS (ux:verify 통과) | PASS | `npm run ux:verify` |
| UI 회귀 버그 비율 분기별 감소 | 감소 추세 | 분기 이슈 트래킹 데이터 미연동 | Blocked | Issue Tracker 연동 필요 |

## 성능 측정 상세
- Realtime state write 감소(raf+no-op): 73.9%
- Realtime reducer call 감소(raf+no-op): 31.1%
- Realtime runtime 개선(raf+no-op vs baseline): 28.6%
- Watchlist 초기 렌더 최소 개선: 66.9%
- Watchlist lazy chunk 최대 시간: 0.074ms

## 판단
- 성능/접근성 자동 지표는 목표 기준을 충족했다.
- 단축키 사용률, 복구율, 회귀 버그율은 운영 텔레메트리 연동 전까지 Blocked 상태로 유지한다.

## 다음 액션
1. `artifacts/ux-metrics` 경로에 실제 사용 세션의 metrics export JSON을 수집해 단축키 사용률 KPI를 실측한다.
2. 오류 복구 시도 횟수(재시도/되돌리기) 이벤트를 계측해 복구율 KPI를 자동 산출한다.
3. 릴리즈 후 1분기 이슈 라벨 통계를 연결해 회귀 버그 비율 KPI를 계산한다.
