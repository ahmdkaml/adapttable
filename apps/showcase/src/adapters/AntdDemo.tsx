import { DataTable, type DataTableProps } from "@adapttable/antd";
import type { NestedTableDefaults } from "@adapttable/core";
import { getDirection, getLabels } from "@adapttable/i18n";
import {
  Avatar,
  ConfigProvider,
  Progress,
  Tag,
  theme as antdTheme,
  Typography,
} from "antd";

import {
  type AvatarCellProps,
  DEMO_ORDER_COLUMNS,
  type DemoCells,
  demoConfirm,
  demoFilterDefs,
  demoOrders,
  demoSavedViews,
  initials,
  LIVE_DEFAULT_LAYOUT,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
  makeWideColumns,
  nameHue,
  type Person,
  type StatusCellProps,
  statusTone,
  strings,
} from "../data";
import {
  type DataMode,
  DemoBody,
  type Density,
  type FiltersUi,
  type PageMode,
} from "../Demo";

const ANTD_TAG_COLOR = {
  green: "green",
  blue: "blue",
  red: "red",
  gray: "default",
} as const;

/** Ant Design-native cell visuals (Avatar · Tag · Progress). */
const ANTD_CELLS: DemoCells = {
  Avatar: ({ name }: AvatarCellProps) => (
    <Avatar
      size={36}
      style={{
        backgroundColor: `hsl(${nameHue(name)} 60% 88%)`,
        color: `hsl(${nameHue(name)} 45% 35%)`,
        fontWeight: 700,
      }}
    >
      {initials(name)}
    </Avatar>
  ),
  Status: ({ status, label }: StatusCellProps) => (
    <Tag color={ANTD_TAG_COLOR[statusTone(status)]} variant="filled">
      {label}
    </Tag>
  ),
  Load: ({ value, meta }: LoadCellProps) => (
    <div style={{ minWidth: 90 }}>
      <Progress percent={value} showInfo={false} size="small" />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {meta}
      </Typography.Text>
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

export function AntdDemo({
  mode,
  locale,
  dark,
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
  editing,
  cellNavigation,
  wide,
  exportCsv,
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
  editing?: boolean;
  cellNavigation?: boolean;
  /** Use the wide, horizontally-scrolling column set with Person pinned. */
  wide?: boolean;
  /**
   * Export configuration for the toolbar button. Defaults to a plain CSV of
   * the current page; the columns demo overrides it to write the highlighted
   * cell range as a spreadsheet.
   */
  exportCsv?: DataTableProps<Person>["exportCsv"];
}>) {
  const s = strings(locale);
  return (
    <ConfigProvider
      direction={getDirection(locale)}
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <DemoBody
        mode={mode}
        pageMode={pageMode}
        urlKey={urlKey}
        defaultColumnLayout={
          // The wide showcase pins BOTH edges by default: person at the
          // start, the actions column at the end (it pins like any column).
          wide
            ? { pinned: { person: "start", actions: "end" } }
            : LIVE_DEFAULT_LAYOUT
        }
        grouping={grouping}
        tree={tree}
        rowMode={rowMode}
        batch={batch}
        rowMutations={rowMutations}
        rowReorder={rowReorder}
        rowPinning={rowPinning}
        cellSpan={cellSpan}
        extraRows={extraRows}
        editing={editing}
        render={(source, columns) => (
          <DataTable
            source={source}
            columns={
              wide
                ? makeWideColumns(locale, ANTD_CELLS)
                : makeColumns(locale, ANTD_CELLS)
            }
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
            exportCsv={exportCsv ?? true}
            savedViews={demoSavedViews(urlKey)}
            animate={animate}
            resizableColumns
            filters={demoFilterDefs(locale)}
          />
        )}
      />
    </ConfigProvider>
  );
}
