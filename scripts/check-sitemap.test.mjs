import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";

import {
  auditDemoRoutes,
  classifyDemoPages,
  deadRoutes,
  demoPages,
} from "./check-sitemap.mjs";
import { SITE } from "./sitemap-routes.mjs";

const ROOT_ROUTE = "/demo/";
const COLUMNS_ROUTE = "/demo/columns/";
const STUB_ROUTE = "/demo/export-pdf/";
const LEGACY_ROUTE = "/demo/legacy/";
const ORPHAN_ROUTE = "/demo/orphan/";
/** Listed in a sitemap, built by nobody. */
const GHOST_ROUTE = "/demo/ghost/";

const INDEX = "index.html";
const PAGE = '<!doctype html><meta charset="utf-8" /><title>A demo</title>';
const STUB =
  '<!doctype html><meta http-equiv="refresh" content="0; url=../export/" />';

/**
 * `/demo/legacy/` is deliberately absent: it stands for a stub nobody
 * registered, which the meta-refresh sniff has to catch on its own.
 */
const MANIFEST = [
  { key: "main", html: "./index.html", route: ROOT_ROUTE, indexable: true },
  {
    key: "columns",
    html: "./columns/index.html",
    route: COLUMNS_ROUTE,
    indexable: true,
  },
  {
    key: "export-pdf",
    html: "./export-pdf/index.html",
    route: STUB_ROUTE,
    indexable: false,
  },
];

const temps = [];

const write = (root, rel, body) => {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
};

/** A composed site: two real pages, two stubs, one unlisted page, one asset. */
const composed = () => {
  const root = mkdtempSync(join(tmpdir(), "adapttable-sitemap-"));
  temps.push(root);
  write(root, join("demo", INDEX), PAGE);
  write(root, join("demo", "columns", INDEX), PAGE);
  write(root, join("demo", "export-pdf", INDEX), STUB);
  write(root, join("demo", "legacy", INDEX), STUB);
  write(root, join("demo", "orphan", INDEX), PAGE);
  write(root, join("demo", "assets", "app.js"), "// bundle");
  return root;
};

const empty = () => {
  const root = mkdtempSync(join(tmpdir(), "adapttable-sitemap-"));
  temps.push(root);
  return root;
};

const urlset = (routes) =>
  `<urlset>${routes
    .map((route) => `<url><loc>${SITE}${route}</loc></url>`)
    .join("")}</urlset>`;

after(() => {
  for (const root of temps) rmSync(root, { recursive: true, force: true });
});

describe("demoPages", () => {
  it("finds every built page and nothing that is not one", () => {
    assert.deepEqual(
      demoPages(composed()).map((page) => page.route),
      [ROOT_ROUTE, COLUMNS_ROUTE, STUB_ROUTE, LEGACY_ROUTE, ORPHAN_ROUTE].sort(
        (a, b) => a.localeCompare(b)
      )
    );
  });

  it("finds no pages in a tree that was never composed", () => {
    assert.deepEqual(demoPages(empty()), []);
  });
});

describe("classifyDemoPages", () => {
  it("excludes a stub the manifest marks and one only the HTML reveals", () => {
    const { crawlable, redirects } = classifyDemoPages(composed(), MANIFEST);
    assert.deepEqual(crawlable, [ROOT_ROUTE, COLUMNS_ROUTE, ORPHAN_ROUTE]);
    assert.deepEqual(redirects, [STUB_ROUTE, LEGACY_ROUTE]);
  });
});

describe("auditDemoRoutes", () => {
  it("names the crawlable route the sitemap left out", () => {
    const xml = urlset([ROOT_ROUTE, COLUMNS_ROUTE]);
    assert.deepEqual(auditDemoRoutes(composed(), xml, MANIFEST).missing, [
      ORPHAN_ROUTE,
    ]);
  });

  it("finds nothing wrong when the sitemap carries every crawlable route", () => {
    const xml = urlset([ROOT_ROUTE, COLUMNS_ROUTE, ORPHAN_ROUTE]);
    const { missing, dead } = auditDemoRoutes(composed(), xml, MANIFEST);
    assert.deepEqual(missing, []);
    assert.deepEqual(dead, []);
  });

  it("never asks the sitemap to carry a redirect", () => {
    const xml = urlset([ROOT_ROUTE, COLUMNS_ROUTE, ORPHAN_ROUTE]);
    const { missing, redirects } = auditDemoRoutes(composed(), xml, MANIFEST);
    assert.equal(missing.includes(STUB_ROUTE), false);
    assert.equal(missing.includes(LEGACY_ROUTE), false);
    assert.deepEqual(redirects, [STUB_ROUTE, LEGACY_ROUTE]);
  });

  it("names a sitemap route with no page behind it", () => {
    const xml = urlset([ROOT_ROUTE, COLUMNS_ROUTE, ORPHAN_ROUTE, GHOST_ROUTE]);
    assert.deepEqual(auditDemoRoutes(composed(), xml, MANIFEST).dead, [
      GHOST_ROUTE,
    ]);
  });
});

describe("deadRoutes", () => {
  it("names a sitemap route with no page behind it", () => {
    const xml = urlset([ROOT_ROUTE, GHOST_ROUTE]);
    assert.deepEqual(deadRoutes(composed(), xml), [GHOST_ROUTE]);
  });

  it("accepts a sitemap whose demo routes are all built", () => {
    const xml = urlset([ROOT_ROUTE, COLUMNS_ROUTE]);
    assert.deepEqual(deadRoutes(composed(), xml), []);
  });
});
