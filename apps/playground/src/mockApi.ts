import { matchesTeam, PEOPLE, type Person } from "./data";

/** One page of a server response. */
export interface PeoplePage {
  items: Person[];
  total: number;
  nextPage: number | null;
}

/** Query params the table sends to the "server". */
export interface PeopleParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  team?: string | string[];
}

/**
 * A fake paginated API over the JSON dataset — applies search, the team
 * filter, sorting, and pagination exactly as a real backend would, behind a
 * small artificial latency. Swapping this for `fetch('/api/people')` is the
 * only change needed to talk to a real server.
 */
export async function fetchPeople(params: PeopleParams): Promise<PeoplePage> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  let rows = PEOPLE.slice();

  const query = params.search?.trim().toLowerCase();
  if (query) {
    rows = rows.filter((r) =>
      `${r.name} ${r.email} ${r.role} ${r.team}`.toLowerCase().includes(query)
    );
  }

  rows = rows.filter((r) => matchesTeam(r, { team: params.team }));

  if (params.sortBy && params.sortDir) {
    const key = params.sortBy as keyof Person;
    const dir = params.sortDir === "asc" ? 1 : -1;
    rows = rows
      .slice()
      .sort((a, b) => String(a[key]).localeCompare(String(b[key])) * dir);
  }

  const total = rows.length;
  const limit = params.limit ?? 8;
  const page = params.page ?? 1;
  const start = (page - 1) * limit;
  const items = rows.slice(start, start + limit);
  const nextPage = start + limit < total ? page + 1 : null;

  return { items, total, nextPage };
}
