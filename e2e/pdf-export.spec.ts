import { expect, test } from "@playwright/test";

/**
 * The /export/ demo is the live PDF export: `pdfWriter` plus
 * `scope: "all"`, button caption `labels.exportFile("pdf")`. jsdom never
 * sees the browser download; this is the smoke that Export hands the user a
 * real PDF — `%PDF` magic, the PDF MIME, a `.pdf` name — and not an empty
 * file or a CSV with the wrong extension.
 *
 * Print preview is a different worker. This file does not open the OS
 * print dialog.
 */

const PDF_MIME = "application/pdf";

/** Every PDF file starts with these four bytes (`%PDF`). */
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];

/** The size of the font the demo fetches, so "subset" is a measurement. */
const AMIRI_BYTES = 431_116;

test.describe("pdf export", () => {
  test("downloads a real PDF from /export/", async ({ page }) => {
    await page.goto("/export/");
    await expect(
      page.getByRole("columnheader", { name: "Person" }).first()
    ).toBeVisible();
    await expect(
      page.locator('[data-adapttable-part="group-row"]').first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Print", exact: true })
    ).toBeVisible();

    const exportButton = page.getByRole("button", {
      name: "Export PDF",
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

    expect(download.suggestedFilename()).toBe("people.pdf");
    expect(await page.locator("html").getAttribute("data-export-mime")).toBe(
      PDF_MIME
    );

    const stream = await download.createReadStream();
    if (!stream) throw new Error("download produced no bytes");
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const bytes = Buffer.concat(chunks);

    expect(bytes.byteLength).toBeGreaterThan(200);
    expect([...bytes.subarray(0, 4)]).toEqual(PDF_MAGIC);
  });
});

/**
 * The Arabic download is the font path end to end: the page fetches a real
 * `.ttf`, hands it to `pdfWriter`, and the writer subsets and embeds it.
 *
 * Node's unit tests can prove the subsetter writes a font; only a browser
 * can prove the bytes a user actually receives carry one. The assertions
 * are on the file: a composite font, an embedded font file, and — read out
 * of the document's own `/ToUnicode` map — glyphs standing for Arabic
 * presentation forms, which is shaping having happened rather than the
 * letters going out as typed.
 */
test("embeds a subset font in the Arabic download", async ({ page }) => {
  await page.goto("/export/");
  await expect(
    page.getByRole("columnheader", { name: "Person" }).first()
  ).toBeVisible();

  // The font is fetched on the language switch, so the wait is armed
  // before the switch — a fetch that finishes first is one this test would
  // otherwise sit through the timeout for.
  const fontLoaded = page.waitForResponse(
    (response) => response.url().includes("Amiri-Regular.ttf") && response.ok()
  );
  await page.getByRole("button", { name: "العربية" }).click();
  await fontLoaded;

  // The button's caption is localized too, which is how we know the table
  // switched language and not just the export options.
  const exportButton = page.getByRole("button", {
    name: "تصدير PDF",
    exact: true,
  });
  await expect(exportButton).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    exportButton.click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  const stream = await download.createReadStream();
  if (!stream) throw new Error("download produced no bytes");
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const bytes = Buffer.concat(chunks);
  const text = bytes.toString("latin1");

  expect([...bytes.subarray(0, 4)]).toEqual(PDF_MAGIC);
  expect(text).toContain("/Subtype /Type0");
  expect(text).toContain("/Encoding /Identity-H");
  expect(text).toContain("/FontFile2");
  expect(text).toMatch(/\/BaseFont \/[A-Z]{6}\+Amiri/);

  // Only the glyphs this sheet drew: a fraction of the 421 KB source.
  expect(bytes.byteLength).toBeLessThan(AMIRI_BYTES / 3);

  // A `/ToUnicode` entry pointing into the Arabic presentation forms
  // block is a shaped letter, not the base letter it was typed as.
  expect(text).toMatch(/<[0-9A-F]{4}> <FE[7-9A-F][0-9A-F]>/);
});

/**
 * The export button is toolbar chrome each adapter renders itself, so a kit
 * that never draws it offers no way to export at all.
 */
const KITS = [
  "mantine",
  "mui",
  "chakra",
  "antd",
  "radix",
  "base-ui",
  "shadcn",
  "tailwind",
] as const;

for (const kit of KITS) {
  test(`${kit}: offers the export button on the export page`, async ({
    page,
  }) => {
    await page.goto("/export/");
    if (kit !== "mantine") {
      const tab = page.getByTestId(`adapter-${kit}`);
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
    }
    const root = page.locator(`[data-adapter="${kit}"]`);
    await expect(root.first()).toBeVisible();
    await expect(
      root.getByRole("button", { name: "Export PDF" }).first()
    ).toBeVisible();
  });
}

/**
 * The address this demo used to live at is published — in docs, in llms.txt,
 * in whatever a reader bookmarked. GitHub Pages serves files, so the move is
 * a document that carries the reader across rather than a 301. The test that
 * matters is the reader's: open the old URL, arrive at the live demo.
 */
test.describe("the old /export-pdf/ address", () => {
  test("carries a reader to /export/", async ({ page }) => {
    await page.goto("/export-pdf/");
    await page.waitForURL(/\/export\/$/);
    await expect(
      page.getByRole("columnheader", { name: "Person" }).first()
    ).toBeVisible();
  });

  test("declares the new URL to a crawler without JavaScript", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    // Meta-refresh still fires with scripting off, so read the stub's own
    // bytes rather than whatever the navigation settles on.
    const html = await (await page.goto("/export-pdf/"))!.text();

    expect(html).toContain('http-equiv="refresh"');
    expect(html).toContain("url=../export/");
    expect(html).toContain(
      'href="https://orwa-mahmoud.github.io/adapttable/demo/export/"'
    );

    // Not thin content: a stub carrying one line of text reads as a soft 404,
    // so it says what moved and where in real prose.
    const words = (await page.locator("main").innerText()).split(/\s+/).length;
    expect(words, `the stub serves only ${words} words`).toBeGreaterThan(40);

    // And it mounts no demo — the bundle belongs to the page that moved.
    expect(html).not.toContain("/src/entry-");
    await context.close();
  });
});
