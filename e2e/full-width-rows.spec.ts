import { expect, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * Extra rows across every kit — On inserts a full-width note in front of a
 * person. RTL uses the same slot; it is an id, not geometry.
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
  if (adapter === "mantine") return;
  const tab = page.getByTestId(`adapter-${adapter}`);
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  await expect(
    demo(page).locator(`[data-adapter="${adapter}"] [data-stagger]`).first()
  ).toBeVisible();
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("inserts a full-width note in front of a person", async ({ page }) => {
      await openDemo(page, adapter);
      await configureFeatureLab(page, "extra attached to a person", "On");
      await expect(
        demo(page).locator('[data-adapttable-part="full-width-row"]').first()
      ).toBeVisible();
      await expect(
        demo(page)
          .getByText(/Full-width extra attached/)
          .first()
      ).toBeVisible();
    });

    test("keeps the same slots under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await configureFeatureLab(page, "extra attached to a person", "On");
      await configureFeatureLab(page, "locale", "العربية");
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      await expect(
        demo(page).locator('[data-adapttable-part="full-width-row"]').first()
      ).toBeVisible();
    });
  });
}
