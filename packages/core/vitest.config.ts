import { mergeConfig } from "vitest/config";

import { sharedConfig } from "../../vitest.shared";

export default mergeConfig(sharedConfig, {
  test: {
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      // Pure type-only modules (interfaces only) compile to nothing and
      // would otherwise report as 0% covered.
      exclude: ["src/source/TableSource.ts", "src/props.ts"],
      thresholds: {
        statements: 97,
        lines: 98,
        functions: 95,
        branches: 95,
      },
    },
  },
});
