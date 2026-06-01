import { mergeConfig } from "vitest/config";

import { sharedConfig } from "../../vitest.shared";

export default mergeConfig(sharedConfig, {
  test: {
    environment: "node",
    coverage: {
      // The bin wrapper is a thin IO shell exercised via run().
      exclude: ["src/cli.ts"],
    },
  },
});
