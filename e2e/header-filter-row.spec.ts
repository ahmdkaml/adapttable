import { expect, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * Compact header filter row — same defs as the panel, desktop only.
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
  await configureFeatureLab(page, "filters container", "Header");
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("header filter row filters the name column", async ({ page }) => {
      await openDemo(page, adapter);
      const table = demo(page).locator(`[data-adapter="${adapter}"]`);
      const name = table.getByRole("searchbox", { name: "Person" });
      await expect(name).toBeVisible();
      await name.fill("Ada");
      await expect(page).toHaveURL(/lab\.f_name=/);
      await expect(table.getByText("Ada Lovelace").first()).toBeVisible();
      await expect(table.getByText("Alan Turing")).toHaveCount(0);
    });

    test("keeps the header filter row under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await configureFeatureLab(page, "locale", "العربية");
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      await expect(
        tableScopedHeader(demo(page), adapter).first()
      ).toBeVisible();
    });
  });
}

function tableScopedHeader(root: ReturnType<typeof demo>, adapter: string) {
  return root
    .locator(`[data-adapter="${adapter}"]`)
    .locator(
      '[data-adapttable-part="filter-header-row"], [data-adapttable-part="filter-header-cell"]'
    );
}
