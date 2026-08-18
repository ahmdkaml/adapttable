import { expect, type Page, test } from "@playwright/test";

import { gotoFromNav } from "./nav";

/**
 * The /accessibility/ page: keyboard reach and what the table says.
 *
 * The page's whole claim is that announcements can be CHECKED rather than
 * taken on trust, so the transcript has to fill from real table activity. It
 * mirrors the live regions the table already renders — if the table announces
 * nothing, the transcript stays empty and this fails, which is the point.
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

const demo = (page: Page) => page.locator("#accessibility");
const transcript = (page: Page) => page.getByTestId("announcements");

test("is reachable from the demo nav", async ({ page }) => {
  await page.goto("/");
  await gotoFromNav(page, "Platform", "Accessibility");
  await expect(page).toHaveURL(/\/accessibility\/$/);
  await expect(page.getByRole("grid").first()).toBeVisible();
});

test("explains what is announced without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/accessibility/");
  await expect(page).toHaveTitle(/Accessible React data table/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /screen-reader/i
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Accessible React data table"
  );
  // The differentiator is the explanation, not just the demo.
  await expect(page.locator("main")).toContainText("What gets announced");
  await expect(page.locator("main")).toContainText("Sorting");
  await context.close();
});

test("the grid takes arrow-key focus, and says where it went", async ({
  page,
}) => {
  await page.goto("/accessibility/");
  const grid = demo(page).getByRole("grid").first();
  await expect(grid).toBeVisible();
  await expect(transcript(page)).toContainText("Nothing yet");

  // Into the grid, then move — a real focus point, not a tab stop per cell.
  await demo(page).locator("tbody tr:visible td").first().click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");

  // Whatever the wording, moving has to produce an announcement.
  await expect(transcript(page)).not.toContainText("Nothing yet");
  await expect(transcript(page).locator("li").first()).toBeVisible();
});

for (const kit of KITS) {
  test(`${kit}: exposes a grid with a focusable cell`, async ({ page }) => {
    await page.goto("/accessibility/");
    if (kit !== "mantine") {
      const tab = page.getByTestId(`adapter-${kit}`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
    }
    const root = demo(page).locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();
    await expect(root.getByRole("grid").first()).toBeVisible();
    // A grid whose cells cannot be reached by keyboard is a table wearing a
    // role it does not honour.
    await expect(root.locator("tbody td[tabindex]").first()).toBeAttached();
  });
}
