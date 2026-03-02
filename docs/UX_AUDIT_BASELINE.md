# UX Audit Baseline (Week 1)

## 목적
- 현 시점 UX 기준선(Baseline)을 명확히 기록하여, 12주 로드맵 개선 효과를 정량/정성으로 비교한다.
- 기준일: 2026-03-02

## 핵심 사용자 시나리오 (Top 10)
1. 심볼 검색 후 차트 로드 완료
2. 인터벌 전환 후 기존 분석 맥락 유지
3. 차트 줌/팬 후 실시간 데이터 수신 시 뷰 안정성 확인
4. 설정 패널에서 지표 on/off 및 파라미터 조정
5. 관심종목에서 종목 전환 + 즐겨찾기 토글
6. 스크리너 조건 설정 후 스캔 실행
7. 리플레이 진입/재생/속도조절/종료
8. 가격 알림 추가/활성/해제
9. 비교 심볼 추가(정규화 포함) 후 해석
10. 오류 발생 시 복구 경로(재시도)로 정상 복귀

## 기준선 측정 항목
- 작업 완료 시간 (Task Completion Time)
- 클릭 수 / 키 입력 수
- 오류 발생률 (Validation/Runtime/Recovery Failure)
- 되돌림/재시도율
- 키보드-only 완료 가능 여부
- 로딩/오류/빈 상태 인지 가능성(명확성)

## 측정 포맷
| Scenario | Baseline Time (sec) | Baseline Clicks | Error Rate | Keyboard-only | Notes |
|---|---:|---:|---:|---|---|
| 1 | TBD | TBD | TBD | TBD | |
| 2 | TBD | TBD | TBD | TBD | |
| 3 | TBD | TBD | TBD | TBD | |
| 4 | TBD | TBD | TBD | TBD | |
| 5 | TBD | TBD | TBD | TBD | |
| 6 | TBD | TBD | TBD | TBD | |
| 7 | TBD | TBD | TBD | TBD | |
| 8 | TBD | TBD | TBD | TBD | |
| 9 | TBD | TBD | TBD | TBD | |
| 10 | TBD | TBD | TBD | TBD | |

## 발견 이슈 분류
- P0: 업무 중단/데이터 신뢰성 저하
- P1: 핵심 흐름 지연/실수 유발
- P2: 가독성/일관성/세부 상호작용 개선

## 현재 우선 개선 대상 (초기)
1. 상태 UI 통일 (로딩/오류/빈 상태)
2. 포커스/키보드 조작 접근성 강화
3. 패널 레이아웃 일관성 확보
4. 복구 경로(재시도/리셋) 명확화

## 증빙 링크
- 관련 로드맵: [ENTERPRISE_UI_UX_ROADMAP.md](./ENTERPRISE_UI_UX_ROADMAP.md)
- 실행 트래커: [ENTERPRISE_UI_UX_EXECUTION_TRACKER.md](./ENTERPRISE_UI_UX_EXECUTION_TRACKER.md)
