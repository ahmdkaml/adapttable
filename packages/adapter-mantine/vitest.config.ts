import { mergeConfig } from "vitest/config";

import { sharedConfig } from "../../vitest.shared";

export default mergeConfig(sharedConfig, {
  test: {
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      // CSS, the barrel, and the test harness carry no testable logic.
      exclude: ["src/**/*.css", "src/test-utils.tsx"],
      // Line coverage stays at the strict bar; function/branch are a touch
      // lower to reflect the many trivial inline UI callbacks.
      thresholds: {
        statements: 85,
        lines: 95,
        functions: 85,
        branches: 78,
      },
    },
  },
});
