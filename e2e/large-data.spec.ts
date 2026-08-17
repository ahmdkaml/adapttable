import { expect, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * The Feature Lab over a large dataset.
 *
 * Two claims only a browser can settle. The checklist filter windows a long
 * option list — unit tests prove the arithmetic against a jsdom container of
 * no width, and a real popover measures a real one, so the mounted count is
 * only knowable here. And the row window stays a window while the reader
 * scrolls, which is the difference between a table that holds forty thousand
 * rows and a page that stops answering.
 *
 * The dataset is generated: 40,000 people over 120 teams, which is what puts
 * the `team` checklist past `CHECKLIST_VIRTUALIZE_AT` (40) — the five teams in
 * the seed can never reach it.
 */

/** `CHECKLIST_VIRTUALIZE_AT` from core: at or above this, the list windows. */
const VIRTUALIZE_AT = 40;

const demo = (page: Page) => page.locator("#demo");

async function openLargeDemo(page: Page, kit = "mantine"): Promise<void> {
  await page.goto("/all-options/");
  await expect(
    demo(page).locator('[data-adapter="mantine"] [data-stagger]').first()
  ).toBeVisible();
  if (kit !== "mantine") {
    const tab = page.getByTestId(`adapter-${kit}`);
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
  }
  await configureFeatureLab(page, "data source", "Large data");
  await expect(page.locator(".lab-summary")).toContainText("40,000");
  await expect(
    demo(page).locator(`[data-adapter="${kit}"] [data-stagger]`).first()
  ).toBeVisible();
}

/** Open the filters popover with the toolbar at the top of the viewport. */
async function openFilters(page: Page): Promise<void> {
  const trigger = demo(page)
    .getByRole("button", { name: "Filters", exact: true })
    .first();
  // The card is taller than the window, so reaching a field further down makes
  // Playwright scroll — which dismisses an anchored popover before it is used.
  await trigger.evaluate((node) => {
    window.scrollBy(0, node.getBoundingClientRect().top - 60);
  });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
}

test.describe("large data — the checklist windows its options", () => {
  test("mounts a fraction of 120 teams, and scrolling changes which", async ({
    page,
  }) => {
    await openLargeDemo(page);
    await openFilters(page);

    const list = page
      .locator('[data-adapttable-part="filter-checklist-list"]')
      .last();
    await expect(list).toBeVisible();
    await expect(list).toHaveAttribute("data-virtualized", "true");

    const boxes = page.locator('[data-adapttable-part="filter-checkbox"]');
    const mounted = await boxes.count();
    // A window, not the list: every one of the 120 teams is selectable, and
    // only a viewport's worth of them exists in the DOM.
    expect(mounted).toBeGreaterThan(0);
    expect(mounted).toBeLessThan(VIRTUALIZE_AT);

    const firstBefore = await boxes.first().innerText();
    expect(firstBefore).toContain("Billing 01");

    await list.evaluate((node) => {
      node.scrollTop = 2000;
    });

    // Different options, same number of them.
    await expect
      .poll(async () => (await boxes.first().innerText()).trim())
      .not.toBe(firstBefore.trim());
    expect(await boxes.count()).toBeLessThan(VIRTUALIZE_AT);
    expect(await boxes.count()).toBeGreaterThan(0);

    // And the far end is reachable, which a clipped list is not: the teams
    // sort alphabetically, so the last area to exist is the one at the bottom.
    await list.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await expect(boxes.last()).toContainText("Web");
    await expect(boxes.first()).not.toContainText("Billing 01");
  });

  test("filtering by one of the 120 teams narrows the table", async ({
    page,
  }) => {
    await openLargeDemo(page);
    await openFilters(page);

    await page.getByLabel("Search values").fill("Payments 03");
    const box = page
      .locator('[data-adapttable-part="filter-checkbox"]')
      .filter({ hasText: /Payments 03/ })
      .first();
    await expect(box).toBeVisible();
    await box.click();

    await expect(page).toHaveURL(/lab\.f_team=/);
    // One team out of 120, chosen from a list that was never fully mounted.
    const table = demo(page).locator('[data-adapter="mantine"]');
    await expect(table).toContainText("Payments 03");
    await expect(table).not.toContainText("Payments 04");
  });
});

/**
 * The row window. `/scale/` proves this for a table mounted directly; the Lab
 * mounts through an adapter demo with the whole toolbar armed, which is the
 * configuration a reader actually meets.
 */
const KITS = ["mantine", "mui", "antd", "tailwind"] as const;

for (const kit of KITS) {
  test(`${kit}: holds a viewport of 40,000 rows, not the set`, async ({
    page,
  }) => {
    await openLargeDemo(page, kit);

    // `data-stagger` marks real body rows in every kit — antd's measure rows
    // and header clones do not carry it.
    const rows = demo(page).locator(`[data-adapter="${kit}"] [data-stagger]`);
    const initial = await rows.count();
    expect(initial).toBeGreaterThan(0);
    expect(initial).toBeLessThan(120);
  });
}

test("the row window advances on scroll and stays a window", async ({
  page,
}) => {
  await openLargeDemo(page);
  const rows = demo(page).locator('[data-adapter="mantine"] [data-stagger]');
  const firstBefore = (await rows.first().innerText()).trim();

  // The page answers the scroll: the window moves to rows that were not
  // mounted a moment ago, and it is still a window when it gets there. A page
  // that had rendered forty thousand rows would not be doing this.
  await page.mouse.wheel(0, 8000);
  await expect
    .poll(async () => (await rows.first().innerText()).trim(), {
      timeout: 10_000,
    })
    .not.toBe(firstBefore);
  expect(await rows.count()).toBeLessThan(120);
  expect(await rows.count()).toBeGreaterThan(0);
});

test("large data disables what the seed-sized demo cannot do at scale", async ({
  page,
}) => {
  await page.goto("/all-options/");
  await expect(
    demo(page).locator('[data-adapter="mantine"] [data-stagger]').first()
  ).toBeVisible();
  await page.getByRole("button", { name: "Configure options" }).click();
  const dialog = page.getByRole("dialog", { name: "Configure Feature Lab" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("group", { name: "data source" })
    .getByRole("button", { name: "Large data", exact: true })
    .click();

  // Every write in this demo rebuilds the whole array, and the grouped model
  // is built from the full set before a row paints. Both say so out loud.
  for (const [group, option] of [
    ["editing mode", "Cell"],
    ["editing mode", "Row"],
    ["editing mode", "Batch"],
    ["row structure", "Grouped"],
    ["row structure", "Tree"],
    ["add / delete", "On"],
    ["reorder", "On"],
  ] as const) {
    const button = dialog
      .getByRole("group", { name: group })
      .getByRole("button", { name: option, exact: true });
    await expect(
      button,
      `${group}/${option} should be unavailable`
    ).toBeDisabled();
    // A disabled control that does not say why is a dead end.
    await expect(button).toHaveAttribute("title", /.+/);
  }

  // Detail rows derive from one row's own id, so they hold at any size.
  await expect(
    dialog
      .getByRole("group", { name: "row structure" })
      .getByRole("button", { name: "Detail", exact: true })
  ).toBeEnabled();

  // The options it turned off report themselves off, not merely unavailable.
  await expect(
    dialog
      .getByRole("group", { name: "row structure" })
      .getByRole("button", { name: "Flat", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    dialog
      .getByRole("group", { name: "editing mode" })
      .getByRole("button", { name: "Off", exact: true })
  ).toHaveAttribute("aria-pressed", "true");

  await dialog.getByRole("button", { name: "Close options" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".lab-summary")).toContainText(
    "40,000 frontend rows"
  );
  await expect(page.locator(".lab-summary")).toContainText("120 teams");
});
