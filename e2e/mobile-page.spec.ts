import { devices, expect, type Page, test } from "@playwright/test";

/**
 * The /mobile/ page at an actual phone size.
 *
 * Every other spec runs at 1280px, where the card layout only appears because
 * the page forces it. That proves the prop works, not that the breakpoint
 * does — and the breakpoint is the part a real visitor meets. This file is the
 * one place the viewport is genuinely small.
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

const demo = (page: Page) => page.locator("#mobile");

test.use({ ...devices["Pixel 7"] });

test("swaps rows for cards on a phone, with no sideways scroll", async ({
  page,
}) => {
  await page.goto("/mobile/");
  const cards = demo(page).locator('[data-adapttable-part="cards"]');
  await expect(cards.first()).toBeVisible();

  // A table that overflows the phone horizontally is the failure the card
  // layout exists to avoid.
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("the nav is reachable on a phone", async ({ page }) => {
  await page.goto("/mobile/");
  // The demo nav collapses to a select below the breakpoint; either shape is
  // fine, but one of them has to be there or the page is a dead end.
  const nav = page
    .getByRole("combobox")
    .or(page.getByRole("link", { name: "Live demo" }));
  await expect(nav.first()).toBeVisible();
});

for (const kit of KITS) {
  test(`${kit}: renders cards, not a table, on a phone`, async ({ page }) => {
    await page.goto("/mobile/");
    if (kit !== "mantine") {
      const tab = page.getByTestId(`adapter-${kit}`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
    }
    const root = demo(page).locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();
    await expect(
      root.locator('[data-adapttable-part="cards"]').first()
    ).toBeVisible();
    // Each card is a list item, so a screen reader counts them.
    await expect(root.getByRole("listitem").first()).toBeVisible();
  });
}

for (const kit of KITS) {
  test(`${kit}: a custom card body keeps the list semantics`, async ({
    page,
  }) => {
    await page.goto("/mobile/");
    if (kit !== "mantine") {
      const tab = page.getByTestId(`adapter-${kit}`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
    }
    await page.getByRole("button", { name: "Custom card" }).click();

    const root = demo(page).locator(`[data-adapter="${kit}"]`);
    await expect(root.locator(".demo-person-card").first()).toBeVisible();
    // The shell is the table's, not the custom body's: a screen reader still
    // counts cards, and the page still does not scroll sideways.
    await expect(root.getByRole("listitem").first()).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
