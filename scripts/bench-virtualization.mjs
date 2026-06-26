/**
 * Virtualization benchmark — the regression target behind the perf claims in
 * `docs/virtualization.md`. It drives the showcase scale demo and reports:
 *
 *   1. an A/B at 10,000 rows — virtualized vs. a plain (non-virtualized) table
 *      over the SAME fully-loaded dataset — measuring DOM `<tr>` count and JS
 *      heap, i.e. the actual saving; and
 *   2. that the rendered row count stays ~constant as the dataset scales
 *      (1k -> 100k), proving cost is bounded by the viewport, not the data.
 *
 * Requires a running showcase and Playwright (both dev-only, not repo deps):
 *
 *   pnpm --filter @adapttable/showcase dev          # in one terminal
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/bench-virtualization.mjs [port]    # default port 5173
 *
 * The demo reads `?rows=N`, `?virtualize=0` (windowing off) and `?all=1` (load
 * the whole list up front), so no app change is needed.
 */
import { chromium } from "playwright";

const PORT = process.argv[2] || "5173";

/** Mount the scale demo and wait until the rendered row count settles. */
async function sample(query) {
  const browser = await chromium.launch();
  const page = await browser
    .newContext({
      viewport: { width: 1280, height: 900 },
    })
    .then((c) => c.newPage());
  await page.goto(`http://localhost:${PORT}/scale/?${query}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("table tbody tr", {
    state: "attached",
    timeout: 60000,
  });
  let prev = -1;
  let stable = 0;
  while (stable < 4) {
    await page.waitForTimeout(200);
    const c = await page.locator("table tbody tr").count();
    if (c === prev) {
      stable++;
    } else {
      stable = 0;
      prev = c;
    }
  }
  const heapMB = await page.evaluate(() =>
    "memory" in performance
      ? Math.round(performance.memory.usedJSHeapSize / 1048576)
      : null
  );
  await page.context().browser().close();
  return { domRows: prev, heapMB };
}

console.log("A/B at 10,000 rows (same dataset fully loaded):");
const on = await sample("rows=10000&all=1&virtualize=1");
const off = await sample("rows=10000&all=1&virtualize=0");
console.table({
  virtualized: on,
  "plain table": off,
  saving: {
    domRows: `${Math.round(off.domRows / on.domRows)}x fewer`,
    heapMB: `${off.heapMB - on.heapMB}MB less`,
  },
});

console.log("\nRendered rows stay constant as the dataset scales:");
const scale = {};
for (const n of [1000, 10000, 50000, 100000]) {
  scale[n.toLocaleString()] = (await sample(`rows=${n}`)).domRows;
}
console.table(scale);
