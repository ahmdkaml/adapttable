import type { TableSource } from "@adapttable/core";
import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/mui";
import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  createTheme,
  FormControlLabel,
  FormGroup,
  FormLabel,
  LinearProgress,
  MenuItem,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";

import {
  allocationFilterState,
  type AvatarCellProps,
  budgetFilterState,
  clearDemoFilters,
  COUNT_OPTIONS,
  type DemoCells,
  demoConfirm,
  demoFilterChips,
  initials,
  LIVE_DEFAULT_LAYOUT,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
  makeFilterLabels,
  nameHue,
  type Person,
  selectedStatuses,
  selectedTeams,
  setAllocationFilter,
  setBudgetFilter,
  type StatusCellProps,
  STATUSES,
  statusTone,
  strings,
  TEAMS,
  toggleTeam,
} from "../data";
import { type DataMode, DemoBody, type Density, type PageMode } from "../Demo";

const numberValue = (value: string): number | undefined =>
  value === "" ? undefined : Number(value);

function MuiFilters({
  source,
  locale,
}: Readonly<{ source: TableSource<Person>; locale: Locale }>) {
  const s = strings(locale);
  const allocation = allocationFilterState(source);
  const budget = budgetFilterState(source);
  const teams = selectedTeams(source.extra.team);
  const statuses = selectedStatuses(source.extra.status);

  return (
    <Box display="grid" gap={2}>
      <FormGroup>
        <FormLabel>{s.team}</FormLabel>
        {TEAMS.map((team) => (
          <FormControlLabel
            key={team}
            label={team}
            control={
              <Checkbox
                checked={teams.includes(team)}
                onChange={() =>
                  source.setExtra("team", toggleTeam(teams, team))
                }
              />
            }
          />
        ))}
      </FormGroup>

      <FormGroup>
        <FormLabel>{s.status}</FormLabel>
        {STATUSES.map((status) => (
          <FormControlLabel
            key={status}
            label={status}
            control={
              <Checkbox
                checked={statuses.includes(status)}
                onChange={() =>
                  source.setExtra(
                    "status",
                    statuses.includes(status)
                      ? statuses.filter((item) => item !== status)
                      : [...statuses, status]
                  )
                }
              />
            }
          />
        ))}
      </FormGroup>

      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
        <TextField
          type="date"
          label={s.dateFrom}
          value={String(source.extra.startFrom ?? "")}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) =>
            source.setExtra("startFrom", event.currentTarget.value)
          }
        />
        <TextField
          type="date"
          label={s.dateTo}
          value={String(source.extra.startTo ?? "")}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) =>
            source.setExtra("startTo", event.currentTarget.value)
          }
        />
      </Box>

      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
        <TextField
          select
          label={s.allocationFilter}
          value={allocation.op ?? ""}
          onChange={(event) =>
            setAllocationFilter(source, {
              op: event.target.value
                ? (event.target.value as typeof allocation.op)
                : undefined,
              value:
                event.target.value && event.target.value !== "between"
                  ? allocation.value
                  : undefined,
              from:
                event.target.value === "between" ? allocation.from : undefined,
              to: event.target.value === "between" ? allocation.to : undefined,
            })
          }
        >
          <MenuItem value="">-</MenuItem>
          {COUNT_OPTIONS.map((option) => (
            <MenuItem key={option.op} value={option.op}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="number"
          label={allocation.op === "between" ? s.countFrom : s.countValue}
          value={
            allocation.op === "between"
              ? (allocation.from ?? "")
              : (allocation.value ?? "")
          }
          onChange={(event) =>
            setAllocationFilter(source, {
              ...allocation,
              [allocation.op === "between" ? "from" : "value"]: numberValue(
                event.currentTarget.value
              ),
            })
          }
        />
      </Box>

      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
        <TextField
          select
          label={s.budgetFilter}
          value={budget.op ?? ""}
          onChange={(event) =>
            setBudgetFilter(source, {
              op: event.target.value
                ? (event.target.value as typeof budget.op)
                : undefined,
              value:
                event.target.value && event.target.value !== "between"
                  ? budget.value
                  : undefined,
              from: event.target.value === "between" ? budget.from : undefined,
              to: event.target.value === "between" ? budget.to : undefined,
            })
          }
        >
          <MenuItem value="">-</MenuItem>
          {COUNT_OPTIONS.map((option) => (
            <MenuItem key={option.op} value={option.op}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="number"
          label={budget.op === "between" ? s.countFrom : s.countValue}
          value={
            budget.op === "between" ? (budget.from ?? "") : (budget.value ?? "")
          }
          onChange={(event) =>
            setBudgetFilter(source, {
              ...budget,
              [budget.op === "between" ? "from" : "value"]: numberValue(
                event.currentTarget.value
              ),
            })
          }
        />
      </Box>
    </Box>
  );
}

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
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  dark?: boolean;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
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
            labels={getLabels(locale)}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
            bulkActions={makeBulkActions(locale)}
            confirm={demoConfirm}
            enableColumnMenu
            resizableColumns
            stickyHeader
            filterLabels={makeFilterLabels(locale)}
            extraChips={demoFilterChips(source, locale)}
            onClearFilters={() => clearDemoFilters(source)}
            filters={<MuiFilters source={source} locale={locale} />}
          />
        )}
      />
    </ThemeProvider>
  );
}
