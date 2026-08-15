# React table PDF export and print layout

▶ **See it working:** [download a grouped PDF and print the same view](https://orwa-mahmoud.github.io/adapttable/demo/export-pdf/) — a real table, not a recording.

▶ **Try it live:** [open a Mantine starter in StackBlitz](https://stackblitz.com/github/orwa-mahmoud/adapttable/tree/main/starters/mantine?file=src%2FApp.tsx) — import `@adapttable/core/pdf`. [Other UI kits →](./getting-started.md#try-it-in-stackblitz)

A downloaded PDF and a printed page are the same view — the columns, group
structure and page breaks the reader can actually see — shipped as
`@adapttable/core/pdf` so a table that never imports it never pays for it.
No PDF library.

```tsx
import { pdfWriter, printTable } from "@adapttable/core/pdf";
import { DataTable } from "@adapttable/mantine";

<DataTable
  data={people}
  columns={columns}
  rowKey={(row) => row.id}
  exportCsv={{ writer: pdfWriter(), scope: "all" }}
/>;
```

`pdfWriter` is the production default for the export button: the same
`exportCsv` seam as [CSV and XLSX](./customization.md#export), the same
scopes (`page`, `all`, `selected`, `range`) and the same column subset.
The button relabels itself **Export PDF** from `labels.exportFile("pdf")`.
`buildTablePdf` is the same file, for a host assembling rows by hand.

Print is a different verb. `downloadExportFile` cannot open a dialog, so
`openPrintLayout` (an `ExportTable`) and `printTable` (rows and columns)
load `buildPrintDocument` into a hidden iframe and call `window.print()`.
`buildPrintTableHtml` is the `<table>` alone; `printStyles` is the
stylesheet — repeating `thead`, `break-inside: avoid` on rows and groups,
column widths from the table, `padding-inline-start` so a tree or a
group indents under RTL. `PrintLayoutOptions` / `PdfWriterOptions` /
`PrintPageSize` configure title, direction, paper and whether a
top-level group starts a new page (`pageBreak: "group"`). Paper defaults
to A4 landscape; direction inherits `document.documentElement.dir` when
omitted, so print matches what the reader is looking at.

The PDF is written by hand (Helvetica, one page tree, no dependency).
Glyphs outside WinAnsi paint as `?` and still travel in `/ActualText`.
Scripts the standard fonts cannot draw — Arabic, CJK, emoji — belong on
the print path: the browser has the fonts, and "Save as PDF" from that
dialog is the Unicode-complete file. A font subsetter would be a
dependency, and this entry exists so a CSV export never takes one.

Mobile cards use the same button and the same file. `hideOnMobile` never
shrinks an export; print and PDF are the column view, not a card list.
A grouped or tree-shaped table exports that structure, not a
denormalised leaf list — the same `ExportViewEntry` rows XLSX writes as
outline levels. Omit the import and nothing is drawn and nothing is
downloaded.
