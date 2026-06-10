import { DataTable } from "@adapttable/chakra";
import type { TableSource } from "@adapttable/core";
import { getDirection, getLabels } from "@adapttable/i18n";
import {
  Avatar,
  Badge,
  Box,
  ChakraProvider,
  Checkbox,
  CheckboxGroup,
  type ColorModeWithSystem,
  extendTheme,
  FormControl,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Progress,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";

import {
  allocationFilterState,
  type AvatarCellProps,
  budgetFilterState,
  clearDemoFilters,
  COUNT_OPTIONS,
  type DemoCells,
  demoConfirm,
  demoFilterChips,
  LIVE_DEFAULT_LAYOUT,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
  makeFilterLabels,
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
} from "../data";
import { type DataMode, DemoBody, type Density, type PageMode } from "../Demo";

const toNumber = (value: string): number | undefined =>
  value === "" ? undefined : Number(value);

function ChakraFilters({
  source,
  locale,
}: Readonly<{ source: TableSource<Person>; locale: Locale }>) {
  const s = strings(locale);
  const allocation = allocationFilterState(source);
  const budget = budgetFilterState(source);

  return (
    <Stack spacing={4}>
      <FormControl>
        <FormLabel>{s.team}</FormLabel>
        <CheckboxGroup
          value={selectedTeams(source.extra.team)}
          onChange={(value) => source.setExtra("team", value as string[])}
        >
          <HStack wrap="wrap">
            {TEAMS.map((team) => (
              <Checkbox key={team} value={team}>
                {team}
              </Checkbox>
            ))}
          </HStack>
        </CheckboxGroup>
      </FormControl>

      <FormControl>
        <FormLabel>{s.status}</FormLabel>
        <CheckboxGroup
          value={selectedStatuses(source.extra.status)}
          onChange={(value) => source.setExtra("status", value as string[])}
        >
          <HStack wrap="wrap">
            {STATUSES.map((status) => (
              <Checkbox key={status} value={status}>
                {status}
              </Checkbox>
            ))}
          </HStack>
        </CheckboxGroup>
      </FormControl>

      <HStack align="end">
        <FormControl>
          <FormLabel>{s.dateFrom}</FormLabel>
          <Input
            type="date"
            value={String(source.extra.startFrom ?? "")}
            onChange={(event) =>
              source.setExtra("startFrom", event.currentTarget.value)
            }
          />
        </FormControl>
        <FormControl>
          <FormLabel>{s.dateTo}</FormLabel>
          <Input
            type="date"
            value={String(source.extra.startTo ?? "")}
            onChange={(event) =>
              source.setExtra("startTo", event.currentTarget.value)
            }
          />
        </FormControl>
      </HStack>

      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
        <FormControl>
          <FormLabel>{s.allocationFilter}</FormLabel>
          <Select
            value={allocation.op ?? ""}
            onChange={(event) =>
              setAllocationFilter(source, {
                op: event.currentTarget.value
                  ? (event.currentTarget.value as typeof allocation.op)
                  : undefined,
                value:
                  event.currentTarget.value &&
                  event.currentTarget.value !== "between"
                    ? allocation.value
                    : undefined,
                from:
                  event.currentTarget.value === "between"
                    ? allocation.from
                    : undefined,
                to:
                  event.currentTarget.value === "between"
                    ? allocation.to
                    : undefined,
              })
            }
          >
            <option value="">-</option>
            {COUNT_OPTIONS.map((option) => (
              <option key={option.op} value={option.op}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>
            {allocation.op === "between" ? s.countFrom : s.countValue}
          </FormLabel>
          <NumberInput
            value={
              allocation.op === "between"
                ? (allocation.from ?? "")
                : (allocation.value ?? "")
            }
            onChange={(value) =>
              setAllocationFilter(source, {
                ...allocation,
                [allocation.op === "between" ? "from" : "value"]:
                  toNumber(value),
              })
            }
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>
      </Box>

      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
        <FormControl>
          <FormLabel>{s.budgetFilter}</FormLabel>
          <Select
            value={budget.op ?? ""}
            onChange={(event) =>
              setBudgetFilter(source, {
                op: event.currentTarget.value
                  ? (event.currentTarget.value as typeof budget.op)
                  : undefined,
                value:
                  event.currentTarget.value &&
                  event.currentTarget.value !== "between"
                    ? budget.value
                    : undefined,
                from:
                  event.currentTarget.value === "between"
                    ? budget.from
                    : undefined,
                to:
                  event.currentTarget.value === "between"
                    ? budget.to
                    : undefined,
              })
            }
          >
            <option value="">-</option>
            {COUNT_OPTIONS.map((option) => (
              <option key={option.op} value={option.op}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>
            {budget.op === "between" ? s.countFrom : s.countValue}
          </FormLabel>
          <NumberInput
            value={
              budget.op === "between"
                ? (budget.from ?? "")
                : (budget.value ?? "")
            }
            onChange={(value) =>
              setBudgetFilter(source, {
                ...budget,
                [budget.op === "between" ? "from" : "value"]: toNumber(value),
              })
            }
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>
      </Box>
    </Stack>
  );
}

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
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  dark?: boolean;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
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
            filters={<ChakraFilters source={source} locale={locale} />}
          />
        )}
      />
    </ChakraProvider>
  );
}
