import { expect, test } from "@playwright/test";

import { builtAdapters } from "../apps/showcase/matrix.mjs";

/**
 * The adapter the page-level checks run against — the first whose own pages
 * are built. The per-kit block at the foot of this file loops every one of
 * them, and widens to the whole grid as the rest arrive.
 */
const KIT = builtAdapters()[0]!.key;

/**
 * The scale demo windows tens of thousands of rows through the real Mantine
 * adapter. jsdom has no layout, so only a real browser can prove the window
 * stays bounded — the DOM must hold a few dozen rows, never the whole dataset,
 * even as you scroll.
 */
test.describe("scale — virtualization", () => {
  test("keeps the DOM row count bounded while windowing the full dataset", async ({
    page,
  }) => {
    await page.goto(`/${KIT}/scale/`);
    const rows = page.getByRole("row");
    await expect(rows.first()).toBeVisible();

    // ~24 rows are windowed against the viewport — never the tens of thousands
    // in the source list.
    const initial = await rows.count();
    expect(initial).toBeGreaterThan(0);
    expect(initial).toBeLessThan(120);

    // Scrolling advances the window but the DOM stays just as small.
    await page.mouse.wheel(0, 6000);
    await expect
      .poll(async () => rows.count(), { timeout: 5000 })
      .toBeLessThan(120);
    expect(await rows.count()).toBeGreaterThan(0);
  });
});

/**
 * The scale page across kits.
 *
 * It mounts a table directly rather than through an adapter demo, so it was
 * single-kit until the provider registry existed — and virtualization is a
 * per-kit claim: the window is the shell's, but each kit renders the rows.
 */
/**
 * The adapters whose own pages are built. Each feature page fixes its
 * kit, so the loop is over URLs rather than over clicks on a switcher
 * the page no longer needs — and it widens to the whole grid as the
 * remaining adapters' pages arrive.
 */
const KITS = builtAdapters().map((adapter) => adapter.key);

for (const kit of KITS) {
  test(`${kit}: windows 50k rows down to a viewport`, async ({ page }) => {
    await page.goto(`/${kit}/scale/`);
    await expect(page.locator("table tbody tr").first()).toBeVisible();
    // The whole point: the DOM holds a window, not the dataset.
    await expect
      .poll(async () => page.locator("table tbody tr").count())
      .toBeLessThan(120);
  });
}
