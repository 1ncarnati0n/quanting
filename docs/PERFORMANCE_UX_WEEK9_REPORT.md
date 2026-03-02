# Performance UX Week 9 Report

## 목적
- 실시간 가격 수신 경로의 불필요 업데이트를 줄여 차트/패널 재렌더 부담을 완화한다.
- before/after 측정표를 남겨 성능 UX 개선 근거를 문서화한다.

## 변경 요약
1. no-op 실시간 캔들 업데이트 차단
- 파일: `src/stores/useChartStore.ts`
- 내용: 마지막 캔들과 완전히 동일한 payload(time/open/high/low/close/volume) 수신 시 상태 갱신을 건너뜀

2. WebSocket 업데이트 RAF 배치 적용
- 파일: `src/App.tsx`
- 내용: 실시간 메시지를 즉시 store에 반영하지 않고 `requestAnimationFrame`으로 프레임 단위 flush
- 효과: 초고빈도 구간에서 store 업데이트 호출 밀도를 프레임 속도 기준으로 제한

3. 성능 시뮬레이터 추가
- 파일: `scripts/perf-realtime-sim.mjs`
- 실행: `npm run perf:sim`
- 목적: baseline / no-op guard / raf+no-op 경로 비교

## 측정 환경
- 측정일: 2026-03-02
- 명령: `npm run perf:sim`
- 시나리오:
  - 300초 구간
  - 90 msg/sec 입력
  - 중복 payload 비율 72%
  - 총 메시지 27,000개

## Before/After 측정표
| scenario | reducer calls | state writes | avg runtime (ms) |
| --- | ---: | ---: | ---: |
| baseline | 27000 | 27000 | 0.330 |
| no-op guard | 27000 | 7737 | 0.241 |
| raf + no-op | 18600 | 7050 | 0.213 |

## 개선 수치 요약
- no-op guard 적용 시 state write 71.3% 감소
- raf+no-op 적용 시 state write 73.9% 감소
- raf+no-op 적용 시 reducer call 31.1% 감소

## 체감 영향(고빈도 구간)
- 같은 캔들 값이 반복 수신되는 구간에서 불필요한 상태 갱신이 크게 감소
- 초고빈도 업데이트 시 프레임 단위 반영으로 차트/패널 동시 렌더 경쟁을 완화

## 리스크/후속
- 시뮬레이터는 합성 데이터 기반이므로 실제 거래소 스트림 특성과 차이가 있을 수 있음
- 다음 단계에서 실제 런타임 측정(DevTools Performance trace) 결과를 추가 수집 권장
