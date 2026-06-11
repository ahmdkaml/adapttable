/**
 * Copy the repo's canonical docs/*.md into Starlight's content collection,
 * injecting the frontmatter Starlight requires. The repo docs stay the
 * single source of truth; this runs before every dev/build.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "../../docs");
const target = join(here, "src/content/docs");

const TITLES = {
  "getting-started.md": "Getting started",
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
  const body = raw.replace(/^# .*\n/, "");
  const title = TITLES[file] ?? file.replace(/\.md$/, "");
  writeFileSync(
    join(target, file),
    `---\ntitle: ${JSON.stringify(title)}\n---\n\n${body}`
  );
}
// The site root: a splash landing the repo docs don't carry (they're
// guide pages). Emitted here so the generated content dir stays the only
// owner of src/content/docs.
const INDEX = `---
title: AdaptTable
description: One headless React data-table engine with batteries-included adapters for Mantine, MUI, Chakra UI, Ant Design, and Tailwind.
template: splash
hero:
  tagline: One headless engine. Every UI kit. URL-synced state, real filters, RTL, virtualization — rendered natively by your design system.
  actions:
    - text: Get started
      link: /adapttable/getting-started/
      icon: right-arrow
      variant: primary
    - text: Live demo
      link: /adapttable/demo/
      icon: rocket
    - text: GitHub
      link: https://github.com/orwa-mahmoud/adapttable
      icon: github
      variant: minimal
---

import { Card, CardGrid } from "@astrojs/starlight/components";

<CardGrid stagger>
  <Card title="Declarative columns & filters" icon="setting">
    \`{ key: "team", filter: "multiSelect" }\` — the widget, URL params,
    chips and predicate all derive from one definition.
  </Card>
  <Card title="Your design system" icon="puzzle">
    The same table renders natively in Mantine, MUI, Chakra UI, Ant
    Design, or your own Tailwind classes — pick an adapter, keep the API.
  </Card>
  <Card title="URL-synced everything" icon="external">
    Search, sort, filters, pagination, column layout and saved views all
    live in shareable URLs.
  </Card>
  <Card title="50,000 rows, no flinching" icon="rocket">
    Opt-in virtualization windows the DOM against the page or any scroll
    box — try it in the live demo.
  </Card>
</CardGrid>
`;
writeFileSync(join(target, "index.mdx"), INDEX);
console.log("docs synced into Starlight");
