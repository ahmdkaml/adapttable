import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import { useState } from "react";

import { cx } from "../cx";
import type { DataTableClassNames } from "../types";

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
  classNames: DataTableClassNames;
}

/**
 * Headless column-management menu: a disclosure button + a panel of per-column
 * controls. Ships no styles — target the `data-adapttable-part` hooks or the
 * `columnMenu*` className slots.
 */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
  classNames,
}: Readonly<ColumnMenuProps<TRow>>) {
  const [open, setOpen] = useState(false);
  const visibleKeys = layout.visibleColumns.map((c) => c.key);
  return (
    <div
      data-adapttable-part="column-menu"
      className={classNames.columnMenu}
      style={{ position: "relative" }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        data-adapttable-part="column-menu-button"
        className={classNames.columnMenuButton}
        onClick={() => setOpen((v) => !v)}
      >
        {labels.columns}
      </button>
      {open && (
        <div
          role="menu"
          data-adapttable-part="column-menu-panel"
          className={classNames.columnMenuPanel}
          style={{ position: "absolute", zIndex: 5, insetInlineEnd: 0 }}
        >
          {allColumns.map((column) => {
            const key = column.key;
            const pinned = layout.state.pinned[key];
            const visIndex = visibleKeys.indexOf(key);
            const name = columnLabel(column);
            return (
              <div
                key={key}
                data-adapttable-part="column-menu-item"
                className={classNames.columnMenuItem}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={!layout.isHidden(key)}
                    onChange={() => layout.toggleVisible(key)}
                  />
                  {name}
                </label>
                <span>
                  <button
                    type="button"
                    data-active={pinned === "left" || undefined}
                    aria-label={`${pinned === "left" ? labels.unpin : labels.pinLeft}: ${name}`}
                    onClick={() =>
                      layout.setPinned(
                        key,
                        pinned === "left" ? undefined : "left"
                      )
                    }
                  >
                    ⇤
                  </button>
                  <button
                    type="button"
                    data-active={pinned === "right" || undefined}
                    aria-label={`${pinned === "right" ? labels.unpin : labels.pinRight}: ${name}`}
                    onClick={() =>
                      layout.setPinned(
                        key,
                        pinned === "right" ? undefined : "right"
                      )
                    }
                  >
                    ⇥
                  </button>
                  <button
                    type="button"
                    disabled={visIndex <= 0}
                    aria-label={`${labels.moveLeft}: ${name}`}
                    onClick={() => layout.move(key, visIndex - 1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={
                      visIndex < 0 || visIndex >= visibleKeys.length - 1
                    }
                    aria-label={`${labels.moveRight}: ${name}`}
                    onClick={() => layout.move(key, visIndex + 1)}
                  >
                    →
                  </button>
                </span>
              </div>
            );
          })}
          <button
            type="button"
            className={cx(classNames.columnMenuItem)}
            onClick={() => layout.reset()}
          >
            {labels.resetColumns}
          </button>
        </div>
      )}
    </div>
  );
}
