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
    // Headroom for cold CI runners: the first test in a heavy suite pays the
    // kit's first-render warm-up (antd's exceeded the 5s default on a 2-core
    // runner). This widens the per-test budget only — assertions unchanged.
    testTimeout: 15000,
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
