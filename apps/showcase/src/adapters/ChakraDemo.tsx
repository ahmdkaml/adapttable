import { DataTable } from "@adapttable/chakra";
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
  type DemoCells,
  demoConfirm,
  demoFilterDefs,
  LIVE_DEFAULT_LAYOUT,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
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
  editing,
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
  editing?: boolean;
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
          editing={editing}
          render={(source, columns) => (
            <DataTable
              source={source}
              columns={makeColumns(locale, CHAKRA_CELLS)}
              rowKey={(r) => r.id}
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
