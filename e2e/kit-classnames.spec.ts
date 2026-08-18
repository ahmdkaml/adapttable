import { expect, type Page, test } from "@playwright/test";

import { builtAdapters } from "../apps/showcase/matrix.mjs";

/**
 * The kits look like themselves wherever they are mounted.
 *
 * `@adapttable/unstyled` renders native controls by contract, so the Tailwind
 * tab's whole appearance is the class map the page hands it. Miss it and that
 * page answers a Tailwind click with raw HTML — which is exactly what jsdom
 * cannot see, because the classes are in the DOM either way. So this asserts
 * the computed look, not the markup.
 *
 * Two surfaces, because they get the map by different routes: a page that
 * mounts an adapter demo (the live demo, the Feature Lab), and a page that
 * builds its own table and panel from `kitTable` / `kitSavedViewsPanel` and so
 * has to pass the map itself.
 */

/** Both members of the unstyled family: one preset from the page, one baked in. */
const KITS = ["tailwind", "shadcn"] as const;

/** The pages where a reader picks the kit. */
const SWITCHER_PAGES = ["/", "/all-options/"] as const;

const tableRoot = (page: Page) =>
  page.locator('[data-adapttable-part="root"]').first();

for (const path of SWITCHER_PAGES) {
  for (const kit of KITS) {
    test(`${path} · ${kit}: the table carries the kit's classes`, async ({
      page,
    }) => {
      if (path === "/") {
        await page.goto(`/?kit=${kit}`);
      } else {
        await page.goto(path);
        await page.getByTestId(`adapter-${kit}`).click();
        await expect(page).not.toHaveURL(/[?&]kit=/);
      }
      const root = tableRoot(page);
      await expect(root).toBeVisible();

      const look = await root.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          className: element.className,
          radius: parseFloat(style.borderTopLeftRadius),
          borderWidth: parseFloat(style.borderTopWidth),
        };
      });

      // The utility classes are on the element…
      expect(
        look.className,
        `${path} (${kit}) mounts the unstyled table with no class map`
      ).toMatch(/rounded|border/);
      // …and Tailwind compiled them, so they actually draw the kit.
      expect(look.radius).toBeGreaterThan(0);
      expect(look.borderWidth).toBeGreaterThan(0);
    });
  }
}

/**
 * The panel beside the table, on each adapter's own saved-views page.
 *
 * The page fixes the kit — that is what an adapter-first demo means — so the
 * loop runs over the adapters whose pages are built, and grows to cover the
 * utility-class kits as their pages arrive. A panel that carries no card of
 * its own is a panel mounted without its kit.
 */
for (const adapter of builtAdapters()) {
  test(`${adapter.key}: the saved-views panel is drawn by its kit`, async ({
    page,
  }) => {
    await page.goto(`/${adapter.key}/saved-views/`);
    const panel = page.locator('[data-adapttable-part="saved-views-panel"]');
    await expect(panel).toBeVisible();

    const look = await panel.evaluate((element) => {
      const style = getComputedStyle(element);
      // A kit draws a card's edge with whatever it draws edges with. Radix
      // Themes' Card paints a one-pixel ring as a box-shadow on `::after`
      // rather than a border, so a border-only measure reads "no card" on a
      // panel that plainly has one.
      const ring = (value: string) => value !== "none" && value !== "";
      const edged =
        parseFloat(style.borderTopWidth) > 0 ||
        ring(style.boxShadow) ||
        ring(getComputedStyle(element, "::after").boxShadow);
      return {
        radius: parseFloat(style.borderTopLeftRadius),
        edged,
        title:
          element
            .querySelector('[data-adapttable-part="saved-views-title"]')
            ?.textContent?.trim() ?? "",
        cluster: element.querySelectorAll(
          '[data-adapttable-part="saved-view-controls"] button'
        ).length,
        rows: element.querySelectorAll(
          '[data-adapttable-part="saved-view-row"]'
        ).length,
      };
    });

    // A card: the panel has an edge of its own rather than floating on the
    // page, which is what a titled container is for.
    expect(look.radius, `the ${adapter.key} panel has no card`).toBeGreaterThan(
      0
    );
    expect(look.edged, `the ${adapter.key} panel has no edge`).toBe(true);
    expect(look.title.toLowerCase()).toContain("saved views");
    // Two seeded views, each with the same five-icon cluster — a kit that
    // renders four of them, or none, is a kit that did not get the contract.
    expect(look.rows).toBe(2);
    expect(look.cluster).toBe(look.rows * 5);
  });
}
