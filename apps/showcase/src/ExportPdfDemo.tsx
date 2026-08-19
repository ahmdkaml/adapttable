import {
  buildGroupedFlatModel,
  type ColumnDef,
  viewFromGroupedEntries,
} from "@adapttable/core";
import { pdfWriter, printTable } from "@adapttable/core/pdf";
import { Suspense, useEffect, useMemo, useState } from "react";

import { rosterFor } from "./casts";
import {
  budget,
  type Locale,
  type Person,
  personName,
  personRole,
  personStatus,
  STATUS_LABELS,
  strings,
} from "./data";
import { DemoScenarioProvider } from "./Demo";
import { ADAPTERS, Control, DemoFallback, Segmented } from "./kitDemos";
import type { FeatureBodyProps } from "./matrix/featureBodies";
import { Check, Layers } from "./sectionIcons";

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
 * Print columns are primitives with stated widths so the Print dialog shows
 * the same groups and proportions the PDF paginates — not the JSX cells the
 * on-screen table paints.
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
  const rows = rosterFor("export");
  printTable({
    rows,
    columns,
    view: viewFromGroupedEntries(
      buildGroupedFlatModel({
        rows,
        columns,
        groupBy: ["team", "status"],
        getRowId: (row) => row.id,
        collapsedGroupIds: new Set<string>(),
        footers: false,
      }),
      undefined,
      true
    ),
    title: locale === "ar" ? "الفرق" : "Squads",
    direction: locale === "ar" ? "rtl" : "ltr",
    font,
    pageSize: "a4-landscape",
    pageBreak: "group",
  });
}

export function ExportPdfDemo({ dark, adapter }: Readonly<FeatureBodyProps>) {
  const [locale, setLocale] = useState<Locale>("en");
  const font = useArabicFont(locale === "ar");
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
    <div className="mx-demo">
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
              : "Print is opt-in toolbar chrome — same view, browser dialog"}
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
        </div>
      </div>
      <div className="mx-demo__body">
        <div key={adapter} data-adapter={adapter}>
          <Suspense fallback={<DemoFallback />}>
            <DemoScenarioProvider value="export">
              <Demo
                mode="frontend"
                locale={locale}
                dark={dark}
                urlKey="pdf"
                grouping
                exportCsv={exportCsv}
                onPrint={() => {
                  printPeople(locale, font);
                }}
                printButton
                focused
              />
            </DemoScenarioProvider>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
