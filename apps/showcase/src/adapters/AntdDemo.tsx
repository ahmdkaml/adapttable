import { DataTable } from "@adapttable/antd";
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
  initials,
  LIVE_DEFAULT_LAYOUT,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
  makeWideColumns,
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
  filtersUi,
  wide,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  dark?: boolean;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
  filtersUi?: FiltersUi;
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
            filtersMode={filtersUi}
            labels={getLabels(locale)}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
            bulkActions={makeBulkActions(locale)}
            confirm={demoConfirm}
            enableColumnMenu
            resizableColumns
            filters={demoFilterDefs(locale)}
          />
        )}
      />
    </ConfigProvider>
  );
}
