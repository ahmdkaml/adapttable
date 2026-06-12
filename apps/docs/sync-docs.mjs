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

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "../../docs");
const target = join(here, "src/content/docs");

const TITLES = {
  // The root page carries the value proposition for search engines; the
  // sidebar still labels it "Getting started" (astro.config).
  "getting-started.md": "AdaptTable — Headless React Data Table",
  "customization.md": "Customization",
  "url-state.md": "URL state",
  "api.md": "API reference",
  "comparison.md": "Comparison",
};

mkdirSync(target, { recursive: true });
for (const file of readdirSync(source)) {
  if (!file.endsWith(".md")) continue;
  const raw = readFileSync(join(source, file), "utf8");
  // Drop the H1 (Starlight renders the frontmatter title) and de-link
  // repo-relative paths that have no meaning on the site.
  const body = raw
    .replace(/^# .*\n/, "")
    // Getting started lives at the site root now.
    .replace(/\(\.\/getting-started\.md\)/g, "(/adapttable/)");
  const title = TITLES[file] ?? file.replace(/\.md$/, "");
  // Getting started IS the site root — its content serves at "/" directly
  // (no landing page, no redirect): index.md is how Starlight roots a page.
  const outName = file === "getting-started.md" ? "index.md" : file;
  writeFileSync(
    join(target, outName),
    `---\ntitle: ${JSON.stringify(title)}\n---\n\n${body}`
  );
}
// LLM-search surface (llmstxt.org): /llms.txt is the index, /llms-full.txt
// the whole documentation in one file. Tools like Perplexity/ChatGPT
// search fetch these from the site root, so they ship with every deploy.
const pub = join(here, "public");
mkdirSync(pub, { recursive: true });
copyFileSync(join(here, "../../llms-full.txt"), join(pub, "llms-full.txt"));
const SITE = "https://orwa-mahmoud.github.io/adapttable";
const LLMS_INDEX = `# AdaptTable

> Headless, UI-agnostic React data table: one declarative API (columns,
> filters, three data tiers) rendered natively by Mantine, MUI, Chakra UI,
> Ant Design, or your own Tailwind classes. URL-synced state, operator
> filters, column management, saved views, virtualization (50k rows), full
> i18n + RTL (10 locales), dark mode. MIT.

## Docs

- [Getting started](${SITE}/): install (npx @adapttable/cli init), providers, first table
- [Concepts](${SITE}/concepts/): TableSource, data tiers, virtualization
- [Customization](${SITE}/customization/): slots, classNames, theming per kit
- [URL state](${SITE}/url-state/): adapters, urlKey namespacing, urlSync opt-out
- [API reference](${SITE}/api/): every prop and headless hook
- [FAQ](${SITE}/faq/)
- [Comparison](${SITE}/comparison/): vs TanStack Table and kit-native tables
- [Full docs in one file](${SITE}/llms-full.txt)

## Demo

- [Live demo](${SITE}/demo/): all five adapters on one dataset
`;
writeFileSync(join(pub, "llms.txt"), LLMS_INDEX);
console.log("docs synced into Starlight");
