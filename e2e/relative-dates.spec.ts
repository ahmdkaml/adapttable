import { expect, type Page, test } from "@playwright/test";

/**
 * Relative date filters — store the token, never a resolved day.
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
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
}

async function pickRelative(page: Page): Promise<void> {
  const native = page.locator("select").filter({
    has: page.locator('option[value="relative"]'),
  });
  if ((await native.count()) > 0) {
    await native.first().selectOption({ value: "relative" });
    return;
  }
  // Mantine / antd name the control "Start Operator" (or the Arabic pair).
  const labeled = page.getByLabel(/^Start Operator$|^البداية /);
  if ((await labeled.count()) > 0) {
    await labeled.first().click();
  } else {
    // Radix / Base UI: the operator is just "Operator" under the Start label.
    const start = page.getByText(/^Start$|^البداية$/, { exact: true }).first();
    await start
      .locator("xpath=..")
      .getByLabel(/Operator|المُعامل/)
      .first()
      .click();
  }
  const option = page
    .getByRole("option", { name: /Relative|نسبي/ })
    .or(page.getByTitle(/Relative|نسبي/))
    .first();
  await expect(option).toBeVisible();
  await option.dispatchEvent("pointerdown");
  await option.click();
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("relative date writes the token, not a calendar day", async ({
      page,
    }) => {
      await openDemo(page, adapter);
      await openFilters(page);
      await pickRelative(page);
      await expect(page).toHaveURL(/f_startOp=relative/);
      await expect(page).toHaveURL(/f_startFrom=today/);
      await expect(page).not.toHaveURL(/f_startFrom=\d{4}-\d{2}-\d{2}/);
    });

    test("keeps the token under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      await openFilters(page, "عوامل التصفية");
      await pickRelative(page);
      await expect(page).toHaveURL(/f_startFrom=today/);
    });
  });
}
