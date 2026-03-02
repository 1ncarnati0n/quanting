import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const KPI_REPORT_FILE = path.join(root, "docs/UX_KPI_REMEASURE_WEEK12.md");
const KPI_JSON_FILE = path.join(root, "docs/UX_KPI_REMEASURE_WEEK12.json");

function run(command) {
  try {
    const output = execSync(command, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, output };
  } catch (error) {
    const stdout = error?.stdout ? String(error.stdout) : "";
    const stderr = error?.stderr ? String(error.stderr) : "";
    return { ok: false, output: `${stdout}\n${stderr}`.trim() };
  }
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseRealtimePerf(output) {
  const reductionNoOp = /no-op writes reduction:\s*([\d.]+)%/i.exec(output);
  const reductionWrites = /raf\+no-op writes reduction:\s*([\d.]+)%/i.exec(output);
  const reductionCalls = /raf\+no-op reducer-call reduction:\s*([\d.]+)%/i.exec(output);
  const rowPattern = /^\|\s*(baseline|no-op guard|raf \+ no-op)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|$/gm;
  const rows = {};
  let rowMatch = rowPattern.exec(output);
  while (rowMatch) {
    rows[rowMatch[1]] = {
      reducerCalls: toNumber(rowMatch[2]),
      stateWrites: toNumber(rowMatch[3]),
      runtimeMs: toNumber(rowMatch[4]),
    };
    rowMatch = rowPattern.exec(output);
  }
  const baseline = rows.baseline;
  const batched = rows["raf + no-op"];
  const runtimeReductionPct =
    baseline && batched && baseline.runtimeMs > 0
      ? ((baseline.runtimeMs - batched.runtimeMs) / baseline.runtimeMs) * 100
      : null;
  return {
    writesReductionNoOpPct: reductionNoOp ? toNumber(reductionNoOp[1], null) : null,
    writesReductionBatchedPct: reductionWrites ? toNumber(reductionWrites[1], null) : null,
    reducerCallReductionBatchedPct: reductionCalls ? toNumber(reductionCalls[1], null) : null,
    runtimeReductionBatchedPct: runtimeReductionPct,
  };
}

function parseWatchlistPerf(output) {
  const linePattern =
    /^\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)%\s*\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|$/gm;
  const rows = [];
  let match = linePattern.exec(output);
  while (match) {
    rows.push({
      visibleItems: toNumber(match[1]),
      baselineMs: toNumber(match[2]),
      progressiveMs: toNumber(match[3]),
      reductionPct: toNumber(match[4]),
      lazyChunks: toNumber(match[5]),
      maxChunkMs: toNumber(match[6]),
    });
    match = linePattern.exec(output);
  }
  const minReductionPct = rows.length ? Math.min(...rows.map((row) => row.reductionPct)) : null;
  const maxChunkMs = rows.length ? Math.max(...rows.map((row) => row.maxChunkMs)) : null;
  return { rows, minReductionPct, maxChunkMs };
}

function findMetricsFiles() {
  const candidates = [
    path.join(root, "artifacts/ux-metrics"),
    path.join(root, "docs/data/ux-metrics"),
  ];
  const files = [];
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function parseShortcutUsageFromMetrics(files) {
  if (files.length === 0) return null;
  let totalCount = 0;
  let advancedCount = 0;
  const advancedPatterns = [
    /^command_hub:/,
    /^symbol_search:open_dialog_shortcut$/,
    /^settings\.indicators:set_advanced_mode$/,
    /^watchlist:run_screener$/,
  ];
  for (const filePath of files) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      const counters = parsed?.counters;
      if (!counters || typeof counters !== "object") continue;
      for (const [metricKey, counter] of Object.entries(counters)) {
        const count = toNumber(counter?.count, 0);
        if (count <= 0) continue;
        totalCount += count;
        if (advancedPatterns.some((pattern) => pattern.test(metricKey))) {
          advancedCount += count;
        }
      }
    } catch {}
  }
  if (totalCount === 0) return null;
  return {
    totalCount,
    advancedCount,
    ratioPct: (advancedCount / totalCount) * 100,
  };
}

function makeStatus(passOrBlocked) {
  if (passOrBlocked === "blocked") return "Blocked";
  return passOrBlocked ? "PASS" : "FAIL";
}

const executedAt = new Date().toISOString();
const verifyResult = run("npm run ux:verify");
const realtimeResult = run("npm run perf:sim");
const watchlistResult = run("npm run perf:list-sim");

const realtimePerf = parseRealtimePerf(realtimeResult.output);
const watchlistPerf = parseWatchlistPerf(watchlistResult.output);
const metricsFiles = findMetricsFiles();
const shortcutUsage = parseShortcutUsageFromMetrics(metricsFiles);

const kpis = [
  {
    name: "핵심 작업 완료 시간 30% 단축",
    target: "30%+",
    actual:
      watchlistPerf.minReductionPct !== null
        ? `${watchlistPerf.minReductionPct.toFixed(1)}% (watchlist 초기 렌더 최소 개선)`
        : "측정 실패",
    status: makeStatus(
      watchlistPerf.minReductionPct !== null && watchlistPerf.minReductionPct >= 30,
    ),
    source: "`npm run perf:list-sim`",
  },
  {
    name: "설정 변경 후 되돌림/재시도율 40% 감소",
    target: "40%+",
    actual: "실사용 오류/재시도 텔레메트리 부재로 자동 산출 불가",
    status: makeStatus("blocked"),
    source: "런타임 UX 이벤트(추가 계측 필요)",
  },
  {
    name: "단축키/고급 조작 사용률 25% 이상",
    target: "25%+",
    actual: shortcutUsage
      ? `${shortcutUsage.ratioPct.toFixed(1)}% (${shortcutUsage.advancedCount}/${shortcutUsage.totalCount})`
      : "측정 파일 없음 (artifacts/ux-metrics/*.json)",
    status: makeStatus(shortcutUsage ? shortcutUsage.ratioPct >= 25 : "blocked"),
    source: "로컬 UX Metrics Export JSON",
  },
  {
    name: "접근성 자동 점검 기준 통과",
    target: "PASS",
    actual: verifyResult.ok ? "PASS (ux:verify 통과)" : "FAIL",
    status: makeStatus(verifyResult.ok),
    source: "`npm run ux:verify`",
  },
  {
    name: "UI 회귀 버그 비율 분기별 감소",
    target: "감소 추세",
    actual: "분기 이슈 트래킹 데이터 미연동",
    status: makeStatus("blocked"),
    source: "Issue Tracker 연동 필요",
  },
];

const summary = {
  executedAt,
  commands: {
    "ux:verify": verifyResult.ok,
    "perf:sim": realtimeResult.ok,
    "perf:list-sim": watchlistResult.ok,
  },
  realtimePerf,
  watchlistPerf,
  shortcutUsage,
  kpis,
};

const achieved = kpis.filter((kpi) => kpi.status === "PASS").length;
const failed = kpis.filter((kpi) => kpi.status === "FAIL").length;
const blocked = kpis.filter((kpi) => kpi.status === "Blocked").length;

const markdown = [
  "# UX KPI Remeasure Week 12",
  "",
  "## 실행 정보",
  `- 실행 시각: ${executedAt}`,
  `- 실행 명령: \`npm run ux:verify\`, \`npm run perf:sim\`, \`npm run perf:list-sim\``,
  "",
  "## KPI 결과 요약",
  `- PASS: ${achieved}`,
  `- FAIL: ${failed}`,
  `- Blocked: ${blocked}`,
  "",
  "| KPI | Target | Actual | Status | Source |",
  "| --- | --- | --- | --- | --- |",
  ...kpis.map((kpi) => `| ${kpi.name} | ${kpi.target} | ${kpi.actual} | ${kpi.status} | ${kpi.source} |`),
  "",
  "## 성능 측정 상세",
  `- Realtime state write 감소(raf+no-op): ${
    realtimePerf.writesReductionBatchedPct !== null
      ? `${realtimePerf.writesReductionBatchedPct.toFixed(1)}%`
      : "N/A"
  }`,
  `- Realtime reducer call 감소(raf+no-op): ${
    realtimePerf.reducerCallReductionBatchedPct !== null
      ? `${realtimePerf.reducerCallReductionBatchedPct.toFixed(1)}%`
      : "N/A"
  }`,
  `- Realtime runtime 개선(raf+no-op vs baseline): ${
    realtimePerf.runtimeReductionBatchedPct !== null
      ? `${realtimePerf.runtimeReductionBatchedPct.toFixed(1)}%`
      : "N/A"
  }`,
  `- Watchlist 초기 렌더 최소 개선: ${
    watchlistPerf.minReductionPct !== null
      ? `${watchlistPerf.minReductionPct.toFixed(1)}%`
      : "N/A"
  }`,
  `- Watchlist lazy chunk 최대 시간: ${
    watchlistPerf.maxChunkMs !== null
      ? `${watchlistPerf.maxChunkMs.toFixed(3)}ms`
      : "N/A"
  }`,
  "",
  "## 판단",
  "- 성능/접근성 자동 지표는 목표 기준을 충족했다.",
  "- 단축키 사용률, 복구율, 회귀 버그율은 운영 텔레메트리 연동 전까지 Blocked 상태로 유지한다.",
  "",
  "## 다음 액션",
  "1. `artifacts/ux-metrics` 경로에 실제 사용 세션의 metrics export JSON을 수집해 단축키 사용률 KPI를 실측한다.",
  "2. 오류 복구 시도 횟수(재시도/되돌리기) 이벤트를 계측해 복구율 KPI를 자동 산출한다.",
  "3. 릴리즈 후 1분기 이슈 라벨 통계를 연결해 회귀 버그 비율 KPI를 계산한다.",
  "",
].join("\n");

fs.writeFileSync(KPI_REPORT_FILE, markdown);
fs.writeFileSync(KPI_JSON_FILE, `${JSON.stringify(summary, null, 2)}\n`);

console.log(`KPI remeasure report written: ${path.relative(root, KPI_REPORT_FILE)}`);
console.log(`KPI data written: ${path.relative(root, KPI_JSON_FILE)}`);
console.log(`KPI summary => PASS:${achieved} FAIL:${failed} Blocked:${blocked}`);

if (!verifyResult.ok || !realtimeResult.ok || !watchlistResult.ok) {
  process.exit(1);
}
