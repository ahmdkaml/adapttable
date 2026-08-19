import { expect, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * Cell spanning across every kit — Span on writes Team once down the
 * consecutive teammates who share it. RTL uses the same lists; spans are
 * ids and counts, not geometry.
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
    test("spans the team name down consecutive teammates", async ({ page }) => {
      await openDemo(page, adapter);
      await configureFeatureLab(page, "span cells", "On");
      const team = demo(page)
        .locator('[data-adapttable-part="cell"][data-column-key="team"]')
        .first();
      await expect(team).toBeVisible();
      // Default page is 5 rows; Core has six people, so the run clamps to
      // the page. Person stays one cell — it is not the merge column.
      await expect(team).toHaveAttribute("rowspan", "5");
      await expect(team).toHaveAttribute("data-cell-span", "1x5");
      await expect(
        demo(page)
          .locator('[data-adapttable-part="cell"][data-column-key="person"]')
          .first()
      ).not.toHaveAttribute("colspan");
    });

    test("spans the same way under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await configureFeatureLab(page, "span cells", "On");
      await configureFeatureLab(page, "locale", "العربية");
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      const team = demo(page)
        .locator('[data-adapttable-part="cell"][data-column-key="team"]')
        .first();
      await expect(team).toHaveAttribute("rowspan", "5");
      await expect(team).toHaveAttribute("data-cell-span", "1x5");
    });
  });
}
