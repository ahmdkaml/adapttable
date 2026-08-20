import { expect, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * Sparkline column — drawn by every kit, in both directions.
 *
 * The feature ships and is marketed on the README and its own docs page, so a
 * kit that silently draws nothing is a documented feature that does not exist.
 * It lives on the Feature Lab rather than the live demo: `/` is frozen, and the
 * Lab is where every shipped feature has a toggle.
 */

const ADAPTERS = [
  "mantine",
  "mui",
  "chakra",
  "antd",
  "radix",
  "base-ui",
  "shadcn",
  "tailwind",
] as const;

const demo = (page: Page) => page.locator("#demo");

/** Open the Lab on `adapter` with the sparkline column turned on. */
async function openLab(page: Page, adapter: string): Promise<void> {
  await page.goto("/all-options/");
  await configureFeatureLab(page, "Sparkline column", "On");
  if (adapter !== "mantine") {
    const tab = page.getByTestId(`adapter-${adapter}`);
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
  }
  await expect(
    demo(page).locator(`[data-adapter="${adapter}"]`).first()
  ).toBeVisible();
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("draws a sparkline in the Trend column", async ({ page }) => {
      await openLab(page, adapter);
      const root = demo(page).locator(`[data-adapter="${adapter}"]`);
      await expect(
        root.locator('[data-adapttable-part="sparkline"]').first()
      ).toBeVisible();
    });

    test("keeps the sparkline under RTL", async ({ page }) => {
      await openLab(page, adapter);
      await configureFeatureLab(page, "locale", "العربية");
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      const root = demo(page).locator(`[data-adapter="${adapter}"]`);
      await expect(
        root.locator('[data-adapttable-part="sparkline"]').first()
      ).toBeVisible();
    });
  });
}
