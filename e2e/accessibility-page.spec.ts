import { expect, type Page, test } from "@playwright/test";

import {
  adapterByKey,
  builtAdapters,
  featureBySlug,
  fillTemplate,
} from "../apps/showcase/matrix.mjs";
import { gotoFromFeatureGrid } from "./nav";

/**
 * The adapter the page-level checks run against — the first whose own pages
 * are built. The per-kit block at the foot of this file loops every one of
 * them, and widens to the whole grid as the rest arrive.
 */
const KIT = builtAdapters()[0]!.key;

/** What the matrix says this page must serve, for the kit it is served for. */
const ADAPTER = adapterByKey(KIT)!;
const FEATURE = featureBySlug("accessibility")!;
const copy = (text: string) => fillTemplate(text, ADAPTER);

/**
 * The /accessibility/ page: keyboard reach and what the table says.
 *
 * The page's whole claim is that announcements can be CHECKED rather than
 * taken on trust, so the transcript has to fill from real table activity. It
 * mirrors the live regions the table already renders — if the table announces
 * nothing, the transcript stays empty and this fails, which is the point.
 */

/**
 * The adapters whose own pages are built. Each feature page fixes its
 * kit, so the loop is over URLs rather than over clicks on a switcher
 * the page no longer needs — and it widens to the whole grid as the
 * remaining adapters' pages arrive.
 */
const KITS = builtAdapters().map((adapter) => adapter.key);

/** The box below the seam — everything inside it is the kit's. */
const demo = (page: Page) => page.locator(".mx-demo");
const transcript = (page: Page) => page.getByTestId("announcements");

test("is reachable from the kit's feature grid", async ({ page }) => {
  await gotoFromFeatureGrid(page, "mantine", "Accessibility");
  await expect(page).toHaveURL(/\/accessibility\/$/);
  await expect(page.getByRole("grid").first()).toBeVisible();
});

test("answers the search phrase without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`/${KIT}/accessibility/`);

  await expect(page).toHaveTitle(copy(FEATURE.title));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    copy(FEATURE.description)
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    copy(FEATURE.h1)
  );
  await expect(page.locator("main")).toContainText(
    copy(FEATURE.intro[0]!).slice(0, 60)
  );
  await expect(page.locator("main")).toContainText(ADAPTER.pkg);
  await context.close();
});

test("the grid takes arrow-key focus, and says where it went", async ({
  page,
}) => {
  await page.goto(`/${KIT}/accessibility/`);
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
    await page.goto(`/${kit}/accessibility/`);
    const root = demo(page).locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();
    await expect(root.getByRole("grid").first()).toBeVisible();
    // A grid whose cells cannot be reached by keyboard is a table wearing a
    // role it does not honour.
    await expect(root.locator("tbody td[tabindex]").first()).toBeAttached();
  });
}
