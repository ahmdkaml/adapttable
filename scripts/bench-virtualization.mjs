/**
 * Virtualization benchmark — the regression target behind the perf claims in
 * `docs/virtualization.md`. It drives the showcase scale demo at a range of
 * row counts and reports time-to-first-rows, the number of `<tr>`s actually in
 * the DOM (which must stay ~constant), how that holds while scrolling deep, and
 * the JS heap.
 *
 * Requires a running showcase and Playwright (both dev-only, not repo deps):
 *
 *   pnpm --filter @adapttable/showcase dev          # in one terminal
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/bench-virtualization.mjs [port]    # default port 5173
 *
 * The demo reads `?rows=N`, so no app change is needed to vary the dataset.
 */
import { chromium } from "playwright";

const PORT = process.argv[2] || "5173";
const COUNTS = [1000, 10000, 50000, 100000];

const browser = await chromium.launch();
const rows = [];
for (const n of COUNTS) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  const t0 = performance.now();
  await page.goto(`http://localhost:${PORT}/scale/?rows=${n}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("table tbody tr", {
    state: "attached",
    timeout: 30000,
  });
  const mountMs = Math.round(performance.now() - t0);
  await page.waitForTimeout(400); // let the virtualizer measure + settle
  const domRows = await page.locator("table tbody tr").count();
  const heapMB = await page.evaluate(() =>
    "memory" in performance
      ? Math.round(performance.memory.usedJSHeapSize / 1048576)
      : null
  );
  // Jump to several scroll depths; the rendered window must stay bounded.
  const onScroll = [];
  for (const frac of [0.25, 0.6, 0.95, 0.4]) {
    await page.evaluate(
      (f) => window.scrollTo(0, document.body.scrollHeight * f),
      frac
    );
    await page.waitForTimeout(220);
    onScroll.push(await page.locator("table tbody tr").count());
  }
  rows.push({
    rows: n,
    mountMs,
    domRows,
    domRowsScrolling: Math.max(...onScroll),
    heapMB,
  });
  await ctx.close();
}
await browser.close();

console.table(rows);
