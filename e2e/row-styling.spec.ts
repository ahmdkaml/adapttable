import { expect, type Page, test } from "@playwright/test";

/**
 * Row style across every kit — Style on paints the first row and sets
 * height 48. RTL uses the same functions; they are not geometry.
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
    test("applies row height when Style is on", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "row style" })
        .getByRole("button", { name: "On", exact: true })
        .click();
      const row = demo(page)
        .locator(`[data-adapter="${adapter}"] [data-stagger]`)
        .first();
      await expect(row).toBeVisible();
      await expect
        .poll(async () =>
          row.evaluate((el) => (el as HTMLElement).style.height)
        )
        .toBe("48px");
    });

    test("keeps the height under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "row style" })
        .getByRole("button", { name: "On", exact: true })
        .click();
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      const row = demo(page)
        .locator(`[data-adapter="${adapter}"] [data-stagger]`)
        .first();
      await expect
        .poll(async () =>
          row.evaluate((el) => (el as HTMLElement).style.height)
        )
        .toBe("48px");
    });
  });
}
