import { expect, type Locator, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * Add / duplicate / delete across every kit — the class of bug jsdom cannot
 * see: the toolbar control actually appearing, a blank row landing at the top
 * and opening an editor, Duplicate copying the row it sits on, and Delete
 * asking first through the showcase dialog. Host Edit/Delete stay off while
 * mutations are on — those are a different demo path.
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

async function enable(page: Page, group: string): Promise<void> {
  await configureFeatureLab(page, group, "On");
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("add, duplicate and delete rows", async ({ page }) => {
      await openDemo(page, adapter);
      await enable(page, "add / delete");
      await configureFeatureLab(page, "editing mode", "Cell");

      const add = demo(page).locator('[data-adapttable-part="add-row"]');
      await expect(add).toBeVisible();

      // data-stagger marks real body rows in every kit (antd's measure
      // rows and header clones do not carry it).
      const rows = demo(page).locator("[data-stagger]");
      const original = "Ada Lovelace";
      await expect(rows.first()).toContainText(original);

      await add.click();
      await expect(rows.first()).not.toContainText(original);

      // The blank row is immediately editable — the same activate control
      // every other editable cell already has.
      await expect(
        rows
          .first()
          .locator('[data-adapttable-part="edit-cell-activate"]')
          .first()
      ).toBeVisible();

      const namedRow = demo(page).locator("[data-stagger]", {
        hasText: original,
      });
      await clickRowAction(page, namedRow, "Duplicate row");
      await expect(
        demo(page).locator("[data-stagger]", { hasText: original })
      ).toHaveCount(2);

      const deleteOnCopy = demo(page)
        .locator("[data-stagger]", { hasText: original })
        .first();
      await clickRowAction(page, deleteOnCopy, "Delete row");
      const dialog = page.getByRole("dialog", { name: "Delete row" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect(dialog).toHaveCount(0);
      await expect(
        demo(page).locator("[data-stagger]", { hasText: original })
      ).toHaveCount(2);

      await clickRowAction(page, deleteOnCopy, "Delete row");
      await page
        .getByRole("dialog", { name: "Delete row" })
        .getByRole("button", { name: "Delete row" })
        .click();
      await expect(
        demo(page).locator("[data-stagger]", { hasText: original })
      ).toHaveCount(1);

      // The actions column is a first-class column: hideable and end-pinnable.
      await demo(page)
        .getByRole("button", { name: "Columns", exact: true })
        .first()
        .click();
      await expect(
        page.getByRole("button", { name: /hide column: Actions/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /pin to end: Actions/i })
      ).toBeVisible();
    });
  });
}

async function clickRowAction(
  page: Page,
  row: Locator,
  name: string
): Promise<void> {
  const trigger = row.locator('[data-adapttable-part="row-actions-trigger"]');
  if ((await trigger.count()) === 0) {
    await row.getByRole("button", { name }).click();
    return;
  }

  // Portaled kits (radix) leave a menu "open" with no content after the
  // confirm overlay; unstyled kits put `row-actions-menu` on <details>,
  // which stays in the layout even when closed. Drive the items, not the
  // wrapper: Escape leftover menus, open this row, retry if the first
  // click toggled a stuck menu shut.
  await page.keyboard.press("Escape");
  const item = page
    .getByRole("menuitem", { name })
    .or(row.getByRole("button", { name, exact: true }))
    .filter({ visible: true });
  await trigger.click();
  try {
    await expect(item.first()).toBeVisible({ timeout: 2000 });
  } catch {
    await trigger.click();
    await expect(item.first()).toBeVisible();
  }
  await item.first().click();
}
