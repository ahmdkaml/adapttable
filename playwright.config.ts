import { defineConfig, devices } from "@playwright/test";

/**
 * E2E smoke suite over the real showcase (`apps/showcase`), which mounts every
 * genuine adapter. jsdom unit tests can't see the bug class this guards —
 * overlay z-index / popover bleed-through, drawer backdrops, sticky headers,
 * pinned-column offsets and virtualization DOM bounds — so these run in a real
 * browser. Depth stays in the unit suites; this is a smoke net.
 */
const PORT = 4321;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Each GitHub-hosted ubuntu-latest is 4 vCPU. CI shards the suite across
  // five of those boxes (`--shard=i/5` in e2e.yml), and each box runs 4
  // Chromiums — 20 tests in flight. 10–20 workers on one runner contend.
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Vite dev server: the showcase resolves `@adapttable/*` to package SOURCE,
    // so the suite always exercises the current library, not a stale build.
    command: `pnpm --filter @adapttable/showcase exec vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
