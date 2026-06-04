import type {
  ColumnDef,
  ColumnMenuRow,
  UseColumnLayoutResult,
} from "@adapttable/core";
import {
  columnDropProps,
  columnMenuRows,
  columnReorderKeyProps,
  columnRowDragProps,
  EyeIcon,
  GripIcon,
  PinIcon,
} from "@adapttable/core";
import { useEffect, useRef, useState } from "react";

import { cx } from "../cx";
import type { DataTableClassNames } from "../types";

export interface ColumnMenuLabels {
  columns: string;
  pinLeft: string;
  pinRight: string;
  unpin: string;
  moveLeft: string;
  moveRight: string;
  resetColumns: string;
}

interface ColumnMenuRowProps<TRow> {
  row: ColumnMenuRow<TRow>;
  layout: UseColumnLayoutResult<TRow>;
  labels: ColumnMenuLabels;
  classNames: DataTableClassNames;
}

function ColumnMenuRowItem<TRow>({
  row,
  layout,
  labels,
  classNames,
}: Readonly<ColumnMenuRowProps<TRow>>) {
  const { key, name, hidden, pinnedLeft, index } = row;
  return (
    <div
      data-adapttable-part="column-menu-item"
      data-hidden={hidden || undefined}
      data-pinned={pinnedLeft ? "left" : undefined}
      className={classNames.columnMenuItem}
      style={{ cursor: "grab" }}
      {...columnRowDragProps(key)}
      {...columnDropProps(index, layout.move)}
    >
      <span
        data-adapttable-part="column-menu-grip"
        className={classNames.columnMenuGrip}
        {...columnReorderKeyProps(
          key,
          index,
          layout.move,
          `${labels.moveLeft} / ${labels.moveRight}: ${name}`
        )}
      >
        <GripIcon />
      </span>
      <button
        type="button"
        data-adapttable-part="column-menu-visibility"
        data-active={!hidden || undefined}
        aria-pressed={!hidden}
        aria-label={`${name}`}
        className={classNames.columnMenuVisibility}
        onClick={() => layout.toggleVisible(key)}
      >
        <EyeIcon off={hidden} />
      </button>
      <span
        data-adapttable-part="column-menu-label"
        data-hidden={hidden || undefined}
        className={classNames.columnMenuLabel}
      >
        {name}
      </span>
      <button
        type="button"
        data-adapttable-part="column-menu-pin"
        data-active={pinnedLeft || undefined}
        aria-pressed={pinnedLeft}
        aria-label={`${pinnedLeft ? labels.unpin : labels.pinLeft}: ${name}`}
        className={classNames.columnMenuPin}
        onClick={() => layout.setPinned(key, pinnedLeft ? undefined : "left")}
      >
        <PinIcon />
      </button>
    </div>
  );
}

export interface ColumnMenuProps<TRow> {
  allColumns: ColumnDef<TRow>[];
  layout: UseColumnLayoutResult<TRow>;
  labels: ColumnMenuLabels;
  classNames: DataTableClassNames;
}

/**
 * Column-management popover: a disclosure button + a panel where each column
 * has a drag grip (reorder), an eye toggle (show/hide), and a pin toggle.
 * Closes on outside-click or Escape. Ships no styles — target the
 * `data-adapttable-part` hooks or the `columnMenu*` className slots.
 */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
  classNames,
}: Readonly<ColumnMenuProps<TRow>>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      data-adapttable-part="column-menu"
      className={classNames.columnMenu}
      style={{ position: "relative" }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        data-adapttable-part="column-menu-button"
        data-active={open || undefined}
        className={classNames.columnMenuButton}
        onClick={() => setOpen((v) => !v)}
      >
        {labels.columns}
      </button>
      {open && (
        <fieldset
          aria-label={labels.columns}
          data-adapttable-part="column-menu-panel"
          className={classNames.columnMenuPanel}
          style={{
            position: "absolute",
            zIndex: 40,
            insetInlineStart: 0,
            margin: 0,
            border: 0,
            padding: 0,
            minInlineSize: 0,
          }}
        >
          <div
            data-adapttable-part="column-menu-header"
            className={classNames.columnMenuHeader}
          >
            <span
              data-adapttable-part="column-menu-title"
              className={classNames.columnMenuTitle}
            >
              {labels.columns}
            </span>
          </div>
          {columnMenuRows(allColumns, layout).map((row) => (
            <ColumnMenuRowItem
              key={row.key}
              row={row}
              layout={layout}
              labels={labels}
              classNames={classNames}
            />
          ))}
          <button
            type="button"
            data-adapttable-part="column-menu-reset"
            className={cx(classNames.columnMenuReset)}
            onClick={() => layout.reset()}
          >
            {labels.resetColumns}
          </button>
        </fieldset>
      )}
    </div>
  );
}
