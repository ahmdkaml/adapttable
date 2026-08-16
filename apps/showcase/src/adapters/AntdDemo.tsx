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
  demoFilterTypes,
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
import { useDemoFilterDefs } from "../demoFilters";

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
  rowStyle,
  realtime,
  editing,
  cellNavigation,
  wide,
  exportCsv,
  headerFilters,
  columnGroups,
  sparkline,
  editorShowcase,
  columnMenu,
  filterControls,
  bulkActions,
  forceMobile,
  focused,
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
  /** Apply live row patches on a timer, the way a socket feed would. */
  realtime?: boolean;
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
  headerFilters?: boolean;
  columnGroups?: boolean;
  sparkline?: boolean;
  /** Add the boolean and multi-select editor columns. */
  editorShowcase?: boolean;
  /** Show the Columns menu. Defaults to on unless the page is focused. */
  columnMenu?: boolean;
  /** Show the Filters control. Defaults to on unless the page is focused. */
  filterControls?: boolean;
  /** Bulk actions, which are what turn row selection on. Defaults to on
   *  unless the page is focused. */
  bulkActions?: boolean;
  forceMobile?: boolean;
  /** Dedicated pages hide unrelated filter/action/view chrome. */
  focused?: boolean;
}>) {
  const s = strings(locale);
  const filters = useDemoFilterDefs(locale);
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
            ? {
                pinned: focused
                  ? { person: "start" }
                  : { person: "start", actions: "end" },
              }
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
        rowStyle={rowStyle}
        realtime={realtime}
        editing={editing}
        columnGroups={columnGroups}
        render={(source, columns) => (
          <DataTable
            source={source}
            columns={
              wide
                ? makeWideColumns(locale, ANTD_CELLS)
                : makeColumns(locale, ANTD_CELLS, {
                    groups: columnGroups,
                    sparkline,
                    editors: editorShowcase,
                  })
            }
            rowKey={(r) => r.id}
            nestedTable={nested ? nestedOrders : undefined}
            cellNavigation={cellNavigation ?? editing}
            selectionStats={editing}
            editHistory={editing}
            findInTable={editing}
            {...columns}
            forceMobile={forceMobile}
            density={density}
            filtersMode={filtersUi}
            labels={getLabels(locale)}
            locale={locale}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={focused ? undefined : makeActions(locale)}
            bulkActions={
              (bulkActions ?? !focused) ? makeBulkActions(locale) : undefined
            }
            confirm={demoConfirm}
            enableColumnMenu={columnMenu ?? !focused}
            exportCsv={exportCsv ?? !focused}
            savedViews={focused ? undefined : demoSavedViews(urlKey)}
            animate={animate}
            resizableColumns
            stickyHeader
            filters={(filterControls ?? !focused) ? filters : undefined}
            filterTypes={demoFilterTypes()}
            headerFilters={headerFilters}
          />
        )}
      />
    </ConfigProvider>
  );
}
