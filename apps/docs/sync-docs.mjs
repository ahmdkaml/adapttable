/**
 * Copy the repo's canonical docs/*.md into Starlight's content collection,
 * injecting the frontmatter Starlight requires. The repo docs stay the
 * single source of truth; this runs before every dev/build.
 */
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildLlmsFull } from "../../scripts/build-llms-full.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../..");
const source = join(here, "../../docs");
const target = join(here, "src/content/docs");

const TITLES = {
  "getting-started.md": "Getting started",
  "columns.md": "Columns",
  "sorting.md": "Sorting",
  "filtering.md": "Filtering",
  "pagination.md": "Pagination",
  "selection.md": "Selection & bulk actions",
  "row-expansion.md": "Row expansion",
  "column-management.md": "Column management",
  "saved-views.md": "Saved views",
  "virtualization.md": "Virtualization",
  "data-tiers.md": "Data tiers",
  "customization.md": "Customization",
  "url-state.md": "URL state",
  "api.md": "API reference",
  "comparison.md": "Comparison",
};

mkdirSync(target, { recursive: true });
for (const file of readdirSync(source)) {
  if (!file.endsWith(".md")) continue;
  const raw = readFileSync(join(source, file), "utf8");
  // Drop the H1 (Starlight renders the frontmatter title) and rewrite
  // repo-relative links into their site equivalents: doc-to-doc .md links
  // become page routes (anchors preserved), repo files point at GitHub.
  const body = raw
    .replace(/^# .*\n/, "")
    .replace(
      /\((?:\.\/)?([a-z0-9-]+)\.md(#[a-z0-9-]+)?\)/g,
      "(/adapttable/$1/$2)"
    )
    .replace(
      /\(\.\.\/([^)]+)\)/g,
      "(https://github.com/orwa-mahmoud/adapttable/blob/main/$1)"
    );
  const title = TITLES[file] ?? file.replace(/\.md$/, "");
  writeFileSync(
    join(target, file),
    `---\ntitle: ${JSON.stringify(title)}\n---\n\n${body}`
  );
}
// LLM-search surface (llmstxt.org): /llms.txt is the index, /llms-full.txt
// the whole documentation in one file. Tools like Perplexity/ChatGPT
// search fetch these from the site root, so they ship with every deploy.
// llms-full.txt is regenerated from docs/ right here so it can never go
// stale; llms.txt is the hand-written root index, copied verbatim.
const pub = join(here, "public");
mkdirSync(pub, { recursive: true });
buildLlmsFull(repoRoot);
copyFileSync(join(repoRoot, "llms-full.txt"), join(pub, "llms-full.txt"));
const llmsIndex = readFileSync(join(repoRoot, "llms.txt"), "utf8");
const unlinked = readdirSync(source).filter(
  (file) =>
    file.endsWith(".md") &&
    !llmsIndex.includes(`/adapttable/${file.replace(/\.md$/, "")}/`)
);
if (unlinked.length > 0) {
  console.warn(
    `sync-docs: llms.txt has no link for: ${unlinked.join(", ")} — add them to the root llms.txt Docs list`
  );
}
copyFileSync(join(repoRoot, "llms.txt"), join(pub, "llms.txt"));
console.log("docs synced into Starlight");
