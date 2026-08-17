import { expect, type Page, test } from "@playwright/test";

/**
 * The /saved-views/ page.
 *
 * What a saved view is worth is that it comes back exactly. So these tests
 * change the table, save it, change it again, and check that re-applying
 * restores what was captured — plus the two cases a demo usually skips: a
 * shared view nobody but its owner may change, and a view saved by an older
 * table still loading.
 */

const panel = (page: Page) =>
  page.locator('[data-adapttable-part="saved-views-panel"]');
const rowFor = (page: Page, name: string) =>
  panel(page).locator('[data-adapttable-part="saved-view-row"]', {
    hasText: name,
  });

test("lists the seeded views", async ({ page }) => {
  await page.goto("/saved-views/");

  await expect(panel(page)).toBeVisible();
  await expect(rowFor(page, "Legacy view")).toBeVisible();
  await expect(rowFor(page, "Team: engineering")).toBeVisible();
});

test("a view saved by an older table still loads", async ({ page }) => {
  await page.goto("/saved-views/");

  // The page reports what it upgraded on the way in.
  await expect(page.getByTestId("migrated")).toContainText("Legacy view");
});

test("a shared view is visibly read-only, not silently inert", async ({
  page,
}) => {
  await page.goto("/saved-views/");
  const shared = rowFor(page, "Team: engineering");

  await expect(shared.getByText("Read-only")).toBeVisible();
  await expect(
    shared.getByRole("button", { name: "Rename view" })
  ).toBeDisabled();
  await expect(
    shared.getByRole("button", { name: "Delete view" })
  ).toBeDisabled();
  // Applying someone else's view is the point of a shared one.
  await expect(
    shared.getByRole("button", { name: "Apply view" })
  ).toBeEnabled();
});

test("renames a view in place, with the keyboard", async ({ page }) => {
  await page.goto("/saved-views/");

  await rowFor(page, "Legacy view")
    .getByRole("button", { name: "Rename view" })
    .click();
  const input = page.getByRole("textbox", { name: "View name" });
  await expect(input).toBeFocused();
  await input.fill("Renamed");
  await input.press("Enter");

  await expect(rowFor(page, "Renamed")).toBeVisible();
  await expect(rowFor(page, "Legacy view")).toHaveCount(0);
});

test("Escape abandons a rename", async ({ page }) => {
  await page.goto("/saved-views/");

  await rowFor(page, "Legacy view")
    .getByRole("button", { name: "Rename view" })
    .click();
  const input = page.getByRole("textbox", { name: "View name" });
  await input.fill("Nope");
  await input.press("Escape");

  await expect(rowFor(page, "Legacy view")).toBeVisible();
  await expect(rowFor(page, "Nope")).toHaveCount(0);
});

test("reorders the list with buttons alone", async ({ page }) => {
  await page.goto("/saved-views/");

  const names = () =>
    panel(page)
      .locator('[data-adapttable-part="saved-view-row"]')
      .allTextContents();
  const before = await names();

  await rowFor(page, "Legacy view")
    .getByRole("button", { name: "Move view up" })
    .click();

  await expect.poll(names).not.toEqual(before);
});

test("marks a default, and only one", async ({ page }) => {
  await page.goto("/saved-views/");

  await rowFor(page, "Legacy view")
    .getByRole("button", { name: "Set as default" })
    .click();

  await expect(
    panel(page)
      .locator('[data-adapttable-part="saved-view-row"]')
      .filter({ hasText: /Default/ })
  ).toHaveCount(1);
});
