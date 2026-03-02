import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const QA_REPORT_FILE = path.join(root, "docs/UX_QA_GATE_WEEK12_REPORT.md");
const QA_JSON_FILE = path.join(root, "docs/UX_QA_GATE_WEEK12_REPORT.json");

const THRESHOLDS = {
  realtimeWritesReductionPctMin: 60,
  realtimeReducerCallsReductionPctMin: 20,
  watchlistInitialReductionPctMin: 50,
  watchlistMaxChunkMsMax: 1.0,
};

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

function toNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseRealtime(output) {
  const writes = /raf\+no-op writes reduction:\s*([\d.]+)%/i.exec(output);
  const calls = /raf\+no-op reducer-call reduction:\s*([\d.]+)%/i.exec(output);
  return {
    writesReductionPct: writes ? toNumber(writes[1]) : null,
    callsReductionPct: calls ? toNumber(calls[1]) : null,
  };
}

function parseWatchlist(output) {
  const linePattern =
    /^\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)%\s*\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|$/gm;
  const rows = [];
  let match = linePattern.exec(output);
  while (match) {
    rows.push({
      visibleItems: toNumber(match[1], 0),
      reductionPct: toNumber(match[4], 0),
      maxChunkMs: toNumber(match[6], 0),
    });
    match = linePattern.exec(output);
  }
  return {
    rows,
    minReductionPct: rows.length ? Math.min(...rows.map((row) => row.reductionPct)) : null,
    maxChunkMs: rows.length ? Math.max(...rows.map((row) => row.maxChunkMs)) : null,
  };
}

function check(name, actual, pass, thresholdText) {
  return {
    name,
    actual,
    threshold: thresholdText,
    status: pass ? "PASS" : "FAIL",
  };
}

const executedAt = new Date().toISOString();
const verifyResult = run("npm run ux:verify");
const realtimeResult = run("npm run perf:sim");
const watchlistResult = run("npm run perf:list-sim");

const realtime = parseRealtime(realtimeResult.output);
const watchlist = parseWatchlist(watchlistResult.output);

const checks = [
  check(
    "Baseline Gate: ux:verify",
    verifyResult.ok ? "PASS" : "FAIL",
    verifyResult.ok,
    "must pass",
  ),
  check(
    "Realtime writes reduction",
    realtime.writesReductionPct !== null ? `${realtime.writesReductionPct.toFixed(1)}%` : "N/A",
    realtime.writesReductionPct !== null
      && realtime.writesReductionPct >= THRESHOLDS.realtimeWritesReductionPctMin,
    `>= ${THRESHOLDS.realtimeWritesReductionPctMin}%`,
  ),
  check(
    "Realtime reducer-call reduction",
    realtime.callsReductionPct !== null ? `${realtime.callsReductionPct.toFixed(1)}%` : "N/A",
    realtime.callsReductionPct !== null
      && realtime.callsReductionPct >= THRESHOLDS.realtimeReducerCallsReductionPctMin,
    `>= ${THRESHOLDS.realtimeReducerCallsReductionPctMin}%`,
  ),
  check(
    "Watchlist initial reduction (minimum)",
    watchlist.minReductionPct !== null ? `${watchlist.minReductionPct.toFixed(1)}%` : "N/A",
    watchlist.minReductionPct !== null
      && watchlist.minReductionPct >= THRESHOLDS.watchlistInitialReductionPctMin,
    `>= ${THRESHOLDS.watchlistInitialReductionPctMin}%`,
  ),
  check(
    "Watchlist max lazy chunk time",
    watchlist.maxChunkMs !== null ? `${watchlist.maxChunkMs.toFixed(3)}ms` : "N/A",
    watchlist.maxChunkMs !== null && watchlist.maxChunkMs <= THRESHOLDS.watchlistMaxChunkMsMax,
    `<= ${THRESHOLDS.watchlistMaxChunkMsMax.toFixed(1)}ms`,
  ),
];

const failedChecks = checks.filter((item) => item.status === "FAIL");
const summary = {
  executedAt,
  thresholds: THRESHOLDS,
  commandStatus: {
    "ux:verify": verifyResult.ok,
    "perf:sim": realtimeResult.ok,
    "perf:list-sim": watchlistResult.ok,
  },
  realtime,
  watchlist,
  checks,
};

const markdown = [
  "# UX QA Gate Week 12 Report",
  "",
  "## 실행 정보",
  `- 실행 시각: ${executedAt}`,
  `- 실행 명령: \`npm run ux:verify\`, \`npm run perf:sim\`, \`npm run perf:list-sim\``,
  "",
  "## 게이트 임계치",
  `- Realtime writes reduction >= ${THRESHOLDS.realtimeWritesReductionPctMin}%`,
  `- Realtime reducer-call reduction >= ${THRESHOLDS.realtimeReducerCallsReductionPctMin}%`,
  `- Watchlist initial reduction(min) >= ${THRESHOLDS.watchlistInitialReductionPctMin}%`,
  `- Watchlist max lazy chunk <= ${THRESHOLDS.watchlistMaxChunkMsMax.toFixed(1)}ms`,
  "",
  "## 점검 결과",
  "| Check | Actual | Threshold | Status |",
  "| --- | --- | --- | --- |",
  ...checks.map((item) => `| ${item.name} | ${item.actual} | ${item.threshold} | ${item.status} |`),
  "",
  `- 최종 판정: ${failedChecks.length === 0 ? "PASS" : "FAIL"}`,
  "",
  "## 메모",
  "- 본 보고서는 릴리즈 전 자동 게이트 실행 기록으로 보관한다.",
  "- FAIL 발생 시 해당 항목을 수정한 뒤 동일 명령으로 재실행한다.",
  "",
].join("\n");

fs.writeFileSync(QA_REPORT_FILE, markdown);
fs.writeFileSync(QA_JSON_FILE, `${JSON.stringify(summary, null, 2)}\n`);

console.log(`UX QA gate report written: ${path.relative(root, QA_REPORT_FILE)}`);
console.log(`UX QA gate data written: ${path.relative(root, QA_JSON_FILE)}`);
console.log(`Final verdict: ${failedChecks.length === 0 ? "PASS" : "FAIL"}`);

if (failedChecks.length > 0 || !verifyResult.ok || !realtimeResult.ok || !watchlistResult.ok) {
  process.exit(1);
}
