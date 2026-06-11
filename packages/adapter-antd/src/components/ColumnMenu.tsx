import type { ColumnMenuChromeProps, Direction } from "@adapttable/core";
import {
  columnMenuRows,
  columnReorderKeyProps,
  EyeIcon,
  GripIcon,
  nextPinSide,
  pinActionLabel,
  PinIcon,
  useColumnDragState,
} from "@adapttable/core";
import { Button, Divider, Flex, Popover, theme } from "antd";
import { useEffect, useState } from "react";

export interface ColumnMenuProps<TRow> extends ColumnMenuChromeProps<TRow> {
  dir?: Direction;
}

/**
 * AntD column-management popover: per-column drag grip (reorder), eye
 * (show/hide), and pin toggle. Controlled open state so Escape dismisses it
 * (antd's Popover has no built-in Escape handling) and the trigger reports
 * `aria-expanded` like the Filters button beside it.
 */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
  dir,
}: Readonly<ColumnMenuProps<TRow>>) {
  const drag = useColumnDragState();
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
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
      {columnMenuRows(allColumns, layout).map((r) => {
        // Drop-position feedback: dim the source, line the landing edge.
        const indicator = drag.rowAttrs(r.key, r.index);
        const edge = indicator["data-drop"];
        const edgeOffset = edge === "before" ? "2px" : "-2px";
        return (
          <Flex
            key={r.key}
            align="center"
            gap={6}
            style={{
              padding: "2px 0",
              cursor: "grab",
              opacity: "data-dragging" in indicator ? 0.4 : undefined,
              boxShadow: edge
                ? `inset 0 ${edgeOffset} 0 0 ${token.colorPrimary}`
                : undefined,
            }}
            {...drag.rowDragProps(r.key, r.index)}
            {...drag.dropProps(r.index, layout.move)}
            {...indicator}
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
              aria-label={`${r.hidden ? labels.showColumn : labels.hideColumn}: ${r.name}`}
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
              type={r.pinned ? "primary" : "text"}
              aria-label={`${pinActionLabel(r.pinned, labels)}: ${r.name}`}
              icon={<PinIcon />}
              onClick={() => layout.setPinned(r.key, nextPinSide(r.pinned))}
            />
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
    <Popover
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement={dir === "rtl" ? "bottomLeft" : "bottomRight"}
      content={content}
      styles={{ body: { padding: 0 } }}
    >
      <Button aria-expanded={open} aria-haspopup="true">
        {labels.columns}
      </Button>
    </Popover>
  );
}
