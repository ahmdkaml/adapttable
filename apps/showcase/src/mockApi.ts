import type { FilterValue, QueryFilterGroup } from "@adapttable/core";
import { evaluateFilterTree } from "@adapttable/core";

import {
  budget,
  DEMO_FILTER_RUNTIME,
  matchesDemoFilters,
  PEOPLE,
  type Person,
  personStatus,
  startDate,
  utilization,
} from "./data";

/** One page of a server response. */
export interface PeoplePage {
  items: Person[];
  total: number;
  nextPage: number | null;
}

/** Query params the table sends to the "server". */
export interface PeopleParams extends Record<string, FilterValue> {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  team?: string | string[];
  status?: string | string[];
  startFrom?: string;
  startTo?: string;
  allocationsMin?: number;
  allocationsMax?: number;
  budgetMin?: number;
  budgetMax?: number;
}

const padNumber = (value: number): string => String(value).padStart(12, "0");

function sortValue(row: Person, key: string): string {
  switch (key) {
    case "person":
      return row.name;
    case "status":
      return personStatus(row);
    case "timeline":
      return padNumber(startDate(row).getTime());
    case "budget":
      return padNumber(budget(row));
    case "load":
      return padNumber(utilization(row));
    default:
      return String(row[key as keyof Person] ?? "");
  }
}

/**
 * A fake paginated API over the JSON dataset — applies search, the demo's
 * declarative filters (the same runtime predicate the frontend mode uses),
 * sorting, and pagination exactly as a real backend would, behind a small
 * artificial latency. Swapping this for `fetch('/api/people')` is the only
 * change needed to talk to a real server.
 */
export async function fetchPeople(
  params: PeopleParams & { filterTree?: QueryFilterGroup }
): Promise<PeoplePage> {
  await new Promise((resolve) => setTimeout(resolve, 480));

  let rows = PEOPLE.slice();

  const query = params.search?.trim().toLowerCase();
  if (query) {
    rows = rows.filter((r) =>
      `${r.name} ${r.email} ${r.role} ${r.team}`.toLowerCase().includes(query)
    );
  }

  rows = rows.filter((r) => matchesDemoFilters(r, params));
  rows = rows.filter((r) =>
    evaluateFilterTree(params.filterTree, r, DEMO_FILTER_RUNTIME.defs)
  );

  if (params.sortBy && params.sortDir) {
    const dir = params.sortDir === "asc" ? 1 : -1;
    rows = rows
      .slice()
      .sort(
        (a, b) =>
          sortValue(a, params.sortBy!).localeCompare(
            sortValue(b, params.sortBy!)
          ) * dir
      );
  }

  const total = rows.length;
  const limit = params.limit ?? 8;
  const page = params.page ?? 1;
  const start = (page - 1) * limit;
  const items = rows.slice(start, start + limit);
  const nextPage = start + limit < total ? page + 1 : null;

  return { items, total, nextPage };
}
