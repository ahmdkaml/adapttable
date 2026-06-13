import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  outExtensions: ({ format }) => ({
    js: format === "es" ? ".js" : ".cjs",
    dts: format === "es" ? ".d.ts" : ".d.cts",
  }),
  deps: {
    neverBundle: [
      "react",
      "react-dom",
      "@mui/material",
      "@emotion/react",
      "@emotion/styled",
      "@adapttable/core",
    ],
  },
});
