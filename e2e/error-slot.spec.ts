import { expect, type Page, test } from "@playwright/test";

import { configureFeatureLab } from "./feature-lab";

/**
 * The load-failure state, built-in and replaced, in every kit.
 *
 * Two things are being checked. The built-in one is each kit's own component
 * — an antd Alert, a Mantine Alert, a plain `<div role="alert">` in unstyled
 * — so the assertion is on the part name and the retry, not on any markup.
 * The replaced one has to take the built-in's place completely: a host who
 * replaces the error state should not find the original still underneath it.
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
  if (adapter === "mantine") return;
  const tab = page.getByTestId(`adapter-${adapter}`);
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  await expect(
    demo(page).locator(`[data-adapter="${adapter}"] [data-stagger]`).first()
  ).toBeVisible();
}

for (const adapter of ADAPTERS) {
  test.describe(adapter, () => {
    test("shows the kit's own error state, and recovers on retry", async ({
      page,
    }) => {
      await openDemo(page, adapter);
      await configureFeatureLab(page, "load failure", "Built-in");

      const kit = demo(page).locator(`[data-adapter="${adapter}"]`);
      await expect(kit.getByRole("alert").first()).toBeVisible();
      await expect(kit.getByText(/did not answer/)).toBeVisible();

      // The rows are gone while the load has failed — the error is the body,
      // not a banner over stale data.
      await expect(kit.locator("[data-stagger]")).toHaveCount(0);

      await kit.getByRole("button", { name: /retry|try again/i }).click();
      await expect(kit.locator("[data-stagger]").first()).toBeVisible();
    });

    test("replaces the error state entirely when the host asks", async ({
      page,
    }) => {
      await openDemo(page, adapter);
      await configureFeatureLab(page, "load failure", "Replaced");

      const kit = demo(page).locator(`[data-adapter="${adapter}"]`);
      await expect(kit.locator(".demo-error")).toBeVisible();
      await expect(kit.getByText("Could not load people")).toBeVisible();

      // Replaced means replaced: the kit's own error chrome is gone.
      await expect(kit.locator('[data-adapttable-part="error"]')).toHaveCount(
        0
      );

      // And the retry the replacement was handed is the source's real one.
      await kit.getByRole("button", { name: "Try again" }).click();
      await expect(kit.locator("[data-stagger]").first()).toBeVisible();
    });
  });
}
