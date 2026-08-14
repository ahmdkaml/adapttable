import { expect, type Page, test } from "@playwright/test";

/**
 * Sparkline column — Trend is visible on the live layout across every kit.
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
    test("draws a sparkline in the Trend column", async ({ page }) => {
      await openDemo(page, adapter);
      const root = demo(page).locator(`[data-adapter="${adapter}"]`);
      await expect(
        root.locator('[data-adapttable-part="sparkline"]').first()
      ).toBeVisible();
    });

    test("keeps the sparkline under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      const root = demo(page).locator(`[data-adapter="${adapter}"]`);
      await expect(
        root.locator('[data-adapttable-part="sparkline"]').first()
      ).toBeVisible();
    });
  });
}
