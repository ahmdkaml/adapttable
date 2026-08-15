import { expect, type Page } from "@playwright/test";

/**
 * Change one Feature Lab option through its modal configuration drawer.
 *
 * The drawer intentionally leaves the table at full width and makes the page
 * behind it inert, so browser tests must close it before driving the preview.
 */
export async function configureFeatureLab(
  page: Page,
  group: string,
  option: string
): Promise<void> {
  await page.getByRole("button", { name: "Configure options" }).click();
  const dialog = page.getByRole("dialog", { name: "Configure Feature Lab" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("group", { name: group })
    .getByRole("button", { name: option, exact: true })
    .click();
  await dialog.getByRole("button", { name: "Close options" }).click();
  await expect(dialog).toBeHidden();
}
