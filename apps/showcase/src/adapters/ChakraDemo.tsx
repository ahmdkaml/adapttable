import { DataTable, type DataTableProps } from "@adapttable/chakra";
import type { ColumnLayoutState, NestedTableDefaults } from "@adapttable/core";
import { getDirection, getLabels } from "@adapttable/i18n";
import {
  Avatar,
  Badge,
  Box,
  ChakraProvider,
  defaultSystem,
  Progress,
  Text,
} from "@chakra-ui/react";

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

/** Chakra-native cell visuals (Avatar · Badge · Progress). */
const CHAKRA_CELLS: DemoCells = {
  Avatar: ({ name }: AvatarCellProps) => (
    <Avatar.Root size="sm">
      <Avatar.Fallback name={name} />
    </Avatar.Root>
  ),
  Status: ({ status, label }: StatusCellProps) => (
    <Badge
      colorPalette={statusTone(status)}
      borderRadius="full"
      px={2}
      py={0.5}
      textTransform="none"
    >
      {label}
    </Badge>
  ),
  Load: ({ value, meta }: LoadCellProps) => (
    <Box minW="90px">
      <Progress.Root value={value} size="sm" colorPalette="blue">
        <Progress.Track borderRadius="full">
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      <Text fontSize="xs" color="gray.500" mt={1}>
        {meta}
      </Text>
    </Box>
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

export function ChakraDemo({
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
  headerFilters,
  columnGroups,
  sparkline,
  exportCsv,
  columnMenu,
  filterControls,
  wide,
  defaultColumnLayout,
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
  editing?: boolean;
  cellNavigation?: boolean;
  headerFilters?: boolean;
  columnGroups?: boolean;
  sparkline?: boolean;
  /** Show the Columns menu. Defaults to on unless the page is focused. */
  /** The toolbar Export button's configuration. */
  exportCsv?: DataTableProps<Person>["exportCsv"];
  columnMenu?: boolean;
  /** Show the Filters control. Defaults to on unless the page is focused. */
  filterControls?: boolean;
  /** Use the wide, horizontally-scrolling column set with Person pinned. */
  wide?: boolean;
  defaultColumnLayout?: Partial<ColumnLayoutState>;
  forceMobile?: boolean;
  /** Dedicated pages hide unrelated filter/action/view chrome. */
  focused?: boolean;
}>) {
  const s = strings(locale);
  const filters = useDemoFilterDefs(locale);
  return (
    <ChakraProvider value={defaultSystem}>
      {/* Chakra v3 resolves `_dark` tokens under a `.dark` ancestor, so forcing
          the class here tracks the page theme without next-themes/persistence. */}
      <Box className={dark ? "dark" : "light"} bg="bg" color="fg">
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
              : (defaultColumnLayout ?? LIVE_DEFAULT_LAYOUT)
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
                  ? makeWideColumns(locale, CHAKRA_CELLS)
                  : makeColumns(locale, CHAKRA_CELLS, {
                      groups: columnGroups,
                      sparkline,
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
              bulkActions={focused ? undefined : makeBulkActions(locale)}
              confirm={demoConfirm}
              enableColumnMenu={columnMenu ?? !focused}
              exportCsv={exportCsv ?? !focused}
              savedViews={focused ? undefined : demoSavedViews(urlKey)}
              animate={animate}
              resizableColumns
              stickyHeader
              headerFilters={headerFilters}
              filters={(filterControls ?? !focused) ? filters : undefined}
              filterTypes={demoFilterTypes()}
            />
          )}
        />
      </Box>
    </ChakraProvider>
  );
}
