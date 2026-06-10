import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Resolve each @adapttable/* package straight to its TypeScript source so the
// playground runs with no pre-build and hot-reloads when you edit the library.
const pkg = (rel: string) =>
  fileURLToPath(new URL(`../../packages/${rel}/src/index.ts`, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@adapttable/core": pkg("core"),
      "@adapttable/mantine": pkg("adapter-mantine"),
      "@adapttable/mui": pkg("adapter-mui"),
      "@adapttable/chakra": pkg("adapter-chakra"),
      "@adapttable/unstyled": pkg("adapter-unstyled"),
      "@adapttable/antd": pkg("adapter-antd"),
      "@adapttable/i18n": pkg("i18n"),
    },
    // One React instance, or hooks throw "invalid hook call".
    dedupe: ["react", "react-dom"],
  },
});
