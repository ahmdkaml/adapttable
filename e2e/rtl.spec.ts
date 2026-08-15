import { expect, type Page, test } from "@playwright/test";

/**
 * The RTL page has to show the filters popover, not just a mirrored table.
 *
 * Anchoring and flipping are the parts of RTL only a browser can judge: a
 * popover that opens from the wrong edge is correct in every unit test and
 * wrong on screen. The page carried no Filters control at all for a while,
 * which made that impossible to see.
 */

const demo = (page: Page) => page.locator("#rtl");

test("mirrors the table and still offers its filters", async ({ page }) => {
  await page.goto("/rtl/");
  await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
  await expect(
    demo(page).getByRole("button", { name: "عوامل التصفية" })
  ).toBeVisible();
});

test("the filters popover opens on screen, anchored to its trigger", async ({
  page,
}) => {
  await page.goto("/rtl/");
  const trigger = demo(page).getByRole("button", { name: "عوامل التصفية" });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  const popover = page.locator('[data-adapttable-part="filters-form"]').first();
  await expect(popover).toBeVisible();

  const card = await popover.boundingBox();
  const anchor = await trigger.boundingBox();
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  expect(card).not.toBeNull();
  expect(anchor).not.toBeNull();
  // The whole card stays on screen: an RTL popover that hangs from the wrong
  // edge runs off one side, which is the failure this page exists to catch.
  expect(card!.x).toBeGreaterThanOrEqual(-1);
  expect(card!.x + card!.width).toBeLessThanOrEqual(width + 1);
  // And it belongs to its trigger rather than floating somewhere else.
  expect(card!.y).toBeGreaterThanOrEqual(anchor!.y - 1);
});
