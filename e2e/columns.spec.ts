import { expect, type Page, test } from "@playwright/test";

/**
 * The /columns/ demo is the wide table: "Person" pinned to the start, eight
 * columns overflowing sideways, Columns menu + resize enabled. Only a real
 * browser can prove a pinned cell holds its offset while the scroll container
 * moves under it — the historical sticky/z-index bug class jsdom can't see.
 */

const headerCell = (page: Page, name: string) =>
  page.getByRole("columnheader", { name }).first();

async function headerX(page: Page, name: string): Promise<number> {
  const box = await headerCell(page, name).boundingBox();
  if (!box) throw new Error(`no layout box for column header "${name}"`);
  return box.x;
}

/** Scroll the table's horizontal container and return the resulting offset. */
async function scrollTableX(page: Page, dx: number): Promise<number> {
  const scroller = page.locator(".ant-table-content, .ant-table-body").first();
  return scroller.evaluate((el, delta) => {
    el.scrollLeft += delta;
    return el.scrollLeft;
  }, dx);
}

test.describe("columns — pinning", () => {
  test("the default-pinned column holds its offset while the table scrolls sideways", async ({
    page,
  }) => {
    await page.goto("/columns/");
    await expect(headerCell(page, "Person")).toBeVisible();

    const pinBefore = await headerX(page, "Person");
    const floatBefore = await headerX(page, "Email");

    const scrolled = await scrollTableX(page, 400);
    expect(scrolled).toBeGreaterThan(200); // the container really scrolled

    // The floating column slid left with the content…
    await expect
      .poll(async () => headerX(page, "Email"))
      .toBeLessThan(floatBefore - 200);
    // …while the pinned column did not move.
    expect(Math.abs((await headerX(page, "Person")) - pinBefore)).toBeLessThan(
      2
    );

    // And nothing scrolled-under bleeds over it: the pinned header is still
    // the hittable element at its own location (hover throws otherwise).
    await headerCell(page, "Person").hover();
  });

  test("pinning a floating column through the Columns menu makes it sticky", async ({
    page,
  }) => {
    await page.goto("/columns/");
    await expect(headerCell(page, "Person")).toBeVisible();

    await page.getByRole("button", { name: "Columns", exact: true }).click();
    await page.getByRole("button", { name: "Pin to start: Status" }).click();
    await page.keyboard.press("Escape");

    // The pin applied: the header cell turned position:sticky. (antd keeps a
    // mid-table pinned column in DOM place — it slides with the content until
    // it reaches its sticky offset, then holds — so stickiness, not a fixed
    // x, is the invariant to assert.)
    await expect
      .poll(() =>
        headerCell(page, "Status").evaluate(
          (el) => getComputedStyle(el).position
        )
      )
      .toBe("sticky");

    // Scroll to the far end so Status has certainly hit its offset and stuck…
    const maxScroll = await scrollTableX(page, 10_000); // clamps to max
    expect(maxScroll).toBeGreaterThan(300);
    const stuckX = await headerX(page, "Status");
    const emailX = await headerX(page, "Email");

    // …then scroll back a little: the floating column slides with the
    // content, the pinned one does not move a pixel (it is still within its
    // stuck range).
    const scroll2 = await scrollTableX(page, -150);
    expect(scroll2).toBe(maxScroll - 150);
    await expect
      .poll(async () => headerX(page, "Email"))
      .toBeGreaterThan(emailX + 100);
    expect(Math.abs((await headerX(page, "Status")) - stuckX)).toBeLessThan(2);
  });
});
