# Performance UX Week 10 Report

## 목적
- 대량 관심종목 리스트에서 초기 렌더/스크롤 부담을 줄인다.
- 로딩 단계를 분리해 사용자에게 현재 상태를 명확히 전달한다.
- 스냅샷 로딩 중 레이아웃 점프를 줄여 시각적 안정성을 높인다.

## 변경 요약
1. 리스트 점진 렌더링 도입
- 파일: `src/components/WatchlistSidebar.tsx`
- `WATCHLIST_INITIAL_RENDER_COUNT=48`, `WATCHLIST_RENDER_STEP=32`
- `IntersectionObserver` 기반으로 하단 sentinel 진입 시 추가 렌더
- `useDeferredValue`를 사용해 필터링/입력 중 렌더 부담 완화

2. 로딩 단계 분리
- 파일: `src/components/WatchlistSidebar.tsx`
- 스냅샷 로딩 상태를 `idle | initial | refresh`로 분리
- 헤더 문구를 단계별로 표시:
  - 초기 로딩: `스냅샷 초기 로딩중`
  - 갱신 중: `스냅샷 갱신중`
  - 완료: 마지막 업데이트 시각 표시

3. 시각 안정성 강화
- 파일: `src/components/WatchlistSidebar.tsx`
- 가격/변동률 영역 폭(`w-[88px]`)과 행 높이를 고정
- 스냅샷 미도착 시에도 placeholder 텍스트/라인 높이를 유지
- Sparkline placeholder 높이를 고정해 카드 높이 변동 최소화

4. 리스트 성능 시뮬레이터 추가
- 파일: `scripts/perf-watchlist-sim.mjs`
- 실행: `npm run perf:list-sim`
- 비교 항목:
  - baseline: 초기 렌더 시 전체 visible items 렌더
  - progressive: 초기 48개 + 스크롤 구간 배치 렌더

## 측정 환경
- 측정일: 2026-03-02
- 명령: `npm run perf:list-sim`
- 설정:
  - initial=48
  - step=32
  - runs=24

## Before/After 측정표
| visible items | baseline initial (ms) | progressive initial (ms) | reduction | lazy chunks | max chunk (ms) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 120 | 0.304 | 0.106 | 65.0% | 3 | 0.073 |
| 240 | 0.498 | 0.104 | 79.1% | 6 | 0.075 |
| 400 | 0.898 | 0.100 | 88.8% | 11 | 0.075 |

## 체감 영향
- 대량 리스트에서 초기 진입 시 표시 지연과 스크롤 시작 지연을 완화
- 스냅샷 로딩 문구가 단계별로 분리되어 상태 인지성이 향상
- 스냅샷 갱신 중 가격 영역/스파크라인 높이 변화가 줄어 화면 점프 감소

## 리스크/후속
- 현재 점진 렌더링은 카드 높이 기반 정밀 가상화가 아니라 단계 렌더 방식
- 1,000+ 아이템 시나리오에서는 windowed virtualization 도입 검토 필요
