import { expect, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * Collapsible column groups across every kit — Delivery keeps its name
 * and folds to a short brief. RTL uses the same control.
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

async function openDemo(page: Page, adapter: string): Promise<void> {
  await page.goto("/all-options/");
  await expect(
    demo(page).locator('[data-adapter="mantine"] [data-stagger]').first()
  ).toBeVisible();
  if (adapter !== "mantine") {
    const tab = page.getByTestId(`adapter-${adapter}`);
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
    await expect(
      demo(page).locator(`[data-adapter="${adapter}"] [data-stagger]`).first()
    ).toBeVisible();
  }
  await configureFeatureLab(page, "column groups", "On");
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("collapses a column group", async ({ page }) => {
      await openDemo(page, adapter);
      const root = demo(page).locator(`[data-adapter="${adapter}"]`);
      const toggle = root
        .locator('[data-adapttable-part="column-group-toggle"]')
        .first();
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    });

    test("keeps the toggle under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await configureFeatureLab(page, "locale", "العربية");
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      const root = demo(page).locator(`[data-adapter="${adapter}"]`);
      const toggle = root
        .locator('[data-adapttable-part="column-group-toggle"]')
        .first();
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    });
  });
}
