import { DataTable } from "@adapttable/chakra";
import type { NestedTableDefaults } from "@adapttable/core";
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
  editing?: boolean;
  cellNavigation?: boolean;
}>) {
  const s = strings(locale);
  return (
    <ChakraProvider value={defaultSystem}>
      {/* Chakra v3 resolves `_dark` tokens under a `.dark` ancestor, so forcing
          the class here tracks the page theme without next-themes/persistence. */}
      <Box className={dark ? "dark" : "light"} bg="bg" color="fg">
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
          editing={editing}
          render={(source, columns) => (
            <DataTable
              source={source}
              columns={makeColumns(locale, CHAKRA_CELLS)}
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
            />
          )}
        />
      </Box>
    </ChakraProvider>
  );
}
