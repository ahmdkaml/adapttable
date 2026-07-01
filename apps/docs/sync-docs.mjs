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
  "concepts.md": "Concepts",
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
  "i18n-rtl.md": "i18n & RTL",
  "api.md": "API reference",
  "faq.md": "FAQ",
  "comparison.md": "AdaptTable vs ag-Grid, MUI X & TanStack Table",
  "versioning.md": "Versioning & stability",
};

// Per-page meta descriptions — the SERP snippet + og:description Starlight
// emits from `description`. Keyword-rich and unique per page so search and
// answer engines have something better than a generic site default.
const DESCRIPTIONS = {
  "getting-started.md":
    "Get started with AdaptTable — install an adapter for Mantine, MUI, Chakra, Ant, Radix or shadcn, pass columns and data, and ship a full React data table fast.",
  "concepts.md":
    "Core concepts behind AdaptTable — the headless engine, TableSource, adapters and columns that render one declarative API natively across React UI kits.",
  "columns.md":
    "Define AdaptTable columns declaratively in React: accessors, sorting, per-column filters, alignment, pinning and custom cell rendering from one ColumnDef.",
  "sorting.md":
    "Sorting in AdaptTable React tables — single and multi-column sort, custom comparators, server-side sorting and accessible aria-sort headers.",
  "filtering.md":
    "Declarative filtering for AdaptTable React tables: text, select, multi-select, number and date-range operators, filter chips and URL-synced state.",
  "pagination.md":
    "Pagination in AdaptTable React tables — numbered pages or infinite scroll, page-size control, server-side paging and shareable URL state.",
  "selection.md":
    "Row selection and bulk actions in AdaptTable — select a page or all matches across pages, and run bulk actions through an injectable confirm dialog.",
  "row-expansion.md":
    "Expandable rows in an AdaptTable React data table — render per-row detail panels with accessible toggles and full keyboard support.",
  "column-management.md":
    "Show/hide, reorder, pin (sticky) and resize columns in an AdaptTable React data table, with a persistent, URL-synced column layout.",
  "saved-views.md":
    "Saved views in AdaptTable — capture filters, sorting and column layout as named views your users can save, restore and share by URL.",
  "virtualization.md":
    "Row and card virtualization in AdaptTable — window tens of thousands of rows against the page or a scroll container for smooth, large-list React tables.",
  "data-tiers.md":
    "AdaptTable's three data tiers: in-memory array, server-side fetch via onQueryChange, or a custom TableSource — client and server data in one React API.",
  "customization.md":
    "Customize an AdaptTable React table from props to fully headless: slots, classNames, data-* state hooks, custom toolbars and prop-getters — no ejecting.",
  "url-state.md":
    "URL-synced state in AdaptTable — search, sort, filters, pagination and column layout live in shareable, SSR-safe URLs, namespaced per table.",
  "i18n-rtl.md":
    "Internationalization and RTL in AdaptTable — locale label presets, per-locale column data paths, logical column pinning and first-class Arabic/Hebrew support.",
  "api.md":
    "Complete API reference for AdaptTable — DataTable props, ColumnDef, filters, source builders, prop-getters and the headless useDataTable hook for React.",
  "faq.md":
    "Frequently asked questions about AdaptTable — the headless React data table for Mantine, MUI, Chakra, Ant Design, Radix and shadcn/ui. SSR, bundle size, licensing.",
  "comparison.md":
    "How AdaptTable compares to ag-Grid, MUI X DataGrid and TanStack Table — native per-kit UI, a headless core and an MIT license, feature by feature.",
  "versioning.md":
    "AdaptTable's versioning and stability policy — semantic versioning, the committed-stable public API surface, deprecation policy and the fixed-group release flow.",
};

const SITE = "https://orwa-mahmoud.github.io/adapttable";

// Flatten an answer's markdown to plain text for FAQPage structured data.
function mdToText(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Parse the FAQ's `## Question` sections into question/answer pairs.
function parseFaq(raw) {
  return raw
    .split(/\n## /)
    .slice(1)
    .map((part) => {
      const nl = part.indexOf("\n");
      return { q: part.slice(0, nl).trim(), a: mdToText(part.slice(nl + 1)) };
    })
    .filter(({ q, a }) => q && a);
}

function faqPage(pairs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function breadcrumbList(title, slug) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AdaptTable",
        item: `${SITE}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: `${SITE}/${slug}/`,
      },
    ],
  };
}

// Serialize Starlight frontmatter `head` entries. JSON-LD content is
// stringified twice: once to the LD string, once to a YAML-safe scalar.
function ldScript(obj) {
  return `  - tag: script\n    attrs:\n      type: application/ld+json\n    content: ${JSON.stringify(JSON.stringify(obj))}`;
}
function metaEntry(key, name, content) {
  return `  - tag: meta\n    attrs:\n      ${key}: ${JSON.stringify(name)}\n      content: ${JSON.stringify(content)}`;
}
function headBlock(entries) {
  if (!entries.length) return "";
  return `head:\n${entries.join("\n")}\n`;
}

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
  const description = DESCRIPTIONS[file];
  const slug = file.replace(/\.md$/, "");

  // Structured data: a BreadcrumbList on every page, plus FAQPage on the FAQ
  // so its Q&As are eligible for Google rich results.
  const jsonLd = [breadcrumbList(title, slug)];
  if (file === "faq.md") jsonLd.push(faqPage(parseFaq(raw)));

  // Per-page social-share card (generated under public/og/<slug>.png).
  const ogImage = `${SITE}/og/${slug}.png`;
  const head = [
    ...jsonLd.map(ldScript),
    metaEntry("property", "og:image", ogImage),
    metaEntry("name", "twitter:image", ogImage),
  ];

  const fm = [`title: ${JSON.stringify(title)}`];
  if (description) fm.push(`description: ${JSON.stringify(description)}`);
  const frontmatter = `---\n${fm.join("\n")}\n${headBlock(head)}---\n\n`;
  writeFileSync(join(target, file), `${frontmatter}${body}`);
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
