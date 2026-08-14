import { expect, type Page, test } from "@playwright/test";

/**
 * Boolean filter — tri-state any/true/false across every kit, plus RTL.
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

async function pickTrue(page: Page): Promise<void> {
  const control = page.getByLabel(/Core team|الفريق الأساسي/).first();
  await expect(control).toBeVisible();
  const native = control.locator("select");
  if ((await native.count()) > 0) {
    await native.selectOption({ value: "true" });
    return;
  }
  const tag = await control.evaluate((el) => el.tagName);
  if (tag === "SELECT") {
    await control.selectOption({ value: "true" });
    return;
  }
  await control.click();
  const option = page
    .getByRole("option", { name: /True|نعم/ })
    .or(page.getByText("True", { exact: true }))
    .first();
  await expect(option).toBeVisible();
  await option.dispatchEvent("pointerdown");
  await option.click();
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("boolean filter writes f_core=true", async ({ page }) => {
      await openDemo(page, adapter);
      await openFilters(page);
      await pickTrue(page);
      await expect(page).toHaveURL(/f_core=true/);
    });

    test("keeps the tri-state under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      await openFilters(page, "عوامل التصفية");
      await expect(
        page.getByLabel(/Core team|الفريق الأساسي/).first()
      ).toBeVisible();
    });
  });
}
