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
console.log("docs synced into Starlight");
