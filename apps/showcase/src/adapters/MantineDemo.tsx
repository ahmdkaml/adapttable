import type { NestedTableDefaults } from "@adapttable/core";
import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable, type DataTableProps } from "@adapttable/mantine";
import {
  Avatar,
  Badge,
  MantineProvider,
  Progress,
  Stack,
  Text,
} from "@mantine/core";

import {
  type AvatarCellProps,
  DEMO_ORDER_COLUMNS,
  type DemoCells,
  demoConfirm,
  demoFilterTypes,
  demoOrders,
  demoSavedViews,
  LIVE_DEFAULT_LAYOUT,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
  makeWideColumns,
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

/** Mantine-native cell visuals (Avatar · Badge · Progress). */
const MANTINE_CELLS: DemoCells = {
  Avatar: ({ name }: AvatarCellProps) => (
    <Avatar name={name} color="initials" radius="xl" size={36} />
  ),
  Status: ({ status, label }: StatusCellProps) => (
    <Badge color={statusTone(status)} variant="light" radius="sm">
      {label}
    </Badge>
  ),
  Load: ({ value, meta }: LoadCellProps) => (
    <Stack gap={4} miw={90}>
      <Progress value={value} size="sm" radius="xl" />
      <Text size="xs" c="dimmed">
        {meta}
      </Text>
    </Stack>
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

export function MantineDemo({
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
  editing,
  cellNavigation,
  forceMobile,
  exportCsv,
  headerFilters,
  columnGroups,
  sparkline,
  editorShowcase,
  columnMenu,
  filterControls,
  bulkActions,
  wide,
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
  editing?: boolean;
  cellNavigation?: boolean;
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
  /** Use the wide, horizontally-scrolling column set with Person pinned. */
  wide?: boolean;
  forceMobile?: boolean;
  /** Dedicated pages hide unrelated filter/action/view chrome. */
  focused?: boolean;
  /**
   * Export configuration for the toolbar button. Defaults to a plain CSV of
   * the current page; the grouping demo overrides it to write the grouped
   * sheet as a spreadsheet.
   */
  exportCsv?: DataTableProps<Person>["exportCsv"];
}>) {
  const s = strings(locale);
  const filters = useDemoFilterDefs(locale);
  return (
    <MantineProvider forceColorScheme={dark ? "dark" : "light"}>
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
        editing={editing}
        render={(source, columns) => (
          <DataTable
            source={source}
            columns={
              wide
                ? makeWideColumns(locale, MANTINE_CELLS)
                : makeColumns(locale, MANTINE_CELLS, {
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
            headerFilters={headerFilters}
            stickyTop={8}
            filters={(filterControls ?? !focused) ? filters : undefined}
            filterTypes={demoFilterTypes()}
            forceMobile={forceMobile}
          />
        )}
      />
    </MantineProvider>
  );
}
