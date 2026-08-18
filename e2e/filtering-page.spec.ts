import { expect, type Page, test } from "@playwright/test";

import { gotoFromNav } from "./nav";

/**
 * The /filtering/ page: one subject, every kit.
 *
 * "React table filter" is the phrase people arrive searching for, so this page
 * has to answer it without JavaScript too — the served HTML carries the title,
 * the description and real copy, not an empty root.
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

const demo = (page: Page) => page.locator("#filtering");

test("is reachable from the demo nav", async ({ page }) => {
  await page.goto("/");
  await gotoFromNav(page, "Features", "Filtering");
  await expect(page).toHaveURL(/\/filtering\/$/);
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("answers the search phrase without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/filtering/");
  await expect(page).toHaveTitle(/React data table filters/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /filter/i
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "React data table filters"
  );
  // Real copy a crawler can read, not a placeholder.
  await expect(page.locator("main")).toContainText("operators");
  await context.close();
});

test("keeps other pages' subjects off it", async ({ page }) => {
  await page.goto("/filtering/");
  await expect(page.getByRole("table").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Saved views", exact: true })
  ).toHaveCount(0);
  await expect(
    demo(page).getByRole("columnheader", { name: "Actions" })
  ).toHaveCount(0);
});

test("switches the filter layout between popover and header row", async ({
  page,
}) => {
  await page.goto("/filtering/");
  await expect(
    demo(page).getByRole("button", { name: "Filters", exact: true })
  ).toBeVisible();
  await demo(page)
    .getByRole("group", { name: "Filter layout" })
    .getByRole("button", { name: "Header row" })
    .click();
  await expect(
    demo(page).locator('[data-adapttable-part="filter-header-row"]').first()
  ).toBeVisible();
});

for (const kit of KITS) {
  test(`${kit}: opens its own filters popover`, async ({ page }) => {
    await page.goto("/filtering/");
    if (kit !== "mantine") {
      const tab = page.getByTestId(`adapter-${kit}`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
    }
    const root = demo(page).locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();
    await root.getByRole("button", { name: "Filters", exact: true }).click();
    await expect(
      page.locator('[data-adapttable-part="filters-form"]').first()
    ).toBeVisible();
  });
}
