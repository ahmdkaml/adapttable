import type { GroupNode } from "@adapttable/core";
import {
  applyRowReorder,
  type ColumnLayoutState,
  evaluateFilterTree,
  type TableSource,
  useColumnLayoutUrlState,
  useFrontendData,
  useQuerySource,
} from "@adapttable/core";
import { useInfiniteQuery } from "@tanstack/react-query";
import { type ReactNode, useCallback, useState } from "react";

import {
  BASE_COLUMNS,
  DEMO_FILTER_RUNTIME,
  DEMO_GROUP_AGGREGATES,
  EDITING_DEFAULT_LAYOUT,
  LIVE_DEFAULT_LAYOUT,
  PEOPLE,
  type Person,
  reportsTo,
} from "./data";
import { fetchPeople, type PeoplePage, type PeopleParams } from "./mockApi";

export type DataMode = "frontend" | "backend";
export type PageMode = "paged" | "infinite";
export type Density = "comfortable" | "compact";
export type FiltersUi = "popover" | "drawer";

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
}: Readonly<DataProps>) {
  // Clone so cell edits never mutate the shared PEOPLE seed.
  const [data, setData] = useState(() => PEOPLE.map((row) => ({ ...row })));
  const onCellEdit = useCallback(
    (row: Person, key: string, nextValue: unknown) => {
      const field = EDIT_FIELD[key] ?? (key as keyof Person);
      setData((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, [field]: nextValue as never } : r
        )
      );
    },
    []
  );
  const onBatchEdit = useCallback(
    (edits: readonly { row: Person; patch: Record<string, unknown> }[]) => {
      setData((prev) => prev.map((row) => applyEdits(row, edits)));
    },
    []
  );
  // Adding, copying and removing rows: the table asks, the demo owns the list —
  // the same one-way flow a real app's mutation would follow.
  const onAddRow = useCallback(() => {
    setData((prev) => [blankPerson(prev), ...prev]);
  }, []);
  const onDuplicateRow = useCallback((row: Person) => {
    setData((prev) => [{ ...row, id: nextId(prev) }, ...prev]);
  }, []);
  const onDeleteRow = useCallback((row: Person) => {
    setData((prev) => prev.filter((r) => r.id !== row.id));
  }, []);
  const onRowReorder = useCallback((from: number, to: number) => {
    setData((prev) => applyRowReorder(prev, from, to));
  }, []);
  // A live update under an open editor is the conflict the table asks
  // about — this is the demo's websocket, not a second commit path.
  const bumpFirstRow = useCallback(() => {
    setData((prev) => {
      const first = prev[0];
      if (!first) return prev;
      return [
        {
          ...first,
          name: `${first.name.replace(/ \*$/, "")} *`,
        },
        ...prev.slice(1),
      ];
    });
  }, []);
  const source = useFrontendData<Person>({
    data,
    columns: BASE_COLUMNS,
    arrayExtraKeys: DEMO_FILTER_RUNTIME.arrayExtraKeys,
    numberExtraKeys: DEMO_FILTER_RUNTIME.numberExtraKeys,
    filterFn: DEMO_FILTER_RUNTIME.filterFn,
    // The registry comes along: the demo declares a custom filter type, and
    // without it the tree falls back to the built-ins and matches every row.
    filterTreeFn: (row, tree) =>
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
  return (
    <>
      {editing ? (
        <button
          type="button"
          className="hint"
          data-adapttable-part="demo-live-update"
          onMouseDown={(event) => {
            // A websocket does not steal focus. Prevent the editor from
            // blur-committing before the row actually changes.
            event.preventDefault();
          }}
          onClick={bumpFirstRow}
        >
          Simulate live update
        </button>
      ) : null}
      {render(source, {
        ...columns,
        // Both features are strictly opt-in: the toggles mirror the API —
        // pass `onCellEdit` and cells edit; pass `groupBy` and groups appear.
        ...(editing ? { onCellEdit } : {}),
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

function Backend({ render, columns, pageMode, urlKey }: Readonly<DataProps>) {
  const source = useQuerySource<Person, PeopleParams, PeoplePage>({
    usePaginatedQuery: usePeopleQuery,
    arrayExtraKeys: DEMO_FILTER_RUNTIME.arrayExtraKeys,
    numberExtraKeys: DEMO_FILTER_RUNTIME.numberExtraKeys,
    defaults: DEFAULTS,
    paginationMode: pageMode,
    urlKey,
    supports: { filterTree: true, facets: true },
    facetKeys: ["team"],
    selectPage: (page) => ({
      rows: page.items,
      total: page.total,
      facets: page.facets,
    }),
  });
  // No onCellEdit — editing stays dormant on the server path.
  return <>{render(source, columns)}</>;
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
}>) {
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
    collapsibleColumnGroups: true,
  };

  return mode === "backend" ? (
    <Backend
      render={render}
      columns={columns}
      pageMode={pageMode}
      urlKey={urlKey}
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
    />
  );
}
