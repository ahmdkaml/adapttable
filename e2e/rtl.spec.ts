import { expect, type Page, test } from "@playwright/test";

import { builtAdapters } from "../apps/showcase/matrix.mjs";
import { gotoFromFeatureGrid } from "./nav";

/**
 * The RTL page has to show the filters popover, not just a mirrored table.
 *
 * Anchoring and flipping are the parts of RTL only a browser can judge: a
 * popover that opens from the wrong edge is correct in every unit test and
 * wrong on screen. The page carried no Filters control at all for a while,
 * which made that impossible to see.
 */

const KIT = builtAdapters()[0]!.key;
const demo = (page: Page) => page.locator(".mx-demo");

test("is reachable from the kit's feature grid", async ({ page }) => {
  await gotoFromFeatureGrid(page, "mantine", "RTL");
  await expect(page).toHaveURL(/\/rtl\/$/);
  await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
});

test("mirrors the table and still offers its filters", async ({ page }) => {
  await page.goto(`/${KIT}/rtl/`);
  await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
  await expect(
    demo(page).getByRole("button", { name: "عوامل التصفية" })
  ).toBeVisible();
});

test("the filters popover opens on screen, anchored to its trigger", async ({
  page,
}) => {
  await page.goto(`/${KIT}/rtl/`);
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

/**
 * RTL is a per-kit claim: each adapter positions its own popover, so a kit
 * that anchors from the wrong edge is only visible in that kit.
 */
const KITS = builtAdapters().map((adapter) => adapter.key);

for (const kit of KITS) {
  test(`${kit}: mirrors the table and keeps its popover on screen`, async ({
    page,
  }) => {
    await page.goto(`/${kit}/rtl/`);
    const root = page.locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();
    await expect(root.locator('[dir="rtl"]').first()).toBeVisible();

    await root.getByRole("button", { name: "عوامل التصفية" }).click();
    const popover = page
      .locator('[data-adapttable-part="filters-form"]')
      .first();
    await expect(popover).toBeVisible();
    const card = await popover.boundingBox();
    const width = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(card).not.toBeNull();
    expect(card!.x).toBeGreaterThanOrEqual(-1);
    expect(card!.x + card!.width).toBeLessThanOrEqual(width + 1);
  });
}
