import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/mui";
import {
  Avatar,
  Box,
  Chip,
  createTheme,
  LinearProgress,
  ThemeProvider,
  Typography,
} from "@mui/material";

import {
  type AvatarCellProps,
  type DemoCells,
  demoConfirm,
  demoFilterDefs,
  initials,
  LIVE_DEFAULT_LAYOUT,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
  nameHue,
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

const MUI_CHIP_COLOR = {
  green: "success",
  blue: "info",
  red: "error",
  gray: "default",
} as const;

/** MUI-native cell visuals (Avatar · Chip · LinearProgress). */
const MUI_CELLS: DemoCells = {
  Avatar: ({ name }: AvatarCellProps) => (
    <Avatar
      sx={{
        width: 36,
        height: 36,
        fontSize: 14,
        fontWeight: 700,
        bgcolor: `hsl(${nameHue(name)} 60% 90%)`,
        color: `hsl(${nameHue(name)} 45% 35%)`,
      }}
    >
      {initials(name)}
    </Avatar>
  ),
  Status: ({ status, label }: StatusCellProps) => (
    <Chip
      label={label}
      size="small"
      color={MUI_CHIP_COLOR[statusTone(status)]}
    />
  ),
  Load: ({ value, meta }: LoadCellProps) => (
    <Box sx={{ minWidth: 90 }}>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{ height: 6, borderRadius: 999 }}
      />
      <Typography variant="caption" color="text.secondary">
        {meta}
      </Typography>
    </Box>
  ),
};

export function MuiDemo({
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
  const theme = createTheme({ palette: { mode: dark ? "dark" : "light" } });
  return (
    <ThemeProvider theme={theme}>
      <DemoBody
        mode={mode}
        pageMode={pageMode}
        urlKey={urlKey}
        defaultColumnLayout={LIVE_DEFAULT_LAYOUT}
        render={(source, columns) => (
          <DataTable
            source={source}
            columns={makeColumns(locale, MUI_CELLS)}
            rowKey={(r) => r.id}
            {...columns}
            density={density}
            filtersMode={filtersUi}
            labels={getLabels(locale)}
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
    </ThemeProvider>
  );
}
