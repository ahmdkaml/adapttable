import "@radix-ui/themes/styles.css";

import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/radix";
import { Avatar, Badge, Box, Progress, Text, Theme } from "@radix-ui/themes";

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

/** Two-letter initials for the avatar fallback. */
function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Radix-native cell visuals (Avatar · Badge · Progress). */
const RADIX_CELLS: DemoCells = {
  Avatar: ({ name }: AvatarCellProps) => (
    <Avatar size="2" radius="full" fallback={initials(name)} />
  ),
  Status: ({ status, label }: StatusCellProps) => (
    <Badge color={statusTone(status)} radius="full" variant="soft">
      {label}
    </Badge>
  ),
  Load: ({ value, meta }: LoadCellProps) => (
    <Box style={{ minWidth: "90px" }}>
      <Progress value={value} size="1" />
      <Text as="div" size="1" color="gray" mt="1">
        {meta}
      </Text>
    </Box>
  ),
};

export function RadixDemo({
  mode,
  locale,
  dark,
  pageMode,
  urlKey,
  density,
  filtersUi,
  animate,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  dark?: boolean;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
  filtersUi?: FiltersUi;
  animate?: boolean;
}>) {
  const s = strings(locale);
  return (
    <Theme
      appearance={dark ? "dark" : "light"}
      accentColor="iris"
      grayColor="slate"
      radius="medium"
      hasBackground={false}
      // Radix's <Theme> defaults to `min-height: 100vh` to fill a page; this
      // one is embedded in the demo card, so let it size to its content.
      style={{ minHeight: 0 }}
    >
      <DemoBody
        mode={mode}
        pageMode={pageMode}
        urlKey={urlKey}
        defaultColumnLayout={LIVE_DEFAULT_LAYOUT}
        render={(source, columns) => (
          <DataTable
            source={source}
            columns={makeColumns(locale, RADIX_CELLS)}
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
            animate={animate}
            resizableColumns
            stickyHeader
            filters={demoFilterDefs(locale)}
          />
        )}
      />
    </Theme>
  );
}
