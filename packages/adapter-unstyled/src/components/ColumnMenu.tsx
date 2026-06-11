import type {
  ColumnDragState,
  ColumnMenuChromeProps,
  ColumnMenuLabels,
  ColumnMenuRow,
  UseColumnLayoutResult,
} from "@adapttable/core";
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
import { useEffect, useRef, useState } from "react";

import { cx } from "../cx";
import type { DataTableClassNames } from "../types";

interface ColumnMenuRowProps<TRow> {
  row: ColumnMenuRow<TRow>;
  layout: UseColumnLayoutResult<TRow>;
  labels: ColumnMenuLabels;
  classNames: DataTableClassNames;
  drag: ColumnDragState;
}

function ColumnMenuRowItem<TRow>({
  row,
  layout,
  labels,
  classNames,
  drag,
}: Readonly<ColumnMenuRowProps<TRow>>) {
  const { key, name, hidden, pinned, index } = row;
  return (
    <div
      data-adapttable-part="column-menu-item"
      data-hidden={hidden || undefined}
      data-pinned={pinned}
      className={classNames.columnMenuItem}
      style={{ cursor: "grab" }}
      {...drag.rowDragProps(key, index)}
      {...drag.dropProps(index, layout.move)}
      {...drag.rowAttrs(key, index)}
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
        aria-label={`${hidden ? labels.showColumn : labels.hideColumn}: ${name}`}
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
        data-active={pinned !== undefined || undefined}
        aria-pressed={pinned !== undefined}
        aria-label={`${pinActionLabel(pinned, labels)}: ${name}`}
        className={classNames.columnMenuPin}
        onClick={() => layout.setPinned(key, nextPinSide(pinned))}
      >
        <PinIcon />
      </button>
    </div>
  );
}

export interface ColumnMenuProps<TRow> extends ColumnMenuChromeProps<TRow> {
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
  const drag = useColumnDragState();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Escape strands keyboard focus inside the removed panel — hand it
      // back to the trigger (outside clicks keep their own focus target).
      triggerRef.current?.focus();
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
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        data-adapttable-part="column-menu-button"
        data-active={open || undefined}
        className={classNames.columnMenuButton}
        style={{ flexShrink: 0, whiteSpace: "nowrap" }}
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
            zIndex: 200,
            insetInlineEnd: 0,
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
              drag={drag}
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
