import type { ColumnDef, ExtraFilters, FilterValue } from "@adapttable/core";

import people from "./people.json";

export interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
}

export const PEOPLE = people as Person[];

export const columns: ColumnDef<Person>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "email", header: "Email", accessor: (r) => r.email },
  { key: "role", header: "Role", accessor: (r) => r.role, sortable: true },
  { key: "team", header: "Team", accessor: (r) => r.team, sortable: true },
];

/** Shared row action wired by every adapter demo. */
export const editAction = {
  key: "edit",
  label: "Edit",
  onClick: (row: Person) => alert(`Edit ${row.name}`),
};

/* ── Team filter (used by every adapter demo + the mock API) ────────── */

export const TEAMS = ["Core", "Platform", "Data", "Web", "Mobile"];

/** Chip label resolvers passed to every adapter's `filterLabels`. */
export const TEAM_FILTER_LABELS = {
  team: (value: string) => `Team: ${value}`,
};

/** Normalise the `team` extra value (string | string[] | …) to a string[]. */
export function selectedTeams(value: FilterValue): string[] {
  if (Array.isArray(value)) return value;
  if (value != null) return [String(value)];
  return [];
}

/** Client-side predicate; the mock API applies the same logic server-side. */
export function matchesTeam(row: Person, extra: ExtraFilters): boolean {
  const selected = selectedTeams(extra.team);
  return selected.length === 0 || selected.includes(row.team);
}

/** Flip a team in/out of the selection (for kits without a checkbox group). */
export function toggleTeam(selected: string[], team: string): string[] {
  return selected.includes(team)
    ? selected.filter((t) => t !== team)
    : [...selected, team];
}
