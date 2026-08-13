/** The desktop `<table>`: header, pinned columns, rows and summary. */
import {
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
  type SelectionState,
  type TableLabels,
  tableMinWidth,
  useHorizontalOverflow,
} from "@adapttable/core";
import {
  cellHighlightStyle,
  ColumnSpacer,
  FillHandle,
  headerGroupRow,
  logicalAlign,
  type PinLeads,
  pinnedColumnWidth,
  pinnedDataCellStyle,
  pinnedEdgeCellStyle,
  type PinOffset,
  rowClickProps,
  rowEditingSignature,
  type RowPairMeasurer,
  shallowEqualByKeys,
  SHARED_DESKTOP_ROW_KEYS,
  type SharedTableRenderProps,
  sortArrow,
  tableRenderModel,
  useSummaryCells,
} from "@adapttable/core/adapter";
import { Box, chakra, Table, Text } from "@chakra-ui/react";
import {
  type CSSProperties,
  memo,
  type ReactNode,
  type RefObject,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { EditableDataCell } from "./EditableCell";
import { ExpandToggle } from "./ExpandToggle";
import { GroupHeaderRow } from "./GroupHeader";
import { Checkbox } from "./primitives";
import { RowActionButtons } from "./RowActionButtons";

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

/**
 * Opaque background for sticky/pinned cells — the Chakra v3 body-background
 * token (`--chakra-colors-bg`). The old v2 `chakra-body-bg` token does not
 * exist in v3, so it resolved to transparent and scrolled columns bled through
 * the pinned ones.
 */
const PIN_BG = "var(--chakra-colors-bg)";

export interface SharedProps<TRow> extends SharedTableRenderProps<TRow> {
  /** Class hook for the table (desktop) / each card (mobile). */
  className?: string;
  size: "sm" | "md" | "lg";
  accentColor?: string;
  /** Text direction — flips the expand chevron for RTL. */
  dir?: Direction;
  /**
   * The injected actions column is end-pinned (via the Columns menu), so
   * its cells stick to the inline end even with zero data columns pinned.
   */
  actionsPinned?: boolean;
}

/**
 * Header sort indicator, derived from the cell's computed `aria-sort` so a
 * multi-sort chain level shows its own direction, not the single-sort one.
 */
const sortGlyph = sortArrow;

/** Pinned data-cell style with the Chakra surface background. */
const pinCellStyle = (pin: PinOffset | undefined, z: number, leads: PinLeads) =>
  pinnedDataCellStyle(pin, z, leads, PIN_BG);

/** Sticky edge-cell style (chevron / selection / actions) over that background. */
const edgeCellStyle = (side: PinSide, active: boolean, z: number, shift = 0) =>
  pinnedEdgeCellStyle(side, active, z, PIN_BG, shift);

/**
 * Everything a memoized desktop row reads through ONE identity-stable ref:
 * the latest callbacks and pin geometry. Routing them through the ref (read
 * at event/render time) keeps a changed callback identity from re-rendering
 * every row, without ever calling a stale closure.
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
  size: "sm" | "md" | "lg";
  accentColor?: string;
  dir?: Direction;
  columns: readonly ColumnDef<TRow>[];
  columnWidths?: Readonly<Record<string, number>>;
  /** Serialized pin geometry — stands in for the `pinOffset` closure. */
  pinSignature: string;
  /** The `rowClassName(row, index)` output, compared as a plain string. */
  className?: string;
  labels: Required<TableLabels>;
  hasSelection: boolean;
  expandable: boolean;
  showActions: boolean;
  hasRowClick: boolean;
  /** Spacer/detail colSpan (selection + data + actions + expansion). */
  columnSpan: number;
  /** Widths holding open the columns outside the horizontal window. */
  columnSpacers?: { start: number; end: number };
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
 * The props {@link desktopRowPropsEqual} compares. `api` and `measureRef`
 * are deliberately absent: both are identity-stable by construction, and a
 * row must never re-render because some callback's identity changed.
 */
const ROW_VISUAL_KEYS = [
  ...SHARED_DESKTOP_ROW_KEYS,
  "accentColor",
  "editingSignature",
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
  className,
  labels,
  hasSelection,
  expandable,
  showActions,
  hasRowClick,
  columnSpan,
  columnSpacers,
  api,
  measureRef,
  editing,
  rows,
  getRowId,
}: Readonly<DesktopRowProps<TRow>>) {
  // Render-time geometry reads the latest ref values: whenever they change,
  // a compared prop (pinSignature / hasSelection / …) changes with them.
  const live = api.current;
  const activateRow = (r: TRow): void => {
    api.current.onRowClick?.(r);
  };
  return (
    <>
      <Table.Row
        {...rowClickProps(row, hasRowClick ? activateRow : undefined, index)}
        ref={measureRef}
        data-index={index}
        {...gridFocus?.getRowPropsAt(index)}
        data-stagger=""
        className={className}
        bg={selected ? "blackAlpha.100" : undefined}
        _dark={{ bg: selected ? "whiteAlpha.200" : undefined }}
        onMouseEnter={() => api.current.prefetch?.(row)}
      >
        {expandable && (
          <Table.Cell
            px={1}
            style={edgeCellStyle("start", live.hasStartPin, PIN_Z.body)}
          >
            <ExpandToggle
              open={expanded}
              dir={dir}
              labels={labels}
              onToggle={() => api.current.expansion?.toggle(id)}
            />
          </Table.Cell>
        )}
        {hasSelection && (
          <Table.Cell
            style={edgeCellStyle(
              "start",
              live.hasStartPin,
              PIN_Z.body,
              expandable ? EXPANSION_WIDTH : 0
            )}
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
        {columns.map((column, colIndex) => {
          const focusProps = gridFocus?.getCellPropsAt(index, colIndex);
          return (
            <Table.Cell
              key={column.key}
              {...focusProps}
              textAlign={logicalAlign(column.align)}
              style={
                // This kit's own subtle fill for a selected cell, applied over the
                // pinned background so a pinned column still shows the selection.
                cellHighlightStyle(
                  focusProps,
                  pinCellStyle(live.pinOffset?.(column.key), 1, live.leads),
                  { background: "var(--chakra-colors-bg-subtle)" }
                )
              }
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
                display={
                  column.Cell ? (
                    <column.Cell row={row} rowIndex={index} />
                  ) : (
                    column.accessor?.(row)
                  )
                }
              />
              <FillHandle
                focus={gridFocus}
                windowIndex={index}
                col={colIndex}
              />
            </Table.Cell>
          );
        })}
        {columnSpacers && <ColumnSpacer width={columnSpacers.end} side="end" />}
        {showActions && (
          <Table.Cell
            textAlign="end"
            style={edgeCellStyle("end", live.actionsStick, PIN_Z.body)}
          >
            <RowActionButtons
              row={row}
              actions={live.rowActions!}
              confirm={live.confirm}
              cancelLabel={labels.cancel}
              accentColor={accentColor}
            />
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
 * Materialize the memoized row for one TRow. React 18's `memo` typing drops
 * a generic component's type parameter, so each `DesktopTable` instantiates
 * the memo for its own row type (zero casts, full type safety).
 */
function createDesktopRow<TRow>() {
  return memo(DesktopRowBase<TRow>, desktopRowPropsEqual<TRow>);
}

/** Body rows for {@link DesktopTable}: group headers + leaves, or leaf-only. */
function DesktopTableRows<TRow>({
  getCellProps,
  gridFocus,
  grouping,
  entries,
  getRowId,
  selection,
  expansion,
  size,
  accentColor,
  dir,
  columns,
  columnWidths,
  pinSignature,
  rowClassName,
  labels,
  expandable,
  showActions,
  onRowClick,
  columnSpan,
  columnSpacers,
  api,
  measureRef,
  editing,
  rows,
  Row,
  onToggleGroup,
}: Readonly<{
  /** The table's per-column cell props, for the group row's aggregate cells. */
  getCellProps: (column: ColumnDef<TRow>) => Record<string, unknown>;
  /** Cell-navigation getters; inert unless `cellNavigation` is on. */
  gridFocus?: GridFocusState;
  grouping: SharedTableRenderProps<TRow>["grouping"];
  entries: ReturnType<typeof tableRenderModel<TRow>>["entries"];
  getRowId: (row: TRow) => string;
  selection: SelectionState | null;
  expansion: RowExpansionState | undefined;
  size: SharedProps<TRow>["size"];
  accentColor?: string;
  dir?: Direction;
  columns: readonly ColumnDef<TRow>[];
  columnWidths?: Readonly<Record<string, number>>;
  pinSignature: string;
  rowClassName?: (row: TRow, index: number) => string | undefined;
  labels: Required<TableLabels>;
  expandable: boolean;
  showActions: boolean;
  onRowClick?: (row: TRow) => void;
  columnSpan: number;
  /** Widths holding open the columns outside the horizontal window. */
  columnSpacers?: { start: number; end: number };
  api: RefObject<DesktopRowApi<TRow>>;
  measureRef: (element: HTMLTableRowElement | null) => void;
  editing?: EditableCellEditing<TRow>;
  rows: readonly TRow[];
  Row: ReturnType<typeof createDesktopRow<TRow>>;
  onToggleGroup: (groupKey: string) => void;
}>): ReactNode {
  if (grouping) {
    return grouping.entries.map((entry) => {
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
            leadingCells={(expandable ? 1 : 0) + (selection ? 1 : 0)}
            showActions={showActions}
            getCellProps={getCellProps}
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
          columnWidths={columnWidths}
          pinSignature={pinSignature}
          className={rowClassName?.(entry.row, entry.index)}
          labels={labels}
          hasSelection={Boolean(selection)}
          expandable={expandable}
          showActions={showActions}
          hasRowClick={Boolean(onRowClick)}
          columnSpan={columnSpan}
          columnSpacers={columnSpacers}
          api={api}
          measureRef={measureRef}
          editing={editing}
          rows={rows}
          getRowId={getRowId}
          editingSignature={rowEditingSignature(editing, id)}
        />
      );
    });
  }
  return entries.map(({ row, index, key }) => {
    const id = getRowId(row);
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
        columnWidths={columnWidths}
        pinSignature={pinSignature}
        className={rowClassName?.(row, index)}
        labels={labels}
        hasSelection={Boolean(selection)}
        expandable={expandable}
        showActions={showActions}
        hasRowClick={Boolean(onRowClick)}
        columnSpan={columnSpan}
        columnSpacers={columnSpacers}
        api={api}
        measureRef={measureRef}
        editing={editing}
        rows={rows}
        getRowId={getRowId}
        editingSignature={rowEditingSignature(editing, id)}
      />
    );
  });
}

/** Desktop Chakra table. */
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
  columnWindow,
}: Readonly<SharedProps<TRow>>) {
  // Core's render model counts the expansion column in `columnSpan` when
  // `renderRowDetail` + `expansion` arrive (the chrome builds them together),
  // so spacer and detail rows span it without local `+ 1` math.
  const {
    columns,
    selection,
    labels,
    showActions,
    entries,
    columnSpan,
    columnSpacers,
  } = tableRenderModel({
    table,
    rows,
    columnWindow,
    rowActions,
    getRowId,
    rowEntries,
    renderRowDetail,
    expansion,
  });
  const expandable = expansion !== undefined;
  const groups = headerGroupRow(columns);
  const summary = useSummaryCells(summaryRow, rows);
  // Stick the header *cells* (a `<thead>` does not pin against the document
  // scroller) and avoid `<TableContainer>`, whose `overflow-x` would trap
  // sticky and let the header overlap the first row.
  // Inside a maxHeight scroll box the box itself is the sticky context, so
  // the header pins to ITS top — a viewport offset would float it mid-box.
  // End-pinned actions count as a pin too: sticking them needs the wrapper
  // to be the horizontal scroll container, exactly like a pinned data column.
  const hasPinned =
    actionsPinned || table.columns.some((c) => pinOffset?.(c.key) != null);
  // With no maxHeight and no pins the wrapper must stay a NON-scroll
  // container so page-scroll sticky headers keep working — but a table wider
  // than the card would then bleed past it. Measure, and scroll only when the
  // content actually overflows.
  const { ref: overflowRef, overflowing } =
    useHorizontalOverflow<HTMLDivElement>();
  // ANY scroll container (maxHeight, pins, measured overflow) becomes the
  // sticky context: the header must pin to ITS top — a viewport offset
  // would shove it down into the rows.
  const inScrollBox = maxHeight != null || hasPinned || overflowing;
  const stickyTh = stickyHeader
    ? {
        position: "sticky" as const,
        top: inScrollBox ? "0px" : `${stickyTop}px`,
        zIndex: PIN_Z.header,
        bg: "bg",
      }
    : {};
  // The leading expansion (32px) / checkbox (48px) and trailing actions
  // (120px) columns pin to the edge alongside the data columns, which
  // therefore start past them.
  const selectionWidth = 48;
  const actionsWidth = 120;
  const leads: PinLeads = {
    start:
      (expandable ? EXPANSION_WIDTH : 0) + (selection ? selectionWidth : 0),
    end: showActions ? actionsWidth : 0,
  };
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
  // Header-cell style merging pin + user width; the resize handle is absolute,
  // so add a positioning context when the cell is not already sticky/pinned.
  const headCellStyle = (
    column: ColumnDef<TRow>
  ): CSSProperties | undefined => {
    const key = column.key;
    const pin = pinCellStyle(pinOffset?.(key), PIN_Z.headerPinned, leads);
    // A pinned column renders at the width its sticky inset assumed, so
    // stacked pins stay flush even with no declared width.
    const width = pin
      ? pinnedColumnWidth(column, columnWidths)
      : columnWidths?.[key];
    if (!pin && width == null && !setWidth) return undefined;
    const style: CSSProperties = { ...pin };
    if (width != null) style.width = width;
    if (setWidth && !stickyHeader && !pin) style.position = "relative";
    return style;
  };
  const columnName = (column: ColumnDef<TRow>): string =>
    typeof column.header === "string" ? column.header : column.key;

  // Fixed-width columns get a real table min-width (their sum), so the table
  // overflows and scrolls horizontally instead of squishing columns to fit.
  const minWidth = tableMinWidth(columns, {
    widths: columnWidths,
    extra:
      (expandable ? EXPANSION_WIDTH : 0) +
      (selection ? selectionWidth : 0) +
      (showActions ? actionsWidth : 0),
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
  };
  const api = useRef(rowApi);
  api.current = rowApi;
  const measureRef = useCallback((element: HTMLTableRowElement | null) => {
    api.current.measureElement?.(element);
  }, []);
  // One memoized row component per table instance — see createDesktopRow.
  const Row = useMemo(() => createDesktopRow<TRow>(), []);
  // `pinOffset` is a fresh closure whenever the layout changes, so rows
  // compare this serialized pin geometry instead of a function identity.
  // The actions edge is part of the geometry: end-pinning the actions column
  // must re-render the memoized rows so their actions cells turn sticky.
  const pinSignature = [
    actionsStick ? "actions:end" : "",
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
      }}
      maxH={maxHeight == null ? undefined : `${maxHeight}px`}
      overflowX={
        maxHeight != null || hasPinned || overflowing ? "auto" : undefined
      }
      overflowY={maxHeight == null ? undefined : "auto"}
    >
      <Table.Root
        size={size}
        data-size={size}
        className={className}
        minW={minWidth > 0 ? `${minWidth}px` : undefined}
        aria-label={table.getTableProps()["aria-label"]}
        {...gridFocus?.getGridProps()}
      >
        <Table.Header>
          {groups && (
            <Table.Row>
              {expandable && <Table.ColumnHeader px={1} />}
              {selection && <Table.ColumnHeader />}
              {groups.map((cell) => (
                <Table.ColumnHeader
                  key={cell.key}
                  colSpan={cell.span}
                  textAlign="center"
                  fontWeight="semibold"
                  textTransform="none"
                >
                  {cell.label}
                </Table.ColumnHeader>
              ))}
              {showActions && <Table.ColumnHeader />}
            </Table.Row>
          )}
          <Table.Row>
            {expandable && (
              <Table.ColumnHeader
                {...stickyTh}
                aria-label={labels.expandRow}
                width={`${EXPANSION_WIDTH}px`}
                px={1}
                style={edgeCellStyle("start", hasStartPin, PIN_Z.headerPinned)}
              />
            )}
            {selection && (
              <Table.ColumnHeader
                {...stickyTh}
                style={edgeCellStyle(
                  "start",
                  hasStartPin,
                  PIN_Z.headerPinned,
                  expandable ? EXPANSION_WIDTH : 0
                )}
              >
                <Checkbox
                  aria-label={labels.selectAll}
                  checked={selection.headerState === "all"}
                  indeterminate={selection.headerState === "some"}
                  onToggle={selection.toggleAll}
                />
              </Table.ColumnHeader>
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
              // Core's sort onClick receives the click EVENT: with `multiSort`
              // a shift-click cycles the column through the sort chain while a
              // plain click keeps single-sorting.
              const sortButton = table.getSortButtonProps(column);
              const sortClick = sortButton.onClick;
              const sortIndex = sortButton["data-sort-index"];
              return (
                <Table.ColumnHeader
                  key={column.key}
                  {...(gridFocus?.getColumnHeaderProps(headerIndex, {
                    sortable: column.sortable,
                  }) ?? {})}
                  textAlign={logicalAlign(column.align)}
                  width={column.width}
                  aria-sort={ariaSort}
                  {...stickyTh}
                  style={headCellStyle(column)}
                >
                  {column.sortable ? (
                    <chakra.button
                      type="button"
                      cursor="pointer"
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
                          fontSize="0.7em"
                          fontWeight="bold"
                          borderRadius="full"
                          px={1.5}
                          ms={1}
                          bg="blackAlpha.200"
                          _dark={{ bg: "whiteAlpha.300" }}
                        >
                          {sortIndex}
                        </Text>
                      )}
                    </chakra.button>
                  ) : (
                    column.header
                  )}
                  {setWidth && (
                    <Box
                      as="span"
                      style={RESIZE_HANDLE_STYLE}
                      {...columnResizeHandleProps(
                        column.key,
                        setWidth,
                        `${resizeLabel}: ${columnName(column)}`
                      )}
                    />
                  )}
                </Table.ColumnHeader>
              );
            })}
            {columnSpacers && (
              <ColumnSpacer width={columnSpacers.end} side="end" as="th" />
            )}
            {showActions && (
              <Table.ColumnHeader
                textAlign="end"
                {...stickyTh}
                style={edgeCellStyle("end", actionsStick, PIN_Z.headerPinned)}
              >
                {labels.actions}
              </Table.ColumnHeader>
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {paddingTop > 0 && (
            <Table.Row aria-hidden>
              <Table.Cell colSpan={columnSpan} h={`${paddingTop}px`} p={0} />
            </Table.Row>
          )}
          <DesktopTableRows
            getCellProps={table.getCellProps}
            gridFocus={gridFocus}
            grouping={grouping}
            entries={entries}
            getRowId={getRowId}
            selection={selection}
            expansion={expansion}
            size={size}
            accentColor={accentColor}
            dir={dir}
            columns={columns}
            columnWidths={columnWidths}
            pinSignature={pinSignature}
            rowClassName={rowClassName}
            labels={labels}
            expandable={expandable}
            showActions={showActions}
            onRowClick={onRowClick}
            columnSpan={columnSpan}
            columnSpacers={columnSpacers}
            api={api}
            measureRef={measureRef}
            editing={editing}
            rows={rows}
            Row={Row}
            onToggleGroup={onToggleGroup}
          />
          {paddingBottom > 0 && (
            <Table.Row aria-hidden>
              <Table.Cell colSpan={columnSpan} h={`${paddingBottom}px`} p={0} />
            </Table.Row>
          )}
        </Table.Body>
        {summary && (
          <Table.Footer>
            <Table.Row>
              {expandable && <Table.Cell px={1} />}
              {selection && <Table.Cell />}
              {columns.map((column) => (
                <Table.Cell
                  key={column.key}
                  textAlign={logicalAlign(column.align)}
                >
                  {summary[column.key]}
                </Table.Cell>
              ))}
              {showActions && <Table.Cell />}
            </Table.Row>
          </Table.Footer>
        )}
      </Table.Root>
    </Box>
  );
}
