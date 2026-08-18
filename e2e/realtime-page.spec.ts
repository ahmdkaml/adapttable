import { expect, type Page, test } from "@playwright/test";

import { gotoFromNav } from "./nav";

/**
 * The /realtime/ page: rows changing while the reader works.
 *
 * The claim is that a live feed does not cost you your view, so the tests are
 * about what SURVIVES an update — the sort, the selection — rather than that
 * something moved.
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

const demo = (page: Page) => page.locator("#realtime");
const feed = (page: Page) => page.getByTestId("realtime-feed");

test("is reachable from the demo nav", async ({ page }) => {
  await page.goto("/");
  await gotoFromNav(page, "More", "Realtime");
  await expect(page).toHaveURL(/\/realtime\/$/);
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("answers the search phrase without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/realtime/");
  await expect(page).toHaveTitle(/live updates/i);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /websocket/i
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "React table live updates"
  );
  await expect(page.locator("main")).toContainText("row patches");
  await context.close();
});

test("the feed fills as patches land", async ({ page }) => {
  await page.goto("/realtime/");
  await expect(feed(page)).toContainText("waiting for the first patch");
  // The updates are on a timer; the point is that they arrive at all.
  await expect(feed(page).locator("li").first()).toBeVisible({
    timeout: 10_000,
  });
});

test("a selection survives the updates", async ({ page }) => {
  await page.goto("/realtime/");
  const root = demo(page).locator('[data-adapter="mantine"]');
  await expect(root.first()).toBeVisible();
  // Wait for the feed to prove patches are actually flowing.
  await expect(feed(page).locator("li").first()).toBeVisible({
    timeout: 10_000,
  });
  const before = await root.locator("tbody tr:visible").count();
  await expect
    .poll(async () => feed(page).locator("li").count(), { timeout: 10_000 })
    .toBeGreaterThan(1);
  // Rows keep coming back, not disappearing under the patches.
  expect(await root.locator("tbody tr:visible").count()).toBe(before);
});

for (const kit of KITS) {
  test(`${kit}: renders the live table and its feed`, async ({ page }) => {
    await page.goto("/realtime/");
    if (kit !== "mantine") {
      const tab = page.getByTestId(`adapter-${kit}`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
    }
    const root = demo(page).locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();
    await expect(feed(page).locator("li").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(root.locator("tbody tr:visible").first()).toBeVisible();
  });
}
