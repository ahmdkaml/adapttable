/**
 * The performance benchmark suite — the numbers behind every perf claim in the
 * docs, and the regression net under them.
 *
 * It drives the showcase scale demo through a set of scenarios and reports, for
 * each: how many rows and cells actually reach the DOM, the JS heap after the
 * table settles, and how long the table takes to become interactive. The demo
 * is the fixture on purpose — the benchmark measures the real adapter over the
 * real engine, never a synthetic harness that could drift from what ships.
 *
 *   node scripts/bench.mjs                        # all scenarios
 *   node scripts/bench.mjs --smoke                # the CI subset
 *   node scripts/bench.mjs --port 4321 --json     # machine-readable
 *
 * It serves the showcase itself when nothing is already on the port, and stops
 * that server again when it finishes. Running `pnpm --filter
 * @adapttable/showcase dev` by hand first is still the faster loop while
 * iterating — an already-running server is used as-is and left alone.
 *
 * Playwright is already a dev dependency here (the e2e suite uses it), so
 * this needs no extra install — only its browser, once:
 *
 *   npx playwright install chromium
 *
 * Reading the output: DOM rows is the number that must stay flat as rows grow
 * — that is windowing working. Heap is indicative, not a contract: it moves
 * with the browser build and the machine, so compare arms within one run
 * rather than across days.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : (args[i + 1] ?? true);
};
const PORT = flag("port", "5173");
const SMOKE = args.includes("--smoke");
const JSON_OUT = args.includes("--json");

/**
 * Every scenario is a URL against the scale demo plus the shape we expect.
 * `smoke` marks the fast subset CI runs on every pull request; the rest are
 * the full sweep worth running before a release or when perf work lands.
 *
 * Scenarios that need features which do not exist yet — server-backed
 * millions, tree data, realtime patches — are absent on purpose rather than
 * stubbed: a benchmark that measures nothing is worse than a missing one. Add
 * them in the same change that adds the feature.
 */
const SCENARIOS = [
  {
    name: "baseline · 50k rows, windowed",
    query: "rows=50000",
    smoke: true,
    expect: { maxDomRows: 60 },
  },
  {
    name: "100k rows, windowed",
    query: "rows=100000",
    smoke: true,
    expect: { maxDomRows: 60 },
  },
  {
    name: "10k rows, windowed (A/B arm)",
    query: "rows=10000&all=1&virtualize=1",
    smoke: true,
    expect: { maxDomRows: 60 },
  },
  {
    name: "10k rows, NOT windowed (A/B arm)",
    query: "rows=10000&all=1&virtualize=0",
    smoke: false,
    expect: { minDomRows: 9000 },
  },
  {
    name: "wide · 100 columns",
    query: "rows=5000&cols=100",
    smoke: true,
    expect: { maxDomRows: 60 },
  },
  {
    name: "wide · 500 columns",
    query: "rows=5000&cols=500",
    smoke: false,
    expect: { maxDomRows: 60 },
  },
  {
    name: "grouped by status",
    query: "rows=20000&scale.groupBy=status",
    smoke: true,
    expect: { maxDomRows: 400 },
  },
  {
    name: "pinned first column",
    query: "rows=20000&scale.colPin=name%3Astart",
    smoke: false,
    expect: { maxDomRows: 60 },
  },
  {
    name: "sorted · 100k rows",
    query: "rows=100000&scale.sortBy=budget&scale.sortDir=desc",
    smoke: false,
    expect: { maxDomRows: 60 },
  },
];

/** Mount one scenario and measure it once the rendered row count settles. */
async function sample(query) {
  const browser = await chromium.launch();
  const page = await browser
    .newContext({ viewport: { width: 1280, height: 900 } })
    .then((c) => c.newPage());
  const started = Date.now();
  await page.goto(`http://localhost:${PORT}/scale/?${query}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("table tbody tr", {
    state: "attached",
    timeout: 90000,
  });
  const interactiveMs = Date.now() - started;

  // Settle: the virtualizer measures rows after paint, so the count moves for
  // a few frames. Four identical reads in a row is the table holding still.
  let prev = -1;
  let stable = 0;
  while (stable < 4) {
    await page.waitForTimeout(200);
    const c = await page.locator("table tbody tr").count();
    if (c === prev) stable++;
    else {
      stable = 0;
      prev = c;
    }
  }

  const { domCells, heapMB } = await page.evaluate(() => ({
    domCells: document.querySelectorAll("table tbody td").length,
    heapMB:
      "memory" in performance
        ? Math.round(performance.memory.usedJSHeapSize / 1048576)
        : null,
  }));
  await page.context().browser().close();
  return { domRows: prev, domCells, heapMB, interactiveMs };
}

/** A scenario fails only against its own stated expectation, never a diff. */
function verdict(result, expect = {}) {
  const failures = [];
  if (expect.maxDomRows !== undefined && result.domRows > expect.maxDomRows) {
    failures.push(`${result.domRows} DOM rows > ${expect.maxDomRows}`);
  }
  if (expect.minDomRows !== undefined && result.domRows < expect.minDomRows) {
    failures.push(`${result.domRows} DOM rows < ${expect.minDomRows}`);
  }
  return failures;
}

/**
 * The demo has to be served for any of this to mean anything.
 *
 * Running the dev server by hand still works and is the faster loop while
 * iterating. But `pnpm bench` on its own used to die on a raw
 * ERR_CONNECTION_REFUSED stack trace, which says nothing about what to do —
 * so when the port is silent this starts the server, waits for it, and shuts
 * it down again at the end.
 */
async function serving() {
  try {
    const res = await fetch(`http://localhost:${PORT}/`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Start the showcase dev server and resolve once it answers. */
async function startShowcase() {
  // The showcase's own vite binary, by absolute path — nothing resolves
  // through PATH, so what runs is the version this repo installed.
  const vite = join(ROOT, "apps/showcase/node_modules/.bin/vite");
  if (!existsSync(vite)) {
    throw new Error(
      `no vite binary at ${vite} — run \`pnpm install\` first, or start the ` +
        `showcase by hand and re-run`
    );
  }
  const child = spawn(vite, ["--port", String(PORT), "--strictPort"], {
    cwd: join(ROOT, "apps/showcase"),
    stdio: "ignore",
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await serving()) return child;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  child.kill();
  throw new Error(
    `the showcase did not come up on port ${PORT} within 60s — start it by ` +
      `hand with \`pnpm --filter @adapttable/showcase dev\` and re-run`
  );
}

const started = (await serving()) ? null : await startShowcase();
if (started && !JSON_OUT) {
  console.log(`started the showcase on :${PORT} for this run\n`);
}

const chosen = SMOKE ? SCENARIOS.filter((s) => s.smoke) : SCENARIOS;
const results = [];
let failed = 0;

for (const scenario of chosen) {
  const result = await sample(scenario.query);
  const failures = verdict(result, scenario.expect);
  if (failures.length) failed++;
  results.push({ ...scenario, ...result, failures });
  if (!JSON_OUT) {
    const status = failures.length ? `FAIL — ${failures.join(", ")}` : "ok";
    console.log(
      `${failures.length ? "✗" : "✓"} ${scenario.name.padEnd(34)} ` +
        `${String(result.domRows).padStart(5)} rows  ` +
        `${String(result.domCells).padStart(6)} cells  ` +
        `${String(result.heapMB ?? "—").padStart(4)}MB  ` +
        `${String(result.interactiveMs).padStart(5)}ms  ${status}`
    );
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({ port: PORT, smoke: SMOKE, results }, null, 2));
} else {
  // The A/B is the headline claim: windowing renders a viewport, not a dataset.
  const on = results.find((r) => r.query.includes("virtualize=1"));
  const off = results.find((r) => r.query.includes("virtualize=0"));
  if (on && off) {
    console.log(
      `\nwindowing at 10k rows: ${Math.round(off.domRows / on.domRows)}x fewer ` +
        `DOM rows (${off.domRows} → ${on.domRows})` +
        (on.heapMB && off.heapMB
          ? `, ${off.heapMB - on.heapMB}MB less heap`
          : "")
    );
  }
  console.log(
    `\n${chosen.length - failed}/${chosen.length} scenarios within expectations`
  );
}

// Leave the machine as we found it: a server this script started is this
// script's to stop, and one that was already running is not.
started?.kill();

process.exit(failed ? 1 : 0);
