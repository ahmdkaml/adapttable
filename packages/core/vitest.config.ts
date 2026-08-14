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
        // The React Compiler's generated cache code (`_c()` slots, the
        // `if ($[i] !== x)` guards) is a fixed cost per component that v8 counts
        // as uncovered statements, so this number falls as the package gains
        // small components even while every line of logic is tested. `lines`
        // below is the honest floor — it sits above 98% with the same suite.
        statements: 95,
        lines: 98,
        functions: 95,
        // v8 coverage fabricates uncoverable "phantom" branches on object
        // literals, destructuring and JSX/SVG attributes — heavy in the shared
        // orchestration/rendering hoisted here from the adapters. Real coverage
        // stays high (statements/lines/functions above); branches is relaxed to
        // reflect that v8 artifact, not a gap in tests.
        branches: 80,
      },
    },
  },
});
