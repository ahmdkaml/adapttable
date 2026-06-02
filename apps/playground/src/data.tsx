import type {
  ColumnDef,
  ExtraFilters,
  FilterValue,
  RowAction,
} from "@adapttable/core";

import { EditIcon, TrashIcon } from "./icons";
import people from "./people.json";

export interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
}

export const PEOPLE = people as Person[];

export type Locale = "en" | "ar";

interface Strings {
  search: string;
  name: string;
  email: string;
  role: string;
  team: string;
  edit: string;
  remove: string;
  confirmMessage: (name: string) => string;
  confirmTitle: string;
}

const STRINGS: Record<Locale, Strings> = {
  en: {
    search: "Search people…",
    name: "Name",
    email: "Email",
    role: "Role",
    team: "Team",
    edit: "Edit",
    remove: "Delete",
    confirmTitle: "Delete person?",
    confirmMessage: (name) => `Permanently delete "${name}"?`,
  },
  ar: {
    search: "ابحث عن الأشخاص…",
    name: "الاسم",
    email: "البريد الإلكتروني",
    role: "الدور",
    team: "الفريق",
    edit: "تعديل",
    remove: "حذف",
    confirmTitle: "حذف الشخص؟",
    confirmMessage: (name) => `هل تريد حذف "${name}" نهائيًا؟`,
  },
};

export function strings(locale: Locale): Strings {
  return STRINGS[locale];
}

/**
 * Stable columns (keys + accessors) for the data hooks — locale-independent,
 * so sorting/keys never change with the language. The display columns
 * ({@link makeColumns}) add localized headers on top.
 */
export const BASE_COLUMNS: ColumnDef<Person>[] = [
  { key: "name", accessor: (r) => r.name, sortable: true, header: "" },
  { key: "email", accessor: (r) => r.email, header: "" },
  { key: "role", accessor: (r) => r.role, sortable: true, header: "" },
  { key: "team", accessor: (r) => r.team, sortable: true, header: "" },
];

export function makeColumns(locale: Locale): ColumnDef<Person>[] {
  const s = STRINGS[locale];
  return [
    { key: "name", header: s.name, accessor: (r) => r.name, sortable: true },
    { key: "email", header: s.email, accessor: (r) => r.email },
    { key: "role", header: s.role, accessor: (r) => r.role, sortable: true },
    { key: "team", header: s.team, accessor: (r) => r.team, sortable: true },
  ];
}

export function makeActions(locale: Locale): RowAction<Person>[] {
  const s = STRINGS[locale];
  return [
    {
      key: "edit",
      label: s.edit,
      icon: <EditIcon />,
      onClick: (row) => alert(`${s.edit}: ${row.name}`),
    },
    {
      key: "delete",
      label: s.remove,
      icon: <TrashIcon />,
      color: "red",
      confirm: {
        title: s.confirmTitle,
        message: (row) => s.confirmMessage(row.name),
        confirmLabel: s.remove,
        danger: true,
      },
      onClick: (row) => alert(`${s.remove}: ${row.name}`),
    },
  ];
}

/* ── Team filter (used by every adapter demo + the mock API) ────────── */

export const TEAMS = ["Core", "Platform", "Data", "Web", "Mobile"];

/** Localized chip label resolvers for the `team` filter. */
export function makeFilterLabels(
  locale: Locale
): Record<string, (value: string) => string> {
  const s = STRINGS[locale];
  return { team: (value) => `${s.team}: ${value}` };
}

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
