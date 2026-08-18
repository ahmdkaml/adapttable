import { expect, type Page } from "@playwright/test";

/**
 * Driving the demo nav's dropdowns.
 *
 * The bar carries two direct links and three menus, so every page is two moves
 * away: open the group, click the item. The specs that prove a page is
 * reachable go through here rather than each spelling the pair out, because a
 * page moving between groups is then one edit.
 *
 * The demo is adapter-first, so the split is by what a reader is asking for:
 * **Adapters** is the eight kits, **Features** the twelve pages of the kit they
 * are currently in, and **More** the four pages that belong to every kit rather
 * than to one.
 */
export type NavGroup = "Adapters" | "Features" | "More";

/** Open one of the nav's menus, and wait for the trigger to say it is open. */
export async function openNavGroup(page: Page, group: NavGroup): Promise<void> {
  const trigger = page
    .locator(".nav")
    .getByRole("button", { name: group, exact: true });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
}

/** Reach a demo page the way a reader does: open its group, click its item. */
export async function gotoFromNav(
  page: Page,
  group: NavGroup,
  label: string
): Promise<void> {
  await openNavGroup(page, group);
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}
