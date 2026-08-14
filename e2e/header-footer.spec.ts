import { expect, type Page, test } from "@playwright/test";

/**
 * Custom header chrome — tooltip on the Email column across every kit.
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
    test("shows a header tooltip", async ({ page }) => {
      await openDemo(page, adapter);
      const root = demo(page).locator(`[data-adapter="${adapter}"]`);
      // Person is always visible; Email ships hidden in the live layout.
      await expect(root.locator('[title="Person"]').first()).toBeVisible();
    });

    test("keeps the tooltip under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      const root = demo(page).locator(`[data-adapter="${adapter}"]`);
      await expect(root.locator("[title]").first()).toBeVisible();
    });
  });
}
