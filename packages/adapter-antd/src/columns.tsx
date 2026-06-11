import {
  type ColumnDef,
  columnResizeHandleProps,
  type ConfirmHandler,
  headerGroupRow,
  resolveDisabledReason,
  type RowAction,
  runRowAction,
  type SortDirection,
  type SortLevel,
  type TableLabels,
} from "@adapttable/core";
import { Button, type TableColumnsType, Tooltip, Typography } from "antd";
import type { CSSProperties, HTMLAttributes, MouseEvent } from "react";

import { isDangerColor } from "./colors";

/** Inline style for an absolutely-positioned column-resize handle. */
const RESIZE_HANDLE_STYLE: CSSProperties = {
  position: "absolute",
  insetInlineEnd: 0,
  top: 0,
  height: "100%",
  width: 8,
  cursor: "col-resize",
  touchAction: "none",
  userSelect: "none",
};

/** Readable column label for the resize handle's accessible name. */
function columnLabel<TRow>(column: ColumnDef<TRow>): string {
  return typeof column.header === "string" ? column.header : column.key;
}

/** Logical (RTL-aware) text alignment for a column. */
export function logicalAlign(
  align: ColumnDef<unknown>["align"]
): "start" | "center" | "end" {
  if (align === "center") return "center";
  if (align === "end") return "end";
  return "start";
}

/** antd cell/header props applying logical alignment. */
function cellStyle(align: ColumnDef<unknown>["align"]): {
  style: { textAlign: "start" | "center" | "end" };
} {
  return { style: { textAlign: logicalAlign(align) } };
}

/** Map our sort state onto antd's `sortOrder` for a column. */
function sortOrderFor(
  columnKey: string,
  sortBy: string | undefined,
  sortDir: SortDirection | undefined
): "ascend" | "descend" | null {
  if (sortBy !== columnKey) return null;
  return sortDir === "desc" ? "descend" : "ascend";
}

/** `aria-sort` for a sortable header — antd's `<Table>` doesn't emit it. */
function ariaSortFor(
  columnKey: string,
  sortBy: string | undefined,
  sortDir: SortDirection | undefined
): "ascending" | "descending" | "none" {
  if (sortBy !== columnKey) return "none";
  return sortDir === "desc" ? "descending" : "ascending";
}

/** The column's direction within the multi-sort chain, if it has one. */
function chainDir(
  sortLevels: readonly SortLevel[],
  key: string
): SortDirection | undefined {
  return sortLevels.find((level) => level.key === key)?.dir;
}

/** 1-based chain position for the header badge, or `undefined`. */
function chainIndex(
  sortLevels: readonly SortLevel[],
  key: string
): number | undefined {
  const index = sortLevels.findIndex((level) => level.key === key);
  return index === -1 ? undefined : index + 1;
}

/**
 * The visible 1-based chain badge for a multi-sorted header (the rendered
 * counterpart of the `data-sort-index` attribute core's headless headers
 * expose). Presentational only — `aria-sort` + `data-sort-index` on the
 * header cell carry the machine-readable state.
 */
function SortIndexBadge({ index }: Readonly<{ index: number | undefined }>) {
  if (index === undefined) return null;
  return (
    <Typography.Text
      aria-hidden="true"
      style={{
        fontSize: "0.75em",
        verticalAlign: "super",
        marginInlineStart: 4,
      }}
    >
      {index}
    </Typography.Text>
  );
}

/** Header-cell props: HTML attributes plus the shared sort-badge data hook. */
interface HeaderCellProps extends HTMLAttributes<HTMLElement> {
  "data-sort-index"?: number;
}

/**
 * Per-header-cell props: logical alignment, `aria-sort` (chain-aware), the
 * `data-sort-index` badge hook, and — when multi-sort is on — the
 * shift-click interceptor.
 *
 * antd-specific multi-sort approach: antd renders its own header cells and
 * composes its sort trigger IN FRONT of any user `onClick` returned from
 * `onHeaderCell`, so a bubble-phase handler can never veto the built-in
 * single-sort. Shift-clicks are therefore intercepted in the CAPTURE phase:
 * `stopPropagation()` there keeps the native event from ever reaching antd's
 * bubble listener, so shift-click feeds OUR sort chain
 * (`source.toggleSortLevel`) while a plain click still drives antd's native
 * single-sort UI (reported back through `onChange`).
 */
function headerCellProps<TRow>(
  column: ColumnDef<TRow>,
  sortBy: string | undefined,
  sortDir: SortDirection | undefined,
  sortIndex: number | undefined,
  hasResizeHandle: boolean,
  onToggleSortLevel: ((key: string) => void) | undefined
): HeaderCellProps {
  const style: CSSProperties = { textAlign: logicalAlign(column.align) };
  // The resize handle is absolute, so the header cell needs a positioning
  // context for it.
  if (hasResizeHandle) style.position = "relative";
  if (!column.sortable) return { style };
  const props: HeaderCellProps = {
    style,
    "aria-sort": ariaSortFor(column.key, sortBy, sortDir),
    "data-sort-index": sortIndex,
  };
  if (onToggleSortLevel) {
    props.onClickCapture = (event: MouseEvent<HTMLElement>) => {
      if (!event.shiftKey) return;
      event.stopPropagation();
      onToggleSortLevel(column.key);
    };
  }
  return props;
}

/**
 * Fold contiguous same-`group` leaves into antd's NATIVE grouped columns.
 * Core's `headerGroupRow` owns the ordering rules (adjacency-based, a
 * reorder splits the group), so the antd column tree always mirrors the
 * shared group-row model: labelled cells become parent columns with
 * `children`, unlabelled gap cells leave their leaves at the top level.
 */
function groupColumns<TRow>(
  columns: readonly ColumnDef<TRow>[],
  leaves: TableColumnsType<TRow>
): TableColumnsType<TRow> {
  const cells = headerGroupRow(columns);
  if (!cells) return leaves;
  const grouped: TableColumnsType<TRow> = [];
  let cursor = 0;
  for (const cell of cells) {
    const run = leaves.slice(cursor, cursor + cell.span);
    cursor += cell.span;
    if (cell.label === null) grouped.push(...run);
    else grouped.push({ key: cell.key, title: cell.label, children: run });
  }
  return grouped;
}

/** Options for {@link buildColumns}. */
export interface BuildColumnsOptions<TRow> {
  columns: readonly ColumnDef<TRow>[];
  rowActions?: readonly RowAction<TRow>[];
  sortBy: string | undefined;
  sortDir: SortDirection | undefined;
  confirm: ConfirmHandler;
  labels: Required<TableLabels>;
  /** Per-column edge pinning, mapped to antd's native `fixed`. */
  pinned?: Readonly<Record<string, "left" | "right">>;
  /** Layout width mutator; enables a resize handle when provided. */
  setWidth?: (key: string, width: number) => void;
  /** Per-column pixel widths from the layout state. */
  columnWidths?: Readonly<Record<string, number>>;
  /** Accessible label prefix for the resize handle. */
  resizeLabel?: string;
  /** The active multi-sort chain (drives badges + chain-aware sort state). */
  sortLevels?: readonly SortLevel[];
  /** Shift-click chain toggler; provided only when `multiSort` is on. */
  onToggleSortLevel?: (key: string) => void;
}

/**
 * Translate AdaptTable {@link ColumnDef}s into antd's `columns` config,
 * wiring sort order, logical alignment, custom `Cell` renderers, and an
 * optional trailing actions column. antd's `<Table>` then drives the header
 * sort carets and (via the parent's `onChange`) reports clicks back.
 *
 * @typeParam TRow - The row type.
 * @returns The antd column definitions.
 */
export function buildColumns<TRow>({
  columns,
  rowActions,
  sortBy,
  sortDir,
  confirm,
  labels,
  pinned,
  setWidth,
  columnWidths,
  resizeLabel = "Resize column",
  sortLevels = [],
  onToggleSortLevel,
}: BuildColumnsOptions<TRow>): TableColumnsType<TRow> {
  const leaves: TableColumnsType<TRow> = columns.map((column) => {
    // An active chain level supersedes the single sort for this column's
    // caret and `aria-sort`, mirroring core's headless header cells.
    const dir = chainDir(sortLevels, column.key);
    const effectiveSortBy = dir ? column.key : sortBy;
    const effectiveSortDir = dir ?? sortDir;
    const sortIndex = chainIndex(sortLevels, column.key);
    return {
      key: column.key,
      title: (
        <>
          {column.header}
          <SortIndexBadge index={sortIndex} />
          {setWidth && (
            <span
              {...columnResizeHandleProps(
                column.key,
                setWidth,
                `${resizeLabel}: ${columnLabel(column)}`
              )}
              style={RESIZE_HANDLE_STYLE}
            />
          )}
        </>
      ),
      width: columnWidths?.[column.key] ?? column.width,
      fixed: pinned?.[column.key],
      sorter: column.sortable ? true : undefined,
      sortOrder: column.sortable
        ? sortOrderFor(column.key, effectiveSortBy, effectiveSortDir)
        : undefined,
      showSorterTooltip: false,
      onCell: () => cellStyle(column.align),
      onHeaderCell: () =>
        headerCellProps(
          column,
          effectiveSortBy,
          effectiveSortDir,
          sortIndex,
          Boolean(setWidth),
          onToggleSortLevel
        ),
      render: (_value: unknown, row: TRow, index: number) =>
        column.Cell ? (
          <column.Cell row={row} rowIndex={index} />
        ) : (
          column.accessor?.(row)
        ),
    };
  });
  const cols = groupColumns(columns, leaves);

  if (rowActions && rowActions.length > 0) {
    cols.push({
      key: "__actions__",
      title: labels.actions,
      width: 1,
      onCell: () => cellStyle("end"),
      onHeaderCell: () => cellStyle("end"),
      render: (_value: unknown, row: TRow) => (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          {rowActions.map((action) => {
            if (action.isHidden?.(row)) return null;
            const reason = resolveDisabledReason(action.disabledReason?.(row));
            const disabled =
              reason !== undefined || (action.isDisabled?.(row) ?? false);
            return (
              <Tooltip key={action.key} title={reason ?? action.label}>
                <Button
                  size="small"
                  type="text"
                  danger={isDangerColor(action.color)}
                  disabled={disabled}
                  title={reason}
                  aria-label={action.label}
                  // The disabled attribute already blocks activation, so
                  // attach the handler only when the action can run.
                  onClick={
                    disabled
                      ? undefined
                      : (e) => {
                          e.stopPropagation();
                          runRowAction(action, row, confirm, labels.cancel);
                        }
                  }
                >
                  {action.icon ?? action.label}
                </Button>
              </Tooltip>
            );
          })}
        </div>
      ),
    });
  }

  return cols;
}
