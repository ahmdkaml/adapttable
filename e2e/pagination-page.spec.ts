import { expect, type Page, test } from "@playwright/test";

import { gotoFromNav } from "./nav";

/**
 * The /pagination/ page: both ways of moving through a long set.
 *
 * The claim under test is that these are one prop apart rather than two
 * tables — so the same page has to produce a pager in one mode and a growing
 * window in the other, in every kit.
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

const demo = (page: Page) => page.locator("#pagination");

const mode = (page: Page, name: "Paged" | "Infinite") =>
  demo(page).getByRole("group", { name: "Pagination" }).getByRole("button", {
    name,
    exact: true,
  });

test("is reachable from the demo nav", async ({ page }) => {
  await page.goto("/");
  await gotoFromNav(page, "Features", "Pagination");
  await expect(page).toHaveURL(/\/pagination\/$/);
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("answers the search phrase without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/pagination/");
  await expect(page).toHaveTitle(/pagination/i);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /infinite scroll/i
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "pagination"
  );
  await expect(page.locator("main")).toContainText("same query");
  await context.close();
});

test("paging carries the page number in the URL", async ({ page }) => {
  await page.goto("/pagination/");
  const root = demo(page).locator('[data-adapter="mantine"]');
  await expect(root.first()).toBeVisible();
  await root.getByRole("button", { name: /next/i }).first().click();
  await expect(page).toHaveURL(/pg[._]?page=2|page=2/);
});

test("infinite mode replaces the pager with one growing window", async ({
  page,
}) => {
  await page.goto("/pagination/");
  const root = () => demo(page).locator('[data-adapter="mantine"]');
  await expect(root().first()).toBeVisible();
  const paged = await root().locator("tbody tr:visible").count();

  await mode(page, "Infinite").click();
  await expect(root().first()).toBeVisible();
  // No pager in this mode — that is the whole difference.
  await expect(root().getByRole("button", { name: /next/i })).toHaveCount(0);
  expect(paged).toBeGreaterThan(0);
});

for (const kit of KITS) {
  test(`${kit}: offers a pager, and drops it in infinite mode`, async ({
    page,
  }) => {
    await page.goto("/pagination/");
    if (kit !== "mantine") {
      const tab = page.getByTestId(`adapter-${kit}`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
    }
    const root = () => demo(page).locator(`[data-adapter="${kit}"]`);
    await expect(root().first()).toBeVisible();
    await expect(
      root().getByRole("button", { name: /next/i }).first()
    ).toBeVisible();

    await mode(page, "Infinite").click();
    await expect(root().first()).toBeVisible();
    await expect(root().getByRole("button", { name: /next/i })).toHaveCount(0);
  });
}
