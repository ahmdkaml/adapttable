import type {
  ActiveFilterChip,
  ColumnDef,
  CountFilterState,
  CountOperator,
  FilterValue,
  RowAction,
  TableSource,
} from "@adapttable/core";
import {
  clearCountFilterExtra,
  COUNT_OPERATOR_SYMBOL,
  COUNT_OPERATORS,
  countFilterChipLabel,
  countFilterExtra,
  countFilterStateFromExtra,
  isCountFilterComplete,
  sanitizeCountFilterParams,
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
  allocations: string;
  allocationFilter: string;
  countOperator: string;
  countValue: string;
  countFrom: string;
  countTo: string;
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
    allocations: "Allocations",
    allocationFilter: "Allocation count",
    countOperator: "Operator",
    countValue: "Count",
    countFrom: "From",
    countTo: "To",
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
    allocations: "التخصيصات",
    allocationFilter: "عدد التخصيصات",
    countOperator: "المعامل",
    countValue: "العدد",
    countFrom: "من",
    countTo: "إلى",
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
  {
    key: "allocations",
    accessor: (r) => allocationCount(r),
    sortValue: (r) => allocationCount(r),
    sortable: true,
    header: "",
  },
];

export function makeColumns(locale: Locale): ColumnDef<Person>[] {
  const s = STRINGS[locale];
  return [
    { key: "name", header: s.name, accessor: (r) => r.name, sortable: true },
    { key: "email", header: s.email, accessor: (r) => r.email },
    { key: "role", header: s.role, accessor: (r) => r.role, sortable: true },
    { key: "team", header: s.team, accessor: (r) => r.team, sortable: true },
    {
      key: "allocations",
      header: s.allocations,
      accessor: (r) => allocationCount(r),
      sortValue: (r) => allocationCount(r),
      sortable: true,
      align: "end",
      hideOnMobile: true,
      mobileLabel: s.allocations,
    },
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
const ALLOCATION_BUCKET = "allocations";
export const COUNT_NUMBER_EXTRA_KEYS = [
  "allocationsValue",
  "allocationsFrom",
  "allocationsTo",
] as const;
const COUNT_OPTIONS = COUNT_OPERATORS.map((op) => ({
  op,
  label: COUNT_OPERATOR_SYMBOL[op],
}));

export function allocationCount(row: Person): number {
  return ((Number(row.id) * 3) % 9) + 1;
}

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
export function matchesTeam(
  row: Person,
  extra: Readonly<Record<string, FilterValue>>
): boolean {
  const selected = selectedTeams(extra.team);
  return selected.length === 0 || selected.includes(row.team);
}

function compareCount(count: number, state: CountFilterState): boolean {
  if (!isCountFilterComplete(state) || !state.op) return true;
  switch (state.op) {
    case "eq":
      return count === state.value;
    case "gte":
      return count >= state.value!;
    case "lte":
      return count <= state.value!;
    case "gt":
      return count > state.value!;
    case "lt":
      return count < state.value!;
    case "between":
      return count >= state.from! && count <= state.to!;
  }
}

export function matchesDemoFilters(
  row: Person,
  extra: Readonly<Record<string, FilterValue>>
): boolean {
  return (
    matchesTeam(row, extra) &&
    compareCount(
      allocationCount(row),
      countFilterStateFromExtra(ALLOCATION_BUCKET, extra)
    )
  );
}

export function sanitizeDemoParams<P extends Record<string, unknown>>(
  params: P
): P {
  return sanitizeCountFilterParams(params, [ALLOCATION_BUCKET]);
}

/** Flip a team in/out of the selection (for kits without a checkbox group). */
export function toggleTeam(selected: string[], team: string): string[] {
  return selected.includes(team)
    ? selected.filter((t) => t !== team)
    : [...selected, team];
}

export function demoFilterChips(
  source: TableSource<Person>,
  locale: Locale
): ActiveFilterChip[] {
  const s = STRINGS[locale];
  const label = countFilterChipLabel(
    s.allocationFilter,
    countFilterStateFromExtra(ALLOCATION_BUCKET, source.extra)
  );
  return label
    ? [
        {
          key: "count:allocations",
          label,
          onRemove: () =>
            source.setExtras(clearCountFilterExtra(ALLOCATION_BUCKET)),
        },
      ]
    : [];
}

export function clearDemoFilters(source: TableSource<Person>): void {
  source.setExtras({
    team: undefined,
    ...clearCountFilterExtra(ALLOCATION_BUCKET),
  });
}

export function DemoFilters({
  source,
  locale,
}: Readonly<{
  source: TableSource<Person>;
  locale: Locale;
}>) {
  const s = STRINGS[locale];
  const selected = selectedTeams(source.extra.team);
  const countState = countFilterStateFromExtra(ALLOCATION_BUCKET, source.extra);
  const setCount = (next: CountFilterState) =>
    source.setExtras(countFilterExtra(ALLOCATION_BUCKET, next));
  return (
    <div className="demo-filter-panel">
      <fieldset>
        <legend>{s.team}</legend>
        <div className="demo-filter-options">
          {TEAMS.map((team) => (
            <label key={team}>
              <input
                type="checkbox"
                checked={selected.includes(team)}
                onChange={() =>
                  source.setExtra("team", toggleTeam(selected, team))
                }
              />
              <span>{team}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>{s.allocationFilter}</legend>
        <div className="demo-count-filter">
          <label>
            <span>{s.countOperator}</span>
            <select
              value={countState.op ?? ""}
              onChange={(event) => {
                const op = (event.currentTarget.value || undefined) as
                  | CountOperator
                  | undefined;
                setCount({
                  op,
                  value: op && op !== "between" ? countState.value : undefined,
                  from: op === "between" ? countState.from : undefined,
                  to: op === "between" ? countState.to : undefined,
                });
              }}
            >
              <option value="">-</option>
              {COUNT_OPTIONS.map((option) => (
                <option key={option.op} value={option.op}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {countState.op === "between" ? (
            <>
              <label>
                <span>{s.countFrom}</span>
                <input
                  type="number"
                  min={0}
                  value={countState.from ?? ""}
                  onChange={(event) =>
                    setCount({
                      ...countState,
                      from: event.currentTarget.value
                        ? Number(event.currentTarget.value)
                        : undefined,
                    })
                  }
                />
              </label>
              <label>
                <span>{s.countTo}</span>
                <input
                  type="number"
                  min={0}
                  value={countState.to ?? ""}
                  onChange={(event) =>
                    setCount({
                      ...countState,
                      to: event.currentTarget.value
                        ? Number(event.currentTarget.value)
                        : undefined,
                    })
                  }
                />
              </label>
            </>
          ) : (
            <label>
              <span>{s.countValue}</span>
              <input
                type="number"
                min={0}
                value={countState.value ?? ""}
                onChange={(event) =>
                  setCount({
                    ...countState,
                    value: event.currentTarget.value
                      ? Number(event.currentTarget.value)
                      : undefined,
                  })
                }
              />
            </label>
          )}
        </div>
      </fieldset>
    </div>
  );
}
