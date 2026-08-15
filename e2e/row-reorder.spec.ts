import { expect, type Locator, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * Row reorder across every kit — the grip appears when the host opts in,
 * Space lifts, arrows move, Space drops, and the first two people swap.
 * `innerText` of a row starts with the empty grip cell, so names are
 * matched from the seed, not split off the first line.
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

const NAMES = [
  "Ada Lovelace",
  "Alan Turing",
  "Grace Hopper",
  "Katherine Johnson",
  "Margaret Hamilton",
  "آدا لوفليس",
  "آلان تورينغ",
  "غريس هوبر",
  "كاثرين جونسون",
  "مارغريت هاميلتون",
] as const;

const demo = (page: Page) => page.locator("#demo");
const part = (page: Page, name: string) =>
  demo(page).locator(`[data-adapttable-part="${name}"]`);

function nameIn(text: string): string {
  return NAMES.find((name) => text.includes(name)) ?? "";
}

async function rowName(row: Locator): Promise<string> {
  const name = nameIn(await row.innerText());
  expect(name.length).toBeGreaterThan(0);
  return name;
}

async function openDemo(page: Page, adapter: string): Promise<void> {
  await page.goto("/all-options/");
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

async function enable(page: Page, group: string): Promise<void> {
  await configureFeatureLab(page, group, "On");
}

async function grabOneDown(page: Page, key: "ArrowDown" | "ArrowLeft") {
  const grip = part(page, "row-reorder-handle").first();
  await expect(grip).toBeVisible();
  const rows = demo(page).locator("[data-stagger]");
  const firstName = await rowName(rows.nth(0));
  const secondName = await rowName(rows.nth(1));
  expect(firstName).not.toBe(secondName);

  await grip.focus();
  await grip.press(" ");
  await expect(grip).toHaveAttribute("aria-pressed", "true");
  await grip.press(key);
  await grip.press(" ");
  await expect(grip).toHaveAttribute("aria-pressed", "false");

  await expect(rows.nth(0)).toContainText(secondName);
  await expect(rows.nth(0)).not.toContainText(firstName);
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("lifts a row with the keyboard and drops it one slot down", async ({
      page,
    }) => {
      await openDemo(page, adapter);
      await enable(page, "reorder");
      await grabOneDown(page, "ArrowDown");
    });

    test("mirrors the horizontal grab under RTL", async ({ page }) => {
      await openDemo(page, adapter);
      await enable(page, "reorder");
      await configureFeatureLab(page, "locale", "العربية");
      await expect(demo(page).locator('[dir="rtl"]').first()).toBeVisible();
      // RTL: ArrowLeft is down, the same as ArrowDown in LTR.
      await grabOneDown(page, "ArrowLeft");
    });
  });
}
