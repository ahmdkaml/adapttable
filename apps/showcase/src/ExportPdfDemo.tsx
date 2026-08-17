import {
  buildGroupedFlatModel,
  type ColumnDef,
  viewFromGroupedEntries,
} from "@adapttable/core";
import { pdfWriter, printTable } from "@adapttable/core/pdf";
import { Suspense, useEffect, useMemo, useState } from "react";

import { cssVars } from "./cssVars";
import {
  budget,
  type Locale,
  PEOPLE,
  type Person,
  personName,
  personRole,
  personStatus,
  STATUS_LABELS,
  strings,
} from "./data";
import {
  ADAPTERS,
  Control,
  DemoFallback,
  KitSwitcher,
  readKitFromUrl,
  Segmented,
} from "./kitDemos";
import { Check, Layers } from "./sectionIcons";
import { SectionHead } from "./sections";
import { ADAPTER_TOKENS } from "./themeTokens";

/**
 * The font the Arabic download embeds.
 *
 * Amiri, under the SIL Open Font License, sits in `public/fonts` beside its
 * licence. It is fetched only when the demo switches language: a table of
 * Latin rows embeds nothing, which is the point of the option being one.
 */
const ARABIC_FONT_URL = "/fonts/Amiri-Regular.ttf";

/**
 * Load the font, once, the first time it is asked for.
 *
 * This is what an app does too — the writer takes bytes, so the host
 * decides when they arrive and from where. Until they do, the export still
 * works; it just writes the built-in face.
 */
function useArabicFont(enabled: boolean): ArrayBuffer | undefined {
  const [font, setFont] = useState<ArrayBuffer>();
  useEffect(() => {
    if (!enabled || font) return;
    let live = true;
    void fetch(ARABIC_FONT_URL)
      .then((response) => response.arrayBuffer())
      .then((bytes) => {
        if (live) setFont(bytes);
      })
      .catch((error: unknown) => {
        console.error("the demo font did not load", error);
      });
    return () => {
      live = false;
    };
  }, [enabled, font]);
  return font;
}

/**
 * Print columns are primitives with stated widths so the host-owned Print
 * control shows the same groups and proportions the PDF paginates — not
 * the JSX cells the on-screen table paints.
 */
function printColumns(locale: Locale): ColumnDef<Person>[] {
  const s = strings(locale);
  return [
    {
      key: "person",
      header: s.person,
      accessor: (row) => personName(row, locale),
      width: 200,
    },
    { key: "team", header: s.team, accessor: (row) => row.team, width: 110 },
    {
      key: "status",
      header: s.status,
      accessor: (row) => STATUS_LABELS[locale][personStatus(row)],
      width: 100,
    },
    {
      key: "role",
      header: s.role,
      accessor: (row) => personRole(row, locale),
      width: 160,
    },
    {
      key: "budget",
      header: s.budget,
      accessor: (row) => budget(row),
      exportValue: (row) => budget(row),
      width: 110,
    },
  ];
}

/** Open the browser print dialog on the grouped view. Core has no Print button. */
function printPeople(locale: Locale, font: ArrayBuffer | undefined): void {
  const columns = printColumns(locale);
  printTable({
    rows: PEOPLE,
    columns,
    view: viewFromGroupedEntries(
      buildGroupedFlatModel({
        rows: PEOPLE,
        columns,
        groupBy: ["team", "status"],
        getRowId: (row) => row.id,
        collapsedGroupIds: new Set<string>(),
        footers: false,
      }),
      undefined,
      true
    ),
    title: locale === "ar" ? "الموظفون" : "People",
    direction: locale === "ar" ? "rtl" : "ltr",
    font,
    pageSize: "a4-landscape",
    pageBreak: "group",
  });
}

export function ExportPdfDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const [locale, setLocale] = useState<Locale>("en");
  const font = useArabicFont(locale === "ar");
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;

  /**
   * `scope: "all"` takes every filtered row — not just the current page of
   * five — so collapsed groups and later pages still leave the file.
   * `pdfWriter` paginates on group boundaries and honours column widths.
   * Handing it `font` is the whole of what Arabic needs: the writer subsets
   * that file to the glyphs this sheet used and embeds the result.
   */
  const exportCsv = useMemo(
    () =>
      ({
        scope: "all",
        writer: pdfWriter({
          title: locale === "ar" ? "الموظفون" : "People",
          direction: locale === "ar" ? "rtl" : "ltr",
          font: locale === "ar" ? font : undefined,
          pageSize: "a4-landscape",
          pageBreak: "group",
        }),
        filename: locale === "ar" ? "الموظفون.pdf" : "people.pdf",
      }) as const,
    [locale, font]
  );

  return (
    <section className="sec shell" id="export">
      <SectionHead title="Download a PDF. Print a grouped view.">
        Pass <code>pdfWriter</code> on <code>exportCsv</code> and the toolbar
        says <strong>Export PDF</strong> — the same seam as CSV and XLSX,{" "}
        <code>{'scope: "all"'}</code> so every grouped row leaves the file.
        Print is a different verb: a host-owned control calls{" "}
        <code>printTable</code> (which loads <code>openPrintLayout</code>) so
        the browser dialog sees column widths, nested groups and page breaks.
        This button builds its sample from the same rows and columns; in an app,
        pass the table&apos;s current view when print must follow live collapse
        or filter state. There is no core Print button. Switch to العربية and
        both paths take a <code>font</code>: the download embeds a subset of it
        and draws joined, right-to-left Arabic, and print carries the same face
        so the two match.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <div
          className="hint-row"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span className="hint">
              <Layers size={12} /> grouped by team, then status
            </span>
            <span className="hint">
              <Check size={12} /> Export PDF writes the whole grouped sheet
            </span>
            <span className="hint">
              <Check size={12} />{" "}
              {locale === "ar"
                ? "Amiri embedded as a subset — shaped, right to left"
                : "Print is host-owned — same view, browser dialog"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Control label="Language">
              <Segmented
                label="Language"
                value={locale}
                onChange={setLocale}
                options={[
                  { value: "en", label: "English" },
                  { value: "ar", label: "العربية" },
                ]}
              />
            </Control>
            <button
              type="button"
              className="nav__cta"
              onClick={() => {
                printPeople(locale, font);
              }}
            >
              Print
            </button>
          </div>
        </div>
        <div
          className="pad-surface__body"
          style={cssVars({
            "--c": dark ? token.accentDark : token.accentLight,
          })}
        >
          <div key={adapter} data-adapter={adapter}>
            <Suspense fallback={<DemoFallback />}>
              <Demo
                mode="frontend"
                locale={locale}
                dark={dark}
                urlKey="pdf"
                grouping
                exportCsv={exportCsv}
                focused
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
