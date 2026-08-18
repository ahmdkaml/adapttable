import { expect, type Locator, type Page, test } from "@playwright/test";

import { builtAdapters } from "../apps/showcase/matrix.mjs";

/**
 * The /saved-views/ page.
 *
 * What a saved view is worth is that it comes back exactly. So these tests
 * change the table, save it, change it again, and check that re-applying
 * restores what was captured — plus the two cases a demo usually skips: a
 * shared view nobody but its owner may change, and a view saved by an older
 * table still loading.
 */

/**
 * The adapters whose own pages are built. Each feature page fixes its
 * kit, so the loop is over URLs rather than over clicks on a switcher
 * the page no longer needs — and it widens to the whole grid as the
 * remaining adapters' pages arrive.
 */
/**
 * The adapter the page-level checks run against — the first whose own pages
 * are built. The per-kit block at the foot of this file loops every one of
 * them, and widens to the whole grid as the rest arrive.
 */
const KIT = builtAdapters()[0]!.key;

const KITS = builtAdapters().map((adapter) => adapter.key);

const panel = (page: Page) =>
  page.locator('[data-adapttable-part="saved-views-panel"]');
const rowFor = (page: Page, name: string) =>
  panel(page).locator('[data-adapttable-part="saved-view-row"]', {
    hasText: name,
  });

/**
 * How far a row's controls miss their panel, in pixels: `spill` past their own
 * group, `past` the panel's edge, `clipped` off a caption. A view's name plus
 * its five icon controls in a narrow panel is the case every kit got wrong in
 * its own way — truncated to "Set a" in one, spilling into the next view's row
 * in another — so the question is measured rather than eyeballed.
 */
/**
 * How far a kit's controls may paint outside their own layout box.
 *
 * Radix Themes gives a ghost IconButton `content-box` sizing with a -4px
 * margin on every side, so its 22px painted square occupies 14px of the line —
 * that is how a ghost control aligns optically with the text beside it. The
 * cluster's paint therefore runs 4px wider than the box holding it, on a panel
 * where nothing is squeezed or cut: `past` and `clipped` both stay at zero,
 * and the five icons sit inside the card with 8px to spare.
 *
 * Listed per kit, with the cause, rather than loosened for everyone — the same
 * shape `scripts/check-parts-parity.mjs` uses for a gap a kit genuinely has.
 */
const PAINT_OVERHANG: Record<string, number> = { radix: 4 };

async function fitOf(target: Locator) {
  return target.evaluate((root) => {
    const edge = root.getBoundingClientRect().right;
    let past = 0;
    let spill = 0;
    let clipped = 0;
    for (const group of root.querySelectorAll(
      '[data-adapttable-part="saved-view-controls"]'
    )) {
      // The group wraps within its own box instead of running out of it.
      spill = Math.max(spill, group.scrollWidth - group.clientWidth);
      for (const button of group.querySelectorAll("button")) {
        past = Math.max(past, button.getBoundingClientRect().right - edge);
        // Nothing is squeezed until its caption reads "Set a": the button, and
        // the label a kit draws inside it, are both at full width.
        for (const box of [button, ...button.querySelectorAll("*")]) {
          clipped = Math.max(clipped, box.scrollWidth - box.clientWidth);
        }
      }
    }
    return { past, spill, clipped };
  });
}

test("lists the seeded views", async ({ page }) => {
  await page.goto(`/${KIT}/saved-views/`);

  await expect(panel(page)).toBeVisible();
  await expect(rowFor(page, "Legacy view")).toBeVisible();
  await expect(rowFor(page, "Team: engineering")).toBeVisible();
});

test("a view saved by an older table still loads", async ({ page }) => {
  await page.goto(`/${KIT}/saved-views/`);

  // The page reports what it upgraded on the way in — each view once. The
  // load runs twice under StrictMode, and a note naming one view twice reads
  // as two upgraded views.
  const note = page.getByTestId("migrated");
  await expect(note).toContainText("Legacy view");
  expect((await note.innerText()).match(/Legacy view/g)).toHaveLength(1);
});

test("every column says what it holds", async ({ page }) => {
  await page.goto(`/${KIT}/saved-views/`);

  const headers = page.locator("thead th");
  await expect(headers).toHaveCount(5);
  for (const cell of await headers.all()) {
    // A header of nothing but a sort caret is a column nobody can read.
    expect((await cell.innerText()).trim()).not.toBe("");
  }
});

for (const width of [1440, 1024]) {
  test(`a view's controls stay in the panel at ${String(width)}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${KIT}/saved-views/`);

    await expect(
      panel(page)
        .locator('[data-adapttable-part="saved-view-controls"]')
        .first()
    ).toBeVisible();

    const fit = await fitOf(panel(page));
    expect(fit.spill).toBeLessThanOrEqual(1);
    expect(fit.past).toBeLessThanOrEqual(1);
    expect(fit.clipped).toBeLessThanOrEqual(1);
  });
}

test("a shared view is visibly read-only, not silently inert", async ({
  page,
}) => {
  await page.goto(`/${KIT}/saved-views/`);
  const shared = rowFor(page, "Team: engineering");

  await expect(shared.getByText("Read-only")).toBeVisible();
  await expect(
    shared.getByRole("button", { name: "Rename view" })
  ).toBeDisabled();
  await expect(
    shared.getByRole("button", { name: "Delete view" })
  ).toBeDisabled();
  // Applying someone else's view is the point of a shared one — and applying
  // is clicking its name, which is the one control a shared row keeps.
  await expect(
    shared.getByRole("button", { name: "Team: engineering" })
  ).toBeEnabled();
});

test("renames a view in place, with the keyboard", async ({ page }) => {
  await page.goto(`/${KIT}/saved-views/`);

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
  await page.goto(`/${KIT}/saved-views/`);

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
  await page.goto(`/${KIT}/saved-views/`);

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
  await page.goto(`/${KIT}/saved-views/`);

  await rowFor(page, "Legacy view")
    .getByRole("button", { name: "Set as default" })
    .click();

  await expect(
    panel(page)
      .locator('[data-adapttable-part="saved-view-row"]')
      .filter({ hasText: /Default/ })
  ).toHaveCount(1);
});

for (const kit of KITS) {
  test(`${kit}: manages the views with its own controls`, async ({ page }) => {
    await page.goto(`/${kit}/saved-views/`);
    const root = page.locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();
    const rows = root.locator('[data-adapttable-part="saved-view-row"]');

    // The panel is this kit's, and the parts are the same in all of them —
    // including the badge that says a shared view is not yours to change.
    await expect(rows).toHaveCount(2);
    await expect(
      root.locator('[data-adapttable-part="saved-view-readonly"]')
    ).toHaveText("Read-only");
    await expect(
      rows.filter({ hasText: "Team: engineering" }).getByRole("button", {
        name: "Rename view",
      })
    ).toBeDisabled();

    // A name plus five icons in a panel this narrow is where each kit used to
    // fail in its own way, so every kit is measured, not only the one that
    // opens.
    const fit = await fitOf(
      root.locator('[data-adapttable-part="saved-views-panel"]')
    );
    expect(fit.spill).toBeLessThanOrEqual(1 + (PAINT_OVERHANG[kit] ?? 0));
    expect(fit.past).toBeLessThanOrEqual(1);
    expect(fit.clipped).toBeLessThanOrEqual(1);

    // Applying a view drives the table beside it: the link carries the search.
    await rows
      .filter({ hasText: "Legacy view" })
      .getByRole("button", { name: "Legacy view" })
      .click();
    await expect(page).toHaveURL(/sv\.q=a/);
  });
}
