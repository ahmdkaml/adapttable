import { expect, test } from "@playwright/test";

/**
 * The /columns/ demo is the live spreadsheet export: `xlsxWriter` plus
 * `scope: "range"`, button caption `labels.exportFile("xlsx")`. jsdom never
 * sees the browser download; this is the smoke that Export hands the user a
 * real OOXML zip — PK magic, the spreadsheet MIME, a `.xlsx` name — and not
 * an empty file or a CSV with the wrong extension.
 *
 * Cell-range contents live in `columns.spec.ts`. This file only asks: did a
 * real workbook leave the page?
 */

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** ZIP local-file header — every OOXML package starts with these four bytes. */
const ZIP_LOCAL_FILE = [0x50, 0x4b, 0x03, 0x04];

test.describe("xlsx export", () => {
  test("downloads a real OOXML workbook from /columns/", async ({ page }) => {
    await page.goto("/mantine/columns/");
    await expect(
      page.getByRole("columnheader", { name: "Person" }).first()
    ).toBeVisible();

    // Highlight a block so scope: "range" writes that rectangle, not the
    // page-fallback the demo uses when nothing is selected.
    const firstCell = page.locator("[data-grid-cell]").first();
    await firstCell.focus();
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowDown");
    await expect(page.locator("[data-cell-selected]")).toHaveCount(4);

    const exportButton = page.getByRole("button", {
      name: "Export XLSX",
      exact: true,
    });
    await expect(exportButton).toBeVisible();

    // Playwright's Download event does not expose the Blob MIME the writer
    // set. Capture it at createObjectURL — that is the type the browser
    // was given, before the object URL is revoked.
    await page.evaluate(() => {
      const create = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (obj) => {
        if (obj instanceof Blob) {
          document.documentElement.dataset.exportMime = obj.type;
        }
        return create(obj);
      };
    });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      exportButton.click(),
    ]);

    expect(download.suggestedFilename()).toBe("people.xlsx");
    expect(await page.locator("html").getAttribute("data-export-mime")).toBe(
      XLSX_MIME
    );

    const stream = await download.createReadStream();
    if (!stream) throw new Error("download produced no bytes");
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const bytes = Buffer.concat(chunks);

    expect(bytes.byteLength).toBeGreaterThan(200);
    expect([...bytes.subarray(0, 4)]).toEqual(ZIP_LOCAL_FILE);
  });
});
