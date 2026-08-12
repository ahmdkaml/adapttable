import { DataTable, type DataTableProps } from "@adapttable/antd";
import { getDirection, getLabels } from "@adapttable/i18n";
import {
  Avatar,
  ConfigProvider,
  Progress,
  Tag,
  theme as antdTheme,
  Typography,
} from "antd";

import {
  type AvatarCellProps,
  type DemoCells,
  demoConfirm,
  demoFilterDefs,
  demoSavedViews,
  initials,
  LIVE_DEFAULT_LAYOUT,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
  makeWideColumns,
  nameHue,
  type Person,
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
    <Tag color={ANTD_TAG_COLOR[statusTone(status)]} variant="filled">
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
  filtersUi,
  animate,
  grouping,
  editing,
  cellNavigation,
  wide,
  exportCsv,
  exportLabel,
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
  cellNavigation?: boolean;
  /** Use the wide, horizontally-scrolling column set with Person pinned. */
  wide?: boolean;
  /**
   * Export configuration for the toolbar button. Defaults to a plain CSV of
   * the current page; the columns demo overrides it to write the highlighted
   * cell range as a spreadsheet.
   */
  exportCsv?: DataTableProps<Person>["exportCsv"];
  /**
   * Toolbar button text. The default label names CSV, so a demo that writes
   * another format says so — a button that lies about what it downloads is
   * worse than an unstyled one.
   */
  exportLabel?: string;
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
          // The wide showcase pins BOTH edges by default: person at the
          // start, the actions column at the end (it pins like any column).
          wide
            ? { pinned: { person: "start", actions: "end" } }
            : LIVE_DEFAULT_LAYOUT
        }
        grouping={grouping}
        editing={editing}
        render={(source, columns) => (
          <DataTable
            source={source}
            columns={
              wide
                ? makeWideColumns(locale, ANTD_CELLS)
                : makeColumns(locale, ANTD_CELLS)
            }
            rowKey={(r) => r.id}
            cellNavigation={cellNavigation}
            {...columns}
            density={density}
            filtersMode={filtersUi}
            labels={{
              ...getLabels(locale),
              ...(exportLabel ? { exportCsv: exportLabel } : {}),
            }}
            locale={locale}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
            bulkActions={makeBulkActions(locale)}
            confirm={demoConfirm}
            enableColumnMenu
            exportCsv={exportCsv ?? true}
            savedViews={demoSavedViews(urlKey)}
            animate={animate}
            resizableColumns
            filters={demoFilterDefs(locale)}
          />
        )}
      />
    </ConfigProvider>
  );
}
