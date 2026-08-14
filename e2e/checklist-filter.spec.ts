import { expect, type Page, test } from "@playwright/test";

/**
 * Excel-style checklist — search, check a value, hide other teams.
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
const filtersTrigger = (page: Page, name = "Filters") =>
  demo(page).getByRole("button", { name, exact: true }).first();
const checklist = (page: Page) =>
  page.locator('[data-adapttable-part="filter-checklist"]').last();

async function openDemo(page: Page, adapter: string): Promise<void> {
  await page.goto("/");
  await expect(
    demo(page).locator('[data-adapter="mantine"] [data-stagger]').first()
  ).toBeVisible();
  if (adapter === "mantine") return;
  const tab = page.getByTestId(`adapter-${adapter}`);
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  await expect(
    demo(page).locator(`[data-adapter="${adapter}"] [data-stagger]`).first()
  ).toBeVisible();
}

async function openFilters(page: Page, name = "Filters"): Promise<void> {
  await page
    .getByRole("group", { name: "filters container" })
    .getByRole("button", { name: "Popover", exact: true })
    .click();
  const trigger = filtersTrigger(page, name);
  // Open with the toolbar at the top of the viewport. The card is taller than
  // the window, and reaching a field further down makes Playwright scroll —
  // which dismisses an anchored popover before the field can be used.
  await trigger.evaluate((node) => {
    window.scrollBy(0, node.getBoundingClientRect().top - 60);
  });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("checking Core keeps Ada and hides Alan", async ({ page }) => {
      await openDemo(page, adapter);
      await openFilters(page);
      const box = checklist(page);
      await box.getByLabel("Search values").fill("Core");
      await box
        .locator('[data-adapttable-part="filter-checkbox"]')
        .filter({ hasText: /Core/ })
        .click();
      await expect(page).toHaveURL(/live\.f_team=/);
      const table = demo(page).locator(`[data-adapter="${adapter}"]`);
      await expect(table.getByText("Ada Lovelace").first()).toBeVisible();
      await expect(table.getByText("Alan Turing")).toHaveCount(0);
      await box.getByLabel("Search values").fill("");
      await expect(
        box
          .locator('[data-adapttable-part="filter-checkbox"]')
          .filter({ hasText: /Web/ })
      ).toBeVisible();
    });

    test("keeps the checklist under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      await openFilters(page, "عوامل التصفية");
      await expect(checklist(page).getByLabel("البحث في القيم")).toBeVisible();
    });
  });
}
