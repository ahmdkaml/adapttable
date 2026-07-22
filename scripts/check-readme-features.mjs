#!/usr/bin/env node
/**
 * Every adapter README must advertise every feature the library ships.
 *
 * This exists because it failed in the worst way: cell editing, row grouping,
 * CSV export, column management, virtualization, saved views and row expansion
 * all shipped, and none of them reached a single adapter README. The lists were
 * written around 1.0 and silently froze, so npm showed a table library that
 * apparently could not edit a cell or export a row — for months, across eleven
 * published packages, while the docs site said otherwise.
 *
 * Nothing detects that. Tests pass, types check, the site builds. Only a reader
 * on npm sees it, and they leave instead of filing a bug. So the gate checks it.
 *
 * Adding a docs page for a new feature therefore fails this check until every
 * adapter README mentions it. That is the point: shipping a feature includes
 * telling people it exists.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Feature docs pages → the pattern that proves a README mentions them.
 * Keyed by the `docs/<slug>.md` page so a new feature page joins the contract
 * automatically; add its matcher here in the same commit.
 */
const FEATURES = {
  "cell-editing": /cell edit/i,
  "column-management": /column management/i,
  "filtering": /filtering/i,
  "i18n-rtl": /\bRTL\b/i,
  "pagination": /paginat/i,
  "row-expansion": /row expansion/i,
  "row-grouping": /grouping/i,
  "saved-views": /saved view/i,
  "selection": /selection/i,
  "sorting": /sorting/i,
  "virtualization": /virtuali/i,
  // Not its own page — documented under customization.
  "csv-export": /csv/i,
};

const adapters = readdirSync(join(root, "packages")).filter((d) =>
  d.startsWith("adapter-")
);

const problems = [];

// Any feature docs page missing from the contract above is a silent gap.
const documented = readdirSync(join(root, "docs"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""));
const IGNORED = new Set([
  "api", "columns", "comparison", "concepts", "customization", "data-tiers",
  "faq", "getting-started", "url-state", "versioning",
]);
for (const page of documented) {
  if (page.startsWith("migrate-") || IGNORED.has(page)) continue;
  if (!(page in FEATURES)) {
    problems.push(
      `docs/${page}.md is a feature page with no entry in FEATURES — ` +
        `add its matcher to scripts/check-readme-features.mjs, then make sure ` +
        `every adapter README mentions it.`
    );
  }
}

for (const adapter of adapters) {
  const path = join(root, "packages", adapter, "README.md");
  const readme = readFileSync(path, "utf8");
  const section = /^## Features\n([\s\S]*?)(?=^## )/m.exec(readme);

  if (!section) {
    problems.push(`packages/${adapter}/README.md has no "## Features" section.`);
    continue;
  }

  const missing = Object.entries(FEATURES)
    .filter(([, pattern]) => !pattern.test(section[1]))
    .map(([name]) => name);

  if (missing.length > 0) {
    problems.push(
      `packages/${adapter}/README.md does not mention: ${missing.join(", ")}`
    );
  }
}

if (problems.length > 0) {
  console.error("README feature parity check failed:\n");
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error(
    `\n${problems.length} problem(s). A feature nobody can find on npm ` +
      `is a feature that does not exist.`
  );
  process.exit(1);
}

console.log(
  `README feature parity: ${adapters.length} adapters × ` +
    `${Object.keys(FEATURES).length} features, all present.`
);
