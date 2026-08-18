import { expect, test } from "@playwright/test";

import { gotoFromNav } from "./nav";

/**
 * The grouping page across every kit.
 *
 * Group headers, their counts and the collapse toggle are chrome each adapter
 * renders with its own controls, so a kit that draws none of it fails silently
 * — the table still shows rows, just ungrouped.
 */
const KITS = [
  "mantine",
  "mui",
  "chakra",
  "antd",
  "radix",
  "base-ui",
  "shadcn",
  "tailwind",
] as const;

test("is reachable from the demo nav", async ({ page }) => {
  await page.goto("/");
  await gotoFromNav(page, "Features", "Grouping");
  await expect(page).toHaveURL(/\/grouping\/$/);
});

for (const kit of KITS) {
  test(`${kit}: groups rows under headers that collapse`, async ({ page }) => {
    await page.goto("/grouping/");
    if (kit !== "mantine") {
      const tab = page.getByTestId(`adapter-${kit}`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
    }
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
