import type { TableSource } from "@adapttable/core";
import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/mantine";
import {
  Checkbox,
  Group,
  MantineProvider,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";

import {
  allocationFilterState,
  budgetFilterState,
  clearDemoFilters,
  COUNT_OPTIONS,
  demoConfirm,
  demoFilterChips,
  type Locale,
  makeActions,
  makeColumns,
  makeFilterLabels,
  type Person,
  selectedStatuses,
  selectedTeams,
  setAllocationFilter,
  setBudgetFilter,
  STATUSES,
  strings,
  TEAMS,
} from "../data";
import { type DataMode, DemoBody } from "../Demo";

const toNumber = (value: number | string): number | undefined =>
  typeof value === "number" ? value : undefined;

function MantineFilters({
  source,
  locale,
}: Readonly<{ source: TableSource<Person>; locale: Locale }>) {
  const s = strings(locale);
  const allocation = allocationFilterState(source);
  const budgetState = budgetFilterState(source);
  const statuses = selectedStatuses(source.extra.status);

  return (
    <Stack gap="md">
      <Checkbox.Group
        label={s.team}
        value={selectedTeams(source.extra.team)}
        onChange={(value) => source.setExtra("team", value)}
      >
        <Group gap="xs" mt="xs">
          {TEAMS.map((team) => (
            <Checkbox key={team} value={team} label={team} />
          ))}
        </Group>
      </Checkbox.Group>

      <Checkbox.Group
        label={s.status}
        value={statuses}
        onChange={(value) => source.setExtra("status", value)}
      >
        <Group gap="xs" mt="xs">
          {STATUSES.map((status) => (
            <Checkbox key={status} value={status} label={status} />
          ))}
        </Group>
      </Checkbox.Group>

      <Group grow align="end">
        <TextInput
          type="date"
          label={s.dateFrom}
          value={String(source.extra.startFrom ?? "")}
          onChange={(event) =>
            source.setExtra("startFrom", event.currentTarget.value)
          }
        />
        <TextInput
          type="date"
          label={s.dateTo}
          value={String(source.extra.startTo ?? "")}
          onChange={(event) =>
            source.setExtra("startTo", event.currentTarget.value)
          }
        />
      </Group>

      <Group grow align="end">
        <Select
          label={s.allocationFilter}
          placeholder={s.countOperator}
          data={COUNT_OPTIONS.map((option) => ({
            value: option.op,
            label: option.label,
          }))}
          value={allocation.op ?? null}
          clearable
          onChange={(value) =>
            setAllocationFilter(source, {
              op: (value ?? undefined) as typeof allocation.op,
              value:
                value && value !== "between" ? allocation.value : undefined,
              from: value === "between" ? allocation.from : undefined,
              to: value === "between" ? allocation.to : undefined,
            })
          }
        />
        <NumberInput
          label={allocation.op === "between" ? s.countFrom : s.countValue}
          value={
            allocation.op === "between" ? allocation.from : allocation.value
          }
          onChange={(value) =>
            setAllocationFilter(source, {
              ...allocation,
              [allocation.op === "between" ? "from" : "value"]: toNumber(value),
            })
          }
        />
        {allocation.op === "between" && (
          <NumberInput
            label={s.countTo}
            value={allocation.to}
            onChange={(value) =>
              setAllocationFilter(source, {
                ...allocation,
                to: toNumber(value),
              })
            }
          />
        )}
      </Group>

      <Group grow align="end">
        <Select
          label={s.budgetFilter}
          placeholder={s.countOperator}
          data={COUNT_OPTIONS.map((option) => ({
            value: option.op,
            label: option.label,
          }))}
          value={budgetState.op ?? null}
          clearable
          onChange={(value) =>
            setBudgetFilter(source, {
              op: (value ?? undefined) as typeof budgetState.op,
              value:
                value && value !== "between" ? budgetState.value : undefined,
              from: value === "between" ? budgetState.from : undefined,
              to: value === "between" ? budgetState.to : undefined,
            })
          }
        />
        <NumberInput
          label={budgetState.op === "between" ? s.countFrom : s.countValue}
          value={
            budgetState.op === "between" ? budgetState.from : budgetState.value
          }
          onChange={(value) =>
            setBudgetFilter(source, {
              ...budgetState,
              [budgetState.op === "between" ? "from" : "value"]:
                toNumber(value),
            })
          }
        />
        {budgetState.op === "between" && (
          <NumberInput
            label={s.countTo}
            value={budgetState.to}
            onChange={(value) =>
              setBudgetFilter(source, {
                ...budgetState,
                to: toNumber(value),
              })
            }
          />
        )}
      </Group>
    </Stack>
  );
}

export function MantineDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  const s = strings(locale);
  return (
    <MantineProvider>
      <DemoBody
        mode={mode}
        render={(source) => (
          <DataTable
            source={source}
            columns={makeColumns(locale)}
            rowKey={(r) => r.id}
            labels={getLabels(locale)}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
            confirm={demoConfirm}
            virtualize
            estimateRowSize={56}
            estimateCardSize={140}
            stickyTop={8}
            filterLabels={makeFilterLabels(locale)}
            extraChips={demoFilterChips(source, locale)}
            onClearFilters={() => clearDemoFilters(source)}
            filters={<MantineFilters source={source} locale={locale} />}
          />
        )}
      />
    </MantineProvider>
  );
}
