import {
  type ColumnLayoutState,
  type TableSource,
  useBackendData,
  useColumnLayoutUrlState,
  useFrontendData,
} from "@adapttable/core";
import { useInfiniteQuery } from "@tanstack/react-query";
import { type ReactNode, useCallback } from "react";

import {
  BASE_COLUMNS,
  COUNT_NUMBER_EXTRA_KEYS,
  matchesDemoFilters,
  PEOPLE,
  type Person,
  sanitizeDemoParams,
} from "./data";
import { fetchPeople, type PeoplePage, type PeopleParams } from "./mockApi";

export type DataMode = "frontend" | "backend";
export type PageMode = "paged" | "infinite";
export type Density = "comfortable" | "compact";

/** A small page size so both modes show real pagination over 30 rows. */
const DEFAULTS = { limit: 8 };

/**
 * The URL-persisted column controls every adapter demo spreads onto its
 * `<DataTable>`. Wiring these makes pin / hide / reorder / resize survive a
 * re-mount (density, locale, … all remount the demo) and a page reload.
 */
export interface DemoColumnProps {
  columnLayout: ColumnLayoutState;
  onColumnLayoutChange: (next: ColumnLayoutState) => void;
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
}

function Frontend({ render, columns, pageMode, urlKey }: Readonly<DataProps>) {
  const source = useFrontendData<Person>({
    data: PEOPLE,
    columns: BASE_COLUMNS,
    arrayExtraKeys: ["team"],
    numberExtraKeys: COUNT_NUMBER_EXTRA_KEYS,
    filterFn: matchesDemoFilters,
    defaults: DEFAULTS,
    paginationMode: pageMode,
    urlKey,
  });
  return <>{render(source, columns)}</>;
}

function Backend({ render, columns, pageMode, urlKey }: Readonly<DataProps>) {
  const source = useBackendData<Person, PeopleParams, PeoplePage>({
    usePaginatedQuery: usePeopleQuery,
    arrayExtraKeys: ["team"],
    numberExtraKeys: COUNT_NUMBER_EXTRA_KEYS,
    defaults: DEFAULTS,
    sanitizeParams: sanitizeDemoParams,
    paginationMode: pageMode,
    urlKey,
  });
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
}: Readonly<{
  mode: DataMode;
  pageMode?: PageMode;
  urlKey?: string;
  defaultColumnLayout?: Partial<ColumnLayoutState>;
  render: TableRender;
}>) {
  const { layout, onLayoutChange } = useColumnLayoutUrlState({
    urlKey,
    defaultLayout: defaultColumnLayout,
  });
  const onColumnLayoutChange = useCallback(
    (next: ColumnLayoutState) =>
      onLayoutChange(revealHiddenOnPin(layout, next)),
    [layout, onLayoutChange]
  );
  const columns: DemoColumnProps = {
    columnLayout: layout,
    onColumnLayoutChange,
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
    />
  );
}
