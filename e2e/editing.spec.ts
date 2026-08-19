import { expect, type Page, test } from "@playwright/test";

import { builtAdapters } from "../apps/showcase/matrix.mjs";

/**
 * The adapter the page-level checks run against — the first whose own pages
 * are built. The per-kit block at the foot of this file loops every one of
 * them, and widens to the whole grid as the rest arrive.
 */
const KIT = builtAdapters()[0]!.key;

import { gotoFromFeatureGrid } from "./nav";

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
  test("is reachable from the kit's feature grid", async ({ page }) => {
    await gotoFromFeatureGrid(page, "mantine", "Editing");
    await expect(page).toHaveURL(/\/editing\/$/);
    await expect(page.getByRole("grid").first()).toBeVisible();
  });

  // Every editable column the page shows on load, not just the first one that
  // works. The display-only Timeline stays hidden so this page needs no
  // Columns menu from the layout showcase.
  for (const column of ["Person", "Email", "Status", "Budget", "Load"]) {
    test(`${column} opens an editor on double-click`, async ({ page }) => {
      await page.goto(`/${KIT}/editing/`);
      await expect(page.getByRole("grid").first()).toBeVisible();
      await expect(await openEditor(page, column)).toBeVisible();
    });
  }

  test("keeps unrelated table chrome out of the editing walkthrough", async ({
    page,
  }) => {
    await page.goto(`/${KIT}/editing/`);
    await expect(page.getByRole("grid").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Filters", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Saved views", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Columns", exact: true })
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Export/ })).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: "Team" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Timeline" })
    ).toHaveCount(0);
  });

  test("Team uses its select editor", async ({ page }) => {
    await page.goto(`/${KIT}/editing/`);
    await expect(page.getByRole("grid").first()).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Team" })
    ).toBeVisible();

    await expect(await openEditor(page, "Team")).toBeVisible();
  });

  test("Enter commits the new value into the cell", async ({ page }) => {
    await page.goto(`/${KIT}/editing/`);
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
    await page.goto(`/${KIT}/editing/`);
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

  test("cleared cell still opens on double-click", async ({ page }) => {
    await page.goto(`/${KIT}/editing/`);
    const editor = await openEditor(page, "Email");
    await expect(editor).toBeVisible();
    await editor.fill("");
    await editor.press("Enter");
    await expect(await openEditor(page, "Email")).toBeVisible();
  });
});

/**
 * Editing has to open in every kit, not just the one that loads first — the
 * editors are kit-native controls now, so "it works" is a per-kit claim.
 */
/**
 * The adapters whose own pages are built. Each feature page fixes its
 * kit, so the loop is over URLs rather than over clicks on a switcher
 * the page no longer needs — and it widens to the whole grid as the
 * remaining adapters' pages arrive.
 */
const KITS = builtAdapters().map((adapter) => adapter.key);

for (const kit of KITS) {
  test(`${kit}: opens an editor on the editing page`, async ({ page }) => {
    await page.goto(`/${kit}/editing/`);
    const root = page.locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();
    // antd puts a zero-height measure row first — it carries the header text,
    // so only its lack of a box tells it apart from a real row.
    const row = root.locator("tbody tr:visible").first();
    await row.locator("td").nth(1).dblclick();
    await expect(
      root.locator('[data-adapttable-part="edit-cell-editor"]').first()
    ).toBeVisible();
  });
}
