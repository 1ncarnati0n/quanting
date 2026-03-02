import { performance } from "node:perf_hooks";

const INITIAL_RENDER_COUNT = 48;
const RENDER_STEP = 32;
const RUNS = 24;

function makeSeries(seed, length = 96) {
  let value = 100 + seed;
  const out = [];
  for (let i = 0; i < length; i += 1) {
    value += Math.sin((seed + i) * 0.17) * 0.9 + Math.cos((seed + i) * 0.07) * 0.5;
    out.push(value);
  }
  return out;
}

function simulateRowRender(rowIndex) {
  const values = makeSeries(rowIndex);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1e-9);
  let pointsHash = 0;
  for (let i = 0; i < values.length; i += 1) {
    const x = (i / (values.length - 1)) * 110 + 1;
    const y = 27 - ((values[i] - min) / range) * 26;
    pointsHash += (x * 0.37 + y * 0.61) * (i + 1);
  }
  return pointsHash;
}

function renderRows(count) {
  let acc = 0;
  for (let i = 0; i < count; i += 1) {
    acc += simulateRowRender(i);
  }
  return acc;
}

function benchmark(count) {
  let total = 0;
  for (let i = 0; i < RUNS; i += 1) {
    const started = performance.now();
    renderRows(count);
    total += performance.now() - started;
  }
  return total / RUNS;
}

function benchmarkProgressive(targetCount) {
  const initialCount = Math.min(INITIAL_RENDER_COUNT, targetCount);
  const initialMs = benchmark(initialCount);

  const chunkCount = Math.max(0, targetCount - initialCount);
  const chunks = Math.ceil(chunkCount / RENDER_STEP);
  const chunkSizes = [];
  for (let i = 0; i < chunks; i += 1) {
    const remaining = chunkCount - i * RENDER_STEP;
    chunkSizes.push(Math.min(RENDER_STEP, remaining));
  }
  const chunkMs = chunkSizes.length
    ? chunkSizes.map((size) => benchmark(size))
    : [];

  return {
    initialMs,
    chunkMs,
    maxChunkMs: chunkMs.length ? Math.max(...chunkMs) : 0,
    chunks: chunkSizes.length,
  };
}

const scenarios = [120, 240, 400];
const rows = scenarios.map((count) => {
  const baselineInitialMs = benchmark(count);
  const progressive = benchmarkProgressive(count);
  const initialReduction = 1 - progressive.initialMs / baselineInitialMs;
  return {
    count,
    baselineInitialMs,
    progressiveInitialMs: progressive.initialMs,
    progressiveChunks: progressive.chunks,
    progressiveMaxChunkMs: progressive.maxChunkMs,
    initialReduction,
  };
});

console.log("Watchlist Render Perf Simulation");
console.log(`initial=${INITIAL_RENDER_COUNT}, step=${RENDER_STEP}, runs=${RUNS}`);
console.log("");
console.log("| visible items | baseline initial (ms) | progressive initial (ms) | reduction | lazy chunks | max chunk (ms) |");
console.log("| ---: | ---: | ---: | ---: | ---: | ---: |");
for (const row of rows) {
  console.log(
    `| ${row.count} | ${row.baselineInitialMs.toFixed(3)} | ${row.progressiveInitialMs.toFixed(3)} | ${(row.initialReduction * 100).toFixed(1)}% | ${row.progressiveChunks} | ${row.progressiveMaxChunkMs.toFixed(3)} |`,
  );
}
