/**
 * classNames ↔ data-adapttable-part parity: every rendered part carries the
 * class of its camelCased key, and every key's class shows up in at least
 * one rendered state — the two surfaces can never drift apart again.
 */
import {
  createMemoryAdapter,
  type FilterDef,
  useFrontendData,
} from "@adapttable/core";
import type * as AdapterModule from "@adapttable/core/adapter";
import { useDataTableShell } from "@adapttable/core/adapter";
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";
import type { ColumnDef, DataTableClassNames } from "./index";

vi.mock("@adapttable/core/adapter", async (importOriginal) => {
  const actual = await importOriginal<typeof AdapterModule>();
  return { ...actual, useDataTableShell: vi.fn(actual.useDataTableShell) };
});

const actualAdapter = await vi.importActual<typeof AdapterModule>(
  "@adapttable/core/adapter"
);

/**
 * Force a controlled virtual window by overriding the shell's `tableProps` —
 * the renderers read `rowEntries` exactly as from a real virtualizer.
 */
function mockVirtualWindow(top: number, bottom: number, indices = [0, 1]) {
  vi.mocked(useDataTableShell).mockImplementation((props, render) => {
    const real = actualAdapter.useDataTableShell(props, render);
    return {
      ...real,
      tableProps: {
        ...real.tableProps,
        rowEntries: indices
          .filter((index) => index < real.tableProps.rows.length)
          .map((index) => ({
            row: real.tableProps.rows[index]!,
            index,
            key: String(real.tableProps.getRowId(real.tableProps.rows[index])),
          })),
        paddingTop: top,
        paddingBottom: bottom,
        measureElement: () => undefined,
      },
    };
  });
}

function restoreRealShell() {
  vi.mocked(useDataTableShell).mockImplementation(
    actualAdapter.useDataTableShell
  );
}

beforeEach(() => {
  restoreRealShell();
});

interface Row {
  id: string;
  name: string;
  team: string;
  qty: number;
}

const ROWS: Row[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  name: `Item ${String(i + 1).padStart(2, "0")}`,
  team: i % 2 ? "Core" : "Web",
  qty: i,
}));

/** The same columns, with a rule the empty string breaks. */
const VALIDATED_COLUMNS: ColumnDef<Row>[] = [
  {
    key: "name",
    header: "Name",
    accessor: (r) => r.name,
    editable: true,
    editor: "text",
    validate: (value) =>
      String(value).trim() === "" ? "A name is required" : undefined,
  },
];

const columns: ColumnDef<Row>[] = [
  {
    key: "name",
    header: "Name",
    accessor: (r) => r.name,
    sortable: true,
    group: "Identity",
    headerActions: <button type="button">info</button>,
    editable: true,
    editor: "text",
  },
  {
    key: "team",
    header: "Team",
    accessor: (r) => r.team,
    sortable: true,
    group: "Identity",
    filter: { type: "select", options: "auto" },
  },
  {
    key: "qty",
    header: "Qty",
    accessor: (r) => String(r.qty),
    sortValue: (r) => r.qty,
    sortable: true,
    group: "Facts",
  },
];

const filters: FilterDef<Row>[] = [
  { key: "name", type: "text", label: "Name" },
  { key: "ok", type: "boolean", label: "Ok" },
  { key: "qty", type: "numberRange", label: "Qty" },
  { key: "team", type: "checklist", label: "Team" },
  {
    key: "tag",
    type: "multiSelect",
    label: "Tag",
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  },
  {
    key: "state",
    type: "multiSelect",
    label: "State",
    options: () =>
      new Promise((resolve) =>
        setTimeout(() => resolve([{ value: "x", label: "X" }]), 60_000)
      ),
  },
];

/** camelCase a kebab-case part name. */
const camel = (part: string): string =>
  part.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Every data-adapttable-part currently in the DOM (portals included). */
/**
 * Parts that are core's, not the kit's: the visually-hidden live regions.
 *
 * They carry no class hook on purpose. Their styling is what makes them
 * announceable — clipped rather than hidden, present in the layout — so handing
 * it to a host is handing over a way to silence the table. Anything visible
 * belongs in the contract; these do not.
 */
const A11Y_PARTS = new Set([
  "export-announcer",
  "grid-announcer",
  "row-reorder-announcer",
]);

/**
 * Class hooks that modify an existing part rather than naming one of their own.
 * `cellSelected` is a second class on `data-adapttable-part="cell"` when the cell
 * sits inside the selected range, so direction 2 below — "every key rendered as
 * a part" — can never see it, and inventing a `cell-selected` part to satisfy
 * the test would put two parts on one element. It is verified in
 * `selectedCells.test.tsx`, which drives a real Shift+arrow selection;
 * `cellMatch` / `cellMatchCurrent` are the same shape for find hits and are
 * verified in `findInTable.test.tsx`.
 */
const STATE_CLASSES = new Set([
  "cellSelected",
  "groupFooterRow",
  "groupFooterCell",
  "groupMoreRow",
  "groupMoreCell",
  "cellMatch",
  "cellMatchCurrent",
]);

function collectParts(): Map<string, Element[]> {
  const map = new Map<string, Element[]>();
  for (const el of document.body.querySelectorAll("[data-adapttable-part]")) {
    const part = el.getAttribute("data-adapttable-part")!;
    if (A11Y_PARTS.has(part)) continue;
    map.set(part, [...(map.get(part) ?? []), el]);
  }
  return map;
}

function Harness(props: {
  mode?: "paged" | "infinite";
  isMobile?: boolean;
  data?: readonly Row[];
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
  url?: string;
  limit?: number;
  override?: Partial<Omit<Parameters<typeof DataTable<Row>>[0], "mode">>;
}) {
  const source = useFrontendData<Row>({
    data: props.data ?? ROWS,
    urlAdapter: createMemoryAdapter(props.url ?? ""),
    columns,
    paginationMode: props.mode ?? "paged",
    isLoading: props.isLoading,
    isFetching: props.isFetching,
    error: props.error ?? null,
    refetch: () => undefined,
    defaults: { limit: props.limit ?? 10 },
  });
  return (
    <DataTable
      source={source}
      columns={columns}
      rowKey={(r) => r.id}
      forceMobile={props.isMobile}
      filters={filters}
      headerFilters
      bulkActions={[
        {
          key: "del",
          label: "Delete",
          onClick: () => Promise.reject(new Error("bulk boom")),
        },
      ]}
      rowActions={[{ key: "open", label: "Open", onClick: vi.fn() }]}
      savedViews={{ storageKey: "parity" }}
      exportCsv
      onAddRow={vi.fn()}
      enableColumnMenu
      collapsibleColumnGroups
      resizableColumns
      multiSort
      tableFooter={<span>Footer slot</span>}
      summaryRow={() => ({ qty: "sum" })}
      groupAggregates={() => ({ qty: "agg" })}
      renderRowDetail={(r) => <div>{r.name}</div>}
      onCellEdit={vi.fn()}
      {...props.override}
    />
  );
}

const part = (name: string): Element | null =>
  document.body.querySelector(`[data-adapttable-part="${name}"]`);

/** Mount every state the table can render and union the parts seen. */
async function renderAllStates(classNames?: DataTableClassNames) {
  const seen = new Map<string, Element[]>();
  const absorb = () => {
    for (const [name, els] of collectParts()) {
      seen.set(name, [...(seen.get(name) ?? []), ...els]);
    }
  };
  const mount = (props: Parameters<typeof Harness>[0]) => {
    const view = render(
      <Harness {...props} override={{ classNames, ...props.override }} />
    );
    absorb();
    return view;
  };

  // Desktop kitchen sink: open filters, select rows, menus, detail, edit.
  const desktop = mount({});
  fireEvent.click(part("filters-button")!);
  absorb();
  const addCondition = desktop.getByRole("button", { name: "Add condition" });
  fireEvent.click(addCondition);
  absorb();
  fireEvent.click(part("selection-cell")!.querySelector("input")!);
  absorb();
  // Bulk failure surfaces the bulk error message.
  await act(async () => {
    fireEvent.click(part("bulk-button")!);
    await Promise.resolve();
  });
  absorb();
  const headerBox = part("selection-header")?.querySelector("input");
  if (headerBox) {
    fireEvent.click(headerBox);
    absorb();
  }
  fireEvent.click(part("column-menu-button")!);
  absorb();
  const more = part("column-menu-more");
  if (more) {
    fireEvent.click(more);
    absorb();
  }
  // Saved views: open, name one, save — the list + delete render.
  fireEvent.click(part("views-button")!);
  absorb();
  fireEvent.change(part("views-input")!, { target: { value: "Mine" } });
  fireEvent.click(part("views-save")!);
  absorb();
  const expand = part("expand-button");
  if (expand) {
    fireEvent.click(expand);
    absorb();
  }
  const editable = part("edit-cell-activate");
  if (editable) {
    fireEvent.doubleClick(editable);
    absorb();
  }
  // Multi-sort chain → sort-index badges.
  const sortButtons = document.body.querySelectorAll(
    '[data-adapttable-part="sort-button"]'
  );
  fireEvent.click(sortButtons[0]!, { shiftKey: true });
  fireEvent.click(sortButtons[1]!, { shiftKey: true });
  absorb();
  desktop.unmount();

  // A host-handled export mid-flight → the busy button's spinner. The promise
  // is left unsettled on purpose: the affordance only exists while it is.
  const exporting = mount({
    override: {
      exportCsv: { request: () => new Promise<void>(() => undefined) },
    },
  });
  await act(async () => {
    fireEvent.click(part("export-csv-button")!);
    await Promise.resolve();
  });
  absorb();
  exporting.unmount();

  // Drawer filters mode (panel, header, footer, close, done, backdrop) with
  // an active filter (count badge + chips + chip remove).
  const drawer = mount({
    url: "f_name=Item",
    override: { filtersMode: "drawer" },
  });
  fireEvent.click(part("filters-button")!);
  absorb();
  drawer.unmount();

  // A rejected save: the cell carries the reason and the undo it offers.
  const rejected = mount({
    override: {
      onCellEdit: () => Promise.reject(new Error("Could not save")),
      onEditRollback: () => undefined,
    },
  });
  const saveActivate = part("edit-cell-activate");
  if (saveActivate) {
    fireEvent.doubleClick(saveActivate);
    const saveEditor = part("edit-cell-editor");
    if (saveEditor) {
      fireEvent.change(saveEditor, { target: { value: "Item 99" } });
      fireEvent.keyDown(saveEditor, { key: "Enter" });
      await act(async () => {
        await Promise.resolve();
      });
      absorb();
    }
  }
  rejected.unmount();

  // A rejected commit: the editor stays open with its message beside it.
  const invalid = mount({
    override: {
      onCellEdit: () => undefined,
      columns: VALIDATED_COLUMNS,
    },
  });
  const activate = part("edit-cell-activate");
  if (activate) {
    fireEvent.doubleClick(activate);
    absorb();
    const editor = part("edit-cell-editor");
    if (editor) {
      fireEvent.change(editor, { target: { value: "" } });
      await act(async () => {
        fireEvent.keyDown(editor, { key: "Enter" });
        await Promise.resolve();
      });
      absorb();
    }
  }
  invalid.unmount();

  // Tree data: an open parent renders the chevron, an indented cell and — on
  // the leaf beside it — the spacer that holds a chevron's width.
  const tree = mount({
    override: {
      getParentId: (row: Row) => (row.id === "2" ? "1" : undefined),
      expandedIds: ["1"],
    },
  });
  absorb();
  tree.unmount();

  // Row grouping (desktop + mobile cards).
  mount({ url: "groupBy=team" }).unmount();
  const groupedMobile = mount({ url: "groupBy=team", isMobile: true });
  absorb();
  groupedMobile.unmount();

  // Row reorder: desktop grip + header, mobile up/down. Isolated so grouping
  // does not refuse the column and fire a devWarn in the kitchen-sink mounts.
  mount({ override: { onRowReorder: vi.fn() } }).unmount();
  mount({ isMobile: true, override: { onRowReorder: vi.fn() } }).unmount();

  mount({
    override: {
      extraRows: [
        { key: "s", kind: "separator", beforeRowId: "2" },
        { key: "n", kind: "fullWidth", render: () => "Note" },
      ],
    },
  }).unmount();
  mount({
    isMobile: true,
    override: {
      extraRows: [
        { key: "s", kind: "separator", beforeRowId: "2" },
        { key: "n", kind: "fullWidth", render: () => "Note" },
      ],
    },
  }).unmount();

  // Mobile cards with an expanded card detail.
  const mobile = mount({ isMobile: true });
  const cardExpand = part("expand-button");
  if (cardExpand) {
    fireEvent.click(cardExpand);
    absorb();
  }
  mobile.unmount();

  // Infinite mode (load-more + toolbar rows-per-page), both layouts.
  mount({ mode: "infinite" }).unmount();
  mount({ mode: "infinite", isMobile: true }).unmount();

  // Deep pager → ellipsis.
  mount({ limit: 1 }).unmount();

  // Background refresh → the non-blocking progress indicator.
  mount({ isFetching: true }).unmount();

  // Loading skeletons, error + retry, empty, and no-results + clear.
  mount({ data: [], isLoading: true }).unmount();
  mount({ data: [], isLoading: true, isMobile: true }).unmount();
  mount({ data: [], error: new Error("boom") }).unmount();
  mount({ data: [] }).unmount();
  mount({ data: [], url: "q=zzz" }).unmount();

  // Virtualized window → spacers (desktop rows and mobile cards).
  mockVirtualWindow(40, 40);
  mount({ mode: "infinite", override: { virtualize: true } }).unmount();
  mount({
    mode: "infinite",
    isMobile: true,
    override: { virtualize: true },
  }).unmount();
  restoreRealShell();

  return seen;
}

// TS enforces this fixture in BOTH directions: the `satisfies` on the
// FIXTURE below rejects any missing key, and the exported proofs reject
// both missing and extra keys — so this list is always exactly the
// DataTableClassNames surface.
const KEYS = [
  "root",
  "toolbar",
  "search",
  "searchField",
  "searchIcon",
  "sortSelect",
  "rowsPerPage",
  "filtersButton",
  "filtersIcon",
  "filtersCount",
  "editCellError",
  "editCellSaveError",
  "editCellRollback",
  "treeCell",
  "treeToggle",
  "treeSpacer",
  "addRow",
  "exportCsvButton",
  "exportSpinner",
  "filtersAnchor",
  "filtersBackdrop",
  "filtersPopover",
  "filtersPanel",
  "filtersHeader",
  "filtersTitle",
  "filtersClose",
  "filtersBody",
  "filtersFooter",
  "filtersClear",
  "filtersDone",
  "filtersForm",
  "filterTree",
  "filterTreeGroup",
  "filterTreeCondition",
  "filterTreeActions",
  "filterTreeRemove",
  "filterField",
  "filterLabel",
  "filterInput",
  "filterSelect",
  "filterOperator",
  "filterCheckboxGroup",
  "filterCheckbox",
  "filterOptionsLoading",
  "filterChecklist",
  "filterChecklistSearch",
  "filterChecklistActions",
  "filterChecklistList",
  "filterChecklistCount",
  "chips",
  "chip",
  "chipRemove",
  "columnMenu",
  "columnMenuButton",
  "columnMenuPanel",
  "columnMenuHeader",
  "columnMenuTitle",
  "columnMenuItem",
  "columnMenuGrip",
  "columnMenuLabel",
  "columnMenuVisibility",
  "columnMenuPin",
  "columnMenuSeparator",
  "columnMenuReset",
  "columnMenuAutoSize",
  "columnMenuSearch",
  "columnMenuBulk",
  "columnMenuBulkButton",
  "columnMenuMore",
  "columnMenuSubmenu",
  "columnMenuAction",
  "headerActions",
  "tableFooter",
  "viewsMenu",
  "viewsButton",
  "viewsPanel",
  "viewsRow",
  "viewsItem",
  "viewsDelete",
  "viewsSaveRow",
  "viewsInput",
  "viewsSave",
  "viewsDivider",
  "resizeHandle",
  "bulkBar",
  "bulkButton",
  "bulkError",
  "selectAllBanner",
  "selectAllText",
  "selectAllButton",
  "table",
  "thead",
  "headerRow",
  "headerCell",
  "filterHeaderRow",
  "filterHeaderCell",
  "filterHeaderInput",
  "headerGroupRow",
  "headerGroupCell",
  "columnGroupToggle",
  "sortButton",
  "sortIndex",
  "tbody",
  "row",
  "cell",
  "cellSelected",
  "groupFooterRow",
  "groupFooterCell",
  "groupMoreRow",
  "groupMoreCell",
  "cellMatch",
  "cellMatchCurrent",
  "expandHeader",
  "expandCell",
  "expandButton",
  "detailRow",
  "detailCell",
  "cardDetail",
  "actionsHeader",
  "actionsCell",
  "actionButton",
  "reorderHeader",
  "reorderCell",
  "rowReorderHandle",
  "rowReorderButtons",
  "rowReorderUp",
  "rowReorderDown",
  "selectionHeader",
  "selectionCell",
  "checkbox",
  "loadMore",
  "loadMoreButton",
  "groupRow",
  "groupCell",
  "groupCard",
  "groupToggle",
  "groupSelect",
  "groupLabel",
  "groupCount",
  "groupAggregate",
  "editCellActivate",
  "editCellEditor",
  "cards",
  "card",
  "cardActions",
  "cardRow",
  "cardLabel",
  "cardValue",
  "scrollBox",
  "virtualSpacer",
  "separatorRow",
  "separatorCell",
  "fullWidthRow",
  "fullWidthCell",
  "summary",
  "summaryRow",
  "summaryCell",
  "summaryCard",
  "footer",
  "pager",
  "pagePrev",
  "pageNext",
  "pageNumber",
  "pageEllipsis",
  "empty",
  "emptyClear",
  "loading",
  "loadingTable",
  "loadingHeaderRow",
  "loadingHeaderCell",
  "loadingRow",
  "loadingCell",
  "loadingLine",
  "loadingCards",
  "loadingCard",
  "refreshIndicator",
  "error",
  "retryButton",
] as const;

type Key = (typeof KEYS)[number];
type Expect<T extends true> = T;
/** Compile-only proof: no DataTableClassNames key is missing from KEYS. */
export type FixtureIsComplete = Expect<
  Exclude<keyof DataTableClassNames, Key> extends never ? true : false
>;
/** Compile-only proof: KEYS declares nothing DataTableClassNames lacks. */
export type FixtureHasNoExtras = Expect<
  Exclude<Key, keyof DataTableClassNames> extends never ? true : false
>;

describe("classNames \u2194 part parity (unstyled)", () => {
  const FIXTURE = Object.fromEntries(
    KEYS.map((key) => [key, `cn-${key}`])
  ) as Record<Key, string> satisfies Required<DataTableClassNames>;

  it("every rendered part carries its key's class, and every key renders", async () => {
    window.localStorage.clear();
    const seen = await renderAllStates(FIXTURE);

    // Direction 1 — part → key: each rendered part maps to a declared key
    // and every element of that part carries the key's class.
    const unmappedParts: string[] = [];
    const unclassed: string[] = [];
    for (const [name, els] of seen) {
      const key = camel(name) as Key;
      if (!KEYS.includes(key)) {
        unmappedParts.push(name);
        continue;
      }
      if (!els.every((el) => el.classList.contains(`cn-${key}`))) {
        unclassed.push(name);
      }
    }
    expect(unmappedParts).toEqual([]);
    expect(unclassed).toEqual([]);

    // Direction 2 — key → part: every declared key showed up as a rendered
    // part in at least one state.
    const renderedKeys = new Set([...seen.keys()].map(camel));
    const neverRendered = KEYS.filter(
      (key) => !renderedKeys.has(key) && !STATE_CLASSES.has(key)
    );
    expect(neverRendered).toEqual([]);
  });
});
