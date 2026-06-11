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
import { type DataMode, DemoBody, type Density, type PageMode } from "../Demo";

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

export function MantineDemo({
  mode,
  locale,
  dark,
  pageMode,
  urlKey,
  density,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  dark?: boolean;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
}>) {
  const s = strings(locale);
  return (
    <MantineProvider forceColorScheme={dark ? "dark" : "light"}>
      <DemoBody
        mode={mode}
        pageMode={pageMode}
        urlKey={urlKey}
        defaultColumnLayout={LIVE_DEFAULT_LAYOUT}
        render={(source, columns) => (
          <DataTable
            source={source}
            columns={makeColumns(locale, MANTINE_CELLS)}
            rowKey={(r) => r.id}
            {...columns}
            density={density}
            labels={getLabels(locale)}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
            bulkActions={makeBulkActions(locale)}
            confirm={demoConfirm}
            enableColumnMenu
            resizableColumns
            stickyHeader
            stickyTop={8}
            filters={demoFilterDefs(locale)}
          />
        )}
      />
    </MantineProvider>
  );
}
