import { expect, type Page, test } from "@playwright/test";

import { gotoFromNav } from "./nav";

/**
 * The /tree/ page: hierarchy in a table, in every kit.
 *
 * "React tree table" is its own search, and its own shape — rows nesting rather
 * than being collected under synthetic headers. The chevron and the indent are
 * kit-native, so a kit that renders neither still shows a table full of rows
 * and looks fine until someone tries to collapse one.
 */

const KITS = [
  "mantine",
  "mui",
  "chakra",
  "antd",
  "radix",
  "base-ui",
  "shadcn",
  "tailwind",
] as const;

const demo = (page: Page) => page.locator("#tree");

test("is reachable from the demo nav", async ({ page }) => {
  await page.goto("/");
  await gotoFromNav(page, "Features", "Tree");
  await expect(page).toHaveURL(/\/tree\/$/);
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("answers the search phrase without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/tree/");
  await expect(page).toHaveTitle(/React tree table/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /nest/i
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "React tree table"
  );
  await expect(page.locator("main")).toContainText("parent id");
  await context.close();
});

test("keeps other pages' subjects off it", async ({ page }) => {
  await page.goto("/tree/");
  await expect(page.getByRole("table").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Saved views", exact: true })
  ).toHaveCount(0);
});

for (const kit of KITS) {
  test(`${kit}: collapses a branch and hides its children`, async ({
    page,
  }) => {
    await page.goto("/tree/");
    if (kit !== "mantine") {
      const tab = page.getByTestId(`adapter-${kit}`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
    }
    const root = demo(page).locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();

    const toggle = root.locator('[data-adapttable-part="tree-toggle"]').first();
    await expect(toggle).toBeVisible();
    const rows = () => root.locator("tbody tr:visible").count();
    const before = await rows();

    // Whether the branch starts open or shut, toggling it has to change what
    // is on screen — and toggling back has to restore it exactly.
    await toggle.click();
    await expect.poll(rows).not.toBe(before);
    await toggle.click();
    await expect.poll(rows).toBe(before);
  });
}
