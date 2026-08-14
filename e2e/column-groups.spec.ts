import { expect, type Page, test } from "@playwright/test";

/**
 * Collapsible column groups across every kit — the Delivery group
 * collapses to its first leaf. RTL uses the same control.
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
    test("collapses a column group to its summary leaf", async ({ page }) => {
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
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
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
