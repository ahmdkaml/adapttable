import { expect, type Page, test } from "@playwright/test";

/**
 * The /selection/ page: choosing rows and acting on them, in every kit.
 *
 * Two things are worth a browser here. The selection column has to carry its
 * part names — five kits emitted them only on the stats bar until recently, so
 * an app targeting `selection-cell` got a different answer per kit. And the
 * claim that makes the feature useful is the easy one to get wrong: the
 * selection is a set of ids, not a slice of the rendered page.
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

const demo = (page: Page) => page.locator("#selection");

test("is reachable from the demo nav", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Selection", exact: true }).click();
  await expect(page).toHaveURL(/\/selection\/$/);
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("answers the search phrase without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/selection/");
  await expect(page).toHaveTitle(/row selection/i);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /bulk actions/i
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "row selection"
  );
  await expect(page.locator("main")).toContainText("set of row ids");
  await context.close();
});

test("the selection outlives the page it was made on", async ({ page }) => {
  await page.goto("/selection/");
  const root = demo(page).locator('[data-adapter="mantine"]');
  await expect(root.first()).toBeVisible();
  const box = root
    .locator('[data-adapttable-part="selection-cell"]')
    .first()
    .getByRole("checkbox");
  await box.click();
  await expect(box).toBeChecked();

  // Away and back. A selection tied to the rendered page would not survive.
  await root.getByRole("button", { name: /next/i }).first().click();
  await expect
    .poll(async () =>
      root.locator('[data-adapttable-part="selection-cell"]').count()
    )
    .toBeGreaterThan(0);
  await root
    .getByRole("button", { name: /previous/i })
    .first()
    .click();
  await expect(
    root
      .locator('[data-adapttable-part="selection-cell"]')
      .first()
      .getByRole("checkbox")
  ).toBeChecked();
});

for (const kit of KITS) {
  test(`${kit}: names its selection cells and acts on a tick`, async ({
    page,
  }) => {
    await page.goto("/selection/");
    if (kit !== "mantine") {
      const tab = page.getByTestId(`adapter-${kit}`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
    }
    const root = demo(page).locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();

    // The parts an app styles or tests against, on the table itself.
    await expect(
      root.locator('[data-adapttable-part="selection-header"]').first()
    ).toBeVisible();
    const cell = root
      .locator('[data-adapttable-part="selection-cell"]')
      .first();
    await expect(cell).toBeVisible();

    // Several kits hide the real input behind their own styled box, so click
    // the cell's control rather than requiring the input itself to be visible.
    await cell.getByRole("checkbox").first().click({ force: true });
    // Ticking a row has to offer something that acts on it.
    await expect(
      page.locator('[data-adapttable-part="bulk-bar"]').first()
    ).toBeVisible();
  });
}
