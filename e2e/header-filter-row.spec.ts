import { expect, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * Per-column header filter icons — same defs as the panel, desktop only.
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

async function openDemo(page: Page, adapter: string): Promise<void> {
  await page.goto("/all-options/");
  await expect(
    demo(page).locator('[data-adapter="mantine"] [data-stagger]').first()
  ).toBeVisible();
  if (adapter !== "mantine") {
    const tab = page.getByTestId(`adapter-${adapter}`);
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
    await expect(
      demo(page).locator(`[data-adapter="${adapter}"] [data-stagger]`).first()
    ).toBeVisible();
  }
  await configureFeatureLab(page, "filters container", "Header");
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("header filter icon filters the name column", async ({ page }) => {
      await openDemo(page, adapter);
      const table = demo(page).locator(`[data-adapter="${adapter}"]`);
      await table
        .locator('[data-adapttable-part="filter-header-trigger"]')
        .first()
        .click();
      const name = page.getByRole("textbox", { name: "Person" });
      await expect(name).toBeVisible();
      await name.fill("Ada");
      await expect(page).not.toHaveURL(/lab\.f_name=/);
      await expect(table.getByText("Ada Lovelace").first()).toBeVisible();
      await expect(table.getByText("Alan Turing")).toHaveCount(0);
    });

    test("picking an operator leaves the header filter open", async ({
      page,
    }) => {
      await openDemo(page, adapter);
      const table = demo(page).locator(`[data-adapter="${adapter}"]`);
      await table
        .getByRole("columnheader", { name: /Person/ })
        .locator('[data-adapttable-part="filter-header-trigger"]')
        .click();
      const panel = page
        .locator('[data-adapttable-part="filter-header-cell"]')
        .filter({ hasText: "Person" });
      await expect(panel).toBeVisible();
      const operator = panel.locator(
        '[data-adapttable-part="filter-operator"]'
      );
      await expect(operator).toBeVisible();
      const tag = await operator.evaluate((el) => el.tagName);
      if (tag === "SELECT") {
        await operator.selectOption({ index: 1 });
      } else {
        await operator.click();
        await page.getByRole("option").nth(1).click();
      }
      await expect(panel).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Person" })).toBeVisible();
    });

    test("header popover is the same field as the Filters panel", async ({
      page,
    }) => {
      await openDemo(page, adapter);
      const table = demo(page).locator(`[data-adapter="${adapter}"]`);
      // Every drawer/popover widget that has a column — text, number range,
      // date range, multi-select — must open AutoFilterForm, not the compact
      // header-row chrome. Team stays hidden; Core has no column.
      for (const { column, field } of [
        { column: "Person", field: "Person" },
        { column: "Budget", field: "Budget" },
        { column: "Timeline", field: "Start" },
        { column: "Load", field: "Allocation count" },
      ] as const) {
        await table
          .getByRole("columnheader", { name: new RegExp(column) })
          .locator('[data-adapttable-part="filter-header-trigger"]')
          .click();
        const panel = page
          .locator('[data-adapttable-part="filter-header-cell"]')
          .filter({ hasText: field });
        await expect(panel).toBeVisible();
        await expect(
          panel.locator('[data-adapttable-part="filter-operator"]')
        ).toBeVisible();
        await expect(
          panel.locator('[data-adapttable-part="filter-header-input"]')
        ).toHaveCount(0);
        await page.keyboard.press("Escape");
      }
      await table
        .getByRole("columnheader", { name: /Status/ })
        .locator('[data-adapttable-part="filter-header-trigger"]')
        .click();
      const status = page
        .locator('[data-adapttable-part="filter-header-cell"]')
        .filter({ hasText: "Status" });
      await expect(status).toBeVisible();
      await expect(
        status.locator('[data-adapttable-part="filter-header-input"]')
      ).toHaveCount(0);
    });

    test("keeps the header filter icon under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await configureFeatureLab(page, "locale", "العربية");
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      await expect(
        tableScopedHeader(demo(page), adapter).first()
      ).toBeVisible();
    });
  });
}

function tableScopedHeader(root: ReturnType<typeof demo>, adapter: string) {
  return root
    .locator(`[data-adapter="${adapter}"]`)
    .locator('[data-adapttable-part="filter-header-trigger"]');
}
