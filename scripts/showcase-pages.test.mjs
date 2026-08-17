import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { SHOWCASE_PAGES } from "../apps/showcase/pages.mjs";
import { isRedirectPage } from "./sitemap-routes.mjs";

const SHOWCASE = fileURLToPath(new URL("../apps/showcase/", import.meta.url));

const INDEX = "index.html";

/** Not page directories: build output, dependencies, static assets, source. */
const NOT_PAGES = new Set(["dist", "node_modules", "public", "src"]);

/** The HTML entries that exist on disk, in the manifest's own path spelling. */
const entriesOnDisk = () => {
  const found = existsSync(join(SHOWCASE, INDEX)) ? [`./${INDEX}`] : [];
  for (const entry of readdirSync(SHOWCASE, { withFileTypes: true })) {
    if (!entry.isDirectory() || NOT_PAGES.has(entry.name)) continue;
    if (existsSync(join(SHOWCASE, entry.name, INDEX))) {
      found.push(`./${entry.name}/${INDEX}`);
    }
  }
  return found.sort((a, b) => a.localeCompare(b));
};

const sorted = (values) => [...values].sort((a, b) => a.localeCompare(b));

describe("the showcase page manifest", () => {
  it("lists every page directory, and only pages that exist", () => {
    assert.deepEqual(
      sorted(SHOWCASE_PAGES.map((page) => page.html)),
      entriesOnDisk()
    );
  });

  it("gives every page its own key and its own route", () => {
    const keys = SHOWCASE_PAGES.map((page) => page.key);
    const routes = SHOWCASE_PAGES.map((page) => page.route);
    assert.equal(new Set(keys).size, keys.length);
    assert.equal(new Set(routes).size, routes.length);
  });

  it("routes every page under /demo/ with a trailing slash", () => {
    for (const { route } of SHOWCASE_PAGES) {
      assert.equal(route.startsWith("/demo/"), true, route);
      assert.equal(route.endsWith("/"), true, route);
    }
  });

  it("keeps a page out of the sitemap only when it forwards the reader on", () => {
    for (const { html, indexable } of SHOWCASE_PAGES) {
      if (indexable) continue;
      const source = readFileSync(join(SHOWCASE, html), "utf8");
      assert.equal(isRedirectPage(source), true, html);
    }
  });
});
