import type { NestedTableDefaults } from "@adapttable/core";
import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/mantine";
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
  editing,
  cellNavigation,
  forceMobile,
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
  editing?: boolean;
  cellNavigation?: boolean;
  forceMobile?: boolean;
}>) {
  const s = strings(locale);
  return (
    <MantineProvider forceColorScheme={dark ? "dark" : "light"}>
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
        editing={editing}
        render={(source, columns) => (
          <DataTable
            source={source}
            columns={makeColumns(locale, MANTINE_CELLS)}
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
            stickyTop={8}
            filters={demoFilterDefs(locale)}
            forceMobile={forceMobile}
          />
        )}
      />
    </MantineProvider>
  );
}
