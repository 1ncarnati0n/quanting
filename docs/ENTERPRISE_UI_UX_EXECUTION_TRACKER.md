# Quanting Enterprise UI/UX Execution Tracker

이 문서는 [ENTERPRISE_UI_UX_ROADMAP.md](./ENTERPRISE_UI_UX_ROADMAP.md)를 실제로 실행하기 위한 작업 관리 문서다.

## 사용 방법
- 각 주차 시작 시 `목표/작업/완료기준`을 확정한다.
- 진행 중에는 체크박스와 증빙 링크(PR, 스크린샷, 측정 리포트)를 업데이트한다.
- 주차 종료 시 `리뷰/회고/다음 주 리스크`를 반드시 작성한다.

## 전체 진행 현황
- 시작일: 2026-03-02
- 목표 종료일: 2026-05-24
- 현재 상태: `In Progress`
- 전체 진행률: `98%`

## 주차별 실행 보드

## Week 1 (2026-03-02 ~ 2026-03-08)
### 목표
- UX 진단과 KPI 기준선 확정
### 작업
- [x] 핵심 사용자 시나리오 10개 정의
- [x] 현재 UX pain point 목록화
- [x] KPI 측정 방식 확정
### 완료 기준
- [x] UX Audit 문서 링크 첨부
- [x] KPI Baseline 표 링크 첨부
### 증빙
- PR: 현재 작업 브랜치 변경 내역 참조
- 리포트: [UX_AUDIT_BASELINE.md](./UX_AUDIT_BASELINE.md)
- KPI 표: [UX_KPI_BASELINE_TABLE.md](./UX_KPI_BASELINE_TABLE.md)
- 스크린샷:
### 리뷰/회고
- 요약: 기준선 측정 프레임과 핵심 시나리오 정의 완료. 실제 측정값 수집은 진행 중.
- 다음 주 리스크: 측정 자동화가 없어서 수동 계측 시간 증가 가능.

## Week 2 (2026-03-09 ~ 2026-03-15)
### 목표
- 우선순위와 실행계획 확정
### 작업
- [x] ICE/RICE 기반 백로그 정렬
- [x] 실험 설계(가설/성공지표/측정방법) 작성
- [x] 1차 적용 컴포넌트 선정
### 완료 기준
- [x] 우선순위 백로그 링크 첨부
- [x] 실험 계획 문서 링크 첨부
### 증빙
- PR: SettingsPanel 빠른 설정 허브 및 접근성 보강
- 리포트: [UX_PRIORITY_BACKLOG.md](./UX_PRIORITY_BACKLOG.md), [UX_EXPERIMENT_PLAN.md](./UX_EXPERIMENT_PLAN.md)
- 스크린샷:
### 리뷰/회고
- 요약: 우선순위 기반 실행계획 수립 완료. 실험 가능한 KPI 항목과 측정 포맷 확정.
- 다음 주 리스크: 사용성 실측 데이터 축적 전까지는 효과 판단이 추정치 중심이 될 수 있음.

## Week 3 (2026-03-16 ~ 2026-03-22)
### 목표
- 디자인 시스템 v1 1차 구축
### 작업
- [ ] 토큰 1차 정리 (색/간격/타입)
- [x] 상태 규격 정리 (hover/focus/disabled/loading/error)
- [x] 공통 컴포넌트 반영 시작
### 완료 기준
- [ ] 토큰 명세 반영
- [x] 최소 3개 핵심 컴포넌트 통일
### 증빙
- PR: `StatePanel` 도입 및 Chart/Watchlist 적용
- 리포트: [UX_PR_CHECKLIST.md](./UX_PR_CHECKLIST.md)
- 스크린샷:
### 리뷰/회고
- 요약: 상태 UI 통일 컴포넌트를 도입해 중복 구현을 제거하고 일관성을 높임.
- 다음 주 리스크: 토큰 레벨 정비가 완료되지 않아 일부 색상/간격 편차가 잔존.

## Week 4 (2026-03-23 ~ 2026-03-29)
### 목표
- 디자인 시스템 v1 2차 적용
### 작업
- [x] Settings/Watchlist/Toolbar 패턴 통일
- [x] Empty/Error/Loading 상태 통일
- [x] 불일치 UI 제거
### 완료 기준
- [x] 대표 화면 3개 이상 통일 완료
- [x] 상태 템플릿 공통화 완료
### 증빙
- PR: Settings/Watchlist/SymbolSearch/Toolbar 라벨·상태·액션 패턴 정리
- 리포트: [UX_PR_CHECKLIST.md](./UX_PR_CHECKLIST.md), [UX_GLOSSARY.md](./UX_GLOSSARY.md)
- 스크린샷:
### 리뷰/회고
- 요약: 패널/툴바/검색 모달까지 문구와 동작 패턴을 맞춰 화면 간 전환 시 학습 비용을 낮춤.
- 다음 주 리스크: 전략 패널 고급 옵션의 라벨은 용어집 기준으로 추가 교정이 필요.

## Week 5 (2026-03-30 ~ 2026-04-05)
### 목표
- 정보구조(IA) 개선 1차
### 작업
- [x] Settings 구조 단순화
- [x] Watchlist 탐색 플로우 단축
- [x] 핵심 작업 클릭 수 측정(로컬 계측/내보내기 도입)
### 완료 기준
- [ ] 클릭 수 개선 수치 제출
- [x] IA 개편 PR 완료
### 증빙
- PR: Settings 기본/고급 모드 도입, Watchlist 빠른 필터 액션 + UX 계측 내보내기/초기화
- 리포트: [UX_PRIORITY_BACKLOG.md](./UX_PRIORITY_BACKLOG.md), [UX_CLICKFLOW_MEASUREMENT.md](./UX_CLICKFLOW_MEASUREMENT.md)
- 스크린샷:
### 리뷰/회고
- 요약: 설정 패널을 기본/고급 모드로 분리해 인지부하를 낮추고, Watchlist에서 필터 초기화/현재시장 집중/즐겨찾기 전환 액션을 추가해 탐색 단계를 단축.
- 다음 주 리스크: 클릭 수 개선 효과를 정량화하려면 시나리오별 계측(수동/자동)이 추가로 필요.

## Week 6 (2026-04-06 ~ 2026-04-12)
### 목표
- 정보구조(IA) 개선 2차
### 작업
- [x] 고급 설정 분리(점진적 공개)
- [x] UX 문구/라벨 정리
- [x] 혼동 요소 제거
### 완료 기준
- [x] 라벨/용어집 문서 업데이트
- [x] 정보구조 최종안 반영
### 증빙
- PR: 용어 통일(설정/관심종목 라벨), Watchlist 중복 필터 제거
- 리포트: [UX_EXPERIMENT_PLAN.md](./UX_EXPERIMENT_PLAN.md), [UX_GLOSSARY.md](./UX_GLOSSARY.md)
- 스크린샷:
### 리뷰/회고
- 요약: 용어집을 기준으로 핵심 라벨을 통일하고, 관심종목의 중복 즐겨찾기 필터를 제거해 혼동 가능성을 낮춤.
- 다음 주 리스크: 아직 SymbolSearch/툴바 일부 라벨은 동일 기준으로 추가 정리가 필요.

## Week 7 (2026-04-13 ~ 2026-04-19)
### 목표
- 파워유저 UX 1차
### 작업
- [x] 단축키 체계 정리
- [x] 충돌/중복 단축키 제거
- [x] 빠른 작업 흐름 개선
### 완료 기준
- [x] 단축키 매트릭스 문서 반영
- [x] 핵심 플로우 단축키로 완료 가능
### 증빙
- PR: 전역 단축키 핸들러 충돌 방지 리팩터링 + ShortcutsModal 단일 소스 매트릭스 연동
- 리포트: [SHORTCUTS_MATRIX.md](./SHORTCUTS_MATRIX.md), [UX_KEYBOARD_ONLY_CHECKLIST.md](./UX_KEYBOARD_ONLY_CHECKLIST.md)
- 스크린샷:
### 리뷰/회고
- 요약: 입력 포커스/모달 컨텍스트 가드를 도입해 전역 단축키 오작동을 줄였고, 단축키 도움말/문서/핸들러 기준을 하나로 통합.
- 다음 주 리스크: 명령형 액션 허브(Week 8)가 아직 없어 고급 워크플로우는 단축키만으로 연결 범위가 제한적.

## Week 8 (2026-04-20 ~ 2026-04-26)
### 목표
- 파워유저 UX 2차
### 작업
- [x] 명령형 액션 UX 도입
- [x] 워크스페이스 저장/복원 개선
- [x] 안전장치(Undo/Reset) 정리
### 완료 기준
- [x] 주요 액션의 실행/복구 경로 제공
- [x] 사용성 피드백 반영
### 증빙
- PR: `CommandCenter` 도입, `Ctrl/Cmd+J` 전역 단축키 연결, 워크스페이스 저장/복원 및 안전 초기화 액션 구현
- 리포트: [COMMAND_HUB_WORKSPACES.md](./COMMAND_HUB_WORKSPACES.md), [SHORTCUTS_MATRIX.md](./SHORTCUTS_MATRIX.md)
- 스크린샷:
### 리뷰/회고
- 요약: 명령 허브 기반 액션 실행/검색 흐름을 도입해 파워유저 작업 진입 단계를 축소하고, 워크스페이스 복원과 안전 초기화로 복구 경로를 명시적으로 제공.
- 다음 주 리스크: 워크스페이스가 로컬 저장소 기반이라 다중 기기 동기화는 추가 설계가 필요.

## Week 9 (2026-04-27 ~ 2026-05-03)
### 목표
- 성능 UX 1차
### 작업
- [x] 차트/패널 병목 측정
- [x] 불필요 렌더 제거
- [x] 체감 지연 구간 개선
### 완료 기준
- [x] before/after 측정표 제출
- [x] 고빈도 화면 체감 개선 확인
### 증빙
- PR: 실시간 캔들 no-op 차단 + RAF 배치 적용으로 업데이트 경로 최적화
- 리포트: [PERFORMANCE_UX_WEEK9_REPORT.md](./PERFORMANCE_UX_WEEK9_REPORT.md)
- 스크린샷:
### 리뷰/회고
- 요약: 실시간 경로에서 동일 payload 업데이트를 제거하고 프레임 단위 반영으로 고빈도 구간의 상태 갱신 밀도를 완화.
- 다음 주 리스크: 실제 사용자 환경에서의 long-session 메모리/스크롤 성능은 Week 10에서 추가 검증 필요.

## Week 10 (2026-05-04 ~ 2026-05-10)
### 목표
- 성능 UX 2차
### 작업
- [x] 스크롤/리스트 성능 개선
- [x] 로딩 단계 분리
- [x] 시각적 안정성 강화
### 완료 기준
- [x] 로딩 UX 회귀 체크 완료
- [x] 성능 이슈 재발 방지 규칙 정리
### 증빙
- PR: Watchlist 점진 렌더링 + 스냅샷 로딩 단계 분리 + 카드 레이아웃 안정화
- 리포트: [PERFORMANCE_UX_WEEK10_REPORT.md](./PERFORMANCE_UX_WEEK10_REPORT.md)
- 스크린샷:
### 리뷰/회고
- 요약: 대량 리스트 초기 렌더를 제한하고 스크롤 시 단계적으로 확장해 체감 성능을 개선했으며, 로딩 상태를 초기/갱신으로 분리해 상태 전달력을 높임.
- 다음 주 리스크: 접근성 Week 11의 핵심 시나리오 수동 점검 로그를 실제 런타임 환경(브라우저/OS 조합)으로 보강해야 함.

## Week 11 (2026-05-11 ~ 2026-05-17)
### 목표
- 접근성 및 품질 게이트
### 작업
- [x] 키보드-only 흐름 검증
- [x] 포커스/대비/ARIA 보완
- [x] 접근성 자동 점검 실행
### 완료 기준
- [x] 접근성 리포트 제출
- [x] 핵심 시나리오 접근성 통과
### 증빙
- PR: `a11y:scenario` 핵심 시나리오 계약 점검 도입 + Watchlist 방향키 탐색(↑/↓/Home/End) 보강
- 리포트: [UX_KEYBOARD_ONLY_CHECKLIST.md](./UX_KEYBOARD_ONLY_CHECKLIST.md), [ACCESSIBILITY_AUTOMATION.md](./ACCESSIBILITY_AUTOMATION.md), [ACCESSIBILITY_SCENARIO_AUDIT.md](./ACCESSIBILITY_SCENARIO_AUDIT.md), [ACCESSIBILITY_REPORT.md](./ACCESSIBILITY_REPORT.md)
- 스크린샷:
### 리뷰/회고
- 요약: 키보드-only 체크리스트에 워치리스트 방향키 탐색을 포함하고, 핵심 접근성 시나리오를 계약 기반 자동 점검으로 상시 검증하도록 강화.
- 다음 주 리스크: 브라우저/OS 및 스크린리더 조합별 실제 읽기 순서 차이는 Week 12 릴리즈 게이트에서 표본 수동 점검으로 보완 필요.

## Week 12 (2026-05-18 ~ 2026-05-24)
### 목표
- 릴리즈 게이트 운영 및 최종 평가
### 작업
- [x] KPI 재측정
- [x] UX QA 게이트 운영
- [x] 차기 분기 로드맵 초안 작성
### 완료 기준
- [x] KPI 달성 여부 결과 문서화
- [x] 최종 회고 및 다음 분기 계획 공유
### 증빙
- PR: `ux:qa-gate`/`ux:kpi` 자동화 스크립트 도입 + Week 12 운영 문서화
- 리포트: [UX_QA_GATE_OPERATION.md](./UX_QA_GATE_OPERATION.md), [UX_QA_GATE_WEEK12_REPORT.md](./UX_QA_GATE_WEEK12_REPORT.md), [UX_KPI_REMEASURE_WEEK12.md](./UX_KPI_REMEASURE_WEEK12.md), [NEXT_QUARTER_UX_ROADMAP_DRAFT.md](./NEXT_QUARTER_UX_ROADMAP_DRAFT.md)
- 스크린샷:
### 리뷰/회고
- 요약: 릴리즈 게이트를 자동화 명령으로 통합하고 KPI 재측정 리포트를 생성해 주차 산출물을 코드와 문서로 고정했다.
- 다음 주 리스크: 단축키 사용률/복구율/회귀 버그율은 운영 텔레메트리와 이슈 트래커 연동 전까지 Blocked 상태로 남는다.

## 공통 작업 템플릿 (반복 사용)
### Task
- 제목:
- 스트림: `WS1` | `WS2` | `WS3` | `WS4` | `WS5`
- 우선순위: `P0` | `P1` | `P2`
- 담당:
- 예정일:

### Definition of Done
- [ ] 기능 요구 충족
- [ ] UX 체크리스트 통과
- [ ] 빌드/타입 검사 통과
- [ ] 회귀 영향 점검
- [ ] 증빙 링크 첨부

## 핵심 파일 맵 (작업 시 참고)
- `src/components/MainChart.tsx`
- `src/components/ChartContainer.tsx`
- `src/components/SettingsPanel.tsx`
- `src/components/WatchlistSidebar.tsx`
- `src/components/patterns/PanelHeader.tsx`
- `src/index.css`
