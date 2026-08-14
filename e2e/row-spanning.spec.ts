import { expect, type Page, test } from "@playwright/test";

/**
 * Cell spanning across every kit — Span on makes Ada's name cover the
 * email column. RTL uses the same lists; spans are ids and counts, not
 * geometry.
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
    test("spans the first name across the next column", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "span cells" })
        .getByRole("button", { name: "On", exact: true })
        .click();
      const name = demo(page)
        .locator('[data-adapttable-part="cell"][data-column-key="person"]')
        .first();
      await expect(name).toBeVisible();
      await expect(name).toHaveAttribute("colspan", "2");
    });

    test("spans the same way under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "span cells" })
        .getByRole("button", { name: "On", exact: true })
        .click();
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      const name = demo(page)
        .locator('[data-adapttable-part="cell"][data-column-key="person"]')
        .first();
      await expect(name).toHaveAttribute("colspan", "2");
    });
  });
}
