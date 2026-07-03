import { expect, test } from "@playwright/test";

/**
 * The scale demo windows tens of thousands of rows through the real Mantine
 * adapter. jsdom has no layout, so only a real browser can prove the window
 * stays bounded — the DOM must hold a few dozen rows, never the whole dataset,
 * even as you scroll.
 */
test.describe("scale — virtualization", () => {
  test("keeps the DOM row count bounded while windowing the full dataset", async ({
    page,
  }) => {
    await page.goto("/scale/");
    const rows = page.getByRole("row");
    await expect(rows.first()).toBeVisible();

    // ~24 rows are windowed against the viewport — never the tens of thousands
    // in the source list.
    const initial = await rows.count();
    expect(initial).toBeGreaterThan(0);
    expect(initial).toBeLessThan(120);

    // Scrolling advances the window but the DOM stays just as small.
    await page.mouse.wheel(0, 6000);
    await expect
      .poll(async () => rows.count(), { timeout: 5000 })
      .toBeLessThan(120);
    expect(await rows.count()).toBeGreaterThan(0);
  });
});
