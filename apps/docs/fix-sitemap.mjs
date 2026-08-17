// Post-build sitemap repair. Three real-world GSC problems on GitHub Pages:
//   1. @astrojs/sitemap builds the landing loc as site+base WITHOUT a
//      trailing slash — that URL sits OUTSIDE the URL-prefix property
//      ("…/adapttable" vs the "…/adapttable/" scope GSC watches).
//   2. GSC has left the sitemap-index.xml + sitemap-0.xml pair in
//      "pending / never downloaded" limbo since Jun 16 — the widely
//      confirmed workaround is a FLAT, conventionally named sitemap.xml.
//   3. The demo pages are built by Vite in apps/showcase, not by Astro, so
//      the sitemap plugin never sees them. Six live, linked, indexable pages
//      were missing from the sitemap entirely — including /demo/editing/ and
//      /demo/grouping/, which the docs link to as "see it working".
// This emits dist/sitemap.xml (flat, slash-fixed, demo pages included)
// alongside the originals.
import { readFileSync, writeFileSync } from "node:fs";

const SITE = "https://orwa-mahmoud.github.io/adapttable";

/**
 * Demo pages, each its own Vite entry in `apps/showcase`. Keep in step with
 * the `input` map in apps/showcase/vite.config.ts — adding a page there
 * without adding it here leaves it undiscoverable from the sitemap, which is
 * how nine live pages (filtering, tree, selection, pagination, accessibility,
 * realtime, pivot, saved views and the Feature Lab) stayed unlisted while the
 * docs linked to them as "see it working".
 *
 * `/demo/export-pdf/` is deliberately absent: it is a meta-refresh stub kept
 * so published links do not 404, and a redirect in a sitemap asks Google to
 * index the page it redirects away from.
 */
const DEMO_PAGES = [
  "/demo/",
  "/demo/accessibility/",
  "/demo/all-options/",
  "/demo/columns/",
  "/demo/editing/",
  "/demo/export/",
  "/demo/filtering/",
  "/demo/formulas/",
  "/demo/grouping/",
  "/demo/mobile/",
  "/demo/pagination/",
  "/demo/pivot/",
  "/demo/realtime/",
  "/demo/rtl/",
  "/demo/saved-views/",
  "/demo/scale/",
  "/demo/selection/",
  "/demo/tree/",
];

const dist = new URL("./dist/", import.meta.url);
let xml = readFileSync(new URL("sitemap-0.xml", dist), "utf8");
xml = xml.replaceAll(`<loc>${SITE}</loc>`, `<loc>${SITE}/</loc>`);

// slash-fixing the landing loc can duplicate an existing entry — dedupe by loc
const seen = new Set();
xml = xml.replace(/<url>.*?<\/url>/g, (block) => {
  const loc = /<loc>(.*?)<\/loc>/.exec(block)?.[1];
  if (seen.has(loc)) return "";
  seen.add(loc);
  return block;
});

// Append the Vite-built demo pages that Astro cannot know about.
const extra = DEMO_PAGES.filter((p) => !seen.has(`${SITE}${p}`))
  .map((p) => {
    seen.add(`${SITE}${p}`);
    return `<url><loc>${SITE}${p}</loc></url>`;
  })
  .join("");
xml = xml.replace("</urlset>", `${extra}</urlset>`);

writeFileSync(new URL("sitemap-0.xml", dist), xml);
writeFileSync(new URL("sitemap.xml", dist), xml);
console.log(
  `sitemap.xml written (flat, slash-fixed, ${seen.size} unique urls, ` +
    `${DEMO_PAGES.length} demo pages)`
);
