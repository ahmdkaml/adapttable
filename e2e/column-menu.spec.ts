import { expect, type Page, test } from "@playwright/test";

/**
 * Column menu 2.0 — search and bulk actions across every kit.
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
  await page.goto("/");
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
    test("searches columns in the menu", async ({ page }) => {
      await openDemo(page, adapter);
      const root = demo(page).locator(`[data-adapter="${adapter}"]`);
      await root.locator('[data-adapttable-part="column-menu-button"]').click();
      const search = page
        .locator('[data-adapttable-part="column-menu-search"]')
        .locator("input")
        .or(page.locator('[data-adapttable-part="column-menu-search"]'))
        .first();
      await expect(search).toBeVisible();
      await search.fill("budget");
      const items = page.locator('[data-adapttable-part="column-menu-item"]');
      await expect(items.first()).toBeVisible();
    });

    test("keeps the search under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      const root = demo(page).locator(`[data-adapter="${adapter}"]`);
      await root.locator('[data-adapttable-part="column-menu-button"]').click();
      await expect(
        page.locator('[data-adapttable-part="column-menu-search"]').first()
      ).toBeVisible();
      if (adapter === "shadcn" || adapter === "tailwind") {
        await expect(
          page.locator('[data-adapttable-part="column-menu-panel"]')
        ).toHaveAttribute("dir", "rtl");
      }
    });
  });
}
