import { DataTable } from "@adapttable/antd";
import type { TableSource } from "@adapttable/core";
import { getDirection, getLabels } from "@adapttable/i18n";
import {
  Checkbox,
  ConfigProvider,
  Input,
  InputNumber,
  Select,
  Space,
} from "antd";

import {
  allocationFilterState,
  budgetFilterState,
  clearDemoFilters,
  COUNT_OPTIONS,
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

function AntdFilters({
  source,
  locale,
}: Readonly<{ source: TableSource<Person>; locale: Locale }>) {
  const s = strings(locale);
  const allocation = allocationFilterState(source);
  const budget = budgetFilterState(source);

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <div>
        <strong>{s.team}</strong>
        <Checkbox.Group
          options={TEAMS}
          value={selectedTeams(source.extra.team)}
          onChange={(value) => source.setExtra("team", value)}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}
        />
      </div>
      <div>
        <strong>{s.status}</strong>
        <Checkbox.Group
          options={[...STATUSES]}
          value={selectedStatuses(source.extra.status)}
          onChange={(value) => source.setExtra("status", value)}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}
        />
      </div>
      <Space.Compact block>
        <Input
          type="date"
          aria-label={s.dateFrom}
          value={String(source.extra.startFrom ?? "")}
          onChange={(event) =>
            source.setExtra("startFrom", event.currentTarget.value)
          }
        />
        <Input
          type="date"
          aria-label={s.dateTo}
          value={String(source.extra.startTo ?? "")}
          onChange={(event) =>
            source.setExtra("startTo", event.currentTarget.value)
          }
        />
      </Space.Compact>
      <Space.Compact block>
        <Select
          aria-label={s.allocationFilter}
          placeholder={s.allocationFilter}
          value={allocation.op}
          allowClear
          options={COUNT_OPTIONS.map((option) => ({
            value: option.op,
            label: option.label,
          }))}
          style={{ minWidth: 160 }}
          onChange={(value) =>
            setAllocationFilter(source, {
              op: value,
              value:
                value && value !== "between" ? allocation.value : undefined,
              from: value === "between" ? allocation.from : undefined,
              to: value === "between" ? allocation.to : undefined,
            })
          }
        />
        <InputNumber
          aria-label={allocation.op === "between" ? s.countFrom : s.countValue}
          value={
            allocation.op === "between" ? allocation.from : allocation.value
          }
          onChange={(value) =>
            setAllocationFilter(source, {
              ...allocation,
              [allocation.op === "between" ? "from" : "value"]:
                typeof value === "number" ? value : undefined,
            })
          }
          style={{ width: "100%" }}
        />
      </Space.Compact>
      <Space.Compact block>
        <Select
          aria-label={s.budgetFilter}
          placeholder={s.budgetFilter}
          value={budget.op}
          allowClear
          options={COUNT_OPTIONS.map((option) => ({
            value: option.op,
            label: option.label,
          }))}
          style={{ minWidth: 160 }}
          onChange={(value) =>
            setBudgetFilter(source, {
              op: value,
              value: value && value !== "between" ? budget.value : undefined,
              from: value === "between" ? budget.from : undefined,
              to: value === "between" ? budget.to : undefined,
            })
          }
        />
        <InputNumber
          aria-label={budget.op === "between" ? s.countFrom : s.countValue}
          value={budget.op === "between" ? budget.from : budget.value}
          onChange={(value) =>
            setBudgetFilter(source, {
              ...budget,
              [budget.op === "between" ? "from" : "value"]:
                typeof value === "number" ? value : undefined,
            })
          }
          style={{ width: "100%" }}
        />
      </Space.Compact>
    </Space>
  );
}

export function AntdDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  const s = strings(locale);
  return (
    <ConfigProvider direction={getDirection(locale)}>
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
            filterLabels={makeFilterLabels(locale)}
            extraChips={demoFilterChips(source, locale)}
            onClearFilters={() => clearDemoFilters(source)}
            filters={<AntdFilters source={source} locale={locale} />}
          />
        )}
      />
    </ConfigProvider>
  );
}
