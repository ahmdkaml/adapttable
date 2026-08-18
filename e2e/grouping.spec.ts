import { expect, test } from "@playwright/test";

import { builtAdapters } from "../apps/showcase/matrix.mjs";

import { gotoFromNav } from "./nav";

/**
 * The grouping page across every kit.
 *
 * Group headers, their counts and the collapse toggle are chrome each adapter
 * renders with its own controls, so a kit that draws none of it fails silently
 * — the table still shows rows, just ungrouped.
 */
/**
 * The adapters whose own pages are built. Each feature page fixes its
 * kit, so the loop is over URLs rather than over clicks on a switcher
 * the page no longer needs — and it widens to the whole grid as the
 * remaining adapters' pages arrive.
 */
const KITS = builtAdapters().map((adapter) => adapter.key);

test("is reachable from the demo nav", async ({ page }) => {
  await page.goto("/");
  await gotoFromNav(page, "Features", "Grouping");
  await expect(page).toHaveURL(/\/grouping\/$/);
});

for (const kit of KITS) {
  test(`${kit}: groups rows under headers that collapse`, async ({ page }) => {
    await page.goto(`/${kit}/grouping/`);
    const root = page.locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();

    const headers = root.locator('[data-adapttable-part="group-label"]');
    await expect(headers.first()).toBeVisible();
    const before = await root.locator("tbody tr:visible").count();

    // Collapsing a group has to remove its rows, in every kit.
    await root.locator('[data-adapttable-part="group-toggle"]').first().click();
    await expect
      .poll(async () => root.locator("tbody tr:visible").count())
      .toBeLessThan(before);
  });
}
