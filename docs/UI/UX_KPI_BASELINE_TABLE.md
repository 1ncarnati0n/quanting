# UX KPI Baseline Table

기준일: 2026-03-02  
대상 빌드: 현재 `main` 동작 기준  
측정 방식: [UX_AUDIT_BASELINE.md](./UX_AUDIT_BASELINE.md) 기준 시나리오 수동 계측

## 측정 규칙
- 동일 환경에서 사전/사후 비교한다.
- 각 시나리오 최소 3회 반복 후 평균값을 기록한다.
- `Time`은 시작 동작부터 정상 완료까지의 초 단위 시간이다.
- `Recoverability`는 오류/실수 후 정상 경로 복귀 가능 여부를 기록한다.

## Baseline
| Scenario | Time (sec) | Clicks/Keys | Error Rate | Recoverability | Keyboard-only | Status |
|---|---:|---:|---:|---|---|---|
| 1. 심볼 검색 후 차트 로드 | TBD | TBD | TBD | TBD | TBD | Planned |
| 2. 인터벌 전환 후 맥락 유지 | TBD | TBD | TBD | TBD | TBD | Planned |
| 3. 줌/팬 후 실시간 수신 안정성 | TBD | TBD | TBD | TBD | TBD | Planned |
| 4. 지표 on/off + 파라미터 조정 | TBD | TBD | TBD | TBD | TBD | Planned |
| 5. 관심종목 전환 + 즐겨찾기 | TBD | TBD | TBD | TBD | TBD | Planned |
| 6. 스크리너 설정 + 스캔 실행 | TBD | TBD | TBD | TBD | TBD | Planned |
| 7. 리플레이 진입/재생/종료 | TBD | TBD | TBD | TBD | TBD | Planned |
| 8. 가격 알림 등록/해제 | TBD | TBD | TBD | TBD | TBD | Planned |
| 9. 비교 심볼 추가/정규화 | TBD | TBD | TBD | TBD | TBD | Planned |
| 10. 오류 후 재시도 복구 | TBD | TBD | TBD | TBD | TBD | Planned |

## 비고
- 본 표는 Week 1 완료 조건의 기준선 테이블 링크용 원본 문서다.
- 실측값은 Week 2~3 동안 순차 입력하며, 입력 시 `Status`를 `Measured`로 변경한다.
