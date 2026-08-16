import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const GA_MEASUREMENT_ID = "G-FT8LY7Z15Y";

const CLARITY_PROJECT_ID = "xxq9dbsjnj";

/**
 * Inject Google Analytics (GA4) into every HTML entry.
 *
 * The showcase is a multi-page app, so this lives here rather than being
 * pasted into each `index.html` — one definition covers all eight pages and
 * any page added later. The docs site injects the same tag through Starlight's
 * `head` config. Microsoft Clarity below follows the identical pattern.
 */
const googleAnalytics = (): Plugin => ({
  name: "adapttable-google-analytics",
  // Production builds only. `transformIndexHtml` runs in dev too, and the
  // Playwright suite drives the dev server — every e2e run reported real
  // sessions against `localhost`, 332 of them in one day. Cloudflare drops
  // those because its beacon is bound to a hostname; GA4 accepts any host, so
  // it counted CI as traffic.
  apply: "build",
  transformIndexHtml: () => [
    {
      tag: "script",
      attrs: {
        async: true,
        src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`,
      },
      injectTo: "head",
    },
    {
      tag: "script",
      children: [
        "window.dataLayer = window.dataLayer || [];",
        "function gtag(){dataLayer.push(arguments);}",
        "gtag('js', new Date());",
        `gtag('config', '${GA_MEASUREMENT_ID}');`,
      ].join("\n"),
      injectTo: "head",
    },
  ],
});

/**
 * Inject Microsoft Clarity session recording into every HTML entry.
 *
 * Same shape and the same build-only gate as GA4 above, for the same reason:
 * the Playwright suite drives the dev server, and a recorder that loads there
 * would file every e2e run as a real visitor session. The stub queues
 * `clarity()` calls until the tag loads.
 */
const microsoftClarity = (): Plugin => ({
  name: "adapttable-microsoft-clarity",
  apply: "build",
  transformIndexHtml: () => [
    {
      tag: "script",
      children: [
        "window.clarity = window.clarity || function () {",
        "  (window.clarity.q = window.clarity.q || []).push(arguments);",
        "};",
      ].join("\n"),
      injectTo: "head",
    },
    {
      tag: "script",
      attrs: {
        async: true,
        src: `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`,
      },
      injectTo: "head",
    },
  ],
});

// Resolve each @adapttable/* package to its TypeScript source so the showcase
// always reflects the current library (and hot-reloads). The adapters are still
// the REAL ones — each section mounts a genuine kit component, never a mock.
const pkg = (rel: string, entry = "index") =>
  fileURLToPath(
    new URL(`../../packages/${rel}/src/${entry}.ts`, import.meta.url)
  );

const page = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), googleAnalytics(), microsoftClarity()],
  // Multi-page app: each demo page is its own static HTML entry, linked
  // with plain anchors — no client router, no GitHub Pages 404 tricks.
  build: {
    rollupOptions: {
      input: {
        main: page("./index.html"),
        columns: page("./columns/index.html"),
        filtering: page("./filtering/index.html"),
        editing: page("./editing/index.html"),
        grouping: page("./grouping/index.html"),
        "export-pdf": page("./export-pdf/index.html"),
        "all-options": page("./all-options/index.html"),
        mobile: page("./mobile/index.html"),
        scale: page("./scale/index.html"),
        rtl: page("./rtl/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      // Longest key first: the bare "@adapttable/core" alias would otherwise
      // swallow the subpath and resolve ".../index.ts/adapter".
      "@adapttable/core/adapter": pkg("core", "adapter"),
      "@adapttable/core/xlsx": pkg("core", "xlsx"),
      "@adapttable/core/pdf": pkg("core", "pdf"),
      "@adapttable/core/sparkline": pkg("core", "sparkline"),
      "@adapttable/core": pkg("core"),
      "@adapttable/mantine": pkg("adapter-mantine"),
      "@adapttable/mui": pkg("adapter-mui"),
      "@adapttable/chakra": pkg("adapter-chakra"),
      "@adapttable/unstyled": pkg("adapter-unstyled"),
      "@adapttable/shadcn": pkg("adapter-shadcn"),
      "@adapttable/antd": pkg("adapter-antd"),
      "@adapttable/radix": pkg("adapter-radix"),
      "@adapttable/base-ui": pkg("adapter-base-ui"),
      "@adapttable/i18n": pkg("i18n"),
    },
    dedupe: ["react", "react-dom"],
  },
});
