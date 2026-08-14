import { expect, type Page, test } from "@playwright/test";

/**
 * Rich filter operators — operator-first text widgets across every kit,
 * plus RTL. The showcase Person filter is a text field.
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

async function firstOperator(page: Page) {
  const byPart = page.locator('[data-adapttable-part="filter-operator"]');
  if ((await byPart.count()) > 0) return byPart.first();
  return page.getByLabel(/Operator/).first();
}

async function pickStartsWith(page: Page): Promise<void> {
  const operator = await firstOperator(page);
  await expect(operator).toBeVisible();
  const native = operator.locator("select");
  if ((await native.count()) > 0) {
    await native.selectOption({ value: "startsWith" });
    return;
  }
  const tag = await operator.evaluate((el) => el.tagName);
  if (tag === "SELECT") {
    await operator.selectOption({ value: "startsWith" });
    return;
  }
  await operator.click();
  const option = page
    .getByRole("option", { name: /Starts with/ })
    .or(page.getByText("Starts with", { exact: true }))
    .first();
  await expect(option).toBeVisible();
  await option.dispatchEvent("pointerdown");
  await option.click();
}

async function fillPerson(page: Page, text: string): Promise<void> {
  const byPart = page.locator('[data-adapttable-part="filter-input"]');
  if ((await byPart.count()) > 0) {
    const input = byPart.locator("input").or(byPart).first();
    await input.fill(text);
    return;
  }
  const person = page.getByLabel("Person", { exact: true });
  if ((await person.count()) > 0) {
    await person.first().fill(text);
    return;
  }
  await page.getByLabel("Value", { exact: true }).first().fill(text);
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("text filter offers starts-with and writes f_nameOp", async ({
      page,
    }) => {
      await openDemo(page, adapter);
      await openFilters(page);
      await pickStartsWith(page);
      await fillPerson(page, "A");
      await expect(page).toHaveURL(/f_nameOp=startsWith/);
    });

    test("keeps operator chrome under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await page
        .getByRole("group", { name: "locale" })
        .getByRole("button", { name: "العربية", exact: true })
        .click();
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      await openFilters(page, "عوامل التصفية");
      await expect(
        page.locator('[data-adapttable-part="filter-operator"]').first()
      ).toBeVisible();
    });
  });
}
