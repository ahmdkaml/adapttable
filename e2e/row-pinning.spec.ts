import { expect, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * Row pinning across every kit — Pin to top moves the first person into
 * the sticky section and out of the scroll body. RTL uses the same
 * actions; the lists are ids, not geometry.
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
const part = (page: Page, name: string) =>
  demo(page).locator(`[data-adapttable-part="${name}"]`);

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

async function enablePinRows(page: Page): Promise<void> {
  await configureFeatureLab(page, "pin rows", "On");
}

async function pinFirstToTop(page: Page, label: string): Promise<void> {
  const pin = demo(page).getByRole("button", { name: label }).first();
  await expect(pin).toBeVisible();
  await pin.click();
  await expect(part(page, "pinned-top")).toBeVisible();
  await expect(part(page, "pinned-top")).toContainText(/Ada|آدا/);
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("pins the first row to the top section", async ({ page }) => {
      await openDemo(page, adapter);
      await enablePinRows(page);
      await pinFirstToTop(page, "Pin to top");
    });

    test("pins the same way under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await enablePinRows(page);
      await configureFeatureLab(page, "locale", "العربية");
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      await pinFirstToTop(page, "تثبيت في الأعلى");
    });
  });
}
