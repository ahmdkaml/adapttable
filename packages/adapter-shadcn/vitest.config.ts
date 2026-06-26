import { mergeConfig } from "vitest/config";

import { sharedConfig } from "../../vitest.shared";

export default mergeConfig(sharedConfig, {
  test: {
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      thresholds: {
        statements: 95,
        lines: 95,
        functions: 85,
        branches: 82,
      },
    },
  },
});
