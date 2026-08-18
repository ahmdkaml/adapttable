import { expect, type Page, test } from "@playwright/test";

import {
  builtAdapters,
  MATRIX_FEATURES,
  SHOWCASE_ADAPTERS,
} from "../apps/showcase/matrix.mjs";
import { openNavGroup } from "./nav";

/**
 * The demo nav's dropdowns.
 *
 * The bar is shared chrome — it is on every page, above every table — so its
 * faults are the ones that touch the whole site at once. Three of them are only
 * visible in a real browser: whether the strip is still one line at the width
 * someone actually has, whether an open panel paints over a sticky table header
 * or under it, and whether opening one widens the document.
 *
 * The rest is the contract a menu owes a keyboard: a trigger that tells the
 * truth about its state, Escape that gives focus back, and items that exist in
 * the markup whether the panel is open or not.
 */

const trigger = (page: Page, group: string) =>
  page.locator(".nav").getByRole("button", { name: group, exact: true });

const menu = (page: Page, key: string) => page.locator(`#nav-menu-${key}`);

const items = (page: Page, key: string) =>
  menu(page, key).getByRole("menuitem");

test("the trigger opens its menu on click and says so", async ({ page }) => {
  await page.goto("/");
  const features = trigger(page, "Features");
  await expect(features).toHaveAttribute("aria-haspopup", "menu");
  await expect(features).toHaveAttribute("aria-controls", "nav-menu-features");
  await expect(features).toHaveAttribute("aria-expanded", "false");
  await expect(menu(page, "features")).toBeHidden();

  await features.click();
  await expect(features).toHaveAttribute("aria-expanded", "true");
  await expect(menu(page, "features")).toBeVisible();
  await expect(items(page, "features")).toHaveCount(MATRIX_FEATURES.length);

  // A second click on the trigger puts it away again — the pointer-down
  // dismissal must not fight the toggle and reopen it.
  await features.click();
  await expect(features).toHaveAttribute("aria-expanded", "false");
  await expect(menu(page, "features")).toBeHidden();
});

test("only one menu is open at a time", async ({ page }) => {
  await page.goto("/");
  await openNavGroup(page, "Features");
  await trigger(page, "Adapters").click();
  await expect(trigger(page, "Adapters")).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  await expect(trigger(page, "Features")).toHaveAttribute(
    "aria-expanded",
    "false"
  );
});

test("Escape closes the menu and hands focus back to the trigger", async ({
  page,
}) => {
  await page.goto("/");
  await openNavGroup(page, "Features");
  await page.keyboard.press("Escape");
  await expect(trigger(page, "Features")).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  // A closed-but-focus-lost menu strands a keyboard user at the top of the
  // document, which is the same defect the filter popover is held to.
  await expect(trigger(page, "Features")).toBeFocused();
});

test("a click outside closes the menu", async ({ page }) => {
  await page.goto("/");
  await openNavGroup(page, "More");
  await page.mouse.click(6, 500);
  await expect(trigger(page, "More")).toHaveAttribute("aria-expanded", "false");
});

test("hover opens the menu and survives the trip into it", async ({ page }) => {
  await page.goto("/");
  await trigger(page, "More").hover();
  await expect(trigger(page, "More")).toHaveAttribute("aria-expanded", "true");

  // The pointer leaves the trigger's box before it enters the panel's — the
  // close delay is what keeps the menu from shutting in the gap.
  const target = await items(page, "more").last().boundingBox();
  await page.mouse.move(
    (target?.x ?? 0) + (target?.width ?? 0) / 2,
    (target?.y ?? 0) + (target?.height ?? 0) / 2,
    { steps: 10 }
  );
  await expect(trigger(page, "More")).toHaveAttribute("aria-expanded", "true");

  // Leaving for good does close it.
  await page.mouse.move(700, 600, { steps: 10 });
  await expect(trigger(page, "More")).toHaveAttribute("aria-expanded", "false");
});

test("the keyboard opens the menu, walks it, and leaves on Tab", async ({
  page,
}) => {
  await page.goto("/");
  const more = trigger(page, "More");
  await more.focus();

  // Enter opens without moving focus; ArrowDown is the move into the panel.
  await page.keyboard.press("Enter");
  await expect(more).toHaveAttribute("aria-expanded", "true");
  await expect(more).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(items(page, "more").nth(0)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(items(page, "more").nth(1)).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(items(page, "more").nth(0)).toBeFocused();
  await page.keyboard.press("End");
  await expect(items(page, "more").nth(3)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(items(page, "more").nth(0)).toBeFocused();
  // Down from the last item comes back round to the first.
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowDown");
  await expect(items(page, "more").nth(0)).toBeFocused();

  // Tab leaves rather than being trapped: this is navigation, not a dialog.
  await page.keyboard.press("Tab");
  await expect(more).toHaveAttribute("aria-expanded", "false");
});

test("Space opens the menu too", async ({ page }) => {
  await page.goto("/");
  const adapters = trigger(page, "Adapters");
  await adapters.focus();
  await page.keyboard.press("Space");
  await expect(adapters).toHaveAttribute("aria-expanded", "true");
});

test("a menu item navigates, and the page it lands on marks itself", async ({
  page,
}) => {
  await page.goto("/");
  await openNavGroup(page, "Features");
  await items(page, "features").filter({ hasText: "Saved views" }).click();
  await expect(page).toHaveURL(/\/mantine\/saved-views\/$/);

  // The parent tells the reader where they are while the panel is shut…
  await expect(trigger(page, "Features")).toHaveClass(/is-on/);
  await expect(trigger(page, "More")).not.toHaveClass(/is-on/);
  // …and the item itself is the one marked as the current page.
  await openNavGroup(page, "Features");
  await expect(
    menu(page, "features").locator('[aria-current="page"]')
  ).toHaveText("Saved views");
  await expect(
    menu(page, "features").locator('[aria-current="page"]')
  ).toHaveCount(1);
});

test("the Adapters menu leads to every kit, and marks the one being read", async ({
  page,
}) => {
  await page.goto("/mantine/pivot/");
  await openNavGroup(page, "Adapters");
  await expect(items(page, "adapters")).toHaveCount(SHOWCASE_ADAPTERS.length);

  // A feature page belongs to its kit: someone on mantine/pivot IS in Mantine,
  // so the kit reads as current even though the page is one level down…
  await expect(trigger(page, "Adapters")).toHaveClass(/is-on/);
  await expect(menu(page, "adapters").locator("a.is-on")).toContainText(
    "Mantine"
  );
  // …and `aria-current` still names one page, which is not this menu's item.
  await expect(
    menu(page, "adapters").locator('[aria-current="page"]')
  ).toHaveCount(0);
});

test("the Features menu answers for the kit the reader is in", async ({
  page,
}) => {
  await page.goto("/mantine/pivot/");
  await openNavGroup(page, "Features");
  const hrefs = await items(page, "features").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href") ?? "")
  );
  // Two levels down, so the prefix climbs twice — and every destination stays
  // inside the kit whose page this is.
  expect(hrefs).toEqual(
    MATRIX_FEATURES.map((feature) => `../../mantine/${feature.slug}/`)
  );
});

test("the direct links keep their own active styling", async ({ page }) => {
  await page.goto("/all-options/");
  const lab = page.locator(".nav").getByRole("link", { name: "Feature Lab" });
  await expect(lab).toHaveClass(/is-on/);
  await expect(lab).toHaveAttribute("aria-current", "page");
  for (const group of ["Adapters", "Features", "More"]) {
    await expect(trigger(page, group)).not.toHaveClass(/is-on/);
  }
});

/**
 * The menu links are rendered whether the panel is open or not — hidden with
 * `visibility`, never unmounted. A crawler reading the DOM finds all sixteen
 * destinations from any page, and a middle click on one opens it in a new tab.
 *
 * Note what this does NOT claim: the showcase nav is client-rendered, so the
 * links appear once React mounts. The served HTML carries each page's own
 * hand-written fallback instead, which `seo.spec.ts` holds to its own bar.
 */
test("every menu link is in the DOM with the menus closed", async ({
  page,
}) => {
  await page.goto("/");
  for (const group of ["Adapters", "Features", "More"]) {
    await expect(trigger(page, group)).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  }
  const hrefs = await page
    .locator(".nav__menu a[href]")
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? "")
    );
  // Adapters first, then the twelve pages of the kit this page belongs to,
  // then the four that belong to every kit. Every adapter's own pages are
  // built, so every kit in the menu goes to its own landing — spelled out
  // rather than mapped from the matrix, because a list generated from the
  // same source it checks agrees with itself however wrong it is.
  const kit = builtAdapters()[0]!.key;
  expect(hrefs).toEqual([
    "./mantine/",
    "./mui/",
    "./chakra/",
    "./antd/",
    "./radix/",
    "./base-ui/",
    "./shadcn/",
    "./tailwind/",
    ...MATRIX_FEATURES.map((feature) => `./${kit}/${feature.slug}/`),
    "./pagination/",
    "./realtime/",
    "./accessibility/",
    "./rtl/",
  ]);
  // Hidden is not absent: the closed panel is out of the accessibility tree
  // and out of the tab order, which is what `visibility` buys over `opacity`.
  await expect(page.locator("#nav-menu-features")).toBeHidden();
});

test("an open menu paints over the table's sticky header", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/mantine/scale/");
  await expect(page.locator("thead th").first()).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight), {
      timeout: 15_000,
    })
    .toBeGreaterThan(3000);
  await page.evaluate(() => window.scrollTo(0, 1200));

  await openNavGroup(page, "Features");
  const covered = await page.evaluate(() => {
    const panel = document.querySelector("#nav-menu-features");
    if (!panel) return "no panel";
    const box = panel.getBoundingClientRect();
    const hit = document.elementFromPoint(
      Math.round(box.left + box.width / 2),
      Math.round(box.bottom - 12)
    );
    return hit && panel.contains(hit) ? "panel" : "covered";
  });
  expect(covered, "the sticky table header paints over the open menu").toBe(
    "panel"
  );
});

/**
 * The two halves of the layout contract, at every desktop width the bar has to
 * hold: the strip is one line, and neither the bar nor an open panel pushes the
 * document wider than the window.
 *
 * 920px is where the `<select>` takes over, so 1024 is the narrowest desktop
 * the strip has to fit into and 1920 the widest anyone brings.
 */
for (const width of [1024, 1280, 1440, 1728, 1920]) {
  test(`the nav is a single row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".nav__inner")).toBeVisible();

    const closed = await page.evaluate(() => ({
      nav: document.querySelector(".nav")?.getBoundingClientRect().height ?? 0,
      strip:
        document.querySelector(".nav__links")?.getBoundingClientRect().height ??
        0,
      overflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    }));
    expect(closed.nav, "the nav takes more than one line").toBeLessThan(70);
    // One line of 14px text; a wrapped strip is two of them.
    expect(closed.strip).toBeLessThan(34);
    expect(closed.overflow).toBeLessThanOrEqual(1);

    // The rightmost menu is the one that can reach the window edge — an open
    // panel that widens the document turns every page into a sideways scroller.
    await openNavGroup(page, "More");
    const open = await page.evaluate(() => {
      const panel = document
        .querySelector("#nav-menu-more")
        ?.getBoundingClientRect();
      return {
        right: panel?.right ?? 0,
        left: panel?.left ?? 0,
        viewport: document.documentElement.clientWidth,
        nav:
          document.querySelector(".nav")?.getBoundingClientRect().height ?? 0,
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      };
    });
    expect(open.left).toBeGreaterThanOrEqual(0);
    expect(open.right).toBeLessThanOrEqual(open.viewport);
    expect(open.overflow).toBeLessThanOrEqual(1);
    // The panel floats; it never grows the bar it hangs from.
    expect(open.nav).toBe(closed.nav);
  });
}

test("the menu surface follows the theme tokens", async ({ page }) => {
  await page.goto("/mantine/columns/");
  await openNavGroup(page, "Features");
  const read = () =>
    page.evaluate(() => {
      const panel = document.querySelector("#nav-menu-features");
      if (!panel) return null;
      const style = getComputedStyle(panel);
      const root = getComputedStyle(document.documentElement);
      return {
        background: style.backgroundColor,
        surface: root.getPropertyValue("--page-surface").trim(),
        border: style.borderTopColor,
        borderToken: root.getPropertyValue("--page-border").trim(),
      };
    });

  const light = await read();
  expect(light?.background).toBe(light?.surface);
  expect(light?.border).toBe(light?.borderToken);

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await openNavGroup(page, "Features");

  const dark = await read();
  expect(dark?.background).toBe(dark?.surface);
  expect(dark?.border).toBe(dark?.borderToken);
  // The panel actually repainted — a hardcoded white card would read the same
  // in both themes and this is the assertion that would catch it.
  expect(dark?.background).not.toBe(light?.background);
});

test("the phone keeps the select instead of the menus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".nav__links")).toBeHidden();
  const pageSelect = page.getByRole("combobox", { name: "Demo page" });
  await expect(pageSelect).toBeVisible();
  await pageSelect.selectOption("mantine/saved-views");
  await expect(page).toHaveURL(/\/mantine\/saved-views\/$/);
});

/**
 * Nothing a menu draws may land outside the panel that holds it.
 *
 * This is the fault a screenshot hides and a layout only shows at one width: a
 * multi-column panel whose tracks cannot shrink pushes its own text past the
 * rounded border, so a tagline paints on the page behind the card. `minmax(0,
 * 1fr)` sizes the TRACK to zero but does nothing for content that cannot wrap,
 * and a panel pinned to a guessed `min-width` has no way to grow to what it
 * actually holds.
 *
 * The assertion is geometric and needs no fixture: for every menu, every
 * descendant rect has to sit inside the panel's own box with its interior
 * padding to spare. Run against a panel with `white-space: nowrap` taglines and
 * it reports the overflow in pixels.
 */
const EDGE = { inline: 12, block: 8 } as const;

for (const path of ["/mantine/", "/"]) {
  for (const width of [1440, 1024]) {
    test(`every menu keeps its content inside the panel at ${width}px on ${path}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.locator(".nav__inner")).toBeVisible();

      const groups = await page
        .locator(".nav__trigger")
        .evaluateAll((nodes) =>
          nodes.map((node) => (node.textContent ?? "").trim())
        );
      expect(groups.length).toBeGreaterThan(0);

      for (const group of groups) {
        await openNavGroup(page, group);
        const report = await page.evaluate(
          ({ group: label, edge }) => {
            const trig = Array.from(
              document.querySelectorAll(".nav__trigger")
            ).find((node) => (node.textContent ?? "").trim() === label);
            const id = trig?.getAttribute("aria-controls");
            const panel = id ? document.getElementById(id) : null;
            if (!panel) return { panel: null, violations: ["no panel"] };
            const box = panel.getBoundingClientRect();
            const violations: string[] = [];
            for (const node of panel.querySelectorAll("*")) {
              const r = node.getBoundingClientRect();
              if (r.width === 0 && r.height === 0) continue;
              const name = node.className || node.tagName;
              if (r.right > box.right - edge.inline)
                violations.push(
                  `${name} right ${r.right.toFixed(1)} vs panel right ${(
                    box.right - edge.inline
                  ).toFixed(1)}`
                );
              if (r.left < box.left + edge.inline)
                violations.push(
                  `${name} left ${r.left.toFixed(1)} vs panel left ${(
                    box.left + edge.inline
                  ).toFixed(1)}`
                );
              if (r.bottom > box.bottom - edge.block)
                violations.push(
                  `${name} bottom ${r.bottom.toFixed(1)} vs panel bottom ${(
                    box.bottom - edge.block
                  ).toFixed(1)}`
                );
              if (r.top < box.top + edge.block)
                violations.push(
                  `${name} top ${r.top.toFixed(1)} vs panel top ${(
                    box.top + edge.block
                  ).toFixed(1)}`
                );
            }
            return {
              panel: {
                left: Math.round(box.left),
                right: Math.round(box.right),
                width: Math.round(box.width),
              },
              violations,
            };
          },
          { group, edge: EDGE }
        );

        expect(
          report.violations,
          `the ${group} panel paints outside itself: ${report.violations.join(
            "; "
          )}`
        ).toEqual([]);
        // The panel also has to stay a panel — inside the window, and never
        // widening the document from the right edge.
        expect(report.panel?.left).toBeGreaterThanOrEqual(0);
        expect(report.panel?.right).toBeLessThanOrEqual(width);
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth
          )
        ).toBeLessThanOrEqual(1);
        await page.keyboard.press("Escape");
      }
    });
  }
}
