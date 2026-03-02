import { performance } from "node:perf_hooks";

/**
 * Synthetic performance simulator for real-time candle ingestion.
 * Compares three paths:
 * 1) baseline (update on every message)
 * 2) no-op guard only (skip identical candle payloads)
 * 3) RAF-batched + no-op guard
 */

function makeRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function cloneCandle(candle) {
  return {
    time: candle.time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  };
}

function generateMessageStream({
  seed = 42,
  durationSec = 300,
  messagesPerSec = 12,
  candleWindowSec = 60,
  duplicateRate = 0.72,
}) {
  const rand = makeRng(seed);
  const messages = [];
  const stepMs = Math.floor(1000 / messagesPerSec);
  let lastPrice = 100;
  let activeCandle = null;

  for (let second = 0; second < durationSec; second += 1) {
    const candleStartSec = Math.floor(second / candleWindowSec) * candleWindowSec;
    const isNewCandle = !activeCandle || activeCandle.time !== candleStartSec;
    if (isNewCandle) {
      activeCandle = {
        time: candleStartSec,
        open: lastPrice,
        high: lastPrice,
        low: lastPrice,
        close: lastPrice,
        volume: 0,
      };
    }

    for (let i = 0; i < messagesPerSec; i += 1) {
      const eventTimeMs = second * 1000 + i * stepMs;
      const isDuplicate = rand() < duplicateRate && messages.length > 0;

      if (!isDuplicate) {
        const drift = (rand() - 0.5) * 0.5;
        const nextClose = Math.max(0.01, activeCandle.close + drift);
        activeCandle.close = Number(nextClose.toFixed(4));
        activeCandle.high = Math.max(activeCandle.high, activeCandle.close);
        activeCandle.low = Math.min(activeCandle.low, activeCandle.close);
        activeCandle.volume = Number((activeCandle.volume + 10 + rand() * 90).toFixed(4));
        lastPrice = activeCandle.close;
      }

      messages.push({
        eventTimeMs,
        candle: cloneCandle(activeCandle),
      });
    }
  }

  return messages;
}

function reduceRealtime(state, incoming, { noOpGuard }) {
  if (!state.candles.length) return false;
  const last = state.candles[state.candles.length - 1];
  if (!last) return false;
  if (incoming.time < last.time) return false;

  if (
    noOpGuard &&
    incoming.time === last.time &&
    incoming.open === last.open &&
    incoming.high === last.high &&
    incoming.low === last.low &&
    incoming.close === last.close &&
    incoming.volume === last.volume
  ) {
    return false;
  }

  if (incoming.time === last.time) {
    state.candles[state.candles.length - 1] = incoming;
    return true;
  }

  state.candles.push(incoming);
  if (state.candles.length > 500) {
    state.candles.shift();
  }
  return true;
}

function runStream(messages, options) {
  const initial = cloneCandle({
    time: messages[0]?.candle.time ?? 0,
    open: 100,
    high: 100,
    low: 100,
    close: 100,
    volume: 0,
  });
  const state = { candles: [initial] };

  let reducerCalls = 0;
  let stateWrites = 0;

  if (!options.rafBatchMs) {
    for (const msg of messages) {
      reducerCalls += 1;
      if (reduceRealtime(state, msg.candle, { noOpGuard: options.noOpGuard })) {
        stateWrites += 1;
      }
    }
    return { reducerCalls, stateWrites };
  }

  const frameMs = options.rafBatchMs;
  let index = 0;
  let frameStart = messages[0]?.eventTimeMs ?? 0;

  while (index < messages.length) {
    const frameEnd = frameStart + frameMs;
    let lastInFrame = null;

    while (index < messages.length && messages[index].eventTimeMs < frameEnd) {
      lastInFrame = messages[index];
      index += 1;
    }

    if (lastInFrame) {
      reducerCalls += 1;
      if (reduceRealtime(state, lastInFrame.candle, { noOpGuard: options.noOpGuard })) {
        stateWrites += 1;
      }
    }
    frameStart = frameEnd;
  }

  return { reducerCalls, stateWrites };
}

function benchmarkScenario(messages, options) {
  const runs = 30;
  let totalMs = 0;
  let summary = null;

  for (let i = 0; i < runs; i += 1) {
    const started = performance.now();
    summary = runStream(messages, options);
    totalMs += performance.now() - started;
  }

  return {
    avgMs: totalMs / runs,
    ...summary,
  };
}

const messages = generateMessageStream({
  seed: 20260302,
  durationSec: 300,
  messagesPerSec: 90,
  candleWindowSec: 60,
  duplicateRate: 0.72,
});

const baseline = benchmarkScenario(messages, { noOpGuard: false, rafBatchMs: null });
const noOpOnly = benchmarkScenario(messages, { noOpGuard: true, rafBatchMs: null });
const rafPlusNoOp = benchmarkScenario(messages, { noOpGuard: true, rafBatchMs: 16 });

const toPercent = (value) => `${(value * 100).toFixed(1)}%`;
const writesReductionNoOp = 1 - noOpOnly.stateWrites / baseline.stateWrites;
const writesReductionBatched = 1 - rafPlusNoOp.stateWrites / baseline.stateWrites;
const callsReductionBatched = 1 - rafPlusNoOp.reducerCalls / baseline.reducerCalls;

const report = {
  generatedAt: new Date().toISOString(),
  messages: messages.length,
  scenarios: {
    baseline,
    noOpOnly,
    rafPlusNoOp,
  },
  reductions: {
    writesNoOpOnly: writesReductionNoOp,
    writesRafPlusNoOp: writesReductionBatched,
    reducerCallsRafPlusNoOp: callsReductionBatched,
  },
};

console.log("Realtime Perf Simulation");
console.log(`messages=${messages.length}`);
console.log("");
console.log("| scenario | reducer calls | state writes | avg runtime (ms) |");
console.log("| --- | ---: | ---: | ---: |");
console.log(`| baseline | ${baseline.reducerCalls} | ${baseline.stateWrites} | ${baseline.avgMs.toFixed(3)} |`);
console.log(`| no-op guard | ${noOpOnly.reducerCalls} | ${noOpOnly.stateWrites} | ${noOpOnly.avgMs.toFixed(3)} |`);
console.log(`| raf + no-op | ${rafPlusNoOp.reducerCalls} | ${rafPlusNoOp.stateWrites} | ${rafPlusNoOp.avgMs.toFixed(3)} |`);
console.log("");
console.log(`no-op writes reduction: ${toPercent(writesReductionNoOp)}`);
console.log(`raf+no-op writes reduction: ${toPercent(writesReductionBatched)}`);
console.log(`raf+no-op reducer-call reduction: ${toPercent(callsReductionBatched)}`);
console.log("");
console.log(JSON.stringify(report, null, 2));
