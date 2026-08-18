/**
 * The adapter × feature matrix — who the showcase's demo pages are FOR.
 *
 * AdaptTable is one engine wearing eight kits, so the demo reads that way: a
 * landing page per adapter ("AdaptTable for Mantine"), and one page per feature
 * underneath it ("Saved views in Mantine"). Somebody searching for a Mantine
 * pivot table finds a page about a Mantine pivot table, with Mantine's install
 * line and Mantine's components on screen — not a generic page with a kit
 * switcher they have to find and press.
 *
 * Everything about those pages is here, in plain JavaScript, because four
 * consumers with nothing else in common read it:
 *
 *   - `pages.mjs` expands the matrix into the page manifest.
 *   - `scripts/build-showcase-html.mjs` writes each page's static HTML —
 *     the title, the description and the no-JavaScript copy a crawler reads.
 *   - `src/matrix/*` renders the live page from the same words.
 *   - `src/sections.tsx` builds the nav out of the same two lists.
 *
 * One home per fact: the copy a reader sees in Google and the copy they see on
 * the page are the same string, and a feature added here appears in the
 * manifest, the sitemap, the nav and the built HTML without being typed again.
 *
 * `{kit}`, `{pkg}` and `{peer}` in any string are filled from the adapter the
 * page is for — see `fillTemplate`. They are the only substitution: a sentence
 * that would need more than a name swapped is written per adapter in `notes`,
 * or it is not written at all.
 */

/**
 * One UI kit AdaptTable adapts to.
 *
 * @typedef {object} ShowcaseAdapter
 * @property {string} key URL segment and switcher id — `mantine`.
 * @property {string} label The kit's own name — `Mantine`.
 * @property {string} blurb One phrase on the kit's look, for the switcher card.
 * @property {string} accentLight The kit's accent on a light page.
 * @property {string} accentDark The kit's accent on a dark page.
 * @property {string} pkg The adapter package a consumer installs.
 * @property {string} peer The kit's own packages, which stay peers.
 * @property {string} install The full install line, kit packages included.
 * @property {string} provider The kit's provider component, or "" when the kit
 *   needs none.
 * @property {string} tagline The landing page's promise, one sentence.
 * @property {string} surface What the kit renders the table's chrome with —
 *   named components, verifiable in the adapter's source.
 * @property {boolean} built Whether this adapter has its own landing and
 *   feature pages yet. Until it does, the nav sends readers to the live demo
 *   pinned to that kit, which is a page that exists and shows that kit.
 */

/**
 * The eight adapters, in the order the switcher and the nav show them.
 *
 * `label`, `blurb` and the two accents are the switcher's tokens — the same
 * values `src/themeTokens.ts` re-exports, kept here so the nav, the landing
 * pages and the switcher cannot describe the same kit differently.
 *
 * @type {ShowcaseAdapter[]}
 */
export const SHOWCASE_ADAPTERS = [
  {
    key: "mantine",
    label: "Mantine",
    blurb: "Rounded, friendly, filled controls",
    accentLight: "oklch(0.58 0.17 252)",
    accentDark: "oklch(0.66 0.16 252)",
    pkg: "@adapttable/mantine",
    peer: "@mantine/core",
    install:
      "pnpm add @adapttable/mantine @adapttable/core @mantine/core @mantine/hooks",
    provider: "MantineProvider",
    tagline:
      "A data table that renders as Mantine, because it is built from Mantine.",
    surface:
      "Mantine's own Paper, Table, Popover, Drawer, Card, Checkbox, Select and Pagination",
    built: true,
  },
  {
    key: "mui",
    label: "MUI",
    blurb: "Material elevation, uppercase actions",
    accentLight: "oklch(0.55 0.18 264)",
    accentDark: "oklch(0.7 0.15 264)",
    pkg: "@adapttable/mui",
    peer: "@mui/material",
    install:
      "pnpm add @adapttable/mui @adapttable/core @mui/material @emotion/react @emotion/styled",
    provider: "ThemeProvider",
    tagline: "A Material data table, drawn by MUI's own components.",
    surface: "MUI's Paper, Table, Popover, Drawer, Card, Checkbox and Select",
    built: false,
  },
  {
    key: "chakra",
    label: "Chakra",
    blurb: "Soft teal, generous radius",
    accentLight: "oklch(0.6 0.1 188)",
    accentDark: "oklch(0.72 0.1 188)",
    pkg: "@adapttable/chakra",
    peer: "@chakra-ui/react",
    install: "pnpm add @adapttable/chakra @adapttable/core @chakra-ui/react",
    provider: "ChakraProvider",
    tagline: "A Chakra data table, with Chakra's controls throughout.",
    surface: "Chakra's Table, Popover, Drawer, Card, Checkbox and Select",
    built: false,
  },
  {
    key: "antd",
    label: "Ant Design",
    blurb: "Compact, tinted header, crisp",
    accentLight: "oklch(0.56 0.2 262)",
    accentDark: "oklch(0.65 0.18 262)",
    pkg: "@adapttable/antd",
    peer: "antd",
    install: "pnpm add @adapttable/antd @adapttable/core antd",
    provider: "ConfigProvider",
    tagline: "An Ant Design data table, in Ant Design's own controls.",
    surface: "antd's Table, Popover, Drawer, Card, Checkbox and Select",
    built: false,
  },
  {
    key: "radix",
    label: "Radix",
    blurb: "Radix Themes, iris accent",
    accentLight: "oklch(0.54 0.19 280)",
    accentDark: "oklch(0.7 0.16 280)",
    pkg: "@adapttable/radix",
    peer: "@radix-ui/themes",
    install: "pnpm add @adapttable/radix @adapttable/core @radix-ui/themes",
    provider: "Theme",
    tagline: "A Radix Themes data table, accent token and all.",
    surface: "Radix Themes' Table, Popover, Dialog, Card, Checkbox and Select",
    built: false,
  },
  {
    key: "base-ui",
    label: "Base UI",
    blurb: "Unstyled primitives, blue accent",
    accentLight: "oklch(0.55 0.19 255)",
    accentDark: "oklch(0.7 0.15 255)",
    pkg: "@adapttable/base-ui",
    peer: "@base-ui/react",
    install: "pnpm add @adapttable/base-ui @adapttable/core @base-ui/react",
    provider: "",
    tagline: "A Base UI data table — their primitives, your tokens.",
    surface: "Base UI's Popover, Dialog, Checkbox, Select and Menu primitives",
    built: false,
  },
  {
    key: "shadcn",
    label: "shadcn",
    blurb: "Monochrome, ring focus",
    accentLight: "oklch(0.28 0.01 264)",
    accentDark: "oklch(0.92 0.004 264)",
    pkg: "@adapttable/shadcn",
    peer: "tailwindcss",
    install: "pnpm add @adapttable/shadcn @adapttable/core",
    provider: "",
    tagline: "A shadcn/ui data table, styled by the classes you already own.",
    surface: "the shadcn class conventions over the unstyled adapter's markup",
    built: false,
  },
  {
    key: "tailwind",
    label: "Tailwind",
    blurb: "Unstyled — your own classes",
    accentLight: "oklch(0.55 0.2 277)",
    accentDark: "oklch(0.68 0.17 277)",
    pkg: "@adapttable/unstyled",
    peer: "react",
    install: "pnpm add @adapttable/unstyled @adapttable/core",
    provider: "",
    tagline: "Native controls and no opinions — every class is yours.",
    surface: "native HTML controls, every one addressable by class name",
    built: false,
  },
];

/**
 * One feature, told per adapter.
 *
 * @typedef {object} MatrixFeature
 * @property {string} slug URL segment under the adapter — `saved-views`.
 * @property {string} label Nav and card caption — `Saved views`.
 * @property {string} h1 The page's heading. Templated.
 * @property {string} title The `<title>`, written as the search result it wants
 *   to win. Templated.
 * @property {string} description The meta description. Templated.
 * @property {string[]} intro Two or three real sentences, served in the static
 *   HTML and rendered again by the page. Templated.
 * @property {string} card The one line under this feature on the landing grid.
 * @property {string} snippet The code, with the adapter's real import path.
 *   Templated.
 * @property {Record<string, string>} notes What is true about this feature in
 *   THIS kit, keyed by adapter — the sentence that cannot be templated. A kit
 *   with nothing honest to add has no entry, and the page shows none.
 * @property {string[]} docs Documentation slugs this feature is written up in.
 */

/**
 * The twelve features that get a page per adapter.
 *
 * Curated rather than exhaustive: these are the ones people search for by name
 * and evaluate a table on. Pagination, realtime, accessibility and RTL are
 * properties of every one of these pages rather than destinations of their own,
 * so they stay single shared pages.
 *
 * @type {MatrixFeature[]}
 */
export const MATRIX_FEATURES = [
  {
    slug: "saved-views",
    label: "Saved views",
    h1: "Saved views in {kit}",
    title: "{kit} saved views — AdaptTable",
    description:
      "Name a table arrangement and switch between saved views in {kit} — filters, sort, columns, density and pivot in one link. Rename, reorder and set a default from the {kit} panel.",
    intro: [
      "A view is everything the table can put in a URL — search, sort, filters, grouping, the column layout, density and the pivot — saved under a name.",
      "Readers pick one from the views menu; the panel beside the table renames, reorders, sets the default and deletes. A view someone else shared arrives read-only and says so on the row.",
      "Both are {kit} components: the menu, the panel, the rename box and every control on it come from {peer}, so a saved view looks like the rest of your app.",
    ],
    card: "Name an arrangement, share it as a link, manage the list in place.",
    snippet: `import {
  DataTable,
  SavedViewsPanel,
  useSavedViews,
} from "{pkg}";

export function People({ rows, columns }) {
  const views = useSavedViews({
    storageKey: "people-views",
    urlKey: "v",
  });
  return (
    <>
      <SavedViewsPanel
        views={views.views}
        onApply={views.apply}
        onRename={views.rename}
        onMove={views.move}
        onSetDefault={views.setDefault}
        onRemove={views.remove}
      />
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        urlKey="v"
        savedViews={{ storageKey: "people-views" }}
      />
    </>
  );
}`,
    notes: {
      mantine:
        "The panel is a Mantine Stack of rows; each name is a Button that applies the view, the icon cluster is ActionIcons, and renaming happens in a Mantine TextInput without leaving the row.",
    },
    docs: ["saved-views", "url-state"],
  },
  {
    slug: "pivot",
    label: "Pivot",
    h1: "Pivot tables in {kit}",
    title: "{kit} pivot table — AdaptTable",
    description:
      "Build a pivot table in {kit}: drag-free row, column and measure zones, subtotals at every level, and the whole configuration carried in the URL.",
    intro: [
      "Grouping answers “what is the total per team”. A pivot answers “what is the total per team per status”, and that second dimension becomes columns your data never had.",
      "Fields move between the three zones with buttons rather than drag, so the pivot can be built from the keyboard. Subtotals close every group and a grand total closes the table.",
      "The configuration — axes, measures, aggregation and what you folded — lives in the URL, so a pivot you build is a pivot you can send someone.",
    ],
    card: "Rows down the side, dimensions across the top, subtotals at every level.",
    snippet: `import { DataTable, PivotPanel } from "{pkg}";
import { usePivotUrlState } from "@adapttable/core/pivot";

export function Spend({ rows, fields }) {
  const pivot = usePivotUrlState({
    urlKey: "p",
    defaultConfig: {
      rows: ["team"],
      columns: ["status"],
      measures: [{ key: "budget", agg: "sum" }],
    },
  });
  return (
    <>
      <PivotPanel fields={fields} {...pivot} />
      <DataTable
        data={rows}
        columns={pivot.columns}
        rowKey={(row) => row.id}
      />
    </>
  );
}`,
    notes: {
      mantine:
        "The zone panel is Mantine's — Stack, Group, Select and Button — and the pivot renders through the same Mantine table as everything else, header tree included.",
    },
    docs: ["pivot"],
  },
  {
    slug: "formulas",
    label: "Formulas",
    h1: "Spreadsheet formulas in {kit}",
    title: "{kit} table formulas — AdaptTable",
    description:
      "Add computed columns to a {kit} data table from spreadsheet formulas — ROUND, IF, UPPER, string joins and aggregates, with errors reported in the cell that caused them.",
    intro: [
      "A formula column is a column nobody wrote code for: type `=ROUND(budget * 0.15, 0)` and the table computes it per row, sorts it, filters it and exports it like any other column.",
      "The engine covers arithmetic, comparison, string joins, IF, and the aggregate functions a footer needs. A bad reference reports in the cell that caused it rather than blanking the table, and a circular reference reports `#CYCLE!` instead of recursing.",
      "Formula columns serialize to the URL with everything else, so a derived column travels in the same link as the filters it sits beside.",
    ],
    card: "Computed columns typed as formulas, errors reported in the cell.",
    snippet: `import { DataTable } from "{pkg}";
import { buildFormulaColumns } from "@adapttable/core/formula";

const derived = buildFormulaColumns([
  {
    key: "margin",
    header: "Margin",
    formula: "=ROUND(budget * 0.15, 0)",
  },
  {
    key: "tag",
    header: "Tag",
    formula: '=UPPER(team) & " · " & role',
  },
]);

export function People({ rows, columns }) {
  return (
    <DataTable
      data={rows}
      columns={[...columns, ...derived]}
      rowKey={(row) => row.id}
    />
  );
}`,
    notes: {
      mantine:
        "The formula bar on this page is the host's own chrome, not the table's — the engine hands back column definitions, and Mantine renders the resulting columns exactly like the declared ones.",
    },
    docs: ["formulas"],
  },
  {
    slug: "editing",
    label: "Editing",
    h1: "Inline cell editing in {kit}",
    title: "{kit} editable data table — AdaptTable",
    description:
      "Edit cells in place in a {kit} table — text, number and select editors, Enter to commit, paste from a spreadsheet, undo in one press. Your handler owns every write.",
    intro: [
      "Mark a column `editable`, pass `onCellEdit`, and double-click opens a {kit} editor in the cell. Enter commits, Escape cancels, Tab moves to the next editable cell.",
      "The table never mutates your rows. It hands your handler the row, the column and the new value, and shows whatever you hand back — which is what makes optimistic updates, validation and rollback yours to decide.",
      "With `cellNavigation` on, the same handler receives whole blocks: paste a spreadsheet range with Ctrl+V, drag the fill handle, and undo the entire paste with one Ctrl+Z.",
    ],
    card: "Kit-native editors in the cell; every write goes through your handler.",
    snippet: `import { DataTable } from "{pkg}";

const columns = [
  { key: "name", editable: true },
  {
    key: "status",
    editable: true,
    editor: { type: "select", options: ["active", "on-leave"] },
  },
  { key: "budget", editable: true, editor: "number" },
];

export function People({ rows, onSave }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={(row) => row.id}
      cellNavigation
      editHistory
      onCellEdit={(row, key, value) =>
        onSave({ ...row, [key]: value })
      }
    />
  );
}`,
    notes: {
      mantine:
        "The editors are Mantine's TextInput, NumberInput and NativeSelect, mounted in the cell — so an edit in progress carries your Mantine theme's focus ring and sizing.",
    },
    docs: ["editing", "cell-navigation"],
  },
  {
    slug: "tree",
    label: "Tree data",
    h1: "Tree data in {kit}",
    title: "{kit} tree table — AdaptTable",
    description:
      "Render hierarchical rows in a {kit} data table — parent/child nesting, chevrons, keyboard traversal and expansion state carried in the URL.",
    intro: [
      "A tree grid is a different shape from a grouped table: the rows themselves nest, rather than being collected under synthetic headers. Point the table at `getChildren` or `getParentId` and it renders the hierarchy.",
      "Children indent under their parent, a chevron opens and closes each branch, and arrow keys walk the tree the way a tree widget should. Expansion is part of the table's state, so it lives in the URL like everything else.",
      "Sorting and filtering apply within the tree rather than flattening it — a branch keeps its shape, and a matching child keeps its ancestors on screen.",
    ],
    card: "Rows that contain rows — nesting, chevrons, keyboard traversal.",
    snippet: `import { DataTable } from "{pkg}";

export function Org({ people, columns }) {
  return (
    <DataTable
      data={people}
      columns={columns}
      rowKey={(row) => row.id}
      getParentId={(row) => row.managerId}
      treeColumn="name"
      urlKey="org"
    />
  );
}`,
    notes: {
      mantine:
        "The branch toggle is a Mantine ActionIcon in the tree column, and the indent is drawn on the kit's own cell — so a nested row is still a Mantine table row.",
    },
    docs: ["tree-data"],
  },
  {
    slug: "mobile-cards",
    label: "Mobile cards",
    h1: "Mobile cards in {kit}",
    title: "{kit} table mobile cards — AdaptTable",
    description:
      "A {kit} data table that becomes cards on phones — automatic below the mobile breakpoint, same filters and URL state, infinite scroll instead of a pager.",
    intro: [
      "Below the mobile breakpoint every row becomes a {kit} card. Same columns, same row content, same query state — there is nothing to configure and no second layout to build.",
      '`paginationMode="auto"` resolves to infinite scroll on phones and a pager on desktop. Per column, `mobileLabel` and `hideOnMobile` tune what a card shows.',
      "`renderCard` replaces the card's body with your own layout while the shell keeps selection, row actions and expansion — so a custom card is a layout decision, not a rewrite.",
    ],
    card: "Every row becomes a card on phones. Automatically, with the same state.",
    snippet: `import { DataTable } from "{pkg}";

export function People({ rows, columns }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={(row) => row.id}
      paginationMode="auto"
      mobileBreakpoint={768}
      renderCard={(row, card) => (
        <MyCard row={row} {...card} />
      )}
    />
  );
}`,
    notes: {
      mantine:
        "Each card is a Mantine Card, and compact density switches it to the tighter Mantine padding — the phone layout inherits your theme rather than approximating it.",
    },
    docs: ["mobile"],
  },
  {
    slug: "scale",
    label: "Scale",
    h1: "Large datasets in {kit}",
    title: "{kit} data table at scale — AdaptTable",
    description:
      "Render 100,000 rows and 40 columns in a {kit} data table — row and column virtualization, sticky headers, pinned columns, and sorting that stays interactive.",
    intro: [
      "Turn `virtualize` on and the table renders the rows in view plus a small overscan, whatever the dataset's size. `virtualizeColumns` does the same across, for column sets far wider than the window.",
      "The header stays pinned, pinned columns stay put, and the scroll box scrolls — never the page. Sorting, filtering and selection keep working on the whole dataset rather than on what is drawn.",
      "Nothing about the markup changes: it is the same {kit} table, with the rows outside the window absent rather than hidden.",
    ],
    card: "100k rows, 40 columns, virtualized rows and columns, sticky chrome.",
    snippet: `import { DataTable } from "{pkg}";

export function Ledger({ rows, columns }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={(row) => row.id}
      virtualize
      virtualizeColumns
      maxHeight={600}
      defaultColumnLayout={{ pinned: { name: "start" } }}
    />
  );
}`,
    notes: {
      mantine:
        "Virtualization happens inside Mantine's own scroll box — the sticky header and pinned cells are the adapter's, so the 100,000th row is styled exactly like the first.",
    },
    docs: ["performance", "virtualization"],
  },
  {
    slug: "columns",
    label: "Columns",
    h1: "Column management in {kit}",
    title: "{kit} table column management — AdaptTable",
    description:
      "Show, hide, reorder, pin and resize columns in a {kit} data table from a built-in menu — and persist the layout to the URL, storage or your server.",
    intro: [
      "Everything a user expects to do to a column, without writing a column-settings panel: show and hide, reorder by drag, pin to either edge, resize by drag or keyboard, and switch row density.",
      "Pinning is logical rather than physical, so a column pinned to the start stays on the correct side in a right-to-left layout.",
      "The arrangement is state like any other: persist it to the URL, to localStorage, or to your own server through `columnLayout` and `onColumnLayoutChange`.",
    ],
    card: "Show, hide, reorder, pin and resize — from a menu you did not write.",
    snippet: `import { DataTable } from "{pkg}";

export function People({ rows, columns, layout, onLayout }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={(row) => row.id}
      enableColumnMenu
      resizableColumns
      columnLayout={layout}
      onColumnLayoutChange={onLayout}
    />
  );
}`,
    notes: {
      mantine:
        "The column menu is a Mantine Popover of Checkboxes and ActionIcons, and the resize handle sits on the kit's own header cell — no second design language on top of your theme.",
    },
    docs: ["column-management", "columns"],
  },
  {
    slug: "filtering",
    label: "Filtering",
    h1: "Filtering in {kit}",
    title: "{kit} table filtering — AdaptTable",
    description:
      "Filter a {kit} data table with kit-native controls — text and number operators, date ranges, a checklist of present values, an AND/OR tree, and removable chips.",
    intro: [
      "Declare what a column filters by and the table builds the control: text and number operators, date ranges with relative presets, and a checklist of the values actually present.",
      "For the cases one row of inputs cannot express there is an AND/OR tree, and every active filter shows as a chip that removes itself.",
      "The whole filter state lives in the URL, so a filtered view is a link someone can send — and the popover, drawer, inputs and chips are all {kit} components.",
    ],
    card: "Kit-native operators, date ranges, checklists, an AND/OR tree, chips.",
    snippet: `import { DataTable } from "{pkg}";

const columns = [
  { key: "name", filter: "text" },
  {
    key: "team",
    filter: { type: "select", options: "auto" },
  },
  { key: "budget", filter: "numberRange" },
  { key: "hiredAt", filter: "dateRange" },
];

export function People({ rows }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={(row) => row.id}
      filtersMode="popover"
      urlKey="f"
    />
  );
}`,
    notes: {
      mantine:
        "The popover is Mantine's Popover and the drawer its Drawer; inside them the controls are TextInput, NumberInput, Select, MultiSelect and Checkbox — the filter form is Mantine all the way down.",
    },
    docs: ["filtering", "filter-tree", "url-state"],
  },
  {
    slug: "export",
    label: "Export & print",
    h1: "Export and print in {kit}",
    title: "{kit} table export to CSV, Excel and PDF — AdaptTable",
    description:
      "Export a {kit} data table to CSV, XLSX or PDF from one toolbar button — grouped sheets with outline levels, selected ranges only, and a real print layout.",
    intro: [
      "One `exportCsv` prop puts an export button in the toolbar, and one `scope` decides what leaves: the current page, every filtered row, or exactly the cells selected.",
      "Swap the writer and the same button produces a different file. `xlsxWriter` writes Excel outline levels for grouped rows and bolds the totals; `pdfWriter` lays out a paginated document, right-to-left scripts included when you hand it a font.",
      "`printTable` opens the browser's own print dialog against a layout built for paper rather than a screenshot of the page.",
    ],
    card: "CSV, XLSX and PDF from one seam — plus a real print layout.",
    snippet: `import { DataTable } from "{pkg}";
import { xlsxWriter } from "@adapttable/core/xlsx";

export function People({ rows, columns }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={(row) => row.id}
      groupBy="team"
      exportCsv={{
        scope: "all",
        filename: "people.xlsx",
        writer: xlsxWriter({ sheetName: "People" }),
      }}
    />
  );
}`,
    notes: {
      mantine:
        "The export control is a Mantine Button in the kit's toolbar, and its busy state is Mantine's — the file is written off the main thread either way.",
    },
    docs: ["export-csv", "export-pdf"],
  },
  {
    slug: "selection",
    label: "Selection",
    h1: "Row selection in {kit}",
    title: "{kit} table row selection — AdaptTable",
    description:
      "Select rows in a {kit} data table and act on them in bulk — a set of ids that survives paging, kit-native checkboxes, and bulk actions with confirmation.",
    intro: [
      "Tick rows one at a time or take the whole page from the header box. The selection is a set of ids rather than a slice of what is rendered, so a row chosen on page one is still chosen while page three is on screen.",
      "Bulk actions run against that set, can ask for confirmation first, and report back through your own handler — the table never performs the write.",
      "Selection is controllable: hand it `selectedIds` and `onSelectionChange` and it becomes state your app owns.",
    ],
    card: "A set of ids that survives paging, with bulk actions over it.",
    snippet: `import { DataTable } from "{pkg}";

export function People({ rows, columns, onArchive }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={(row) => row.id}
      bulkActions={[
        {
          key: "archive",
          label: "Archive",
          confirm: true,
          onAction: (ids) => onArchive(ids),
        },
      ]}
    />
  );
}`,
    notes: {
      mantine:
        "Every box is a Mantine Checkbox, indeterminate state included, and the bulk bar that appears above the table is built from Mantine Buttons.",
    },
    docs: ["selection", "bulk-actions"],
  },
  {
    slug: "grouping",
    label: "Grouping",
    h1: "Row grouping in {kit}",
    title: "{kit} table row grouping — AdaptTable",
    description:
      "Group rows in a {kit} data table by one key or several — nested group headers with counts, per-group subtotals, group footers, and collapse state in the URL.",
    intro: [
      "Pass `groupBy` and rows fold into {kit} group headers with counts. Pass a list and each key nests inside the one before it, however deep the nesting goes.",
      "`groupAggregates` adds per-group subtotals from the same mapper `summaryRow` uses, so every header totals its whole subtree and `groupFooters` closes each group with the same numbers.",
      "Collapse state travels in the URL, and export writes the grouped sheet — outline levels and all — rather than the flat rows underneath it.",
    ],
    card: "Nested group headers with counts, subtotals, footers and collapse state.",
    snippet: `import { DataTable } from "{pkg}";

export function People({ rows, columns }) {
  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={(row) => row.id}
      groupBy={["team", "status"]}
      groupFooters
      groupAggregates={(group) => ({
        budget: group.reduce(
          (sum, row) => sum + row.budget,
          0
        ),
      })}
    />
  );
}`,
    notes: {
      mantine:
        "A group header is a Mantine table row with the kit's own chevron ActionIcon, and on phones it becomes a Mantine Card header — the same grouping, both layouts.",
    },
    docs: ["grouping"],
  },
];

/**
 * The adapter landing page's own copy.
 *
 * What is kit-specific here is not a swapped name: it is `tagline`, `surface`,
 * `install` and `provider`, each written per adapter against that adapter's
 * real source. The connective sentences are shared because the claim they make
 * — one engine, your kit's components — is the same claim for all eight, and
 * writing eight paraphrases of it would be the filler, not the fix.
 */
export const LANDING = {
  h1: "AdaptTable for {kit}",
  title: "AdaptTable for {kit} — a data table built from {peer}",
  description:
    "A batteries-included React data table for {kit}: filtering, grouping, pivot, editing, saved views and export, rendered with {peer}'s own components. Install {pkg}.",
  intro: [
    "{tagline}",
    "The engine is headless and shared — sorting, filtering, grouping, the pivot, URL state, saved views and export live in @adapttable/core. Every control you can see and click is {surface}.",
    "That is the whole trade: one model to learn, and a table that belongs in a {kit} app rather than sitting inside one.",
  ],
  /** The heading over the twelve feature pages. */
  gridTitle: "Twelve features, each on its own {kit} page",
  gridLead:
    "Every one is the same engine and {kit}'s own components. Each page carries the code for that feature and a table you can drive.",
  /** The heading over the other seven kits. */
  kitsTitle: "The same table, in seven other kits",
  kitsLead:
    "Switching kit changes the components, never the model — the props on this page are the props there.",
};

/**
 * Fill `{kit}`, `{pkg}` and `{peer}` from an adapter.
 *
 * @param {string} text
 * @param {ShowcaseAdapter} adapter
 * @returns {string}
 */
export const fillTemplate = (text, adapter) =>
  text
    .replaceAll("{tagline}", adapter.tagline)
    .replaceAll("{surface}", adapter.surface)
    .replaceAll("{kit}", adapter.label)
    .replaceAll("{pkg}", adapter.pkg)
    .replaceAll("{peer}", adapter.peer);

/**
 * The adapters whose own pages are built. Every other kit is reachable, and
 * shown, through the live demo pinned to it.
 *
 * @returns {ShowcaseAdapter[]}
 */
export const builtAdapters = () =>
  SHOWCASE_ADAPTERS.filter((adapter) => adapter.built);

/**
 * One built page of the matrix: an adapter landing, or an adapter's feature.
 *
 * @typedef {object} MatrixPageSpec
 * @property {string} adapter The adapter key.
 * @property {string | null} feature The feature slug, or `null` for the landing.
 * @property {string} dir The directory under the showcase root.
 */

/**
 * Every matrix page, landing first for each built adapter.
 *
 * @returns {MatrixPageSpec[]}
 */
export const matrixPages = () =>
  builtAdapters().flatMap((adapter) => [
    { adapter: adapter.key, feature: null, dir: adapter.key },
    ...MATRIX_FEATURES.map((feature) => ({
      adapter: adapter.key,
      feature: feature.slug,
      dir: `${adapter.key}/${feature.slug}`,
    })),
  ]);

/**
 * The adapter with this key.
 *
 * @param {string} key
 * @returns {ShowcaseAdapter | undefined}
 */
export const adapterByKey = (key) =>
  SHOWCASE_ADAPTERS.find((adapter) => adapter.key === key);

/**
 * The feature with this slug.
 *
 * @param {string} slug
 * @returns {MatrixFeature | undefined}
 */
export const featureBySlug = (slug) =>
  MATRIX_FEATURES.find((feature) => feature.slug === slug);
