import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  indexableRoutes,
  isRedirectPage,
  locsIn,
  routeCountFaults,
  routeForFile,
  SITE,
} from "./sitemap-routes.mjs";

const ROOT_ROUTE = "/demo/";
const COLUMNS_ROUTE = "/demo/columns/";
const STUB_ROUTE = "/demo/export-pdf/";

/** A manifest shaped like the real one, small enough to reason about. */
const PAGES = [
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

const urlset = (routes) =>
  `<urlset>${routes
    .map((route) => `<url><loc>${SITE}${route}</loc></url>`)
    .join("")}</urlset>`;

describe("locsIn", () => {
  it("reads every loc in document order, trimmed", () => {
    const xml = `<urlset><url><loc> ${SITE}/ </loc></url><url><loc>${SITE}${ROOT_ROUTE}</loc></url></urlset>`;
    assert.deepEqual(locsIn(xml), [`${SITE}/`, `${SITE}${ROOT_ROUTE}`]);
  });

  it("reads nothing from a document with no urls", () => {
    assert.deepEqual(locsIn("<urlset></urlset>"), []);
  });
});

describe("indexableRoutes", () => {
  it("keeps manifest order and drops what the manifest excludes", () => {
    assert.deepEqual(indexableRoutes(PAGES), [ROOT_ROUTE, COLUMNS_ROUTE]);
  });
});

describe("routeCountFaults", () => {
  it("finds no fault when each indexable route is listed once", () => {
    assert.deepEqual(
      routeCountFaults(urlset([ROOT_ROUTE, COLUMNS_ROUTE]), PAGES),
      []
    );
  });

  it("reports a route the sitemap left out, with a count of zero", () => {
    assert.deepEqual(routeCountFaults(urlset([ROOT_ROUTE]), PAGES), [
      { route: COLUMNS_ROUTE, count: 0 },
    ]);
  });

  it("reports a duplicated route with the number of entries", () => {
    assert.deepEqual(
      routeCountFaults(
        urlset([ROOT_ROUTE, COLUMNS_ROUTE, COLUMNS_ROUTE]),
        PAGES
      ),
      [{ route: COLUMNS_ROUTE, count: 2 }]
    );
  });

  it("ignores a route the manifest marks unindexable", () => {
    assert.deepEqual(
      routeCountFaults(urlset([ROOT_ROUTE, COLUMNS_ROUTE, STUB_ROUTE]), PAGES),
      []
    );
  });

  it("does not accept a loc that dropped its trailing slash", () => {
    const xml = `<urlset><url><loc>${SITE}/demo</loc></url></urlset>`;
    assert.deepEqual(routeCountFaults(xml, [PAGES[0]]), [
      { route: ROOT_ROUTE, count: 0 },
    ]);
  });
});

describe("isRedirectPage", () => {
  it("recognises the committed export-pdf stub", () => {
    const stub = fileURLToPath(
      new URL("../apps/showcase/export-pdf/index.html", import.meta.url)
    );
    assert.equal(isRedirectPage(readFileSync(stub, "utf8")), true);
  });

  it("recognises an unquoted, upper-case meta refresh", () => {
    assert.equal(
      isRedirectPage("<META HTTP-EQUIV=REFRESH CONTENT='0; url=/elsewhere/'>"),
      true
    );
  });

  it("leaves a real page alone", () => {
    assert.equal(
      isRedirectPage('<meta charset="utf-8" /><title>Columns</title>'),
      false
    );
  });

  it("only reads meta tags, not prose that mentions one", () => {
    assert.equal(
      isRedirectPage("<p>Static hosts redirect with http-equiv=refresh.</p>"),
      false
    );
  });
});

describe("routeForFile", () => {
  it("turns a built index into the route it serves", () => {
    assert.equal(routeForFile("demo/columns/index.html"), COLUMNS_ROUTE);
  });

  it("turns the section root into the section route", () => {
    assert.equal(routeForFile("demo/index.html"), ROOT_ROUTE);
  });
});
