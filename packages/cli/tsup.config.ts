import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  dts: { entry: "src/index.ts" },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  banner: { js: "#!/usr/bin/env node" },
  outExtension() {
    return { js: ".js" };
  },
});
