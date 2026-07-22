// Post-build sitemap repair. Two real-world GSC problems on GitHub Pages:
//   1. @astrojs/sitemap builds the landing loc as site+base WITHOUT a
//      trailing slash — that URL sits OUTSIDE the URL-prefix property
//      ("…/adapttable" vs the "…/adapttable/" scope GSC watches).
//   2. GSC has left the sitemap-index.xml + sitemap-0.xml pair in
//      "pending / never downloaded" limbo since Jun 16 — the widely
//      confirmed workaround is a FLAT, conventionally named sitemap.xml.
// This emits dist/sitemap.xml (flat, slash-fixed) alongside the originals.
import { readFileSync, writeFileSync } from "node:fs";

const dist = new URL("./dist/", import.meta.url);
let xml = readFileSync(new URL("sitemap-0.xml", dist), "utf8");
xml = xml.replaceAll(
  "<loc>https://orwa-mahmoud.github.io/adapttable</loc>",
  "<loc>https://orwa-mahmoud.github.io/adapttable/</loc>"
);
// slash-fixing the landing loc can duplicate an existing entry — dedupe by loc
const seen = new Set();
xml = xml.replace(/<url>.*?<\/url>/g, (block) => {
  const loc = /<loc>(.*?)<\/loc>/.exec(block)?.[1];
  if (seen.has(loc)) return "";
  seen.add(loc);
  return block;
});
writeFileSync(new URL("sitemap-0.xml", dist), xml);
writeFileSync(new URL("sitemap.xml", dist), xml);
console.log(
  `sitemap.xml written (flat, slash-fixed, ${seen.size} unique urls)`
);
