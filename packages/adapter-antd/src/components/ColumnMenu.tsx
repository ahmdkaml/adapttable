import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import { Button, Checkbox, Divider, Dropdown, Flex, Space } from "antd";

function columnLabel<TRow>(column: ColumnDef<TRow>): string {
  if (typeof column.header === "string") return column.header;
  return column.mobileLabel ?? column.key;
}

export interface ColumnMenuLabels {
  columns: string;
  pinLeft: string;
  pinRight: string;
  unpin: string;
  moveLeft: string;
  moveRight: string;
  resetColumns: string;
}

export interface ColumnMenuProps<TRow> {
  allColumns: ColumnDef<TRow>[];
  layout: UseColumnLayoutResult<TRow>;
  labels: ColumnMenuLabels;
}

/** Built-in AntD column-management menu: show/hide, pin, reorder, reset. */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
}: Readonly<ColumnMenuProps<TRow>>) {
  const visibleKeys = layout.visibleColumns.map((c) => c.key);
  const content = (
    <div
      style={{
        background: "var(--ant-color-bg-elevated, #fff)",
        borderRadius: 8,
        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
        padding: 8,
        minWidth: 260,
      }}
    >
      {allColumns.map((column) => {
        const key = column.key;
        const pinned = layout.state.pinned[key];
        const visIndex = visibleKeys.indexOf(key);
        return (
          <Flex key={key} justify="space-between" align="center" gap={8}>
            <Checkbox
              checked={!layout.isHidden(key)}
              onChange={() => layout.toggleVisible(key)}
            >
              {columnLabel(column)}
            </Checkbox>
            <Space size={0}>
              <Button
                size="small"
                type={pinned === "left" ? "primary" : "text"}
                aria-label={`${pinned === "left" ? labels.unpin : labels.pinLeft}: ${columnLabel(column)}`}
                onClick={() =>
                  layout.setPinned(key, pinned === "left" ? undefined : "left")
                }
              >
                ⇤
              </Button>
              <Button
                size="small"
                type={pinned === "right" ? "primary" : "text"}
                aria-label={`${pinned === "right" ? labels.unpin : labels.pinRight}: ${columnLabel(column)}`}
                onClick={() =>
                  layout.setPinned(
                    key,
                    pinned === "right" ? undefined : "right"
                  )
                }
              >
                ⇥
              </Button>
              <Button
                size="small"
                type="text"
                disabled={visIndex <= 0}
                aria-label={`${labels.moveLeft}: ${columnLabel(column)}`}
                onClick={() => layout.move(key, visIndex - 1)}
              >
                ←
              </Button>
              <Button
                size="small"
                type="text"
                disabled={visIndex < 0 || visIndex >= visibleKeys.length - 1}
                aria-label={`${labels.moveRight}: ${columnLabel(column)}`}
                onClick={() => layout.move(key, visIndex + 1)}
              >
                →
              </Button>
            </Space>
          </Flex>
        );
      })}
      <Divider style={{ margin: "8px 0" }} />
      <Button size="small" type="text" onClick={() => layout.reset()}>
        {labels.resetColumns}
      </Button>
    </div>
  );
  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      popupRender={() => content}
    >
      <Button>{labels.columns}</Button>
    </Dropdown>
  );
}
