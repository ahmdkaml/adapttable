/** The desktop `<table>`: header, pinned columns, rows and summary. */
import {
  bodyRowEntries,
  type ColumnDef,
  columnResizeHandleProps,
  type ConfirmHandler,
  type Direction,
  type EditableCellEditing,
  type GridFocusState,
  PIN_Z,
  type PinSide,
  type RowAction,
  type RowExpansionState,
  type RowPinSide,
  type SelectionState,
  type TableLabels,
  tableMinWidth,
  type TreeEntry,
  useHorizontalOverflow,
} from "@adapttable/core";
import {
  type BodyCell,
  cellHighlightStyle,
  cellsForRow,
  columnFlexShares,
  columnSizeStyle,
  ColumnSpacer,
  FillHandle,
  fittedTableStyle,
  headerGroupRow,
  logicalAlign,
  type PinLeads,
  PINNED_BOTTOM_PART,
  PINNED_TOP_PART,
  pinnedColumnWidth,
  pinnedDataCellStyle,
  pinnedEdgeCellStyle,
  pinnedRowCellStyle,
  pinnedRowStickyStyle,
  type PinOffset,
  REORDER_COLUMN_WIDTH,
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
  shallowEqualByKeys,
  SHARED_DESKTOP_ROW_KEYS,
  type SharedTableRenderProps,
  sortArrow,
  tableRenderModel,
  TreeCell,
  useOffsetHeight,
  useSummaryCells,
} from "@adapttable/core/adapter";
import {
  type CSSProperties,
  memo,
  type ReactNode,
  type RefObject,
  useCallback,
  useMemo,
  useRef,
} from "react";

import type { BaseUiAccentColor } from "../types";
import { Box, Table, Text } from "../ui";
import { EditableDataCell } from "./EditableCell";
import { ExpandToggle } from "./ExpandToggle";
import { GroupHeaderRow } from "./GroupHeader";
import { Checkbox } from "./primitives";
import { RowActionButtons } from "./RowActionButtons";

type TableSize = "1" | "2" | "3";

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

/** Width (px) reserved for the leading expand-chevron column. */
const EXPANSION_WIDTH = 32;
const SELECTION_WIDTH = 48;
const ACTIONS_WIDTH = 120;

function When({
  show,
  children,
}: Readonly<{ show: boolean; children: ReactNode }>) {
  if (!show) return null;
  return children;
}

function pinChrome(
  expandable: boolean,
  showReorder: boolean,
  hasSelection: boolean,
  showActions: boolean,
  actionsPinned: boolean,
  reorderPinned: boolean,
  columns: readonly { key: string }[],
  pinOffset?: (key: string) => unknown
): {
  hasPinned: boolean;
  leads: PinLeads;
  extraMinWidth: number;
  expand: number;
  selectionLead: number;
  reorderSig: string;
} {
  const expand = expandable ? EXPANSION_WIDTH : 0;
  const reorder = showReorder ? REORDER_COLUMN_WIDTH : 0;
  const select = hasSelection ? SELECTION_WIDTH : 0;
  const actions = showActions ? ACTIONS_WIDTH : 0;
  return {
    hasPinned:
      actionsPinned ||
      (showReorder && reorderPinned) ||
      columns.some((c) => pinOffset?.(c.key) != null),
    leads: { start: expand + reorder + select, end: actions },
    extraMinWidth: expand + reorder + select + actions,
    expand,
    selectionLead: expand + reorder,
    reorderSig: showReorder && reorderPinned ? "reorder:start" : "",
  };
}

/** Opaque background for sticky/pinned cells (the panel surface). */
const PIN_BG = "var(--adapttable-surface, #ffffff)";

/**
 * Ensure pinned columns stick against our scroll wrapper via a min-width
 * custom property on the wrapper.
 */
const STICKY_FIX_CLASS = "adapttable-base-ui-scroll";

const STICKY_FIX_CSS = `.${STICKY_FIX_CLASS} table{overflow:visible;min-width:var(--adapttable-min-width,0)}`;

export interface SharedProps<TRow> extends SharedTableRenderProps<TRow> {
  /** Class hook for the table (desktop) / each card (mobile). */
  className?: string;
  size: TableSize;
  accentColor?: BaseUiAccentColor;
  /** Text direction — flips the expand chevron for RTL. */
  dir?: Direction;
  /**
   * The injected actions column is end-pinned (via the Columns menu), so
   * its cells stick to the inline end even with zero data columns pinned.
   */
  actionsPinned?: boolean;
}

/** Map a column's alignment onto a cell `justify` value. */
const justifyFor = logicalAlign;

/**
 * Header sort indicator, derived from the cell's computed `aria-sort` so a
 * multi-sort chain level shows its own direction, not the single-sort one.
 * The trailing U+FE0E forces text (not emoji) presentation — Base UI's font
 * forces text (not emoji) presentation.
 */
const sortGlyph = (sort: unknown): string => sortArrow(sort) + "\uFE0E";

/**
 * Pinned data-cell style with an opaque background. A raw `style` keeps the
 * pixel insets the core layout computes from being mangled by any prop scale.
 */
const pinCellStyle = (pin: PinOffset | undefined, z: number, leads: PinLeads) =>
  pinnedDataCellStyle(pin, z, leads, PIN_BG);

/** Sticky edge-cell style (chevron / selection / actions) over that background. */
const edgeCellStyle = (side: PinSide, active: boolean, z: number, shift = 0) =>
  pinnedEdgeCellStyle(side, active, z, PIN_BG, shift);

/**
 * Everything a memoized desktop row reads through ONE identity-stable ref: the
 * latest callbacks and pin geometry. Routing them through the ref (read at
 * event/render time) keeps a changed callback identity from re-rendering every
 * row, without ever calling a stale closure.
 */
interface DesktopRowApi<TRow> {
  selection: SelectionState | null;
  expansion?: RowExpansionState;
  rowActions?: RowAction<TRow>[];
  confirm: ConfirmHandler;
  onRowClick?: (row: TRow) => void;
  prefetch?: (row: TRow) => void;
  renderRowDetail?: (row: TRow) => ReactNode;
  pinOffset?: (key: string) => PinOffset | undefined;
  measureElement?: (element: Element | null) => void;
  /** Measures a row together with its open detail panel. */
  measureRowPair?: RowPairMeasurer;
  leads: PinLeads;
  hasStartPin: boolean;
  /** Actions cells stick: a data column is right-pinned OR actions are end-pinned. */
  actionsStick: boolean;
  /** Headless reorder; uncompared — visual churn is `reorderSignature`. */
  rowReorder: SharedTableRenderProps<TRow>["rowReorder"];
  windowStart: number;
  rowCount: number;
  reorderPinned: boolean;
}

/** The visual inputs of one desktop row — exactly what the memo compares. */
interface DesktopRowProps<TRow> {
  row: TRow;
  id: string;
  index: number;
  /** Cell-navigation getters; inert unless `cellNavigation` is on. */
  gridFocus?: GridFocusState;
  selected: boolean;
  expanded: boolean;
  size: TableSize;
  accentColor?: BaseUiAccentColor;
  dir?: Direction;
  columns: readonly ColumnDef<TRow>[];
  /** This row's cells — covered neighbours already omitted. */
  bodyCells: readonly BodyCell<TRow>[];
  /** Memo digest from {@link rowSpanSignature}. */
  spanSignature: string;
  columnWidths?: Readonly<Record<string, number>>;
  /** Serialized pin geometry — stands in for the `pinOffset` closure. */
  pinSignature: string;
  /** The `rowClassName(row, index)` output, compared as a plain string. */
  className?: string;
  labels: Required<TableLabels>;
  hasSelection: boolean;
  expandable: boolean;
  showActions: boolean;
  showReorder: boolean;
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
  hasRowClick: boolean;
  /** Spacer/detail colSpan (selection + data + actions + expansion). */
  columnSpan: number;
  /** Widths holding open the columns outside the horizontal window. */
  columnSpacers?: { start: number; end: number };
  /** This row's place in the tree, when the table has one. */
  treeEntry?: TreeEntry<TRow>;
  /** Which column carries the chevron and the indent. */
  treeColumnKey?: string;
  /** Open or close a tree node. */
  onToggleTree?: (id: string) => void;
  /** Identity-stable ref to the latest callbacks — see {@link DesktopRowApi}. */
  api: RefObject<DesktopRowApi<TRow>>;
  /** Identity-stable ref-callback forwarding to the virtualizer's measure. */
  measureRef: (element: HTMLTableRowElement | null) => void;
  editing: EditableCellEditing<TRow> | undefined;
  rows: readonly TRow[];
  getRowId: (row: TRow) => string;
  editingSignature: string | null;
}

/**
 * The props {@link desktopRowPropsEqual} compares. `api` and `measureRef` are
 * deliberately absent: both are identity-stable by construction, and a row must
 * never re-render because some callback's identity changed.
 */
const ROW_VISUAL_KEYS = [
  ...SHARED_DESKTOP_ROW_KEYS,
  "accentColor",
  "editingSignature",
  "rowPinSide",
  "rowPinOffset",
  "sourceIndex",
] as const satisfies readonly (keyof DesktopRowProps<unknown>)[];

/** Re-render a row only when one of its visual inputs changes. */
function desktopRowPropsEqual<TRow>(
  prev: Readonly<DesktopRowProps<TRow>>,
  next: Readonly<DesktopRowProps<TRow>>
): boolean {
  return shallowEqualByKeys(ROW_VISUAL_KEYS, prev, next);
}

/** One desktop row (+ its detail panel row while expanded). */
function DesktopRowBase<TRow>({
  row,
  id,
  index,
  gridFocus,
  selected,
  expanded,
  accentColor,
  dir,
  columns,
  bodyCells,
  className,
  labels,
  hasSelection,
  expandable,
  showActions,
  showReorder,
  rowPinSide,
  rowPinOffset,
  sourceIndex,
  hasRowClick,
  columnSpan,
  columnSpacers,
  api,
  measureRef,
  editing,
  rows,
  getRowId,
  treeEntry,
  treeColumnKey: treeKey,
  onToggleTree,
}: Readonly<DesktopRowProps<TRow>>) {
  // Render-time geometry reads the latest ref values: whenever they change, a
  // compared prop (pinSignature / hasSelection / …) changes with them.
  const live = api.current;
  const activateRow = (r: TRow): void => {
    api.current.onRowClick?.(r);
  };
  const edgeRowPin = pinnedRowCellStyle(rowPinSide, rowPinOffset, true);
  const dataPinStyle = (key: string) => {
    const column = pinCellStyle(live.pinOffset?.(key), 1, live.leads);
    const rowPin = pinnedRowCellStyle(
      rowPinSide,
      rowPinOffset,
      column !== undefined
    );
    if (!column && !rowPin.position) return undefined;
    return { ...column, ...rowPin };
  };
  const focusIndex = sourceIndex;
  return (
    <>
      <Table.Row
        {...rowClickProps(
          row,
          hasRowClick ? activateRow : undefined,
          focusIndex
        )}
        {...(live.rowReorder?.dropProps(index, row, live.windowStart) ?? {})}
        {...(live.rowReorder?.rowAttrs(id, index) ?? {})}
        ref={rowPinSide ? undefined : measureRef}
        data-index={index}
        data-row-pin={rowPinSide}
        {...gridFocus?.getRowPropsAt(focusIndex)}
        data-stagger=""
        data-dirty={rowIsDirty(editing, id) ? "" : undefined}
        className={className}
        style={{
          background: selected ? "var(--gray-a3)" : undefined,
          ...rowReorderDropStyle(live.rowReorder?.rowAttrs(id, index)),
        }}
        onMouseEnter={() => api.current.prefetch?.(row)}
      >
        {expandable && (
          <Table.Cell
            style={{
              ...edgeCellStyle("start", live.hasStartPin, PIN_Z.body),
              ...edgeRowPin,
            }}
          >
            <ExpandToggle
              open={expanded}
              dir={dir}
              labels={labels}
              onToggle={() => api.current.expansion?.toggle(id)}
            />
          </Table.Cell>
        )}
        {showReorder && live.rowReorder && (
          <Table.Cell
            data-adapttable-part="reorder-cell"
            style={{
              ...edgeCellStyle(
                "start",
                live.hasStartPin || live.reorderPinned,
                PIN_Z.body,
                expandable ? EXPANSION_WIDTH : 0
              ),
              ...edgeRowPin,
            }}
          >
            <RowReorderHandle
              reorder={live.rowReorder}
              labels={labels}
              rowId={id}
              localIndex={index}
              row={row}
              windowStart={live.windowStart}
              rowCount={live.rowCount}
            />
          </Table.Cell>
        )}
        {hasSelection && (
          <Table.Cell
            style={{
              ...edgeCellStyle(
                "start",
                live.hasStartPin,
                PIN_Z.body,
                (expandable ? EXPANSION_WIDTH : 0) +
                  (showReorder ? REORDER_COLUMN_WIDTH : 0)
              ),
              ...edgeRowPin,
            }}
          >
            <Checkbox
              aria-label={labels.selectRow}
              checked={selected}
              onToggle={() => api.current.selection?.toggle(id)}
            />
          </Table.Cell>
        )}
        {columnSpacers && (
          <ColumnSpacer width={columnSpacers.start} side="start" />
        )}
        {bodyCells.map((cell) => {
          const { column, columnIndex, colSpan, rowSpan } = cell;
          const focusProps = gridFocus?.getCellPropsAt(focusIndex, columnIndex);
          return (
            <Table.Cell
              key={column.key}
              colSpan={colSpan > 1 ? colSpan : undefined}
              rowSpan={rowSpan > 1 ? rowSpan : undefined}
              data-column-key={column.key}
              data-adapttable-part="cell"
              {...focusProps}
              justify={justifyFor(column.align)}
              style={
                // This kit's own subtle fill for a selected cell, applied over the
                // pinned background so a pinned column still shows the selection.
                cellHighlightStyle(focusProps, dataPinStyle(column.key), {
                  background:
                    "var(--adapttable-cell-selected, rgba(59, 130, 246, 0.14))",
                })
              }
            >
              <TreeCell
                entry={treeEntry}
                columnKey={column.key}
                treeColumnKey={treeKey}
                labels={labels}
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
                  editLabel={labels.editCell}
                  undoLabel={labels.undoEdit}
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
            </Table.Cell>
          );
        })}
        {columnSpacers && <ColumnSpacer width={columnSpacers.end} side="end" />}
        {showActions && (
          <Table.Cell
            justify="end"
            style={{
              ...edgeCellStyle("end", live.actionsStick, PIN_Z.body),
              ...edgeRowPin,
            }}
          >
            {editing?.rowEditing && (
              <RowEditActions
                rowEditing={editing.rowEditing}
                row={row}
                rowId={id}
                labels={labels}
              />
            )}
            {/* The control column also exists for row mode alone, so this is
                not the same question as `showActions`. */}
            {live.rowActions && live.rowActions.length > 0 && (
              <RowActionButtons
                row={row}
                actions={live.rowActions}
                confirm={live.confirm}
                cancelLabel={labels.cancel}
                accentColor={accentColor}
              />
            )}
          </Table.Cell>
        )}
      </Table.Row>
      {expandable && expanded && (
        <Table.Row>
          <Table.Cell colSpan={columnSpan}>
            {api.current.renderRowDetail?.(row)}
          </Table.Cell>
        </Table.Row>
      )}
    </>
  );
}

/**
 * Materialize the memoized row for one TRow. React 18's `memo` typing drops a
 * generic component's type parameter, so each `DesktopTable` instantiates the
 * memo for its own row type (zero casts, full type safety).
 */
function createDesktopRow<TRow>() {
  return memo(DesktopRowBase<TRow>, desktopRowPropsEqual<TRow>);
}

/** Desktop Base UI table. */
export function DesktopTable<TRow>({
  gridFocus,
  table,
  rows,
  rowActions,
  confirm,
  getRowId,
  size,
  accentColor,
  dir,
  prefetch,
  onRowClick,
  rowClassName,
  renderRowDetail,
  summaryRow,
  expansion,
  editing,
  grouping,
  className,
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
  measureRowPair,
  stickyHeader = false,
  stickyTop = 0,
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
  columnWindow,
  fitColumns,
  tree,
  getCellSpan,
}: Readonly<SharedProps<TRow>>) {
  // Core's render model counts the expansion column in `columnSpan` when
  // `renderRowDetail` + `expansion` arrive (the chrome builds them together),
  // so spacer and detail rows span it without local `+ 1` math.
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
  const expandable = expansion !== undefined;
  const groups = headerGroupRow(columns);
  const summary = useSummaryCells(summaryRow, rows);
  // End-pinned actions count as a pin too: sticking them needs the wrapper to
  // be the horizontal scroll container, exactly like a pinned data column.
  const { hasPinned, leads, extraMinWidth, expand, selectionLead, reorderSig } =
    pinChrome(
      expandable,
      showReorder,
      Boolean(selection),
      showActions,
      actionsPinned,
      reorderPinned,
      table.columns,
      pinOffset
    );
  // With no maxHeight and no pins the wrapper must stay a NON-scroll container
  // so page-scroll sticky headers keep working — but a table wider than the
  // card would then bleed past it. Measure, and scroll only on real overflow.
  const { ref: overflowRef, overflowing } =
    useHorizontalOverflow<HTMLDivElement>();
  // ANY scroll container (maxHeight, pins, measured overflow) becomes the
  // sticky context: the header must pin to ITS top — a viewport offset would
  // shove it down into the rows.
  const inScrollBox = maxHeight != null || hasPinned || overflowing;

  const headerPinTop = inScrollBox ? 0 : stickyTop;
  const rowPinOffset = stickyHeader ? headerPinTop + headerHeight : 0;

  const hasStartPin = table.columns.some(
    (c) => pinOffset?.(c.key)?.side === "start"
  );
  const hasEndPin = table.columns.some(
    (c) => pinOffset?.(c.key)?.side === "end"
  );
  // The actions cells stick flush to the inline end when a data column is
  // pinned right (so it can't slide beneath them) OR when the actions column
  // itself is end-pinned from the Columns menu — independently, in one click.
  const actionsStick = hasEndPin || actionsPinned;
  // Add the sticky-top offset onto an (optionally pinned) header-cell style.
  const stickify = (
    base: CSSProperties | undefined
  ): CSSProperties | undefined => {
    if (!stickyHeader) return base;
    const top = inScrollBox ? 0 : stickyTop;
    if (base?.position === "sticky") return { ...base, top };
    return {
      ...base,
      position: "sticky",
      top,
      zIndex: PIN_Z.header,
      background: PIN_BG,
    };
  };
  // Header-cell style merging pin + user width; the resize handle is absolute,
  // so add a positioning context when the cell is not already sticky/pinned.
  const headCellStyle = (
    column: ColumnDef<TRow>
  ): CSSProperties | undefined => {
    const key = column.key;
    const pin = pinCellStyle(pinOffset?.(key), PIN_Z.headerPinned, leads);
    const width = pin
      ? pinnedColumnWidth(column, columnWidths)
      : columnWidths?.[key];
    const sizing = columnSizeStyle(column, flexShares, columnWidths?.[key]);
    if (!pin && width == null && !setWidth && !sizing) {
      return stickify(undefined);
    }
    const style: CSSProperties = { ...pin, ...sizing };
    if (width != null) style.width = width;
    if (setWidth && !stickyHeader && !pin) style.position = "relative";
    return stickify(style);
  };
  const columnName = (column: ColumnDef<TRow>): string =>
    typeof column.header === "string" ? column.header : column.key;

  // Fixed-width columns get a real table min-width (their sum), so the table
  // overflows and scrolls horizontally instead of squishing columns to fit.
  // Each flexible column's share, from the same rule core's prop-getters
  // use — so a kit that styles its own header still sizes identically.
  const flexShares = columnFlexShares({
    columns,
    fitColumns,
    widths: columnWidths,
  });

  const minWidth = tableMinWidth(columns, {
    widths: columnWidths,
    extra: extraMinWidth,
  });

  // The memoized row reads everything non-visual through this single ref,
  // re-assigned every render so event handlers always see the latest values
  // without their identity ever becoming a compared prop.
  const rowApi: DesktopRowApi<TRow> = {
    selection,
    expansion,
    rowActions,
    confirm,
    onRowClick,
    prefetch,
    renderRowDetail,
    pinOffset,
    measureElement,
    measureRowPair,
    leads,
    hasStartPin,
    actionsStick,
    rowReorder,
    windowStart,
    rowCount: rows.length,
    reorderPinned,
  };
  const api = useRef(rowApi);
  api.current = rowApi;
  const measureRef = useCallback((element: HTMLTableRowElement | null) => {
    api.current.measureElement?.(element);
  }, []);
  // One memoized row component per table instance — see createDesktopRow.
  const Row = useMemo(() => createDesktopRow<TRow>(), []);
  const renderPinnedRow = (row: TRow, side: RowPinSide) => {
    const id = getRowId(row);
    const found = rows.findIndex((item) => getRowId(item) === id);
    const sourceIndex = found < 0 ? 0 : found;
    return (
      <Row
        key={id}
        row={row}
        id={id}
        index={sourceIndex}
        gridFocus={gridFocus}
        selected={selection?.isSelected(id) ?? false}
        expanded={expansion?.isExpanded(id) ?? false}
        size={size}
        accentColor={accentColor}
        dir={dir}
        columns={columns}
        bodyCells={cellsForRow(cellsByRow, id)}
        spanSignature={rowSpanSignature(cellsForRow(cellsByRow, id))}
        columnWidths={columnWidths}
        pinSignature={pinSignature}
        className={rowClassName?.(row, sourceIndex)}
        labels={labels}
        hasSelection={Boolean(selection)}
        expandable={expandable}
        showActions={showActions}
        showReorder={showReorder}
        reorderSignature={rowReorderSignature(rowReorder, id, sourceIndex)}
        rowPinSide={side}
        rowPinOffset={rowPinOffset}
        rowPinSignature={rowPinSignature(rowPinning, id)}
        sourceIndex={sourceIndex}
        hasRowClick={Boolean(onRowClick)}
        columnSpan={columnSpan}
        api={api}
        measureRef={measureRef}
        editing={editing}
        rows={rows}
        getRowId={getRowId}
        editingSignature={rowEditingSignature(editing, id)}
      />
    );
  };
  // `pinOffset` is a fresh closure whenever the layout changes, so rows compare
  // this serialized pin geometry instead of a function identity. The actions
  // edge is part of the geometry: end-pinning the actions column must re-render
  // the memoized rows so their actions cells turn sticky.
  const pinSignature = [
    actionsStick ? "actions:end" : "",
    reorderSig,
    ...columns.map((column) => {
      const pin = pinOffset?.(column.key);
      return pin ? `${column.key}:${pin.side}:${pin.inset}` : "";
    }),
  ].join("|");
  const groupingRef = useRef(grouping);
  groupingRef.current = grouping;
  const onToggleGroup = useCallback(
    (groupKey: string) => groupingRef.current?.collapsed.toggle(groupKey),
    []
  );

  return (
    <Box
      ref={(node: HTMLDivElement | null) => {
        overflowRef(node);
        virtualScrollRef?.(node);
        // Feed STICKY_FIX_CSS the fixed-column min-width as a custom property
        // (React's CSSProperties type rejects `--*` keys, so set it directly):
        // it lands on the table so pinned/edge sticky cells stick against the wrapper.
        node?.style.setProperty(
          "--adapttable-min-width",
          minWidth > 0 ? `${minWidth}px` : "0"
        );
      }}
      className={STICKY_FIX_CLASS}
      style={{
        maxHeight: maxHeight == null ? undefined : `${maxHeight}px`,
        overflowX:
          maxHeight != null || hasPinned || overflowing ? "auto" : undefined,
        overflowY: maxHeight == null ? undefined : "auto",
      }}
    >
      {/* See STICKY_FIX_CSS: push min-width onto the table so pinning sticks. */}
      <style>{STICKY_FIX_CSS}</style>
      <Table.Root
        size={size}
        variant="surface"
        data-size={size}
        className={className}
        aria-label={table.getTableProps()["aria-label"]}
        {...gridFocus?.getGridProps()}
        tableStyle={fittedTableStyle(fitColumns)}
      >
        <thead ref={theadRef}>
          {groups && (
            <Table.Row>
              {expandable && <Table.ColumnHeaderCell />}
              <When show={showReorder}>
                <Table.ColumnHeaderCell />
              </When>
              {selection && <Table.ColumnHeaderCell />}
              {groups.map((cell) => (
                <Table.ColumnHeaderCell
                  key={cell.key}
                  colSpan={cell.span}
                  justify="center"
                >
                  {cell.label}
                </Table.ColumnHeaderCell>
              ))}
              {showActions && <Table.ColumnHeaderCell />}
            </Table.Row>
          )}
          <Table.Row>
            {expandable && (
              <Table.ColumnHeaderCell
                aria-label={labels.expandRow}
                style={stickify(
                  edgeCellStyle("start", hasStartPin, PIN_Z.headerPinned)
                )}
              />
            )}
            <When show={showReorder}>
              <Table.ColumnHeaderCell
                aria-label={labels.reorderRow}
                data-adapttable-part="reorder-header"
                style={stickify(
                  edgeCellStyle(
                    "start",
                    hasStartPin || reorderPinned,
                    PIN_Z.headerPinned,
                    expand
                  )
                )}
              />
            </When>
            {selection && (
              <Table.ColumnHeaderCell
                style={stickify(
                  edgeCellStyle(
                    "start",
                    hasStartPin,
                    PIN_Z.headerPinned,
                    selectionLead
                  )
                )}
              >
                <Checkbox
                  aria-label={labels.selectAll}
                  checked={selection.headerState === "all"}
                  indeterminate={selection.headerState === "some"}
                  onToggle={selection.toggleAll}
                />
              </Table.ColumnHeaderCell>
            )}
            {columnSpacers && (
              <ColumnSpacer width={columnSpacers.start} side="start" as="th" />
            )}
            {columns.map((column, headerIndex) => {
              const ariaSort = table.getHeaderCellProps(column)["aria-sort"] as
                | "ascending"
                | "descending"
                | "none"
                | undefined;
              // Core's sort onClick receives the click EVENT: with `multiSort` a
              // shift-click cycles the column through the sort chain while a
              // plain click keeps single-sorting.
              const sortButton = table.getSortButtonProps(column);
              const sortClick = sortButton.onClick;
              const sortIndex = sortButton["data-sort-index"];
              return (
                <Table.ColumnHeaderCell
                  key={column.key}
                  {...(gridFocus?.getColumnHeaderProps(headerIndex, {
                    sortable: column.sortable,
                  }) ?? {})}
                  justify={justifyFor(column.align)}
                  aria-sort={ariaSort}
                  data-column-key={column.key}
                  style={headCellStyle(column)}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="adapttable-sort-btn"
                      style={{
                        cursor: "pointer",
                        font: "inherit",
                        color: "inherit",
                        background: "none",
                        border: 0,
                        padding: 0,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                      aria-label={`${labels.sortBy}: ${columnName(column)}`}
                      onClick={sortClick}
                    >
                      {column.header}
                      <Text as="span" aria-hidden>
                        {sortGlyph(ariaSort)}
                      </Text>
                      {sortIndex !== undefined && (
                        <Text
                          as="span"
                          aria-hidden
                          data-sort-index={sortIndex}
                          size="1"
                          weight="bold"
                          ml="1"
                          style={{
                            borderRadius: "9999px",
                            padding: "0 0.4em",
                            background: "var(--gray-a3)",
                          }}
                        >
                          {sortIndex}
                        </Text>
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                  {setWidth && (
                    <span
                      style={RESIZE_HANDLE_STYLE}
                      {...columnResizeHandleProps(
                        column.key,
                        setWidth,
                        `${resizeLabel}: ${columnName(column)}`
                      )}
                    />
                  )}
                </Table.ColumnHeaderCell>
              );
            })}
            {columnSpacers && (
              <ColumnSpacer width={columnSpacers.end} side="end" as="th" />
            )}
            {showActions && (
              <Table.ColumnHeaderCell
                justify="end"
                style={stickify(
                  edgeCellStyle("end", actionsStick, PIN_Z.headerPinned)
                )}
              >
                {labels.actions}
              </Table.ColumnHeaderCell>
            )}
          </Table.Row>
        </thead>
        {pinnedTopRows.length > 0 && (
          <tbody
            data-adapttable-part={PINNED_TOP_PART}
            style={pinnedRowStickyStyle("top", rowPinOffset)}
          >
            {pinnedTopRows.map((row) => renderPinnedRow(row, "top"))}
          </tbody>
        )}
        <tbody data-adapttable-part="tbody">
          {paddingTop > 0 && (
            <Table.Row aria-hidden>
              <Table.Cell
                colSpan={columnSpan}
                style={{ height: paddingTop, padding: 0 }}
              />
            </Table.Row>
          )}
          {grouping
            ? grouping.entries.map((entry) => {
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
                      dir={dir}
                      accentColor={accentColor}
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
                    id={id}
                    index={entry.index}
                    gridFocus={gridFocus}
                    selected={selection?.isSelected(id) ?? false}
                    expanded={expansion?.isExpanded(id) ?? false}
                    size={size}
                    accentColor={accentColor}
                    dir={dir}
                    columns={columns}
                    bodyCells={cellsForRow(cellsByRow, id)}
                    spanSignature={rowSpanSignature(
                      cellsForRow(cellsByRow, id)
                    )}
                    columnWidths={columnWidths}
                    pinSignature={pinSignature}
                    className={rowClassName?.(entry.row, entry.index)}
                    labels={labels}
                    hasSelection={Boolean(selection)}
                    expandable={expandable}
                    showActions={showActions}
                    showReorder={showReorder}
                    reorderSignature={rowReorderSignature(
                      rowReorder,
                      id,
                      entry.index
                    )}
                    rowPinSide={undefined}
                    rowPinOffset={rowPinOffset}
                    rowPinSignature={rowPinSignature(rowPinning, id)}
                    sourceIndex={entry.index}
                    hasRowClick={Boolean(onRowClick)}
                    columnSpan={columnSpan}
                    api={api}
                    measureRef={measureRef}
                    editing={editing}
                    rows={rows}
                    getRowId={getRowId}
                    editingSignature={rowEditingSignature(editing, id)}
                  />
                );
              })
            : // A tree renders its own flattened entries; a flat table renders the
              // (possibly windowed) rows. Both carry a row and a key.
              bodyRowEntries(entries, tree).map(
                ({ row, index, key, treeEntry, sourceIndex }) => {
                  const id = getRowId(row);
                  const focusIndex = sourceIndex ?? index;
                  return (
                    <Row
                      gridFocus={gridFocus}
                      key={key}
                      row={row}
                      id={id}
                      index={index}
                      selected={selection?.isSelected(id) ?? false}
                      expanded={expansion?.isExpanded(id) ?? false}
                      size={size}
                      accentColor={accentColor}
                      dir={dir}
                      columns={columns}
                      bodyCells={cellsForRow(cellsByRow, id)}
                      spanSignature={rowSpanSignature(
                        cellsForRow(cellsByRow, id)
                      )}
                      columnWidths={columnWidths}
                      pinSignature={pinSignature}
                      className={rowClassName?.(row, focusIndex)}
                      labels={labels}
                      hasSelection={Boolean(selection)}
                      expandable={expandable}
                      showActions={showActions}
                      showReorder={showReorder}
                      reorderSignature={rowReorderSignature(
                        rowReorder,
                        id,
                        index
                      )}
                      rowPinSide={undefined}
                      rowPinOffset={rowPinOffset}
                      rowPinSignature={rowPinSignature(rowPinning, id)}
                      sourceIndex={focusIndex}
                      hasRowClick={Boolean(onRowClick)}
                      columnSpan={columnSpan}
                      api={api}
                      measureRef={measureRef}
                      editing={editing}
                      rows={rows}
                      getRowId={getRowId}
                      treeEntry={treeEntry}
                      treeColumnKey={tree?.columnKey}
                      onToggleTree={tree?.expansion.toggle}
                      editingSignature={rowEditingSignature(editing, id)}
                    />
                  );
                }
              )}
          {paddingBottom > 0 && (
            <Table.Row aria-hidden>
              <Table.Cell
                colSpan={columnSpan}
                style={{ height: paddingBottom, padding: 0 }}
              />
            </Table.Row>
          )}
          {summary && (
            <Table.Row data-summary="">
              {expandable && <Table.Cell />}
              <When show={showReorder}>
                <Table.Cell />
              </When>
              {selection && <Table.Cell />}
              {columns.map((column) => (
                <Table.Cell key={column.key} justify={justifyFor(column.align)}>
                  {summary[column.key]}
                </Table.Cell>
              ))}
              {showActions && <Table.Cell />}
            </Table.Row>
          )}
        </tbody>
        {pinnedBottomRows.length > 0 && (
          <tbody
            data-adapttable-part={PINNED_BOTTOM_PART}
            style={pinnedRowStickyStyle("bottom", 0)}
          >
            {pinnedBottomRows.map((row) => renderPinnedRow(row, "bottom"))}
          </tbody>
        )}
      </Table.Root>
    </Box>
  );
}
