import type { GroupNode } from "@adapttable/core";
import {
  applyRowPatchesWithLog,
  applyRowReorder,
  type ColumnDef,
  type ColumnLayoutState,
  evaluateFilterTree,
  type MobileCardModel,
  type MobileCardRenderer,
  type QueryFilterGroup,
  type Slot,
  type TableErrorState,
  type TableSource,
  updateRow,
  useColumnLayoutUrlState,
  useFrontendData,
  useHighlight,
  useQuerySource,
} from "@adapttable/core";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BASE_COLUMNS,
  budget,
  DEMO_FILTER_RUNTIME,
  DEMO_GROUP_AGGREGATES,
  EDITING_DEFAULT_LAYOUT,
  LIVE_DEFAULT_LAYOUT,
  PEOPLE,
  type Person,
  personName,
  personStatus,
  reportsTo,
  utilization,
} from "./data";
import { fetchPeople, type PeoplePage, type PeopleParams } from "./mockApi";

export type DataMode = "frontend" | "backend";
export type PageMode = "paged" | "infinite";
export type Density = "comfortable" | "compact";
export type FiltersUi = "popover" | "drawer" | "header";

/**
 * Which load-failure state to show: none, the adapter's own, or a
 * replacement passed through `slots.error`.
 */
export type Failure = "off" | "builtin" | "replaced";

/** The failure the lab simulates. */
const DEMO_FAILURE = new Error("The people service did not answer (503).");

/**
 * A host's own error state, to sit beside the built-in one.
 *
 * Deliberately not a static node: it reads the error it is reporting and
 * offers the retry the source handed it, which is the whole reason this slot
 * takes a function.
 */
const REPLACED_ERROR_SLOT = {
  error: ({ error, retry, retrying }: TableErrorState) => (
    <div className="demo-error" role="alert">
      <strong>Could not load people</strong>
      <p>{error.message}</p>
      {retry && (
        <button type="button" onClick={retry} disabled={retrying}>
          {retrying ? "Retrying…" : "Try again"}
        </button>
      )}
    </div>
  ),
};

/**
 * A host's own card: the identity column as a headline, the rest as a
 * compact grid. It reuses `card.fields`, so every value — cell renderers and
 * editors included — is the one the built-in card would have shown.
 */
function demoCard(row: Person, card: MobileCardModel<Person>): ReactNode {
  const [identity, ...rest] = card.fields;
  return (
    <div className="demo-person-card">
      <p className="demo-person-card__name">{identity?.value}</p>
      <dl className="demo-person-card__grid">
        {rest.map(({ column, label, value }) => (
          <div key={column.key}>
            {label && <dt>{label}</dt>}
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The demo's own card layout, when that toggle is on. */
function cardRenderer(
  customCard: boolean | undefined
): MobileCardRenderer<Person> | undefined {
  return customCard ? demoCard : undefined;
}

/** The failure the lab is simulating, or none. */
function demoError(failure: Failure | undefined): Error | null {
  return failure && failure !== "off" ? DEMO_FAILURE : null;
}

/** The host's own error state, when the lab is showing a replacement. */
function errorSlots(
  failure: Failure | undefined
): { error: (state: TableErrorState) => ReactNode } | undefined {
  return failure === "replaced" ? REPLACED_ERROR_SLOT : undefined;
}

const AdvancedFiltersContext = createContext(false);

/** Feature Lab only — the live demo stays a simple auto form. */
export const AdvancedFiltersProvider = AdvancedFiltersContext.Provider;

function useAdvancedFilters(): boolean {
  return useContext(AdvancedFiltersContext);
}

/** Hide the AND/OR builder without changing the hook's setter contract. */
function withoutFilterTree<T>(source: TableSource<T>): TableSource<T> {
  return { ...source, setFilterTree: undefined };
}

/** A small page size so both modes show real pagination over 30 rows. */
// Five rows by default: enough to show real data while keeping the
// whole table (and often the footer) on one screen.
const DEFAULTS = { limit: 5 };
const TREE_DEFAULTS = { limit: 30 };

/**
 * The URL-persisted column controls every adapter demo spreads onto its
 * `<DataTable>`. Wiring these makes pin / hide / reorder / resize survive a
 * kit remount and a page reload. Density / locale / filters update as props
 * without tearing the table down.
 *
 * `onCellEdit` is frontend-only: mutable local rows. Backend mode omits it
 * so editing stays fully dormant (package DNA — nothing forced).
 *
 * `groupBy` / `groupAggregates` follow the same rule — frontend tier only;
 * server-paginated sources cannot regroup a full result set.
 */
export interface DemoColumnProps {
  columnLayout: ColumnLayoutState;
  onColumnLayoutChange: (next: ColumnLayoutState) => void;
  collapsibleColumnGroups?: boolean;
  onCellEdit?: (row: Person, key: string, nextValue: unknown) => void;
  onRowReorder?: (from: number, to: number, row: Person) => void;
  /** The flash on a changed row — a class, which every adapter honours. */
  rowClassName?: (row: Person, index: number) => string | undefined;
  /** The host's own error state, when the lab is showing a replacement. */
  slots?: { error?: Slot<TableErrorState> };
  /** The demo's own mobile card layout, when that toggle is on. */
  renderCard?: MobileCardRenderer<Person>;
  /** `null` forces grouping off even if the URL carries a groupBy. */
  groupBy?: string | readonly string[] | null;
  groupAggregates?: (
    rows: readonly Person[]
  ) => Partial<Record<string, ReactNode>>;
}

/** Adapter demos provide this — given a source + column controls, render. */
export type TableRender = (
  source: TableSource<Person>,
  columns: DemoColumnProps
) => ReactNode;

/**
 * Demo affordance: pinning a column reveals every hidden column, so the table
 * widens past its container and the pin's stickiness becomes visible while
 * scrolling. Only fires when a *new* pin is added (not on unpin/resize).
 */
function revealHiddenOnPin(
  prev: ColumnLayoutState,
  next: ColumnLayoutState
): ColumnLayoutState {
  const pinAdded = Object.keys(next.pinned).some(
    (key) => !(key in prev.pinned)
  );
  return pinAdded && next.hidden.length > 0 ? { ...next, hidden: [] } : next;
}

function usePeopleQuery(params: PeopleParams) {
  return useInfiniteQuery({
    queryKey: ["people", params],
    queryFn: ({ pageParam }) => fetchPeople({ ...params, page: pageParam }),
    initialPageParam: params.page ?? 1,
    getNextPageParam: (last: PeoplePage) => last.nextPage ?? undefined,
  });
}

/** How often the realtime page applies a patch, in ms. */
const REALTIME_INTERVAL_MS = 1200;

/** The budget the nth live update writes — deterministic, so tests can rely on it. */
function realtimeBudget(tick: number): number {
  return 40000 + ((tick * 7919) % 160000);
}

/**
 * Apply the nth live update.
 *
 * Through the patch API rather than by rebuilding the array: the log rides on
 * the returned rows, which is what lets the incremental engine re-run search,
 * filters and sort for the touched row only. Copying the result would drop it.
 */
function nextRealtimeRows(
  rows: readonly Person[],
  tick: number
): readonly Person[] {
  const target = rows[tick % rows.length];
  if (!target) return rows;
  return applyRowPatchesWithLog(
    rows,
    [updateRow<Person>(target.id, { budget: realtimeBudget(tick) })],
    (row) => row.id
  ).rows;
}

/** The feed line for the nth update, newest first, capped. */
function nextRealtimeFeed(lines: readonly string[], tick: number): string[] {
  const target = PEOPLE[tick % PEOPLE.length];
  if (!target) return [...lines];
  const line = `${personName(target, "en")} · budget → ${realtimeBudget(tick)}`;
  return [line, ...lines].slice(0, 6);
}

/**
 * Drive a live feed of row patches, and report what was applied.
 *
 * Its own hook rather than an effect inside the table body: the timer, the
 * patch and the transcript are one concern, and inlining them pushed the
 * caller past its complexity budget.
 */
function useRealtimeFeed(
  enabled: boolean,
  setData: Dispatch<SetStateAction<readonly Person[]>>
): string[] {
  const [feed, setFeed] = useState<string[]>([]);
  useEffect(() => {
    if (!enabled) return undefined;
    let tick = 0;
    const id = setInterval(() => {
      const at = tick++;
      setData((prev) => nextRealtimeRows(prev, at));
      setFeed((lines) => nextRealtimeFeed(lines, at));
    }, REALTIME_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, [enabled, setData]);
  return feed;
}

/** What the live feed has applied, newest first. */
function RealtimeFeed({ lines }: Readonly<{ lines: readonly string[] }>) {
  return (
    <div className="demo-live-update" data-testid="realtime-feed">
      <span>Applied updates</span>
      {lines.length === 0 ? (
        <span>waiting for the first patch…</span>
      ) : (
        <ol>
          {lines.map((line, index) => (
            <li key={`${line}-${String(index)}`}>{line}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

interface DataProps {
  render: TableRender;
  columns: DemoColumnProps;
  pageMode?: PageMode;
  /** URL-param namespace, so each table on the page has isolated state. */
  urlKey?: string;
  /** Opt-in feature toggles — off renders the plain table (package DNA). */
  grouping?: boolean;
  editing?: boolean;
  tree?: boolean;
  rowMode?: boolean;
  batch?: boolean;
  rowMutations?: boolean;
  rowReorder?: boolean;
  rowPinning?: boolean;
  cellSpan?: boolean;
  extraRows?: boolean;
  rowStyle?: boolean;
  /** Flash the row a change just landed on. */
  highlight?: boolean;
  /** Fail the load, so the error chrome is on screen. */
  failure?: Failure;
  /** Lay the mobile cards out with the demo's own `renderCard`. */
  customCard?: boolean;
  /** What the error state's retry does — here, clear the simulated failure. */
  onRecover?: () => void;
  /** Apply live row patches on a timer, the way a socket feed would. */
  realtime?: boolean;
  /** AND/OR builder — Feature Lab only. Live demo stays a simple form. */
  advancedFilters?: boolean;
  /** Hand the rows their id-derived fields, so a formula can read them. */
  derivedFields?: boolean;
  /**
   * The formula columns the table is rendering. The data hook needs them too:
   * a click on a formula column's header sorts by a key only these columns
   * know how to resolve.
   */
  formulaColumns?: readonly ColumnDef<Person>[];
}

/**
 * The seed rows, with the id-derived fields written onto them.
 *
 * Most of the demo reads `status`, `budget` and `utilization` through a
 * function, so a row carries one only after an edit materializes it. A formula
 * reads FIELDS — `=budget * 0.15` asks the row for `budget` and gets `#NAME?`
 * if it is not there — so a page that lets the reader type one hands the engine
 * rows that actually carry them. The values are the same ones the accessors
 * derive, so nothing on screen changes.
 */
function withDerivedFields(rows: readonly Person[]): Person[] {
  return rows.map((row) => ({
    ...row,
    status: personStatus(row),
    budget: budget(row),
    utilization: utilization(row),
  }));
}

/** The next free id, so an added row never collides with a seeded one. */
function nextId(rows: readonly Person[]): string {
  return String(
    rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1
  );
}

/** A blank person to fill in — the row an Add starts from. */
function blankPerson(rows: readonly Person[]): Person {
  const id = nextId(rows);
  return {
    id,
    name: "",
    email: "",
    role: "",
    team: PEOPLE[0]?.team ?? "",
    nameAr: "",
    roleAr: "",
    teamAr: "",
  };
}

/** Apply whichever of a batch's edits belongs to this row. */
function applyEdits(
  row: Person,
  edits: readonly { row: Person; patch: Record<string, unknown> }[]
): Person {
  const edit = edits.find((one) => one.row.id === row.id);
  return edit ? applyRowPatch(row, edit.patch) : row;
}

/**
 * Apply a row patch, mapping each column key to the field it edits — the same
 * mapping a single cell edit uses.
 */
function applyRowPatch(
  row: Person,
  patch: Readonly<Record<string, unknown>>
): Person {
  let next = row;
  for (const [key, value] of Object.entries(patch)) {
    const field = EDIT_FIELD[key] ?? (key as keyof Person);
    next = { ...next, [field]: value as never };
  }
  return next;
}

/** Column key → row field for composite cells (person shows name; load
 * shows utilisation). Every other column key IS the field name. */
const EDIT_FIELD: Record<string, keyof Person> = {
  person: "name",
  load: "utilization",
  // The timeline cell shows a range; its editor edits the start it sorts by.
  timeline: "start",
};

function Frontend({
  render,
  columns,
  pageMode,
  urlKey,
  grouping,
  editing,
  tree,
  rowMode,
  batch,
  rowMutations,
  rowReorder,
  rowPinning,
  cellSpan,
  extraRows,
  rowStyle,
  highlight,
  failure,
  onRecover,
  customCard,
  realtime,
  advancedFilters,
  derivedFields,
  formulaColumns,
}: Readonly<DataProps>) {
  // Clone so cell edits never mutate the shared PEOPLE seed.
  const [data, setData] = useState<readonly Person[]>(() =>
    derivedFields
      ? withDerivedFields(PEOPLE)
      : PEOPLE.map((row) => ({ ...row }))
  );
  // The demo owns the data, so the demo is what knows which row changed —
  // exactly where a real app would flash it. Note there is no highlight prop
  // on the table: `rowClassName` is the seam, so this works in every kit.
  const flash = useHighlight(highlight === true);
  const onCellEdit = useCallback(
    (row: Person, key: string, nextValue: unknown) => {
      const field = EDIT_FIELD[key] ?? (key as keyof Person);
      setData((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, [field]: nextValue as never } : r
        )
      );
      flash.flashRow(row.id);
    },
    [flash]
  );
  const onBatchEdit = useCallback(
    (edits: readonly { row: Person; patch: Record<string, unknown> }[]) => {
      setData((prev) => prev.map((row) => applyEdits(row, edits)));
      for (const edit of edits) flash.flashRow(edit.row.id);
    },
    [flash]
  );
  // Adding, copying and removing rows: the table asks, the demo owns the list —
  // the same one-way flow a real app's mutation would follow.
  // The new row is built before the update rather than inside it: a state
  // updater must stay pure, and the flash needs the id it produced.
  const onAddRow = useCallback(() => {
    const added = blankPerson(data);
    setData((prev) => [added, ...prev]);
    flash.flashRow(added.id);
  }, [data, flash]);
  const onDuplicateRow = useCallback(
    (row: Person) => {
      const copy = { ...row, id: nextId(data) };
      setData((prev) => [copy, ...prev]);
      flash.flashRow(copy.id);
    },
    [data, flash]
  );
  const onDeleteRow = useCallback((row: Person) => {
    setData((prev) => prev.filter((r) => r.id !== row.id));
  }, []);
  const onRowReorder = useCallback((from: number, to: number) => {
    setData((prev) => applyRowReorder(prev, from, to));
  }, []);
  // A websocket revision can land on whichever row is being edited. Bump all
  // demo revisions so the control remains truthful after sorting/filtering and
  // whichever visible cell the reader chose; rowVersion identifies the one
  // active row without changing any displayed value.
  const simulateLiveUpdate = useCallback(() => {
    setData((prev) =>
      prev.map((row) => ({ ...row, revision: (row.revision ?? 0) + 1 }))
    );
  }, []);
  // Two classes, not one: the mark holds steady under reduced motion, so the
  // user still learns which row changed without anything moving.
  const flashClass = useCallback(
    (row: Person) => {
      if (!flash.isRowHighlighted(row.id)) return undefined;
      return flash.animated ? "demo-flash demo-flash--animated" : "demo-flash";
    },
    [flash]
  );
  const feed = useRealtimeFeed(realtime === true, setData);
  const sourceColumns = useMemo(
    () =>
      formulaColumns && formulaColumns.length > 0
        ? [...BASE_COLUMNS, ...formulaColumns]
        : BASE_COLUMNS,
    [formulaColumns]
  );
  const source = useFrontendData<Person>({
    data,
    error: demoError(failure),
    // A retry that actually recovers: the demo's "server" answers on the
    // second ask, so the button is worth pressing.
    refetch: onRecover,
    // The formula columns join the stable set: a click on one of their headers
    // sorts by a key only they can resolve, and a source that had never heard
    // of the key would quietly sort by nothing.
    columns: sourceColumns,
    arrayExtraKeys: DEMO_FILTER_RUNTIME.arrayExtraKeys,
    numberExtraKeys: DEMO_FILTER_RUNTIME.numberExtraKeys,
    filterFn: DEMO_FILTER_RUNTIME.filterFn,
    // Keep the headless engine active for deep links and restored query state.
    // `withoutFilterTree` below hides only the builder UI outside Feature Lab.
    filterTreeFn: (row: Person, tree: QueryFilterGroup) =>
      evaluateFilterTree(
        tree,
        row,
        DEMO_FILTER_RUNTIME.defs,
        DEMO_FILTER_RUNTIME.registry
      ),
    // A hierarchy needs its parents in hand: a five-row page cut through an
    // org chart leaves every visible person a root, so the tree demo takes the
    // whole team at once.
    defaults: tree ? TREE_DEFAULTS : DEFAULTS,
    paginationMode: pageMode,
    urlKey,
  });
  const tableSource = advancedFilters ? source : withoutFilterTree(source);
  return (
    <>
      {editing ? (
        <div className="demo-live-update">
          <span>With an editor open, test an incoming server change.</span>
          <button
            type="button"
            data-adapttable-part="demo-live-update"
            onMouseDown={(event) => {
              // A websocket does not steal focus. Prevent the editor from
              // blur-committing before the row actually changes.
              event.preventDefault();
            }}
            onClick={simulateLiveUpdate}
          >
            Simulate incoming update
          </button>
        </div>
      ) : null}
      {realtime ? <RealtimeFeed lines={feed} /> : null}
      {render(tableSource, {
        ...columns,
        // Always wired, never conditional: there is no highlight prop on the
        // table, `rowClassName` is the seam every adapter already honours,
        // and a disarmed `useHighlight` simply never returns a class.
        rowClassName: flashClass,
        slots: errorSlots(failure),
        renderCard: cardRenderer(customCard),
        // Both features are strictly opt-in: the toggles mirror the API —
        // pass `onCellEdit` and cells edit; pass `groupBy` and groups appear.
        ...(editing
          ? {
              onCellEdit,
              rowVersion: (row: Person) => row.revision ?? 0,
            }
          : {}),
        // Row mode changes the commit unit: every field of the row opens
        // together and arrives as one patch.
        ...(rowMode
          ? {
              rowEditing: true,
              onRowEdit: (row: Person, patch: Record<string, unknown>) => {
                setData((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? applyRowPatch(r, patch) : r
                  )
                );
                flash.flashRow(row.id);
              },
            }
          : {}),
        // Two keys, so the demo shows what nesting looks like: each status
        // sits inside its team, and every header totals its whole subtree.
        ...(grouping
          ? {
              groupBy: ["team", "status"],
              groupAggregates: DEMO_GROUP_AGGREGATES,
              groupFooters: true,
              // Biggest team first, from the same rows the subtotal reads.
              groupSort: (a: GroupNode<Person>, b: GroupNode<Person>) =>
                b.leafRows.length - a.leafRows.length,
            }
          : { groupBy: null }),
        // The same thirty people read as the org chart they already are:
        // the first person on each team leads it, the rest report to them.
        // Nothing about the data changes — only how it is declared.
        ...(tree ? { getParentId: reportsTo, treeColumn: "person" } : {}),
        // Batch mode: every editable cell is a field, one write at the end.
        ...(batch ? { batchEditing: true, onBatchEdit } : {}),
        // Three handlers, three controls: Add in the toolbar, Duplicate and
        // Delete on every row.
        ...(rowMutations ? { onAddRow, onDuplicateRow, onDeleteRow } : {}),
        ...(rowReorder ? { onRowReorder } : {}),
        ...(rowPinning ? { onPinnedRowIdsChange: () => undefined } : {}),
        ...(cellSpan
          ? {
              getCellSpan: ({
                column,
                rowIndex,
              }: {
                column: { key: string };
                rowIndex: number;
              }) =>
                column.key === "person" && rowIndex === 0
                  ? { colSpan: 2 }
                  : undefined,
            }
          : {}),
        ...(extraRows
          ? {
              extraRows: [
                {
                  key: "sep",
                  kind: "separator" as const,
                  beforeRowId: data[1]?.id,
                },
                {
                  key: "note",
                  kind: "fullWidth" as const,
                  render: () => "Section note",
                },
              ],
            }
          : {}),
        ...(rowStyle
          ? {
              rowStyle: (_row: Person, index: number) =>
                index === 0
                  ? { backgroundColor: "rgba(255, 193, 7, 0.22)" }
                  : undefined,
              rowHeight: 48,
            }
          : {}),
      })}
    </>
  );
}

function Backend({
  render,
  columns,
  pageMode,
  urlKey,
  advancedFilters,
}: Readonly<DataProps>) {
  const source = useQuerySource<Person, PeopleParams, PeoplePage>({
    usePaginatedQuery: usePeopleQuery,
    arrayExtraKeys: DEMO_FILTER_RUNTIME.arrayExtraKeys,
    numberExtraKeys: DEMO_FILTER_RUNTIME.numberExtraKeys,
    defaults: DEFAULTS,
    paginationMode: pageMode,
    urlKey,
    supports: { filterTree: Boolean(advancedFilters), facets: true },
    facetKeys: ["team"],
    selectPage: (page) => ({
      rows: page.items,
      total: page.total,
      facets: page.facets,
    }),
  });
  // No onCellEdit — editing stays dormant on the server path.
  return (
    <>{render(advancedFilters ? source : withoutFilterTree(source), columns)}</>
  );
}

/**
 * Render the same table against either data path. Only one data hook is
 * mounted at a time (remounted on `mode` change), so the headless source is
 * the single thing that differs — the adapter markup is identical. The column
 * layout is URL-persisted here (shared by both paths) so pin/hide/reorder
 * survive the re-mount.
 */
export function DemoBody({
  mode,
  pageMode,
  urlKey,
  defaultColumnLayout,
  render,
  grouping,
  editing,
  tree,
  rowMode,
  batch,
  rowMutations,
  rowReorder,
  rowPinning,
  cellSpan,
  extraRows,
  rowStyle,
  highlight,
  failure,
  onRecover,
  customCard,
  realtime,
  columnGroups,
  derivedFields,
  formulaColumns,
}: Readonly<{
  mode: DataMode;
  pageMode?: PageMode;
  urlKey?: string;
  defaultColumnLayout?: Partial<ColumnLayoutState>;
  render: TableRender;
  grouping?: boolean;
  tree?: boolean;
  editing?: boolean;
  rowMode?: boolean;
  batch?: boolean;
  rowMutations?: boolean;
  rowReorder?: boolean;
  rowPinning?: boolean;
  cellSpan?: boolean;
  extraRows?: boolean;
  rowStyle?: boolean;
  highlight?: boolean;
  failure?: Failure;
  onRecover?: () => void;
  customCard?: boolean;
  realtime?: boolean;
  columnGroups?: boolean;
  /** Hand the rows their id-derived fields, so a formula can read them. */
  derivedFields?: boolean;
  /** The formula columns the table renders, so the data hook can sort by them. */
  formulaColumns?: readonly ColumnDef<Person>[];
}>) {
  const advancedFilters = useAdvancedFilters();
  // Demos mounted WITH editing (the /editing page) keep email visible — it
  // is the column the walkthrough edits. Only the shared live default is
  // swapped; explicit layouts (the wide showcase's pins) pass through.
  const resolvedDefaultLayout =
    editing && defaultColumnLayout === LIVE_DEFAULT_LAYOUT
      ? EDITING_DEFAULT_LAYOUT
      : defaultColumnLayout;
  const { layout, onLayoutChange } = useColumnLayoutUrlState({
    urlKey,
    defaultColumnLayout: resolvedDefaultLayout,
  });
  const onColumnLayoutChange = useCallback(
    (next: ColumnLayoutState) =>
      onLayoutChange(revealHiddenOnPin(layout, next)),
    [layout, onLayoutChange]
  );
  const columns: DemoColumnProps = {
    columnLayout: layout,
    onColumnLayoutChange,
    collapsibleColumnGroups: columnGroups !== false,
  };

  return mode === "backend" ? (
    <Backend
      render={render}
      columns={columns}
      pageMode={pageMode}
      urlKey={urlKey}
      advancedFilters={advancedFilters}
    />
  ) : (
    <Frontend
      render={render}
      columns={columns}
      pageMode={pageMode}
      urlKey={urlKey}
      grouping={grouping}
      editing={editing}
      tree={tree}
      rowMode={rowMode}
      batch={batch}
      rowMutations={rowMutations}
      rowReorder={rowReorder}
      rowPinning={rowPinning}
      cellSpan={cellSpan}
      extraRows={extraRows}
      rowStyle={rowStyle}
      highlight={highlight}
      failure={failure}
      onRecover={onRecover}
      customCard={customCard}
      realtime={realtime}
      advancedFilters={advancedFilters}
      derivedFields={derivedFields}
      formulaColumns={formulaColumns}
    />
  );
}
