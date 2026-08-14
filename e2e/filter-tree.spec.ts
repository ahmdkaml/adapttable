import { expect, type Page, test } from "@playwright/test";

/**
 * AND/OR filter tree engine — no builder UI yet. The showcase reads `live.ft`
 * and the frontend predicate hides rows that miss the tree.
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

const TREE = {
  combinator: "and",
  conditions: [{ key: "name", op: "eq", value: "Ada Lovelace" }],
} as const;

const FT = `1.${JSON.stringify(TREE)}`;

const demo = (page: Page) => page.locator("#demo");

async function openDemo(page: Page, adapter: string): Promise<void> {
  await page.goto(`/?live.ft=${encodeURIComponent(FT)}`);
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
    test("ft=1 tree keeps Ada and hides Alan", async ({ page }) => {
      await openDemo(page, adapter);
      await expect(page).toHaveURL(/live\.ft=1\./);
      const table = demo(page).locator(`[data-adapter="${adapter}"]`);
      await expect(table.getByText("Ada Lovelace").first()).toBeVisible();
      await expect(table.getByText("Alan Turing")).toHaveCount(0);
    });

    test("keeps the tree under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      await expect(page).toHaveURL(/live\.ft=1\./);
      const table = demo(page).locator(`[data-adapter="${adapter}"]`);
      await expect(table.getByText("آدا لوفليس").first()).toBeVisible();
      await expect(table.getByText("آلان تورينغ")).toHaveCount(0);
    });
  });
}
