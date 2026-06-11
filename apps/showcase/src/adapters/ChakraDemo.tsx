import { DataTable } from "@adapttable/chakra";
import { getDirection, getLabels } from "@adapttable/i18n";
import {
  Avatar,
  Badge,
  Box,
  ChakraProvider,
  type ColorModeWithSystem,
  extendTheme,
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
  Avatar: ({ name }: AvatarCellProps) => <Avatar name={name} size="sm" />,
  Status: ({ status, label }: StatusCellProps) => (
    <Badge
      colorScheme={statusTone(status)}
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
      <Progress
        value={value}
        size="sm"
        borderRadius="full"
        colorScheme="blue"
      />
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
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  dark?: boolean;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
  filtersUi?: FiltersUi;
}>) {
  const s = strings(locale);
  const scheme: ColorModeWithSystem = dark ? "dark" : "light";
  const theme = extendTheme({
    config: { initialColorMode: scheme, useSystemColorMode: false },
  });
  // Force the color mode (ignore any persisted value) so it tracks the page.
  const colorModeManager = {
    type: "localStorage" as const,
    ssr: false,
    get: () => scheme,
    set: () => undefined,
  };
  return (
    <ChakraProvider
      key={scheme}
      theme={theme}
      colorModeManager={colorModeManager}
    >
      <DemoBody
        mode={mode}
        pageMode={pageMode}
        urlKey={urlKey}
        defaultColumnLayout={LIVE_DEFAULT_LAYOUT}
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
            resizableColumns
            stickyHeader
            filters={demoFilterDefs(locale)}
          />
        )}
      />
    </ChakraProvider>
  );
}
