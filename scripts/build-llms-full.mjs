#!/usr/bin/env node
/**
 * Regenerate `llms-full.txt` by concatenating the markdown docs, so the
 * LLM-facing "all docs in one file" can never drift from `docs/`.
 *
 * Run via `pnpm llms` after editing anything under `docs/`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HEADER = `# AdaptTable — full documentation

> Headless, UI-agnostic React data table with ready adapters for Mantine, MUI, Chakra, Ant Design, and Tailwind/shadcn. Unified client/server data via TableSource, URL-synced state, column management (show/hide, reorder, pin left/right, resize, density), responsive mobile cards, optional row/card virtualization, provider-native filter popovers/drawers with chips, numeric/date/status filters, i18n + RTL (logical pinning — works in Arabic/Hebrew), dark mode. MIT.

`;

/** Docs in reading order. Each file's own H1 is kept as the section break. */
const DOCS = [
  "getting-started.md",
  "concepts.md",
  "data-tiers.md",
  "columns.md",
  "sorting.md",
  "filtering.md",
  "pagination.md",
  "selection.md",
  "row-expansion.md",
  "column-management.md",
  "saved-views.md",
  "virtualization.md",
  "url-state.md",
  "customization.md",
  "i18n-rtl.md",
  "api.md",
  "faq.md",
  "comparison.md",
];

const root = process.cwd();
const sections = DOCS.map((name) =>
  readFileSync(join(root, "docs", name), "utf8").trim()
);

writeFileSync(
  join(root, "llms-full.txt"),
  `${HEADER}\n---\n\n${sections.join("\n\n---\n\n")}\n`
);
console.log(`llms-full.txt rebuilt from ${DOCS.length} docs.`);
