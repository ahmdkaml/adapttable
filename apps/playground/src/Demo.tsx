import {
  type TableSource,
  useBackendData,
  useFrontendData,
} from "@adapttable/core";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { columns, matchesTeam, PEOPLE, type Person } from "./data";
import { fetchPeople, type PeoplePage, type PeopleParams } from "./mockApi";

export type DataMode = "frontend" | "backend";

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

function Frontend({ render }: Readonly<{ render: TableRender }>) {
  const source = useFrontendData<Person>({
    data: PEOPLE,
    columns,
    arrayExtraKeys: ["team"],
    filterFn: matchesTeam,
    defaults: DEFAULTS,
  });
  return <>{render(source)}</>;
}

function Backend({ render }: Readonly<{ render: TableRender }>) {
  const source = useBackendData<Person, PeopleParams, PeoplePage>({
    usePaginatedQuery: usePeopleQuery,
    arrayExtraKeys: ["team"],
    defaults: DEFAULTS,
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
  render,
}: Readonly<{ mode: DataMode; render: TableRender }>) {
  return mode === "backend" ? (
    <Backend render={render} />
  ) : (
    <Frontend render={render} />
  );
}
