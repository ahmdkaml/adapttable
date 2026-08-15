import { expect, test } from "@playwright/test";

/**
 * Kitchen-sink page: grouped controls, and the features the default
 * live demo no longer mounts (column groups, header filters).
 */

test("all-options page loads grouped controls and the table", async ({
  page,
}) => {
  await page.goto("/all-options/");
  const demo = page.locator("#demo");
  await expect(
    demo.locator('[data-adapter="mantine"] [data-stagger]').first()
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Data and chrome" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Structure" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Editing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rows" })).toBeVisible();
  await expect(
    demo.locator('[data-adapttable-part="column-group-toggle"]').first()
  ).toBeVisible();
  await expect(demo.getByRole("searchbox", { name: "Person" })).toBeVisible();
});
