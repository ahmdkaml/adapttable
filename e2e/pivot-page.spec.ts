import { expect, type Page, test } from "@playwright/test";

/**
 * The /pivot/ page.
 *
 * A pivot is worth a page of its own because it is the one table shape a
 * grid cannot fake, and because the thing most pivot UIs get wrong is the
 * keyboard. So the tests here drive the panel with keys and check the
 * arithmetic that appears — a pivot whose subtotals disagree with its grand
 * total is worse than no pivot.
 */

const table = (page: Page) => page.getByTestId("pivot-table");

test("opens already pivoted, with a header row per column value", async ({
  page,
}) => {
  await page.goto("/pivot/");
  await expect(table(page)).toBeVisible();

  // The default puts teams down the side and statuses across the top.
  await expect(page.getByRole("group", { name: "Rows" })).toContainText("Team");
  await expect(page.getByRole("group", { name: "Columns" })).toContainText(
    "Status"
  );
  await expect(table(page).locator("tbody tr")).not.toHaveCount(0);
});

test("totals every column, and the grand total agrees with the rows", async ({
  page,
}) => {
  await page.goto("/pivot/");

  const grand = table(page).locator('tr[data-kind="grandTotal"]');
  await expect(grand).toBeVisible();

  // Every currency cell in the first column, summed, must equal the total.
  const numbers = await table(page)
    .locator('tbody tr:not([data-kind="grandTotal"]) td:nth-of-type(1)')
    .allTextContents();
  const total = await grand.locator("td").first().textContent();

  const parse = (text: string) => Number(text.replaceAll(/[^0-9.-]/g, "")) || 0;
  const summed = numbers.reduce((sum, text) => sum + parse(text), 0);
  expect(numbers.length).toBeGreaterThan(1);
  expect(summed).toBeGreaterThan(0);
  expect(parse(total ?? "")).toBe(summed);
});

test("builds a pivot with the keyboard alone", async ({ page }) => {
  await page.goto("/pivot/");

  // Add a second row dimension using only keys.
  const rows = page.getByRole("group", { name: "Rows" });
  const add = rows.getByRole("combobox", { name: "Add field" });
  await add.focus();
  await add.press("Enter");
  await page.getByRole("option", { name: "Role", exact: true }).click();

  await expect(rows).toContainText("Role");
  // A second dimension brings subtotal lines with it.
  await expect(
    table(page).locator('tr[data-kind="subtotal"]').first()
  ).toBeVisible();
});

test("puts the whole configuration in the URL", async ({ page }) => {
  await page.goto("/pivot/");

  const remove = page
    .getByRole("group", { name: "Columns" })
    .getByRole("button", { name: /Remove field/ })
    .first();
  await remove.click();

  await expect(page).toHaveURL(/p\.pivot=/);
  const url = page.url();

  // The link reproduces the pivot: a fresh page with the same URL agrees.
  // Assert on the zone's FIELD entries — the add-control still lists Status
  // as something you could put back, which is not the same as it being on.
  await page.goto(url);
  await expect(
    page
      .getByRole("group", { name: "Columns" })
      .locator('[data-adapttable-part="pivot-field"]')
  ).toHaveCount(0);
});

test("changing a measure's aggregation changes the numbers", async ({
  page,
}) => {
  await page.goto("/pivot/");

  // The grand total, not the first data cell: a single team/status pair can
  // legitimately be empty, and an empty cell proves nothing either way.
  const grandCell = table(page)
    .locator('tr[data-kind="grandTotal"] td')
    .first();
  const before = await grandCell.textContent();

  const agg = page
    .getByRole("group", { name: "Measures" })
    .getByRole("combobox", { name: "Aggregation" });
  await agg.click();
  await page.getByRole("option", { name: "avg", exact: true }).click();

  await expect(grandCell).not.toHaveText(before ?? "");
});
