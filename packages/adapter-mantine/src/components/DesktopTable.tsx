import {
  bodyRowEntries,
  type ColumnDef,
  columnResizeHandleProps,
  type ConfirmHandler,
  edgePinStyle,
  type EditableCellEditing,
  type GridFocusState,
  PIN_Z,
  pinnedCellStyle,
  type RowAction,
  type RowPinSide,
  runRowAction,
  type TableLabels,
  tableMinWidth,
  type TreeEntry,
  type UseDataTableResult,
  useHorizontalOverflow,
} from "@adapttable/core";
import {
  type BodyCell,
  cellHighlightStyle,
  cellsForRow,
  ColumnGroupToggle,
  ColumnSpacer,
  EXTRA_ROW_PARTS,
  FillHandle,
  fittedTableStyle,
  headerGroupRows,
  insertExtraRows,
  type PinLeads,
  PINNED_BOTTOM_PART,
  PINNED_TOP_PART,
  pinnedColumnWidth,
  pinnedRowCellStyle,
  pinnedRowStickyStyle,
  REORDER_COLUMN_WIDTH,
  resolveDisabledReason,
  resolveRowStyle,
  rowClickProps,
  RowEditActions,
  rowEditingSignature,
  rowIsDirty,
  type RowPairMeasurer,
  rowPinSignature,
  rowReorderDropStyle,
  RowReorderHandle,
  rowReorderSignature,
  rowSpanSignature,
  rowStyleSignature,
  type SharedTableRenderProps,
  tableRenderModel,
  TreeCell,
  useOffsetHeight,
  useSummaryCells,
} from "@adapttable/core/adapter";
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Table,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import type {
  CSSProperties,
  MouseEvent,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";
import { memo, useCallback, useMemo, useRef } from "react";

import { type Density, DENSITY_SPACING } from "../density";
import { ChevronDownIcon, ChevronUpIcon, SelectorIcon } from "../icons";
import { HAIRLINE, SURFACE } from "../surface";
import { EditableDataCell } from "./EditableCell";
import { ExpandToggle } from "./ExpandToggle";
import { GroupHeaderRow } from "./GroupHeader";

function ExtraSlotRow({
  kind,
  colSpan,
  render,
  labels,
}: Readonly<{
  kind: "separator" | "fullWidth";
  colSpan: number;
  render?: () => ReactNode;
  labels: TableLabels;
}>): ReactElement {
  const parts = EXTRA_ROW_PARTS[kind];
  return (
    <Table.Tr data-adapttable-part={parts.row}>
      <Table.Td
        colSpan={colSpan}
        data-adapttable-part={parts.cell}
        role={kind === "separator" ? "separator" : undefined}
        aria-label={kind === "separator" ? labels.rowSeparator : undefined}
      >
        {kind === "fullWidth" ? render?.() : null}
      </Table.Td>
    </Table.Tr>
  );
}

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

function When({
  show,
  children,
}: Readonly<{ show: boolean; children: ReactNode }>) {
  if (!show) return null;
  return children;
}

function isPinnedTable(
  hasColumnPin: boolean,
  actionsEdgePinned: boolean,
  showReorder: boolean,
  reorderPinned: boolean
): boolean {
  return hasColumnPin || actionsEdgePinned || (showReorder && reorderPinned);
}

function startLeads(
  expandable: boolean,
  showReorder: boolean,
  hasSelection: boolean,
  showActions: boolean,
  expansionWidth: number,
  selectionWidth: number,
  actionsWidth: number
): {
  expansionLead: number;
  reorderLead: number;
  leads: PinLeads;
} {
  const expansionLead = expandable ? expansionWidth : 0;
  const reorderLead = showReorder ? REORDER_COLUMN_WIDTH : 0;
  return {
    expansionLead,
    reorderLead,
    leads: {
      start: expansionLead + reorderLead + (hasSelection ? selectionWidth : 0),
      end: showActions ? actionsWidth : 0,
    },
  };
}

/**
 * Props for {@link DesktopTable}: the shared render contract from core
 * (minus `stickyTop` — the resolved `stickyHeaderOffset` replaces it) plus
 * the Mantine-specific extras.
 */
export interface DesktopTableProps<TRow> extends Omit<
  SharedTableRenderProps<TRow>,
  "stickyTop"
> {
  bodyRef: RefObject<HTMLTableSectionElement | null>;
  className?: string;
  /** Resolved sticky-header top inset (page `stickyTop` + toolbar height). */
  stickyHeaderOffset?: number;
  /** The injected actions column is pinned to the inline end on its own. */
  actionsPinned?: boolean;
  density?: Density;
}

function SortIcon({
  active,
  dir,
}: Readonly<{
  active: boolean;
  dir: "asc" | "desc" | undefined;
}>) {
  if (!active) return <SelectorIcon size={12} />;
  return dir === "asc" ? (
    <ChevronUpIcon size={12} />
  ) : (
    <ChevronDownIcon size={12} />
  );
}

function HeaderCell<TRow>({
  table,
  column,
  stickyStyle,
  resizeHandle,
  columnProps,
}: Readonly<{
  table: UseDataTableResult<TRow>;
  column: ColumnDef<TRow>;
  stickyStyle: CSSProperties;
  resizeHandle?: ReactNode;
  /** Cell-navigation props for this header — column selection. */
  columnProps?: Record<string, unknown>;
}>) {
  const cellProps = { ...table.getHeaderCellProps(column), ...columnProps };
  const headerStyle = {
    ...cellProps.style,
    ...stickyStyle,
  };
  if (!column.sortable) {
    return (
      <Table.Th {...cellProps} style={headerStyle}>
        {column.header}
        {resizeHandle}
      </Table.Th>
    );
  }
  // Core's onClick receives the click event as-is (no zero-arg wrapper), so
  // shift-clicks reach the multi-sort branch inside `getSortButtonProps`.
  const buttonProps = table.getSortButtonProps(column);
  // 1-based chain position from core (always > 0 when defined) — drives the
  // multi-sort badge; the chain level also wins the icon's active/dir state,
  // because chaining clears the single-sort `sortBy`.
  const sortIndex = buttonProps["data-sort-index"];
  const level = table.source.sortLevels.find((l) => l.key === column.key);
  const active = level !== undefined || table.sortBy === column.key;
  return (
    <Table.Th {...cellProps} style={headerStyle}>
      <Group
        component="button"
        gap={6}
        wrap="nowrap"
        display="inline-flex"
        style={{
          background: "none",
          border: 0,
          cursor: "pointer",
          font: "inherit",
          padding: 0,
          color: active ? "var(--mantine-primary-color-filled)" : "inherit",
        }}
        {...buttonProps}
      >
        <span>{column.header}</span>
        <SortIcon active={active} dir={level?.dir ?? table.sortDir} />
        {typeof sortIndex === "number" && (
          <Badge component="span" size="xs" variant="light">
            {sortIndex}
          </Badge>
        )}
      </Group>
      {resizeHandle}
    </Table.Th>
  );
}

function RowActions<TRow>({
  row,
  actions,
  confirm,
  cancelLabel,
}: Readonly<{
  row: TRow;
  actions: RowAction<TRow>[];
  confirm: ConfirmHandler;
  cancelLabel: string;
}>) {
  return (
    <Group gap={4} justify="flex-end" wrap="nowrap">
      {actions.map((action) => {
        if (action.isHidden?.(row)) return null;
        const reason = resolveDisabledReason(action.disabledReason?.(row));
        const disabled =
          reason !== undefined || (action.isDisabled?.(row) ?? false);
        // The disabled attribute already blocks activation, so attach the
        // handler only when the action can run.
        const handleClick = disabled
          ? undefined
          : (e: MouseEvent) => {
              e.stopPropagation();
              runRowAction(action, row, confirm, cancelLabel);
            };
        // Icon-only actions render as an ActionIcon; without an icon, fall
        // back to a text button so the label is actually visible.
        return action.icon ? (
          <Tooltip
            key={action.key}
            label={reason ?? action.label}
            withArrow
            openDelay={200}
          >
            <ActionIcon
              variant="subtle"
              color={action.color}
              size="sm"
              disabled={disabled}
              aria-label={action.label}
              onClick={handleClick}
            >
              {action.icon}
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            key={action.key}
            variant="subtle"
            color={action.color}
            size="compact-sm"
            disabled={disabled}
            onClick={handleClick}
          >
            {action.label}
          </Button>
        );
      })}
    </Group>
  );
}

/**
 * Props for the memoized {@link DesktopRowBase}. Everything the row's visual
 * output depends on is a primitive, a stable identity, or is fingerprinted
 * by `pinSignature` — so {@link desktopRowPropsEqual} can hold the row
 * across unrelated table re-renders (search keystrokes, other rows'
 * selection) without ever capturing a stale event handler.
 */
interface DesktopRowProps<TRow> {
  row: TRow;
  /** Absolute row index (virtual windows keep source indices). */
  index: number;
  /** Stable row id from `getRowId`. */
  id: string;
  columns: readonly ColumnDef<TRow>[];
  /** This row's cells — covered neighbours already omitted. */
  bodyCells: readonly BodyCell<TRow>[];
  /** Memo digest from {@link rowSpanSignature}. */
  spanSignature: string;
  /** Core's cell prop-getter — identity-stable for the table's lifetime. */
  getCellProps: UseDataTableResult<TRow>["getCellProps"];
  /** Cell-navigation getters; absent unless `cellNavigation` is on. */
  gridFocus?: GridFocusState;
  /** Selected state; `undefined` when selection is off (no checkbox cell). */
  selected?: boolean;
  selectLabel: string;
  /** Identity-stable select toggle (latest-ref wrapped in the parent). */
  onToggleSelect: (id: string) => void;
  /** Expanded state; `undefined` when expansion is off (no chevron cell). */
  expanded?: boolean;
  expandLabel: string;
  collapseLabel: string;
  /** Core's expansion toggle — identity-stable. */
  onToggleExpand?: (id: string) => void;
  renderRowDetail?: (row: TRow) => ReactNode;
  /** Detail-cell span: expansion + selection + data + actions columns. */
  columnSpan: number;
  /** Widths holding open the columns outside the horizontal window. */
  columnSpacers?: { start: number; end: number };
  /** This row's place in the tree, when the table has one. */
  treeEntry?: TreeEntry<TRow>;
  /** Which column carries the chevron and the indent. */
  treeColumnKey?: string;
  /** Open or close a tree node. */
  onToggleTree?: (id: string) => void;
  rowActions?: RowAction<TRow>[];
  confirm: ConfirmHandler;
  cancelLabel: string;
  /** `labels.editRow` / `labels.saveRow` — row mode's own controls. */
  editRowLabel: string;
  saveRowLabel: string;
  editLabel: string;
  /** `labels.undoEdit` — the control a failed save offers. */
  undoLabel: string;
  /** Whether the leading reorder column renders. */
  showReorder: boolean;
  /** Headless reorder; uncompared — visual churn is `reorderSignature`. */
  rowReorder: SharedTableRenderProps<TRow>["rowReorder"];
  windowStart: number;
  rowCount: number;
  reorderPinned: boolean;
  /** Memo digest from {@link rowReorderSignature}. */
  reorderSignature: string | null;
  /** Which edge this row is pinned to, if any. */
  rowPinSide?: RowPinSide;
  /** Sticky header offset for a pinned row's cells. */
  rowPinOffset: number;
  /** Memo digest from {@link rowPinSignature}. */
  rowPinSignature: string | null;
  /** Dataset index for ARIA / focus when pinning remapped the window. */
  sourceIndex: number;
  /** Resolved table labels — the reorder handle reads its own strings. */
  labels: Required<TableLabels>;
  onRowClick?: (row: TRow) => void;
  prefetch?: (row: TRow) => void;
  /** Resolved `rowClassName(row, index)` output. */
  className?: string;
  /** Resolved `rowStyle` + `rowHeight`. Compared via `rowStyleSignature`. */
  rowVisualStyle?: CSSProperties;
  rowStyleSignature: string;
  measureElement?: (element: Element | null) => void;
  /** Measures a row together with its open detail panel. */
  measureRowPair?: RowPairMeasurer;
  /** Pinned-cell style for a data column (output covered by `pinSignature`). */
  pinStyleFor: (key: string) => CSSProperties | undefined;
  selectionCellStyle?: CSSProperties;
  expansionCellStyle?: CSSProperties;
  reorderCellStyle?: CSSProperties;
  actionsCellStyle?: CSSProperties;
  /** Fingerprint of the pin layout, compared instead of the styles above. */
  pinSignature: string;
  editing: EditableCellEditing<TRow> | undefined;
  rows: readonly TRow[];
  getRowId: (row: TRow) => string;
  editingSignature: string | null;
}

/**
 * The style-ish props the comparator deliberately skips: they are rebuilt
 * every parent render, and their visual output is exactly determined by
 * `pinSignature` (plus the compared inputs) — comparing their identities
 * would only defeat the memo.
 */
type UncomparedRowProp =
  | "pinStyleFor"
  | "selectionCellStyle"
  | "expansionCellStyle"
  | "reorderCellStyle"
  | "actionsCellStyle"
  | "editing"
  | "rows"
  | "getRowId"
  | "rowReorder"
  | "windowStart"
  | "rowCount"
  | "bodyCells"
  | "rowVisualStyle";

/** Every row prop the memo comparator checks with `Object.is`. */
const COMPARED_ROW_PROPS: readonly Exclude<
  keyof DesktopRowProps<unknown>,
  UncomparedRowProp
>[] = [
  "row",
  "index",
  "id",
  // Cell focus and the selected range, or a row never learns that one of its
  // cells became focused or selected — the live region announced the move
  // while every row kept its previous output. One reference compare: the
  // state object is memoized as a whole.
  "gridFocus",
  "columns",
  "spanSignature",
  "getCellProps",
  "selected",
  "selectLabel",
  "onToggleSelect",
  "expanded",
  "expandLabel",
  "collapseLabel",
  "onToggleExpand",
  "renderRowDetail",
  "columnSpan",
  "rowActions",
  "confirm",
  "cancelLabel",
  "editLabel",
  "showReorder",
  "reorderSignature",
  "rowPinSignature",
  "rowPinSide",
  "rowPinOffset",
  "sourceIndex",
  "reorderPinned",
  "labels",
  "onRowClick",
  "prefetch",
  "className",
  "rowStyleSignature",
  "measureElement",
  "pinSignature",
  "editingSignature",
  // Or a folder opens and its own chevron never turns.
  "treeEntry",
  "treeColumnKey",
];

/**
 * Row memo comparator: `Object.is` over every prop except the per-render
 * style derivations excluded above. All event handlers passed to the row
 * are identity-stable (or compared here, so a changed handler re-renders
 * the row and is captured fresh) — a held row can never fire a stale
 * closure.
 */
function desktopRowPropsEqual<TRow>(
  prev: Readonly<DesktopRowProps<TRow>>,
  next: Readonly<DesktopRowProps<TRow>>
): boolean {
  return COMPARED_ROW_PROPS.every((key) => Object.is(prev[key], next[key]));
}

/**
 * Sticky style for a leading chrome cell (chevron / checkbox) pinned
 * `inset` px past the inline-start edge, active only while a data column is
 * pinned on that side. Body cells pass a `background` so scrolled data
 * never shows through.
 */
function leadingPinStyle(
  active: boolean,
  inset: number,
  zIndex: number,
  background?: string
): CSSProperties | undefined {
  if (!active) return undefined;
  const style = pinnedCellStyle({ side: "start", inset }, zIndex);
  return background ? { ...style, background } : style;
}

/**
 * Visual fingerprint of the pin layout (sides, insets, edge-pinned chrome
 * columns). Memoized rows compare this one string instead of the per-render
 * style objects derived from it.
 */
function pinLayoutSignature<TRow>(
  columns: readonly ColumnDef<TRow>[],
  pinOffset: SharedTableRenderProps<TRow>["pinOffset"],
  hasStartPin: boolean,
  actionsEdgePinned: boolean
): string {
  const perColumn = columns.map((column) => {
    const pin = pinOffset?.(column.key);
    return pin ? `${column.key}:${pin.side}${pin.inset}` : column.key;
  });
  return `${perColumn.join("|")}|${String(hasStartPin)}|${String(actionsEdgePinned)}`;
}

/**
 * One desktop row (plus its detail row when expanded), extracted so it can
 * be memoized: typing in the search box or toggling another row's checkbox
 * re-renders the table chrome but leaves untouched rows alone.
 */
function DesktopRowBase<TRow>({
  row,
  index,
  id,
  columns,
  bodyCells,
  getCellProps,
  gridFocus,
  selected,
  selectLabel,
  onToggleSelect,
  expanded,
  expandLabel,
  collapseLabel,
  onToggleExpand,
  renderRowDetail,
  columnSpan,
  columnSpacers,
  rowActions,
  confirm,
  cancelLabel,
  editLabel,
  undoLabel,
  showReorder,
  rowReorder,
  rowPinSide,
  rowPinOffset,
  sourceIndex,
  windowStart,
  rowCount,
  labels,
  onRowClick,
  prefetch,
  className,
  rowVisualStyle,
  measureElement,
  measureRowPair,
  pinStyleFor,
  selectionCellStyle,
  expansionCellStyle,
  reorderCellStyle,
  actionsCellStyle,
  editing,
  rows,
  getRowId,
  treeEntry,
  treeColumnKey: treeKey,
  onToggleTree,
  editRowLabel,
  saveRowLabel,
}: Readonly<DesktopRowProps<TRow>>) {
  // The trailing control column also carries row mode's save / cancel.
  const showActions =
    (rowActions?.length ?? 0) > 0 || editing?.rowEditing !== undefined;
  const edgeRowPin = pinnedRowCellStyle(rowPinSide, rowPinOffset, true);
  const focusIndex = sourceIndex;
  const bodyPinStyle = (key: string): CSSProperties | undefined => {
    const column = pinStyleFor(key);
    const rowPin = pinnedRowCellStyle(
      rowPinSide,
      rowPinOffset,
      column !== undefined
    );
    if (!column && !rowPin.position) return undefined;
    return { ...column, ...rowPin };
  };
  let rowMeasureRef: typeof measureElement | undefined;
  if (!rowPinSide) {
    rowMeasureRef = measureRowPair ? measureRowPair.row(index) : measureElement;
  }
  return (
    <>
      <Table.Tr
        role="row"
        data-index={index}
        data-row-pin={rowPinSide}
        {...gridFocus?.getRowPropsAt(focusIndex)}
        aria-selected={selected}
        {...rowClickProps(row, onRowClick, focusIndex)}
        {...(rowReorder?.dropProps(index, row, windowStart) ?? {})}
        {...(rowReorder?.rowAttrs(id, index) ?? {})}
        className={className}
        style={{
          ...rowVisualStyle,
          ...rowReorderDropStyle(rowReorder?.rowAttrs(id, index)),
        }}
        ref={rowMeasureRef}
        data-stagger=""
        data-dirty={rowIsDirty(editing, id) ? "" : undefined}
        onMouseEnter={prefetch ? () => prefetch(row) : undefined}
      >
        {expanded !== undefined && (
          <Table.Td
            ta="center"
            style={{ ...expansionCellStyle, ...edgeRowPin }}
          >
            <ExpandToggle
              expanded={expanded}
              expandLabel={expandLabel}
              collapseLabel={collapseLabel}
              onToggle={() => onToggleExpand!(id)}
            />
          </Table.Td>
        )}
        {showReorder && rowReorder && (
          <Table.Td
            data-adapttable-part="reorder-cell"
            ta="center"
            style={{ ...reorderCellStyle, ...edgeRowPin }}
          >
            <RowReorderHandle
              reorder={rowReorder}
              labels={labels}
              rowId={id}
              localIndex={index}
              row={row}
              windowStart={windowStart}
              rowCount={rowCount}
            />
          </Table.Td>
        )}
        {selected !== undefined && (
          <Table.Td
            ta="center"
            style={{ ...selectionCellStyle, ...edgeRowPin }}
          >
            <Checkbox
              aria-label={selectLabel}
              checked={selected}
              onChange={() => onToggleSelect(id)}
            />
          </Table.Td>
        )}
        {columnSpacers && (
          <ColumnSpacer width={columnSpacers.start} side="start" />
        )}
        {bodyCells.map((cell) => {
          const { column, columnIndex, colSpan, rowSpan } = cell;
          const focusProps = gridFocus?.getCellPropsAt(focusIndex, columnIndex);
          return (
            <Table.Td
              key={column.key}
              colSpan={colSpan > 1 ? colSpan : undefined}
              rowSpan={rowSpan > 1 ? rowSpan : undefined}
              data-column-key={column.key}
              data-adapttable-part="cell"
              {...getCellProps(column)}
              {...focusProps}
              style={
                // A selected cell takes Mantine's own primary-light fill, applied
                // OVER the pinned background so a pinned column still shows the
                // selection rather than hiding it behind its opaque surface.
                cellHighlightStyle(focusProps, bodyPinStyle(column.key), {
                  background: "var(--mantine-primary-color-light)",
                })
              }
            >
              <TreeCell
                entry={treeEntry}
                columnKey={column.key}
                treeColumnKey={treeKey}
                labels={{ expandRow: expandLabel, collapseRow: collapseLabel }}
                onToggle={onToggleTree}
              >
                <EditableDataCell
                  editing={editing}
                  row={row}
                  column={column}
                  rowId={id}
                  rows={rows}
                  columns={columns}
                  rowKey={getRowId}
                  editLabel={editLabel}
                  undoLabel={undoLabel}
                  display={
                    column.Cell ? (
                      <column.Cell row={row} rowIndex={focusIndex} />
                    ) : (
                      column.accessor?.(row)
                    )
                  }
                />
              </TreeCell>
              <FillHandle
                focus={gridFocus}
                windowIndex={focusIndex}
                col={columnIndex}
              />
            </Table.Td>
          );
        })}
        {columnSpacers && <ColumnSpacer width={columnSpacers.end} side="end" />}
        {showActions && (
          <Table.Td ta="end" style={{ ...actionsCellStyle, ...edgeRowPin }}>
            {editing?.rowEditing && (
              <RowEditActions
                rowEditing={editing.rowEditing}
                row={row}
                rowId={id}
                labels={{
                  editRow: editRowLabel,
                  saveRow: saveRowLabel,
                  cancel: cancelLabel,
                }}
              />
            )}
            {/* The control column also exists for row mode alone, so this is
                not the same question as `showActions`. */}
            {rowActions && rowActions.length > 0 && (
              <RowActions
                row={row}
                actions={rowActions}
                confirm={confirm}
                cancelLabel={cancelLabel}
              />
            )}
          </Table.Td>
        )}
      </Table.Tr>
      {expanded === true && (
        <Table.Tr>
          <Table.Td colSpan={columnSpan}>{renderRowDetail!(row)}</Table.Td>
        </Table.Tr>
      )}
    </>
  );
}

/** Desktop table rendering driven by core prop-getters. */
export function DesktopTable<TRow>({
  gridFocus,
  table,
  rows,
  rowActions,
  confirm,
  prefetch,
  onRowClick,
  rowClassName,
  collapsibleColumnGroups,
  collapsedColumnGroups,
  onToggleColumnGroup,
  rowStyle,
  rowHeight,
  renderRowDetail,
  summaryRow,
  expansion,
  editing,
  grouping,
  getRowId,
  bodyRef,
  className,
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
  measureRowPair,
  stickyHeaderOffset = 0,
  stickyHeader = false,
  pinOffset,
  maxHeight,
  virtualScrollRef,
  setWidth,
  columnWidths,
  resizeLabel = "Resize column",
  actionsPinned = false,
  reorderPinned = false,
  rowReorder,
  windowStart = 0,
  pinnedTopRows = [],
  pinnedBottomRows = [],
  rowPinning,
  density = "comfortable",
  columnWindow,
  fitColumns,
  tree,
  extraRows,
  getCellSpan,
}: Readonly<DesktopTableProps<TRow>>) {
  // The shared render prelude from core — including `columnSpan` for the
  // spacer/detail cells, which counts the expansion column itself when
  // `renderRowDetail` + `expansion` are wired.
  const {
    columns,
    selection,
    labels,
    showActions,
    showReorder,
    leadingCells,
    entries,
    columnSpan,
    columnSpacers,
    cellsByRow,
  } = tableRenderModel({
    table,
    rows,
    columnWindow,
    rowActions,
    getRowId,
    rowEntries,
    renderRowDetail,
    expansion,
    editing,
    rowReorder,
    pinnedTopRows,
    pinnedBottomRows,
    getCellSpan,
    pinOffset,
    tree,
  });
  const [theadRef, headerHeight] = useOffsetHeight();
  // Expansion state only exists when `renderRowDetail` is set (the chrome
  // couples them), so its presence alone decides the leading chevron column.
  const expandable = expansion !== undefined;
  // Grouped header row over the VISIBLE columns (`null` → no extra row) and
  // the per-column footer summary cells (`undefined` → no footer).
  const groupRows = headerGroupRows(
    columns,
    collapsedColumnGroups,
    collapsibleColumnGroups
  );
  const summaryCells = useSummaryCells(summaryRow, rows);
  const hasEndPin = table.columns.some(
    (c) => pinOffset?.(c.key)?.side === "end"
  );
  // The actions column sticks to the inline end either because a data column
  // is pinned right (it must stay outermost past it) or because the user
  // pinned the actions column itself — one click, no data column involved.
  const actionsEdgePinned = showActions && (hasEndPin || actionsPinned);
  const hasPinned = isPinnedTable(
    table.columns.some((c) => pinOffset?.(c.key) != null),
    actionsEdgePinned,
    showReorder,
    reorderPinned
  );
  // Pinning needs horizontal scroll, and a `maxHeight` needs vertical scroll;
  // either makes the wrapper a scroll container (setting one overflow axis to
  // `auto` computes the other to `auto` too). Inside that container the page
  // toolbar is irrelevant, so the sticky header sticks to the box top (0).
  // Only against the document scroller must it clear the toolbar via
  // `stickyHeaderOffset`.
  // Without a `maxHeight`, the wrapper becomes a horizontal scroller only
  // when it must: pinned columns always need one, otherwise only while the
  // table is measurably wider than the wrapper (so wide tables scroll instead
  // of bleeding over the card border). When the table fits, the wrapper stays
  // a NON-scroll container — any `overflow` would trap the page-scroll sticky
  // header inside it.
  const { ref: wrapperRef, overflowing } =
    useHorizontalOverflow<HTMLDivElement>();
  const inScrollBox = maxHeight != null || hasPinned || overflowing;
  const headerPinTop = inScrollBox ? 0 : stickyHeaderOffset;
  const rowPinOffset = stickyHeader ? headerPinTop + headerHeight : 0;
  // `position: sticky` on `<thead>` does not engage against the document
  // scroller (only inside an overflow container) — so we stick the header
  // *cells* instead. Each th carries its own opaque background so scrolled
  // rows never show through.
  const headerCellStyle: CSSProperties = stickyHeader
    ? {
        position: "sticky",
        top: inScrollBox ? 0 : stickyHeaderOffset,
        zIndex: PIN_Z.header,
        background: SURFACE,
        boxShadow: `0 1px 0 ${HAIRLINE}`,
      }
    : { background: SURFACE };

  // The leading chevron (36px) + checkbox (40px) and trailing actions
  // (120px) columns pin to the edge alongside the data columns, which
  // therefore start past them.
  const expansionWidth = 36;
  const selectionWidth = 40;
  const actionsWidth = 120;
  const { expansionLead, reorderLead, leads } = startLeads(
    expandable,
    showReorder,
    Boolean(selection),
    showActions,
    expansionWidth,
    selectionWidth,
    actionsWidth
  );
  const hasStartPin = table.columns.some(
    (c) => pinOffset?.(c.key)?.side === "start"
  );

  // Pinned cells stick to the left/right edge (corner-sticky in the header,
  // which also sticks to the top). They need an opaque background.
  const pinBg = SURFACE;
  const headerStyleFor = (column: ColumnDef<TRow>): CSSProperties => {
    const key = column.key;
    const pin = pinnedCellStyle(pinOffset?.(key), PIN_Z.headerPinned, leads);
    // A pinned column renders at the same width its sticky inset assumed, so
    // stacked pins stay flush even with no declared width. Written only when
    // there IS one: an explicit `width: undefined` spread over core's computed
    // size would erase it.
    const width = pin
      ? pinnedColumnWidth(column, columnWidths)
      : columnWidths?.[key];
    const merged: CSSProperties = {
      ...headerCellStyle,
      ...pin,
      ...(width == null ? {} : { width }),
    };
    if (setWidth && !merged.position) merged.position = "relative";
    return merged;
  };
  // The chevron / checkbox / actions cells become corner-sticky (top + edge
  // in the header, edge in the body) when a data column on their side is
  // pinned. The checkbox column sits AFTER the chevron column, so its edge
  // inset starts past the chevron's width.
  const expansionHeaderStyle: CSSProperties = {
    ...headerCellStyle,
    ...leadingPinStyle(hasStartPin, 0, PIN_Z.headerPinned),
  };
  const reorderHeaderStyle: CSSProperties = {
    ...headerCellStyle,
    ...leadingPinStyle(
      hasStartPin || reorderPinned,
      expansionLead,
      PIN_Z.headerPinned
    ),
  };
  const selectionHeaderStyle: CSSProperties = {
    ...headerCellStyle,
    ...leadingPinStyle(
      hasStartPin,
      expansionLead + reorderLead,
      PIN_Z.headerPinned
    ),
  };
  const actionsHeaderStyle: CSSProperties = {
    ...headerCellStyle,
    ...edgePinStyle("end", actionsEdgePinned, PIN_Z.headerPinned),
  };
  const edgeBodyStyle = (
    side: "start" | "end",
    active: boolean
  ): CSSProperties | undefined => {
    const pin = edgePinStyle(side, active, PIN_Z.body);
    return pin ? { ...pin, background: pinBg } : undefined;
  };
  const columnName = (column: ColumnDef<TRow>): string =>
    typeof column.header === "string" ? column.header : column.key;
  const resizeHandleFor = (column: ColumnDef<TRow>): ReactNode =>
    setWidth ? (
      <span
        {...columnResizeHandleProps(
          column.key,
          setWidth,
          `${resizeLabel}: ${columnName(column)}`
        )}
        style={RESIZE_HANDLE_STYLE}
      />
    ) : undefined;
  // Row separators, but drawn on the CELLS. A sticky header forces the table
  // into `border-collapse: separate` (below), and the separated model tells
  // the browser to ignore borders declared on a `<tr>` — which is exactly
  // where Mantine's `withRowBorders` puts them, so every row divider silently
  // disappears. Mantine solves the same problem for its own sticky mode by
  // shadowing the cell; we do the same here. Collapsed tables keep the row's
  // real border, so this must stay off in that path or every line doubles.
  const rowSeparator: CSSProperties | undefined = stickyHeader
    ? { boxShadow: `inset 0 -1px 0 ${HAIRLINE}` }
    : undefined;
  // A pinned cell already carries a `boxShadow`; merging blindly would drop
  // one of the two, so compose them into a single value.
  const withRowSeparator = (
    style: CSSProperties | undefined
  ): CSSProperties | undefined => {
    if (!rowSeparator) return style;
    if (!style) return rowSeparator;
    return {
      ...style,
      boxShadow: style.boxShadow
        ? `${String(style.boxShadow)}, ${String(rowSeparator.boxShadow)}`
        : rowSeparator.boxShadow,
    };
  };
  const bodyPinStyle = (key: string): CSSProperties | undefined => {
    const pin = pinnedCellStyle(pinOffset?.(key), PIN_Z.body, leads);
    return withRowSeparator(pin ? { ...pin, background: pinBg } : undefined);
  };
  const expansionCellStyle = withRowSeparator(
    leadingPinStyle(hasStartPin, 0, PIN_Z.body, pinBg)
  );
  const reorderCellStyle = withRowSeparator(
    leadingPinStyle(
      hasStartPin || reorderPinned,
      expansionLead,
      PIN_Z.body,
      pinBg
    )
  );
  const selectionCellStyle = withRowSeparator(
    leadingPinStyle(hasStartPin, expansionLead + reorderLead, PIN_Z.body, pinBg)
  );
  const actionsCellStyle = withRowSeparator(
    edgeBodyStyle("end", actionsEdgePinned)
  );

  const { verticalSpacing, horizontalSpacing } = DENSITY_SPACING[density];

  // Fixed-width columns get a real table min-width (their sum), so the table
  // overflows and scrolls horizontally instead of squishing columns to fit.
  const minWidth = tableMinWidth(columns, {
    widths: columnWidths,
    extra:
      expansionLead +
      reorderLead +
      (selection ? 40 : 0) +
      (showActions ? 120 : 0),
  });

  // Latest-ref select toggle: the controlled selection mode rebuilds
  // `selection.toggle` around the current ids on every change, so memoized
  // rows hold this FIXED identity that always dispatches to the live one.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const groupingRef = useRef(grouping);
  groupingRef.current = grouping;
  const toggleSelect = useCallback(
    (id: string) => selectionRef.current!.toggle(id),
    []
  );
  const onToggleGroup = useCallback(
    (groupKey: string) => groupingRef.current?.collapsed.toggle(groupKey),
    []
  );

  // `memo` erases generics at module level, so the memoized row is
  // instantiated here (once — the identity is stable for the table's life).
  const Row = useMemo(
    () => memo(DesktopRowBase<TRow>, desktopRowPropsEqual),
    []
  );

  const pinSignature = pinLayoutSignature(
    columns,
    pinOffset,
    hasStartPin,
    actionsEdgePinned
  );
  const renderPinnedRow = (row: TRow, side: RowPinSide) => {
    const id = getRowId(row);
    const found = rows.findIndex((item) => getRowId(item) === id);
    const sourceIndex = found < 0 ? 0 : found;
    return (
      <Row
        key={id}
        row={row}
        index={sourceIndex}
        id={id}
        columns={columns}
        bodyCells={cellsForRow(cellsByRow, id)}
        spanSignature={rowSpanSignature(cellsForRow(cellsByRow, id))}
        getCellProps={table.getCellProps}
        gridFocus={gridFocus}
        selected={selection?.isSelected(id)}
        selectLabel={labels.selectRow}
        onToggleSelect={toggleSelect}
        expanded={expansion?.isExpanded(id)}
        expandLabel={labels.expandRow}
        collapseLabel={labels.collapseRow}
        onToggleExpand={expansion?.toggle}
        renderRowDetail={renderRowDetail}
        columnSpan={columnSpan}
        columnSpacers={columnSpacers}
        rowActions={rowActions}
        confirm={confirm}
        cancelLabel={labels.cancel}
        editRowLabel={labels.editRow}
        saveRowLabel={labels.saveRow}
        editLabel={labels.editCell}
        undoLabel={labels.undoEdit}
        showReorder={showReorder}
        rowReorder={rowReorder}
        windowStart={windowStart}
        rowCount={rows.length}
        reorderPinned={reorderPinned}
        reorderSignature={rowReorderSignature(rowReorder, id, sourceIndex)}
        rowPinSide={side}
        rowPinOffset={rowPinOffset}
        rowPinSignature={rowPinSignature(rowPinning, id)}
        sourceIndex={sourceIndex}
        labels={labels}
        onRowClick={onRowClick}
        prefetch={prefetch}
        className={rowClassName?.(row, sourceIndex)}
        rowVisualStyle={resolveRowStyle(rowStyle, rowHeight, row, sourceIndex)}
        rowStyleSignature={rowStyleSignature(
          resolveRowStyle(rowStyle, rowHeight, row, sourceIndex)
        )}
        pinStyleFor={bodyPinStyle}
        selectionCellStyle={selectionCellStyle}
        expansionCellStyle={expansionCellStyle}
        reorderCellStyle={reorderCellStyle}
        actionsCellStyle={actionsCellStyle}
        pinSignature={pinSignature}
        editing={editing}
        rows={rows}
        getRowId={getRowId}
        editingSignature={rowEditingSignature(editing, id)}
      />
    );
  };
  const wrapperStyle: CSSProperties =
    maxHeight == null
      ? {
          width: "100%",
          ...(hasPinned || overflowing ? { overflowX: "auto" } : {}),
        }
      : { width: "100%", maxHeight, overflow: "auto" };

  return (
    <div
      ref={(node) => {
        wrapperRef(node);
        virtualScrollRef?.(node);
      }}
      style={wrapperStyle}
    >
      <Table
        {...table.getTableProps()}
        {...gridFocus?.getGridProps()}
        className={className}
        highlightOnHover
        verticalSpacing={verticalSpacing}
        horizontalSpacing={horizontalSpacing}
        miw={Math.max(480, minWidth)}
        // Chromium cannot stick a <th
        // <thead> inside a border-collapsed table, so
        // the sticky header opts into separate borders. That model ignores
        // borders on a <tr>, which is where the row dividers live — so the
        // sticky path draws them on the cells instead (`rowSeparator` above).
        style={{
          ...(stickyHeader
            ? { borderCollapse: "separate" as const, borderSpacing: 0 }
            : {}),
          ...fittedTableStyle(fitColumns),
        }}
      >
        <Table.Thead ref={theadRef} style={{ background: SURFACE }}>
          {groupRows?.map((groups, rowIndex) => (
            <Table.Tr key={rowIndex}>
              {expandable && <Table.Th />}
              <When show={showReorder}>
                <Table.Th />
              </When>
              {selection && <Table.Th />}
              {groups.map((cell) => (
                <Table.Th
                  key={cell.key}
                  colSpan={cell.span}
                  ta="center"
                  fw={600}
                  style={{
                    borderBottom: `1px solid ${HAIRLINE}`,
                  }}
                >
                  {onToggleColumnGroup ? (
                    <ColumnGroupToggle
                      cell={cell}
                      labels={labels}
                      onToggle={onToggleColumnGroup}
                    />
                  ) : null}
                  {cell.label}
                </Table.Th>
              ))}
              {showActions && <Table.Th />}
            </Table.Tr>
          ))}
          <Table.Tr {...table.getHeaderRowProps()}>
            {expandable && (
              <Table.Th
                w={expansionWidth}
                ta="center"
                style={expansionHeaderStyle}
              >
                <VisuallyHidden>{labels.expandRow}</VisuallyHidden>
              </Table.Th>
            )}
            <When show={showReorder}>
              <Table.Th
                w={REORDER_COLUMN_WIDTH}
                ta="center"
                aria-label={labels.reorderRow}
                data-adapttable-part="reorder-header"
                style={reorderHeaderStyle}
              />
            </When>
            {selection && (
              <Table.Th
                w={selectionWidth}
                ta="center"
                style={selectionHeaderStyle}
              >
                <Checkbox
                  aria-label={labels.selectAll}
                  checked={selection.headerState === "all"}
                  indeterminate={selection.headerState === "some"}
                  onChange={selection.toggleAll}
                />
              </Table.Th>
            )}
            {columns.map((column, headerIndex) => (
              <HeaderCell
                key={column.key}
                table={table}
                column={column}
                stickyStyle={headerStyleFor(column)}
                resizeHandle={resizeHandleFor(column)}
                columnProps={gridFocus?.getColumnHeaderProps(headerIndex, {
                  sortable: column.sortable,
                })}
              />
            ))}
            {showActions && (
              <Table.Th ta="end" w={actionsWidth} style={actionsHeaderStyle}>
                {labels.actions}
              </Table.Th>
            )}
          </Table.Tr>
        </Table.Thead>
        {pinnedTopRows.length > 0 && (
          <Table.Tbody
            data-adapttable-part={PINNED_TOP_PART}
            style={pinnedRowStickyStyle("top", rowPinOffset)}
          >
            {pinnedTopRows.map((row) => renderPinnedRow(row, "top"))}
          </Table.Tbody>
        )}
        <Table.Tbody ref={bodyRef} data-adapttable-part="tbody">
          {paddingTop > 0 && (
            <Table.Tr aria-hidden>
              <Table.Td
                colSpan={columnSpan}
                style={{ height: paddingTop, padding: 0 }}
              />
            </Table.Tr>
          )}
          {grouping
            ? grouping.entries.map((entry) => {
                if (entry.kind === "separator" || entry.kind === "fullWidth") {
                  return (
                    <ExtraSlotRow
                      key={entry.key}
                      kind={entry.kind}
                      colSpan={columnSpan}
                      render={
                        entry.kind === "fullWidth" ? entry.render : undefined
                      }
                      labels={labels}
                    />
                  );
                }
                if (
                  entry.kind === "group" ||
                  entry.kind === "groupFooter" ||
                  entry.kind === "groupMore"
                ) {
                  return (
                    <GroupHeaderRow
                      key={entry.key}
                      entry={entry}
                      columns={columns}
                      leadingCells={leadingCells}
                      showActions={showActions}
                      getCellProps={table.getCellProps}
                      selection={selection}
                      labels={labels}
                      onToggleCollapse={onToggleGroup}
                      onShowMore={grouping.showMore}
                    />
                  );
                }
                const id = getRowId(entry.row);
                return (
                  <Row
                    key={entry.key}
                    row={entry.row}
                    index={entry.index}
                    id={id}
                    columns={columns}
                    bodyCells={cellsForRow(cellsByRow, id)}
                    spanSignature={rowSpanSignature(
                      cellsForRow(cellsByRow, id)
                    )}
                    getCellProps={table.getCellProps}
                    gridFocus={gridFocus}
                    selected={selection?.isSelected(id)}
                    selectLabel={labels.selectRow}
                    onToggleSelect={toggleSelect}
                    expanded={expansion?.isExpanded(id)}
                    expandLabel={labels.expandRow}
                    collapseLabel={labels.collapseRow}
                    onToggleExpand={expansion?.toggle}
                    renderRowDetail={renderRowDetail}
                    columnSpan={columnSpan}
                    columnSpacers={columnSpacers}
                    rowActions={rowActions}
                    confirm={confirm}
                    cancelLabel={labels.cancel}
                    editRowLabel={labels.editRow}
                    saveRowLabel={labels.saveRow}
                    editLabel={labels.editCell}
                    undoLabel={labels.undoEdit}
                    showReorder={showReorder}
                    rowReorder={rowReorder}
                    windowStart={windowStart}
                    rowCount={rows.length}
                    reorderPinned={reorderPinned}
                    reorderSignature={rowReorderSignature(
                      rowReorder,
                      id,
                      entry.index
                    )}
                    rowPinSide={undefined}
                    rowPinOffset={rowPinOffset}
                    rowPinSignature={rowPinSignature(rowPinning, id)}
                    sourceIndex={entry.index}
                    labels={labels}
                    onRowClick={onRowClick}
                    prefetch={prefetch}
                    className={rowClassName?.(entry.row, entry.index)}
                    rowVisualStyle={resolveRowStyle(
                      rowStyle,
                      rowHeight,
                      entry.row,
                      entry.index
                    )}
                    rowStyleSignature={rowStyleSignature(
                      resolveRowStyle(
                        rowStyle,
                        rowHeight,
                        entry.row,
                        entry.index
                      )
                    )}
                    measureElement={measureElement}
                    measureRowPair={measureRowPair}
                    pinStyleFor={bodyPinStyle}
                    selectionCellStyle={selectionCellStyle}
                    expansionCellStyle={expansionCellStyle}
                    reorderCellStyle={reorderCellStyle}
                    actionsCellStyle={actionsCellStyle}
                    pinSignature={pinSignature}
                    editing={editing}
                    rows={rows}
                    getRowId={getRowId}
                    editingSignature={rowEditingSignature(editing, id)}
                  />
                );
              })
            : // A tree renders its own flattened entries; a flat table renders the
              // (possibly windowed) rows. Both carry a row and a key.
              insertExtraRows(
                bodyRowEntries(entries, tree),
                extraRows,
                (e) => e.key
              ).map((slot) => {
                if ("kind" in slot) {
                  return (
                    <ExtraSlotRow
                      key={slot.key}
                      kind={slot.kind}
                      colSpan={columnSpan}
                      render={
                        slot.kind === "fullWidth" ? slot.render : undefined
                      }
                      labels={labels}
                    />
                  );
                }
                const { row, index, key, treeEntry, sourceIndex } = slot;
                const id = getRowId(row);
                const focusIndex = sourceIndex ?? index;
                return (
                  <Row
                    key={key}
                    row={row}
                    index={index}
                    id={id}
                    columns={columns}
                    bodyCells={cellsForRow(cellsByRow, id)}
                    spanSignature={rowSpanSignature(
                      cellsForRow(cellsByRow, id)
                    )}
                    getCellProps={table.getCellProps}
                    gridFocus={gridFocus}
                    selected={selection?.isSelected(id)}
                    selectLabel={labels.selectRow}
                    onToggleSelect={toggleSelect}
                    expanded={expansion?.isExpanded(id)}
                    expandLabel={labels.expandRow}
                    collapseLabel={labels.collapseRow}
                    onToggleExpand={expansion?.toggle}
                    renderRowDetail={renderRowDetail}
                    columnSpan={columnSpan}
                    columnSpacers={columnSpacers}
                    rowActions={rowActions}
                    confirm={confirm}
                    cancelLabel={labels.cancel}
                    editRowLabel={labels.editRow}
                    saveRowLabel={labels.saveRow}
                    editLabel={labels.editCell}
                    undoLabel={labels.undoEdit}
                    showReorder={showReorder}
                    rowReorder={rowReorder}
                    windowStart={windowStart}
                    rowCount={rows.length}
                    reorderPinned={reorderPinned}
                    reorderSignature={rowReorderSignature(
                      rowReorder,
                      id,
                      index
                    )}
                    rowPinSide={undefined}
                    rowPinOffset={rowPinOffset}
                    rowPinSignature={rowPinSignature(rowPinning, id)}
                    sourceIndex={focusIndex}
                    labels={labels}
                    onRowClick={onRowClick}
                    prefetch={prefetch}
                    className={rowClassName?.(row, focusIndex)}
                    rowVisualStyle={resolveRowStyle(
                      rowStyle,
                      rowHeight,
                      row,
                      focusIndex
                    )}
                    rowStyleSignature={rowStyleSignature(
                      resolveRowStyle(rowStyle, rowHeight, row, focusIndex)
                    )}
                    measureElement={measureElement}
                    measureRowPair={measureRowPair}
                    pinStyleFor={bodyPinStyle}
                    selectionCellStyle={selectionCellStyle}
                    expansionCellStyle={expansionCellStyle}
                    reorderCellStyle={reorderCellStyle}
                    actionsCellStyle={actionsCellStyle}
                    pinSignature={pinSignature}
                    editing={editing}
                    rows={rows}
                    getRowId={getRowId}
                    treeEntry={treeEntry}
                    treeColumnKey={tree?.columnKey}
                    onToggleTree={tree?.expansion.toggle}
                    editingSignature={rowEditingSignature(editing, id)}
                  />
                );
              })}
          {paddingBottom > 0 && (
            <Table.Tr aria-hidden>
              <Table.Td
                colSpan={columnSpan}
                style={{ height: paddingBottom, padding: 0 }}
              />
            </Table.Tr>
          )}
        </Table.Tbody>
        {pinnedBottomRows.length > 0 && (
          <Table.Tbody
            data-adapttable-part={PINNED_BOTTOM_PART}
            style={pinnedRowStickyStyle("bottom", 0)}
          >
            {pinnedBottomRows.map((row) => renderPinnedRow(row, "bottom"))}
          </Table.Tbody>
        )}
        {summaryCells && (
          <Table.Tfoot>
            <Table.Tr>
              {expandable && <Table.Td />}
              <When show={showReorder}>
                <Table.Td />
              </When>
              {selection && <Table.Td />}
              {columns.map((column) => (
                <Table.Td
                  key={column.key}
                  {...table.getCellProps(column)}
                  fw={600}
                  c="dimmed"
                >
                  {summaryCells[column.key]}
                </Table.Td>
              ))}
              {showActions && <Table.Td />}
            </Table.Tr>
          </Table.Tfoot>
        )}
      </Table>
    </div>
  );
}
