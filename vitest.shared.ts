import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Shared Vitest configuration consumed by every package via
 * `mergeConfig(sharedConfig, { ... })`. Centralises the jsdom
 * environment, React plugin, and the coverage thresholds the whole
 * monorepo holds itself to (near-100%, enforced in CI).
 */
export const sharedConfig = defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    css: true,
    clearMocks: true,
    restoreMocks: true,
    // On the 2-core CI runner `turbo` already runs every package's suite in
    // parallel; letting each vitest ALSO fan its files across worker threads
    // oversubscribed the cores ~20×, and antd 6's cold cssinjs render (paid
    // once, by the first test of the suite) blew past the per-test timeout
    // under that thrash. Run files serially on CI so the aggregate thread
    // count stays near the core count — locally we keep full parallelism.
    fileParallelism: !process.env.CI,
    // Generous per-test budget for that same cold first render on a loaded CI
    // runner. This only widens the time limit — assertions are unchanged.
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.gaps.test.{ts,tsx}",
        "src/**/index.ts",
        "src/**/*.d.ts",
        "src/**/types.ts",
      ],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
});

export default sharedConfig;
