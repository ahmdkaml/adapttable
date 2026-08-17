/**
 * The showcase page manifest — the one list of demo pages this repo keeps.
 *
 * Three consumers read it and nothing else:
 *   - `apps/showcase/vite.config.ts` generates `rollupOptions.input` from it,
 *     so an entry here is a page that ships.
 *   - `apps/docs/fix-sitemap.mjs` generates the `/demo/` URLs of
 *     `dist/sitemap.xml` from the indexable entries, and fails the docs build
 *     if one of them is not listed exactly once.
 *   - `scripts/check-sitemap.mjs` walks the composed site and fails when a
 *     built demo page is missing from that sitemap.
 *
 * One entry here is therefore the whole registration: the page builds, it is
 * crawlable, and the checks that prove both read the same line. Two separate
 * lists is how nine live pages — filtering, tree, selection, pagination,
 * accessibility, realtime, pivot, saved views and the Feature Lab — stayed out
 * of the sitemap while the docs linked to them as "see it working".
 *
 * @typedef {object} ShowcasePage
 * @property {string} key Rollup input name, and the basename Vite gives the
 *   page's chunk and CSS asset.
 * @property {string} html HTML entry, relative to the showcase package root —
 *   where this file and `vite.config.ts` both sit.
 * @property {string} route Public path on the composed site, which serves the
 *   showcase under `/demo/`. Trailing slash always: that is the form Pages
 *   serves a directory index at, and the form the sitemap has to carry.
 * @property {boolean} indexable Whether the route belongs in the sitemap. A
 *   page that must build but must never be indexed sets `false`; a redirect
 *   stub is that case, because listing one asks a crawler to index a URL whose
 *   whole content is "the page is elsewhere".
 */

/**
 * A demo whose directory name is also its key and its route segment — every
 * page except the landing page.
 *
 * @param {string} dir
 * @param {{ indexable?: boolean }} [options]
 * @returns {ShowcasePage}
 */
const demo = (dir, { indexable = true } = {}) => ({
  key: dir,
  html: `./${dir}/index.html`,
  route: `/demo/${dir}/`,
  indexable,
});

/**
 * Alphabetical after the landing page, which is the section root.
 *
 * @type {ShowcasePage[]}
 */
export const SHOWCASE_PAGES = [
  { key: "main", html: "./index.html", route: "/demo/", indexable: true },
  demo("accessibility"),
  demo("all-options"),
  demo("columns"),
  demo("editing"),
  demo("export"),
  // The export demo's former address, kept as a static meta-refresh stub so no
  // published link 404s. It carries no bundle — it is HTML only — and a
  // redirect in a sitemap asks Google to index the page it sends readers away
  // from, so it builds and stays unlisted.
  demo("export-pdf", { indexable: false }),
  demo("filtering"),
  demo("formulas"),
  demo("grouping"),
  demo("mobile"),
  demo("pagination"),
  demo("pivot"),
  demo("realtime"),
  demo("rtl"),
  demo("saved-views"),
  demo("scale"),
  demo("selection"),
  demo("tree"),
];
