import {
  type TableSource,
  useBackendData,
  useFrontendData,
} from "@adapttable/core";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

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

/** A small page size so both modes show real pagination over 30 rows. */
const DEFAULTS = { limit: 8 };

/** Adapter demos provide this — given a source, render their `<DataTable>`. */
export type TableRender = (source: TableSource<Person>) => ReactNode;

function usePeopleQuery(params: PeopleParams) {
  return useInfiniteQuery({
    queryKey: ["people", params],
    queryFn: ({ pageParam }) => fetchPeople({ ...params, page: pageParam }),
    initialPageParam: params.page ?? 1,
    getNextPageParam: (last: PeoplePage) => last.nextPage ?? undefined,
  });
}

function Frontend({
  render,
  pageMode,
}: Readonly<{ render: TableRender; pageMode?: PageMode }>) {
  const source = useFrontendData<Person>({
    data: PEOPLE,
    columns: BASE_COLUMNS,
    arrayExtraKeys: ["team"],
    numberExtraKeys: COUNT_NUMBER_EXTRA_KEYS,
    filterFn: matchesDemoFilters,
    defaults: DEFAULTS,
    paginationMode: pageMode,
  });
  return <>{render(source)}</>;
}

function Backend({
  render,
  pageMode,
}: Readonly<{ render: TableRender; pageMode?: PageMode }>) {
  const source = useBackendData<Person, PeopleParams, PeoplePage>({
    usePaginatedQuery: usePeopleQuery,
    arrayExtraKeys: ["team"],
    numberExtraKeys: COUNT_NUMBER_EXTRA_KEYS,
    defaults: DEFAULTS,
    sanitizeParams: sanitizeDemoParams,
    paginationMode: pageMode,
  });
  return <>{render(source)}</>;
}

/**
 * Render the same table against either data path. Only one data hook is
 * mounted at a time (remounted on `mode` change), so the headless source is
 * the single thing that differs — the adapter markup is identical.
 */
export function DemoBody({
  mode,
  pageMode,
  render,
}: Readonly<{ mode: DataMode; pageMode?: PageMode; render: TableRender }>) {
  return mode === "backend" ? (
    <Backend render={render} pageMode={pageMode} />
  ) : (
    <Frontend render={render} pageMode={pageMode} />
  );
}
