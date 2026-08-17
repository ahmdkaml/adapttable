import { expect, type Page, test } from "@playwright/test";

/**
 * The utility-class kits look like themselves on every page.
 *
 * `@adapttable/unstyled` renders native controls by contract, so the Tailwind
 * tab's whole appearance is the class map the page hands it — and the pages
 * that mount a kit's table directly (`kitTable`) have to pass it themselves,
 * because they never go through an adapter demo that would. Miss it on one
 * page and that page answers a Tailwind click with raw HTML, which is exactly
 * what jsdom cannot see: the classes are in the DOM either way, so this asserts
 * the computed look as well.
 */

/** The pages that build their own table instead of mounting an adapter demo. */
const PAGES = ["/saved-views/", "/scale/", "/pivot/"] as const;

/** Both members of the unstyled family: one preset from the page, one baked in. */
const KITS = ["tailwind", "shadcn"] as const;

const tableRoot = (page: Page) =>
  page.locator('[data-adapttable-part="root"]').first();

for (const path of PAGES) {
  for (const kit of KITS) {
    test(`${path} · ${kit}: the table carries the kit's classes`, async ({
      page,
    }) => {
      await page.goto(`${path}?kit=${kit}`);
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
 * The panel beside the table is the same promise: native markup with the
 * kit's classes, not raw HTML next to a styled table.
 */
for (const kit of KITS) {
  test(`/saved-views/ · ${kit}: the panel carries the kit's classes`, async ({
    page,
  }) => {
    await page.goto(`/saved-views/?kit=${kit}`);
    const panel = page.locator('[data-adapttable-part="saved-views-panel"]');
    await expect(panel).toBeVisible();

    const look = await panel.evaluate((element) => ({
      className: element.className,
      radius: parseFloat(getComputedStyle(element).borderTopLeftRadius),
      row:
        element.querySelector('[data-adapttable-part="saved-view-row"]')
          ?.className ?? "",
      apply: element.querySelector<HTMLElement>("button")?.className ?? "",
    }));

    expect(
      look.className,
      `the ${kit} saved-views panel renders unstyled`
    ).toMatch(/rounded|border|bg-/);
    expect(look.radius).toBeGreaterThan(0);
    expect(look.row).not.toBe("");
    expect(look.apply).not.toBe("");
  });
}
