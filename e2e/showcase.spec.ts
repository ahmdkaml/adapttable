import { expect, type Page, test } from "@playwright/test";

/**
 * E2E smoke suite over the real showcase — one describe block per adapter.
 * These assert the bug class jsdom can't see: filter-overlay stacking (no
 * sticky-header/pinned-cell bleed-through), the drawer backdrop actually
 * blocking the background, and the mount-animation hook tagging rows. Depth
 * lives in the unit suites; this is the real-browser net.
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
const filtersTrigger = (page: Page) =>
  demo(page).getByRole("button", { name: "Filters", exact: true }).first();

async function openDemo(page: Page, adapter: string): Promise<void> {
  await page.goto("/");
  // Default kit (Mantine) is eager — wait for it before switching so lazy
  // chunk requests for other kits are attributable to the click.
  await expect(
    demo(page).locator('[data-adapter="mantine"] [data-stagger]').first()
  ).toBeVisible();
  if (adapter === "mantine") return;
  const tab = page.getByTestId(`adapter-${adapter}`);
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  // startTransition keeps the previous kit painted until the new chunk is
  // ready — assert against the NEW adapter's tree, not the outgoing one.
  await expect(
    demo(page).locator(`[data-adapter="${adapter}"] [data-stagger]`).first()
  ).toBeVisible();
}

test("non-default kits load on demand (code-split)", async ({ page }) => {
  await page.goto("/");
  await expect(
    demo(page).locator('[data-adapter="mantine"] [data-stagger]').first()
  ).toBeVisible();

  const chunk = page.waitForRequest(
    (req) =>
      req.resourceType() === "script" &&
      /adapters\/MuiDemo|MuiDemo/.test(req.url())
  );
  await page.getByTestId("adapter-mui").click();
  await chunk;
  await expect(
    demo(page).locator('[data-adapter="mui"] [data-stagger]').first()
  ).toBeVisible();
});

test("default live demo keeps the seven pre-353 controls", async ({ page }) => {
  await page.goto("/");
  await expect(
    demo(page).locator('[data-adapter="mantine"] [data-stagger]').first()
  ).toBeVisible();
  await expect(page.getByRole("group", { name: "data source" })).toBeVisible();
  await expect(page.getByRole("group", { name: "locale" })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "filters container" })
  ).toBeVisible();
  await expect(page.getByRole("group", { name: "density" })).toBeVisible();
  await expect(page.getByRole("group", { name: "grouping" })).toBeVisible();
  await expect(page.getByRole("group", { name: "editing" })).toBeVisible();
  await expect(page.getByRole("group", { name: "motion" })).toBeVisible();
  await expect(page.getByRole("group", { name: "tree" })).toHaveCount(0);
  await expect(
    demo(page).locator('[data-adapttable-part="filter-header-row"]')
  ).toHaveCount(0);
  await expect(
    demo(page).locator('[data-adapttable-part="column-group-toggle"]')
  ).toHaveCount(0);
  await expect(demo(page).getByText("Delivery")).toHaveCount(0);
});

test("install + StackBlitz CTAs sit under the kit switcher", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Copy install command" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open in StackBlitz" })
  ).toBeVisible();
});

/** Grouping and editing are opt-in control-bar toggles (off by default). */
async function enableToggle(
  page: Page,
  group: "grouping" | "editing"
): Promise<void> {
  await page
    .getByRole("group", { name: group })
    .getByRole("button", { name: "On", exact: true })
    .click();
}

async function setFiltersMode(
  page: Page,
  mode: "Popover" | "Drawer"
): Promise<void> {
  await page
    .getByRole("group", { name: "filters container" })
    .getByRole("button", { name: mode, exact: true })
    .click();
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("renders the real table with animation-tagged rows", async ({
      page,
    }) => {
      await openDemo(page, adapter);
      expect(
        await demo(page).locator("[data-stagger]").count()
      ).toBeGreaterThan(0);
    });

    test("filter popover opens on top and dismisses on Escape + outside click", async ({
      page,
    }) => {
      await openDemo(page, adapter);
      await setFiltersMode(page, "Popover");
      const trigger = filtersTrigger(page);

      // Open it with the toolbar already on screen. An anchored popover is
      // dismissed by a page scroll, and Playwright scrolls on its own before
      // hovering something out of view — which would close the card under the
      // very assertions below rather than testing them.
      await trigger.evaluate((node) => {
        window.scrollBy(0, node.getBoundingClientRect().top - 60);
      });
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");

      // A control inside the open overlay must be hittable — Playwright's
      // actionability throws if a sticky header or pinned cell is stacked over
      // it (the historical bleed-through bug), so a plain hover is the check.
      //
      // Scope the search to the filter form itself. Searching the page finds
      // whichever control happens to come last in the DOM, and the table's own
      // inputs qualify — hovering one of those scrolls the page, which
      // dismisses an anchored popover before Escape is ever pressed.
      // The FIRST control in the form: the card is taller than this viewport,
      // so its last field sits below the fold and hovering it would scroll —
      // and a scroll dismisses an anchored popover.
      const form = page.locator('[data-adapttable-part="filters-form"]');
      const control = form
        .getByRole("combobox")
        .or(form.getByRole("spinbutton"))
        .or(form.getByRole("radio"))
        .first();
      await expect(control).toBeVisible();
      await control.hover();

      // Escape while interacting inside the overlay dismisses it (some kits
      // scope their Escape listener to the open panel, so focus it first).
      await control.focus();
      await page.keyboard.press("Escape");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      // Escape must also RESTORE focus to the trigger (CLAUDE.md overlay
      // rule) — a closed-but-focus-lost popover strands keyboard users.
      await expect(trigger).toBeFocused();

      // Re-open, then a click in the far corner (outside the anchored card)
      // dismisses it.
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await page.mouse.click(4, 4);
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    test("filter drawer dims and blocks the background", async ({ page }) => {
      await openDemo(page, adapter);
      await setFiltersMode(page, "Drawer");

      // A point over the table body before the drawer opens. The row has to be
      // ON SCREEN to hit-test: `elementFromPoint` answers null for anything
      // outside the viewport, and the demo's controls push the table below the
      // fold at this window size.
      const row = demo(page).locator("[data-stagger]").first();
      await row.scrollIntoViewIfNeeded();
      const point = await row.evaluate((node) => {
        const r = node.getBoundingClientRect();
        return { x: Math.round(r.left + 8), y: Math.round(r.top + 8) };
      });
      const behind = await page.evaluate(
        (p) => document.elementFromPoint(p.x, p.y)?.tagName ?? null,
        point
      );

      await filtersTrigger(page).click();
      // Drawer kits mount/animate the backdrop a tick after open — poll the
      // hit-test until the same point no longer lands on the row (CI flake
      // without this: sameRow stayed true while the panel was still sliding).
      await expect
        .poll(async () => {
          const covering = await page.evaluate((p) => {
            const el = document.elementFromPoint(p.x, p.y);
            if (!el) return { blocked: false, sameRow: true };
            const row = el.closest("[data-stagger]");
            return { blocked: true, sameRow: Boolean(row) };
          }, point);
          return covering.blocked && !covering.sameRow;
        })
        .toBe(true);
      expect(behind).not.toBeNull();
    });

    test("columns menu opens on top of the table", async ({ page }) => {
      await openDemo(page, adapter);
      await demo(page)
        .getByRole("button", { name: "Columns", exact: true })
        .first()
        .click();
      // A column visibility toggle is visible and hittable — the column overlay
      // stacks above the sticky header / pinned cells, same as the filter one.
      const toggle = page
        .getByRole("button", { name: /(hide|show) column/i })
        .first();
      await expect(toggle).toBeVisible();
      await toggle.hover();
    });

    test("mirrors to RTL in Arabic", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      // The re-rendered table flips its writing direction.
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();

      // A dir attribute SOMEWHERE is not enough — that assertion passed for
      // months while Radix rendered its columns left-to-right. Check what the
      // browser actually resolves on the table and inside a cell, which is
      // the only place the CSS overrides (Radix's own ScrollArea dir, and its
      // physical text-align classes) can be proven.
      const table = demo(page).locator("table").first();
      await expect(table).toHaveCSS("direction", "rtl");

      // Alignment: kits resolve this to the logical "start" (already correct
      // under RTL); Radix compiles it to a physical value. Either is fine —
      // "left" is the bug, because it does not follow direction.
      const firstDataHeader = demo(page).locator("thead th").nth(1);
      const align = await firstDataHeader.evaluate(
        (el) => getComputedStyle(el).textAlign
      );
      expect(align).not.toBe("left");

      // And prove it where it counts — the pixels. Measure the first
      // text-bearing cell's own TEXT NODE (not its wrapper, which stretches
      // to the full column width and hides the misalignment) against its own
      // padding box: under RTL the glyphs must hug the RIGHT edge. This is
      // the assertion that fails on the shipped Radix build, where the cell
      // kept a physical `text-align: left` and the text sat on the far side
      // of the column from where an Arabic reader looks for it.
      const gaps = await demo(page)
        .locator("tbody tr")
        .first()
        .evaluate((row) => {
          for (const cell of row.querySelectorAll("td")) {
            const walker = document.createTreeWalker(
              cell,
              NodeFilter.SHOW_TEXT
            );
            let node = walker.nextNode();
            while (node && !node.textContent?.trim()) node = walker.nextNode();
            if (!node) continue; // checkbox / icon-only column — nothing to align
            const range = document.createRange();
            range.selectNode(node);
            const text = range.getBoundingClientRect();
            const box = cell.getBoundingClientRect();
            const css = getComputedStyle(cell);
            return {
              left: text.left - (box.left + parseFloat(css.paddingLeft)),
              right: box.right - parseFloat(css.paddingRight) - text.right,
            };
          }
          return null;
        });
      // 1px of subpixel slack; the real regression is a whole column width.
      expect(gaps!.right).toBeLessThanOrEqual(gaps!.left + 1);

      // …and the mirrored order puts that first column on the right half.
      const t = await table.boundingBox();
      const h = await firstDataHeader.boundingBox();
      expect(h!.x - t!.x).toBeGreaterThan(t!.width / 2);
    });

    test("inline cell edit commits on Enter", async ({ page }) => {
      await openDemo(page, adapter);
      // Editing and grouping are opt-in toggles; grouping stays ON here so
      // the edit below exercises a row OUTSIDE the page slice.
      await enableToggle(page, "editing");
      await enableToggle(page, "grouping");
      // Frontend mode ships onCellEdit; every data column is editable, so
      // scope to Barbara's row (id 6 — OUTSIDE the current page slice while
      // grouping renders the full filtered set) and take its first editable
      // cell. Guards the regression where the page-slice discard froze every
      // off-page row as display-only (only each group's first row edited).
      const activate = demo(page)
        .locator("tr", { hasText: "Barbara Liskov" })
        .locator('[data-adapttable-part="edit-cell-activate"]')
        .first();
      await expect(activate).toBeVisible();
      await activate.dblclick();
      // Prefer the accessible textbox — kit wrappers may put the data-* on a
      // non-input root (MUI TextField), so role is the stable target.
      const editor = demo(page)
        .getByRole("textbox", { name: "Edit cell" })
        .or(
          demo(page).locator(
            '[data-adapttable-part="edit-cell-editor"] input, input[data-adapttable-part="edit-cell-editor"]'
          )
        );
      await expect(editor).toBeVisible();
      await editor.fill("edited@example.com");
      await editor.press("Enter");
      await expect(
        demo(page).getByText("edited@example.com").first()
      ).toBeVisible();
    });

    test("group header expands and collapses", async ({ page }) => {
      await openDemo(page, adapter);
      await enableToggle(page, "grouping");
      // Frontend mode groups by team; group headers replace bare leaf rows.
      const groupRow = demo(page)
        .locator('[data-adapttable-part="group-row"]')
        .first();
      await expect(groupRow).toBeVisible();
      const toggle = groupRow.locator('[data-adapttable-part="group-toggle"]');
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(groupRow).toHaveAttribute("data-collapsed", "true");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(groupRow).not.toHaveAttribute("data-collapsed", "true");
    });
  });
}
