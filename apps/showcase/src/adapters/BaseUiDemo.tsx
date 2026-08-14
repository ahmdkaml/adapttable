import { DataTable } from "@adapttable/base-ui";
import type { NestedTableDefaults } from "@adapttable/core";
import { getDirection, getLabels } from "@adapttable/i18n";

import {
  type AvatarCellProps,
  DEMO_ORDER_COLUMNS,
  type DemoCells,
  demoConfirm,
  demoFilterDefs,
  demoOrders,
  demoSavedViews,
  LIVE_DEFAULT_LAYOUT,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
  type Person,
  type StatusCellProps,
  strings,
} from "../data";
import {
  type DataMode,
  DemoBody,
  type Density,
  type FiltersUi,
  type PageMode,
} from "../Demo";

/** Two-letter initials for the avatar fallback. */
function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Base UI–native cell visuals (semantic HTML + adapter chrome). */
const BASE_UI_CELLS: DemoCells = {
  Avatar: ({ name }: AvatarCellProps) => (
    <span
      aria-hidden
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: 28,
        height: 28,
        borderRadius: "999px",
        background: "color-mix(in srgb, currentColor 12%, transparent)",
        fontSize: 11,
        fontWeight: 650,
      }}
    >
      {initials(name)}
    </span>
  ),
  Status: ({ label }: StatusCellProps) => (
    <span
      style={{
        display: "inline-flex",
        borderRadius: 999,
        padding: "0.1rem 0.5rem",
        background: "color-mix(in srgb, currentColor 10%, transparent)",
        fontSize: 12,
      }}
    >
      {label}
    </span>
  ),
  Load: ({ value, meta }: LoadCellProps) => (
    <div style={{ minWidth: 90 }}>
      <div
        role="progressbar"
        aria-valuenow={value}
        style={{
          height: 4,
          borderRadius: 999,
          background: "color-mix(in srgb, currentColor 10%, transparent)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: "var(--adapttable-accent, #2563eb)",
          }}
        />
      </div>
      <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>{meta}</div>
    </div>
  ),
};

/**
 * The orders under one person, as a nested table — the kit's own `<DataTable>`
 * inside a row, so the reader gets the same table twice over.
 */
const nestedOrders = (row: Person) => ({
  label: `${row.name} — recent orders`,
  table: (defaults: NestedTableDefaults) => (
    <DataTable
      {...defaults}
      data={demoOrders(row)}
      columns={DEMO_ORDER_COLUMNS}
      rowKey={(order) => order.id}
    />
  ),
});

export function BaseUiDemo({
  mode,
  locale,
  pageMode,
  urlKey,
  density,
  filtersUi,
  animate,
  grouping,
  tree,
  nested,
  rowMode,
  batch,
  rowMutations,
  rowReorder,
  rowPinning,
  cellSpan,
  extraRows,
  rowStyle,
  editing,
  cellNavigation,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  dark?: boolean;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
  filtersUi?: FiltersUi;
  animate?: boolean;
  grouping?: boolean;
  tree?: boolean;
  nested?: boolean;
  rowMode?: boolean;
  batch?: boolean;
  rowMutations?: boolean;
  rowReorder?: boolean;
  rowPinning?: boolean;
  cellSpan?: boolean;
  extraRows?: boolean;
  rowStyle?: boolean;
  editing?: boolean;
  cellNavigation?: boolean;
}>) {
  const s = strings(locale);
  return (
    <DemoBody
      mode={mode}
      pageMode={pageMode}
      urlKey={urlKey}
      defaultColumnLayout={LIVE_DEFAULT_LAYOUT}
      grouping={grouping}
      tree={tree}
      rowMode={rowMode}
      batch={batch}
      rowMutations={rowMutations}
      rowReorder={rowReorder}
      rowPinning={rowPinning}
      cellSpan={cellSpan}
      extraRows={extraRows}
      rowStyle={rowStyle}
      editing={editing}
      render={(source, columns) => (
        <DataTable
          source={source}
          columns={makeColumns(locale, BASE_UI_CELLS)}
          rowKey={(r) => r.id}
          nestedTable={nested ? nestedOrders : undefined}
          cellNavigation={cellNavigation ?? editing}
          selectionStats={editing}
          editHistory={editing}
          findInTable={editing}
          {...columns}
          density={density}
          filtersMode={filtersUi}
          labels={getLabels(locale)}
          locale={locale}
          dir={getDirection(locale)}
          searchPlaceholder={s.search}
          rowActions={makeActions(locale)}
          bulkActions={makeBulkActions(locale)}
          confirm={demoConfirm}
          enableColumnMenu
          exportCsv
          savedViews={demoSavedViews(urlKey)}
          animate={animate}
          resizableColumns
          stickyHeader
          filters={demoFilterDefs(locale)}
          accentColor="blue"
        />
      )}
    />
  );
}
