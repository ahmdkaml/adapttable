import { devices, expect, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * The header checkbox that selects a column.
 *
 * Ctrl/Cmd+click on a header has always selected one, and still does. It needs
 * a modifier key, which a touchscreen does not have, and it announces itself
 * nowhere. This is the same selection behind a control — and two of its three
 * claims can only be settled in a browser: what a real media query reports
 * about the pointer, and what a real tap does with no keyboard anywhere near it.
 *
 * The accessibility page arms `cellNavigation` and `columnSelectionCheckbox`.
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

const demo = (page: Page) => page.locator(".mx-demo");

/** A real tablet: touch, a coarse pointer, and a viewport wide enough
 * for a table rather than the card layout a phone gets. */
const TOUCH_DEVICE = (() => {
  const { defaultBrowserType: _ignored, ...rest } =
    devices["iPad Pro 11 landscape"];
  return rest;
})();

async function openKit(page: Page, kit: string): Promise<void> {
  await page.goto(`/${kit}/accessibility/`);
  await expect(demo(page).locator(`[data-adapter="${kit}"]`)).toBeVisible();
}

const boxes = (page: Page, kit: string) =>
  demo(page).locator(
    `[data-adapter="${kit}"] [data-adapttable-part="column-select"]`
  );

/**
 * The kit's own control inside the slot.
 *
 * Radix and Base UI build a checkbox from a button carrying the role; the rest
 * use an `<input>`, and Chakra draws a styled box over its own — so the click
 * is forced past Playwright's hit-test rather than aimed at whichever pixel
 * each kit leaves exposed. What is asserted is unchanged: cells get selected.
 */
const control = (page: Page, kit: string) =>
  boxes(page, kit)
    .first()
    .locator('[role="checkbox"], input[type="checkbox"]')
    .first();

for (const kit of KITS) {
  test(`${kit}: selects a column from the header checkbox`, async ({
    page,
  }) => {
    await openKit(page, kit);
    const first = boxes(page, kit).first();
    await expect(first).toBeAttached();

    // Named for the column it selects — "Select column" five times over tells a
    // screen reader user nothing about which one is about to be selected.
    await expect(control(page, kit)).toHaveAttribute(
      "aria-label",
      "Select column: Person"
    );

    await control(page, kit).click({ force: true });

    const root = demo(page).locator(`[data-adapter="${kit}"]`);
    const selected = root.locator("[data-cell-selected]");
    await expect(selected.first()).toBeAttached();
    const count = await selected.count();
    expect(count).toBeGreaterThan(1);

    // Every selected cell is in the same column: a column, not a rectangle.
    const keys = await selected.evaluateAll((nodes) => [
      ...new Set(
        nodes.map((node) =>
          node.closest("[data-column-key]")?.getAttribute("data-column-key")
        )
      ),
    ]);
    expect(keys).toEqual(["person"]);
  });
}

test("on a hovering pointer it waits for hover, and comes back on focus", async ({
  page,
}) => {
  await openKit(page, "mantine");
  const first = boxes(page, "mantine").first();
  await expect(first).toBeAttached();

  // A header row of twelve checkboxes is noise, so on a mouse it holds its
  // space and stays out of the way until it is wanted.
  await expect(first).toHaveCSS("opacity", "0");

  await first.hover();
  await expect(first).toHaveCSS("opacity", "1");

  // Focus reveals it too — a keyboard reaches what a mouse does.
  await page.mouse.move(0, 0);
  await expect(first).toHaveCSS("opacity", "0");
  await control(page, "mantine").focus();
  await expect(first).toHaveCSS("opacity", "1");
});

test("a selected column keeps its checkbox on screen", async ({ page }) => {
  await openKit(page, "mantine");
  await control(page, "mantine").click({ force: true });
  await page.mouse.move(0, 0);

  // A ticked box that fades out is a selection with nothing saying so.
  await expect(boxes(page, "mantine").first()).toHaveCSS("opacity", "1");
});

test("ticking the box does not sort the header it sits in", async ({
  page,
}) => {
  await openKit(page, "mantine");
  const header = demo(page)
    .locator('[data-adapter="mantine"] [data-column-key="person"]')
    .first();

  await control(page, "mantine").click({ force: true });

  // A sortable header sorts on click. Either handler firing underneath would
  // undo what ticking the box just did.
  await expect(header).not.toHaveAttribute("aria-sort", "ascending");
  await expect(
    demo(page).locator('[data-adapter="mantine"] [data-cell-selected]').first()
  ).toBeAttached();
});

/**
 * A real touch device: no pointer to hover with, and no Ctrl key to hold.
 *
 * This is the whole reason the control exists, and the one case the gesture
 * cannot cover. A tablet rather than a phone, because a phone gets the card
 * layout and a card has no column headers to check.
 */
test.describe("on a touchscreen", () => {
  // The device descriptor, minus the key that would force its own worker:
  // `defaultBrowserType` cannot be set inside a describe, and the rest of the
  // emulation — the touch flag, the coarse pointer, the viewport, the UA — is
  // what this test is about.
  test.use(TOUCH_DEVICE);

  test("a column selects with a tap and no keyboard", async ({ page }) => {
    await page.goto("/mantine/accessibility/");
    const root = demo(page).locator('[data-adapter="mantine"]');
    await expect(root).toBeVisible();

    // The device really does report a coarse pointer, which is what the
    // always-visible branch keys off. Asserted, not assumed.
    expect(
      await page.evaluate(
        () => matchMedia("(hover: hover) and (pointer: fine)").matches
      )
    ).toBe(false);

    const first = boxes(page, "mantine").first();
    await expect(first).toBeAttached();
    // Nothing to hover, so nothing is waiting for a hover.
    await expect(first).toHaveCSS("opacity", "1");

    const box = control(page, "mantine");
    await box.scrollIntoViewIfNeeded();
    await box.tap({ force: true });

    const selected = root.locator("[data-cell-selected]");
    await expect(selected.first()).toBeAttached();
    expect(await selected.count()).toBeGreaterThan(1);
  });
});

/**
 * The Feature Lab's toggle, and the reason it is unavailable until the grid is.
 */
test("the Feature Lab guards the toggle on cell navigation", async ({
  page,
}) => {
  await page.goto("/all-options/");
  await expect(
    page.locator('#demo [data-adapter="mantine"] [data-stagger]').first()
  ).toBeVisible();
  await page.getByRole("button", { name: "Configure options" }).click();
  const dialog = page.getByRole("dialog", { name: "Configure Feature Lab" });
  await expect(dialog).toBeVisible();

  const toggle = dialog
    .getByRole("group", { name: "column checkboxes" })
    .getByRole("button", { name: "On", exact: true });
  // The checkbox selects into the cell grid, which this page arms with an
  // editing mode — so until one is on there is nothing to select into.
  await expect(toggle).toBeDisabled();
  await expect(toggle).toHaveAttribute("title", /editing mode/);

  await dialog
    .getByRole("group", { name: "editing mode" })
    .getByRole("button", { name: "Cell", exact: true })
    .click();
  await expect(toggle).toBeEnabled();
  await dialog.getByRole("button", { name: "Close options" }).click();
  await expect(dialog).toBeHidden();

  // Off by default: omitting the option draws nothing.
  await expect(
    page.locator('#demo [data-adapttable-part="column-select"]')
  ).toHaveCount(0);

  await configureFeatureLab(page, "column checkboxes", "On");
  await expect(
    page.locator('#demo [data-adapttable-part="column-select"]').first()
  ).toBeAttached();
});
