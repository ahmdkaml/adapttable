import { expect, type Page, test } from "@playwright/test";

/**
 * The /editing/ demo is the inline cell-editing page: editing is always on
 * (no toggle to find), so every editable column can be exercised directly.
 *
 * The point of this file is coverage of the columns themselves. The demo
 * shipped for a while with only Email editable, which read as "editing barely
 * works" to anyone clicking around — the feature was fine, the demo was not.
 * A per-column check is the only thing that catches that regression, because
 * one working column is enough to make a single-cell test pass.
 */

/** Open the editor for the named column in the first body row. */
async function openEditor(page: Page, column: string) {
  const header = page.getByRole("columnheader", { name: column }).first();
  const index = await header.evaluate((el) => {
    const row = el.closest("tr");
    return row ? [...row.children].indexOf(el) : -1;
  });
  expect(
    index,
    `column "${column}" not found in the header row`
  ).toBeGreaterThan(-1);

  const cell = page.locator("tbody tr").first().locator("td").nth(index);
  await cell.dblclick();
  return cell.locator("input, select, [role='combobox']").first();
}

test.describe("editing demo page", () => {
  test("is reachable from the demo nav", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Editing" }).click();
    await expect(page).toHaveURL(/\/editing\/$/);
    await expect(page.getByRole("table").first()).toBeVisible();
  });

  // Every editable column the page shows on load, not just the first one that
  // works. "Team" is editable too but starts hidden (LIVE_DEFAULT_LAYOUT hides
  // it so revealing it still widens the table past its container), so it is
  // covered by the reveal test below rather than here.
  for (const column of ["Person", "Email", "Status", "Budget", "Load"]) {
    test(`${column} opens an editor on double-click`, async ({ page }) => {
      await page.goto("/editing/");
      await expect(page.getByRole("table").first()).toBeVisible();
      await expect(await openEditor(page, column)).toBeVisible();
    });
  }

  test("Team edits once revealed from the Columns menu", async ({ page }) => {
    await page.goto("/editing/");
    await expect(page.getByRole("table").first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Team" })).toHaveCount(
      0
    );

    await page.getByRole("button", { name: "Columns" }).click();
    await page.getByRole("button", { name: /show column: Team/i }).click();
    await page.keyboard.press("Escape");

    // Team uses a select editor, so this also proves a non-text editor opens.
    await expect(await openEditor(page, "Team")).toBeVisible();
  });

  test("Enter commits the new value into the cell", async ({ page }) => {
    await page.goto("/editing/");
    const editor = await openEditor(page, "Email");
    await expect(editor).toBeVisible();
    await editor.fill("changed@adapttable.dev");
    await editor.press("Enter");

    const cell = page.locator("tbody tr").first().locator("td");
    await expect(
      cell.filter({ hasText: "changed@adapttable.dev" })
    ).toHaveCount(1);
  });

  test("Escape leaves the original value untouched", async ({ page }) => {
    await page.goto("/editing/");
    const cell = page.locator("tbody tr").first().locator("td");
    const editor = await openEditor(page, "Email");
    const original = await editor.inputValue();

    await editor.fill("discarded@adapttable.dev");
    await editor.press("Escape");

    await expect(
      cell.filter({ hasText: "discarded@adapttable.dev" })
    ).toHaveCount(0);
    await expect(cell.filter({ hasText: original })).toHaveCount(1);
  });
});
