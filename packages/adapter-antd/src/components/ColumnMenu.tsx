import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import {
  columnDropProps,
  columnMenuRows,
  columnReorderKeyProps,
  columnRowDragProps,
  EyeIcon,
  GripIcon,
  PinIcon,
} from "@adapttable/core";
import { Button, Divider, Flex, Popover } from "antd";

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

/**
 * AntD column-management popover: per-column drag grip (reorder), eye
 * (show/hide), and pin toggle.
 */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
}: Readonly<ColumnMenuProps<TRow>>) {
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
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          opacity: 0.6,
          padding: "0 4px 6px",
        }}
      >
        {labels.columns}
      </div>
      {columnMenuRows(allColumns, layout).map((r) => (
        <Flex
          key={r.key}
          align="center"
          gap={6}
          style={{ padding: "2px 0", cursor: "grab" }}
          {...columnRowDragProps(r.key)}
          {...columnDropProps(r.index, layout.move)}
        >
          <span
            style={{ display: "inline-flex", cursor: "grab", opacity: 0.55 }}
            {...columnReorderKeyProps(
              r.key,
              r.index,
              layout.move,
              `${labels.moveLeft} / ${labels.moveRight}: ${r.name}`
            )}
          >
            <GripIcon />
          </span>
          <Button
            size="small"
            type={r.hidden ? "text" : "link"}
            aria-label={r.name}
            aria-pressed={!r.hidden}
            icon={<EyeIcon off={r.hidden} />}
            onClick={() => layout.toggleVisible(r.key)}
          />
          <span
            style={{
              flex: 1,
              fontSize: 14,
              opacity: r.hidden ? 0.5 : 1,
              textDecoration: r.hidden ? "line-through" : "none",
            }}
          >
            {r.name}
          </span>
          <Button
            size="small"
            type={r.pinnedLeft ? "primary" : "text"}
            aria-label={`${r.pinnedLeft ? labels.unpin : labels.pinLeft}: ${r.name}`}
            icon={<PinIcon />}
            onClick={() =>
              layout.setPinned(r.key, r.pinnedLeft ? undefined : "left")
            }
          />
        </Flex>
      ))}
      <Divider style={{ margin: "8px 0" }} />
      <Button size="small" type="text" onClick={() => layout.reset()}>
        {labels.resetColumns}
      </Button>
    </div>
  );
  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      content={content}
      styles={{ body: { padding: 0 } }}
    >
      <Button>{labels.columns}</Button>
    </Popover>
  );
}
