import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  dts: { entry: "src/index.ts" },
  sourcemap: true,
  clean: true,
  treeshake: true,
  banner: { js: "#!/usr/bin/env node" },
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
});
