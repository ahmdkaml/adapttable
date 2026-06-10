import { DataTable } from "@adapttable/antd";
import type { TableSource } from "@adapttable/core";
import { getDirection, getLabels } from "@adapttable/i18n";
import {
  Avatar,
  Checkbox,
  ConfigProvider,
  Input,
  InputNumber,
  Progress,
  Select,
  Space,
  Tag,
  theme as antdTheme,
  Typography,
} from "antd";

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
  makeWideColumns,
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
} from "../data";
import { type DataMode, DemoBody, type Density, type PageMode } from "../Demo";

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

const ANTD_TAG_COLOR = {
  green: "green",
  blue: "blue",
  red: "red",
  gray: "default",
} as const;

/** Ant Design-native cell visuals (Avatar · Tag · Progress). */
const ANTD_CELLS: DemoCells = {
  Avatar: ({ name }: AvatarCellProps) => (
    <Avatar
      size={36}
      style={{
        backgroundColor: `hsl(${nameHue(name)} 60% 88%)`,
        color: `hsl(${nameHue(name)} 45% 35%)`,
        fontWeight: 700,
      }}
    >
      {initials(name)}
    </Avatar>
  ),
  Status: ({ status, label }: StatusCellProps) => (
    <Tag color={ANTD_TAG_COLOR[statusTone(status)]} bordered={false}>
      {label}
    </Tag>
  ),
  Load: ({ value, meta }: LoadCellProps) => (
    <div style={{ minWidth: 90 }}>
      <Progress percent={value} showInfo={false} size="small" />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {meta}
      </Typography.Text>
    </div>
  ),
};

export function AntdDemo({
  mode,
  locale,
  dark,
  pageMode,
  urlKey,
  density,
  wide,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  dark?: boolean;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
  /** Use the wide, horizontally-scrolling column set with Person pinned. */
  wide?: boolean;
}>) {
  const s = strings(locale);
  return (
    <ConfigProvider
      direction={getDirection(locale)}
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <DemoBody
        mode={mode}
        pageMode={pageMode}
        urlKey={urlKey}
        defaultColumnLayout={
          wide ? { pinned: { person: "left" } } : LIVE_DEFAULT_LAYOUT
        }
        render={(source, columns) => (
          <DataTable
            source={source}
            columns={
              wide
                ? makeWideColumns(locale, ANTD_CELLS)
                : makeColumns(locale, ANTD_CELLS)
            }
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
