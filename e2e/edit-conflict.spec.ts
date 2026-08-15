import { expect, type Page, test } from "@playwright/test";

/**
 * A live row changing under an open editor is a conflict, not a discard.
 * jsdom already covers the policies; this is the ask UI in a real browser
 * across every kit — the notice, Keep mine, and the draft surviving.
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
const part = (page: Page, name: string) =>
  demo(page).locator(`[data-adapttable-part="${name}"]`);

async function openDemo(page: Page, adapter: string): Promise<void> {
  await page.goto("/");
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

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("asks, then keeps the draft the reader typed", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "editing" })
        .getByRole("button", { name: "On", exact: true })
        .click();

      // Not the source's first row: the demo simulation must follow whichever
      // visible editor is active after sort/filter changes.
      const row = demo(page).locator("[data-stagger]").nth(2);
      const activate = row
        .locator('[data-adapttable-part="edit-cell-activate"]')
        .first();
      await expect(activate).toBeVisible();
      await activate.dblclick();
      const editor = part(page, "edit-cell-editor");
      await expect(editor).toBeVisible();
      await editor.fill("typed");

      await part(page, "demo-live-update").click();
      await expect(part(page, "edit-cell-conflict")).toBeVisible();
      await part(page, "edit-cell-keep-mine").click();
      await expect(part(page, "edit-cell-conflict")).toHaveCount(0);
      await expect(editor).toHaveValue("typed");
    });
  });
}
