import type {
  ActiveFilterChip,
  BulkAction,
  ColumnDef,
  ColumnLayoutState,
  ConfirmHandler,
  ConfirmRequest,
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
import type { CSSProperties, ReactNode } from "react";

import { EditIcon, TrashIcon } from "./icons";
import people from "./people.json";

export const DEMO_NOTICE_EVENT = "adapttable-demo-notice";
export const DEMO_CONFIRM_EVENT = "adapttable-demo-confirm";

export interface DemoNotice {
  message: string;
  tone?: "info" | "danger";
}

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
  person: string;
  email: string;
  role: string;
  team: string;
  status: string;
  startDate: string;
  dueDate: string;
  budget: string;
  utilization: string;
  allocations: string;
  timeline: string;
  load: string;
  allocationFilter: string;
  budgetFilter: string;
  countOperator: string;
  countValue: string;
  countFrom: string;
  countTo: string;
  dateFrom: string;
  dateTo: string;
  edit: string;
  remove: string;
  confirmMessage: (name: string) => string;
  confirmTitle: string;
}

const STRINGS: Record<Locale, Strings> = {
  en: {
    search: "Search people…",
    name: "Name",
    person: "Person",
    email: "Email",
    role: "Role",
    team: "Team",
    status: "Status",
    startDate: "Start",
    dueDate: "Due",
    budget: "Budget",
    utilization: "Utilization",
    allocations: "Allocations",
    timeline: "Timeline",
    load: "Load",
    allocationFilter: "Allocation count",
    budgetFilter: "Budget",
    countOperator: "Operator",
    countValue: "Count",
    countFrom: "From",
    countTo: "To",
    dateFrom: "Start from",
    dateTo: "Start to",
    edit: "Edit",
    remove: "Delete",
    confirmTitle: "Delete person?",
    confirmMessage: (name) => `Permanently delete "${name}"?`,
  },
  ar: {
    search: "ابحث عن الأشخاص…",
    name: "الاسم",
    person: "الشخص",
    email: "البريد الإلكتروني",
    role: "الدور",
    team: "الفريق",
    status: "الحالة",
    startDate: "البداية",
    dueDate: "الاستحقاق",
    budget: "الميزانية",
    utilization: "الاستخدام",
    allocations: "التخصيصات",
    timeline: "الجدول الزمني",
    load: "الحمل",
    allocationFilter: "عدد التخصيصات",
    budgetFilter: "الميزانية",
    countOperator: "المعامل",
    countValue: "العدد",
    countFrom: "من",
    countTo: "إلى",
    dateFrom: "البداية من",
    dateTo: "البداية إلى",
    edit: "تعديل",
    remove: "حذف",
    confirmTitle: "حذف الشخص؟",
    confirmMessage: (name) => `هل تريد حذف "${name}" نهائيًا؟`,
  },
};

export function strings(locale: Locale): Strings {
  return STRINGS[locale];
}

export function notifyDemo(notice: DemoNotice): void {
  window.dispatchEvent(
    new CustomEvent<DemoNotice>(DEMO_NOTICE_EVENT, { detail: notice })
  );
}

export const demoConfirm: ConfirmHandler = (request: ConfirmRequest) => {
  window.dispatchEvent(
    new CustomEvent<ConfirmRequest>(DEMO_CONFIRM_EVENT, { detail: request })
  );
};

/**
 * Stable columns (keys + accessors) for the data hooks — locale-independent,
 * so sorting/keys never change with the language. The display columns
 * ({@link makeColumns}) add localized headers on top.
 */
export const BASE_COLUMNS: ColumnDef<Person>[] = [
  {
    key: "person",
    accessor: (r) => r.name,
    sortValue: (r) => r.name,
    sortable: true,
    header: "",
  },
  {
    key: "status",
    accessor: (r) => personStatus(r),
    sortValue: (r) => personStatus(r),
    sortable: true,
    header: "",
  },
  {
    key: "timeline",
    accessor: (r) => formatDate(startDate(r)),
    sortValue: (r) => startDate(r).getTime(),
    sortable: true,
    header: "",
  },
  {
    key: "budget",
    accessor: (r) => formatMoney(budget(r)),
    sortValue: (r) => budget(r),
    sortable: true,
    header: "",
  },
  {
    key: "load",
    accessor: (r) => formatPercent(utilization(r)),
    sortValue: (r) => utilization(r),
    sortable: true,
    header: "",
  },
];

/**
 * Provider-native cell renderers. Each adapter passes its OWN kit components
 * (Mantine `Avatar`/`Badge`/`Progress`, MUI `Avatar`/`Chip`/`LinearProgress`,
 * …) so the rich cells look native to that kit — no bespoke showcase CSS. The
 * column STRUCTURE (keys, headers, sort, widths) stays shared via
 * {@link makeColumns}; only these three visuals differ per provider.
 */
/** Props for a provider's avatar cell. */
export interface AvatarCellProps {
  name: string;
}
/** Props for a provider's status-pill cell. */
export interface StatusCellProps {
  status: DemoStatus;
  label: string;
}
/** Props for a provider's load-bar cell. */
export interface LoadCellProps {
  /** Utilisation 0–100. */
  value: number;
  /** Caption rendered under the bar, e.g. `"78% · 4"`. */
  meta: string;
}

export interface DemoCells {
  /** Initials avatar (kit-styled, deterministic colour from the name). */
  Avatar: (props: AvatarCellProps) => ReactNode;
  /** Status pill / badge / tag. */
  Status: (props: StatusCellProps) => ReactNode;
  /** Utilisation bar with a `value` (0–100) and a `meta` caption. */
  Load: (props: LoadCellProps) => ReactNode;
}

const cellStack: CSSProperties = {
  display: "inline-flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
  lineHeight: 1.35,
};

/** First-letters of (up to) the first two name words, e.g. "Ada Lovelace" → "AL". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

/** Deterministic 0–359 hue from a name, for adapters whose avatar needs a colour. */
export function nameHue(name: string): number {
  let hue = 0;
  for (let i = 0; i < name.length; i += 1) {
    hue = (hue * 31 + name.charCodeAt(i)) % 360;
  }
  return hue;
}

/** Map a demo status to a semantic colour family every kit understands. */
export function statusTone(
  status: DemoStatus
): "green" | "blue" | "red" | "gray" {
  if (status === "Active") return "green";
  if (status === "Planned") return "blue";
  if (status === "Blocked") return "red";
  return "gray";
}

/**
 * The live-demo's default column layout: `email` and `team` ship as real
 * columns but start hidden, so the table is clean by default yet has columns
 * to reveal. Revealing them (or pinning — see the showcase) widens the table
 * past its container so a pinned column visibly sticks while scrolling.
 */
export const LIVE_DEFAULT_LAYOUT: Partial<ColumnLayoutState> = {
  hidden: ["email", "team"],
};

export function makeColumns(
  locale: Locale,
  cells: DemoCells
): ColumnDef<Person>[] {
  const s = STRINGS[locale];
  const { Avatar, Status, Load } = cells;
  // Fixed pixel widths (not %) so revealing the hidden email/team columns
  // pushes the total past the container and the table scrolls horizontally —
  // the only way a pinned column can be seen to stick.
  return [
    {
      key: "person",
      header: s.person,
      sortable: true,
      sortValue: (r) => r.name,
      width: 230,
      accessor: (row) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
          <Avatar name={row.name} />
          <span style={cellStack}>
            <strong style={{ fontWeight: 600 }}>{row.name}</strong>
            <small style={{ opacity: 0.55, fontSize: "0.8em" }}>
              {row.role}
            </small>
          </span>
        </span>
      ),
      mobileLabel: s.person,
    },
    {
      key: "email",
      header: s.email,
      accessor: (r) => (
        <span style={{ opacity: 0.7, fontSize: "0.9em" }}>{r.email}</span>
      ),
      width: 250,
      mobileLabel: s.email,
    },
    {
      key: "team",
      header: s.team,
      accessor: (r) => r.team,
      width: 130,
      mobileLabel: s.team,
    },
    {
      key: "status",
      header: s.status,
      accessor: (r) => (
        <Status status={personStatus(r)} label={personStatus(r)} />
      ),
      sortValue: (r) => personStatus(r),
      sortable: true,
      width: 130,
      mobileLabel: s.status,
    },
    {
      key: "timeline",
      header: s.timeline,
      sortValue: (r) => startDate(r).getTime(),
      sortable: true,
      width: 185,
      accessor: (row) => (
        <span style={cellStack}>
          <strong style={{ fontWeight: 550 }}>
            {formatDate(startDate(row), locale)}
          </strong>
          <small style={{ opacity: 0.6, fontSize: "0.82em" }}>
            → {formatDate(dueDate(row), locale)}
          </small>
        </span>
      ),
      mobileLabel: s.timeline,
    },
    {
      key: "budget",
      header: s.budget,
      accessor: (r) => (
        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {formatMoney(budget(r), locale)}
        </span>
      ),
      sortValue: (r) => budget(r),
      sortable: true,
      align: "end",
      width: 130,
      mobileLabel: s.budget,
    },
    {
      key: "load",
      header: s.load,
      sortValue: (r) => utilization(r),
      sortable: true,
      width: 175,
      accessor: (row) => (
        <Load
          value={utilization(row)}
          meta={`${formatPercent(utilization(row), locale)} · ${allocationCount(row)}`}
        />
      ),
      mobileLabel: s.load,
    },
  ];
}

/**
 * A deliberately WIDE column set (8 fixed-px columns, ~1440px total) for the
 * column-management showcase — wide enough to scroll sideways so a pinned
 * column visibly sticks. `person` is the natural pin target; pair it with
 * `defaultColumnLayout={{ pinned: { person: "left" } }}`.
 */
export function makeWideColumns(
  locale: Locale,
  cells: DemoCells
): ColumnDef<Person>[] {
  const s = STRINGS[locale];
  const { Avatar, Status, Load } = cells;
  return [
    {
      key: "person",
      header: s.person,
      sortable: true,
      sortValue: (r) => r.name,
      width: 240,
      accessor: (row) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
          <Avatar name={row.name} />
          <span style={cellStack}>
            <strong style={{ fontWeight: 600 }}>{row.name}</strong>
            <small style={{ opacity: 0.6, fontSize: "0.82em" }}>
              {row.email}
            </small>
          </span>
        </span>
      ),
    },
    { key: "role", header: s.role, accessor: (r) => r.role, width: 150 },
    {
      key: "team",
      header: s.team,
      accessor: (r) => r.team,
      sortValue: (r) => r.team,
      sortable: true,
      width: 130,
    },
    {
      key: "status",
      header: s.status,
      accessor: (r) => (
        <Status status={personStatus(r)} label={personStatus(r)} />
      ),
      sortValue: (r) => personStatus(r),
      sortable: true,
      width: 140,
    },
    { key: "email", header: s.email, accessor: (r) => r.email, width: 240 },
    {
      key: "timeline",
      header: s.timeline,
      sortValue: (r) => startDate(r).getTime(),
      sortable: true,
      width: 200,
      accessor: (row) => (
        <span style={cellStack}>
          <strong style={{ fontWeight: 550 }}>
            {formatDate(startDate(row), locale)}
          </strong>
          <small style={{ opacity: 0.6, fontSize: "0.82em" }}>
            → {formatDate(dueDate(row), locale)}
          </small>
        </span>
      ),
    },
    {
      key: "budget",
      header: s.budget,
      accessor: (r) => (
        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
          {formatMoney(budget(r), locale)}
        </span>
      ),
      sortValue: (r) => budget(r),
      sortable: true,
      align: "end",
      width: 150,
    },
    {
      key: "load",
      header: s.load,
      sortValue: (r) => utilization(r),
      sortable: true,
      width: 190,
      accessor: (row) => (
        <Load
          value={utilization(row)}
          meta={`${formatPercent(utilization(row), locale)} · ${allocationCount(row)}`}
        />
      ),
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
      onClick: (row) => notifyDemo({ message: `${s.edit}: ${row.name}` }),
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
      onClick: (row) =>
        notifyDemo({ message: `${s.remove}: ${row.name}`, tone: "danger" }),
    },
  ];
}

/** Bulk actions — passing these turns on row selection + the bulk bar. */
export function makeBulkActions(locale: Locale): BulkAction[] {
  const t =
    locale === "ar"
      ? { export: "تصدير", archive: "أرشفة", done: "تم" }
      : { export: "Export", archive: "Archive", done: "Done" };
  return [
    {
      key: "export",
      label: t.export,
      onClick: (ids) => notifyDemo({ message: `${t.export}: ${ids.length}` }),
    },
    {
      key: "archive",
      label: t.archive,
      onClick: (ids) =>
        notifyDemo({ message: `${t.archive}: ${ids.length}`, tone: "danger" }),
    },
  ];
}

/* ── Team filter (used by every adapter demo + the mock API) ────────── */

export const TEAMS = ["Core", "Platform", "Data", "Web", "Mobile"];
export const STATUSES = ["Active", "Planned", "Blocked", "Archived"] as const;
export type DemoStatus = (typeof STATUSES)[number];
const ALLOCATION_BUCKET = "allocations";
const BUDGET_BUCKET = "budget";
export const COUNT_NUMBER_EXTRA_KEYS = [
  "allocationsValue",
  "allocationsFrom",
  "allocationsTo",
  "budgetValue",
  "budgetFrom",
  "budgetTo",
] as const;
export const COUNT_OPTIONS = COUNT_OPERATORS.map((op) => ({
  op,
  label: COUNT_OPERATOR_SYMBOL[op],
}));

export function allocationCount(row: Person): number {
  return ((Number(row.id) * 3) % 9) + 1;
}

export function budget(row: Person): number {
  return 18_000 + ((Number(row.id) * 7300) % 95_000);
}

export function utilization(row: Person): number {
  return 45 + ((Number(row.id) * 11) % 55);
}

export function startDate(row: Person): Date {
  const day = 1 + ((Number(row.id) * 7) % 26);
  const month = (Number(row.id) * 2) % 12;
  return new Date(Date.UTC(2026, month, day));
}

export function dueDate(row: Person): Date {
  const date = startDate(row);
  return new Date(date.getTime() + 1000 * 60 * 60 * 24 * 45);
}

export function personStatus(row: Person): DemoStatus {
  return STATUSES[Number(row.id) % STATUSES.length];
}

export function formatDate(date: Date, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatMoney(value: number, locale: Locale = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, locale: Locale = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

/** Localized chip label resolvers for the `team` filter. */
export function makeFilterLabels(
  locale: Locale
): Record<string, (value: string) => string> {
  const s = STRINGS[locale];
  return {
    team: (value) => `${s.team}: ${value}`,
    status: (value) => `${s.status}: ${value}`,
    startFrom: (value) => `${s.dateFrom}: ${value}`,
    startTo: (value) => `${s.dateTo}: ${value}`,
  };
}

/** Normalise the `team` extra value (string | string[] | …) to a string[]. */
export function selectedTeams(value: FilterValue): string[] {
  if (Array.isArray(value)) return value;
  if (value != null) return [String(value)];
  return [];
}

export function selectedStatuses(value: FilterValue): string[] {
  return selectedTeams(value).filter((status) =>
    STATUSES.includes(status as DemoStatus)
  );
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

function matchesDateRange(
  date: Date,
  extra: Readonly<Record<string, FilterValue>>
): boolean {
  const from = extra.startFrom ? new Date(String(extra.startFrom)) : undefined;
  const to = extra.startTo ? new Date(String(extra.startTo)) : undefined;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function matchesDemoFilters(
  row: Person,
  extra: Readonly<Record<string, FilterValue>>
): boolean {
  const selectedStatus = selectedStatuses(extra.status);
  return (
    matchesTeam(row, extra) &&
    (selectedStatus.length === 0 ||
      selectedStatus.includes(personStatus(row))) &&
    matchesDateRange(startDate(row), extra) &&
    compareCount(
      allocationCount(row),
      countFilterStateFromExtra(ALLOCATION_BUCKET, extra)
    ) &&
    compareCount(budget(row), countFilterStateFromExtra(BUDGET_BUCKET, extra))
  );
}

export function sanitizeDemoParams<P extends Record<string, unknown>>(
  params: P
): P {
  return sanitizeCountFilterParams(params, [ALLOCATION_BUCKET, BUDGET_BUCKET]);
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
  const allocationLabel = countFilterChipLabel(
    s.allocationFilter,
    countFilterStateFromExtra(ALLOCATION_BUCKET, source.extra)
  );
  const budgetLabel = countFilterChipLabel(
    s.budgetFilter,
    countFilterStateFromExtra(BUDGET_BUCKET, source.extra)
  );
  return [
    allocationLabel
      ? {
          key: "count:allocations",
          label: allocationLabel,
          onRemove: () =>
            source.setExtras(clearCountFilterExtra(ALLOCATION_BUCKET)),
        }
      : undefined,
    budgetLabel
      ? {
          key: "count:budget",
          label: budgetLabel,
          onRemove: () =>
            source.setExtras(clearCountFilterExtra(BUDGET_BUCKET)),
        }
      : undefined,
  ].filter((chip): chip is ActiveFilterChip => chip !== undefined);
}

export function allocationFilterState(
  source: TableSource<Person>
): CountFilterState {
  return countFilterStateFromExtra(ALLOCATION_BUCKET, source.extra);
}

export function budgetFilterState(
  source: TableSource<Person>
): CountFilterState {
  return countFilterStateFromExtra(BUDGET_BUCKET, source.extra);
}

export function setAllocationFilter(
  source: TableSource<Person>,
  next: CountFilterState
): void {
  source.setExtras(countFilterExtra(ALLOCATION_BUCKET, next));
}

export function setBudgetFilter(
  source: TableSource<Person>,
  next: CountFilterState
): void {
  source.setExtras(countFilterExtra(BUDGET_BUCKET, next));
}

export function clearDemoFilters(source: TableSource<Person>): void {
  source.setExtras({
    team: undefined,
    status: undefined,
    startFrom: undefined,
    startTo: undefined,
    ...clearCountFilterExtra(ALLOCATION_BUCKET),
    ...clearCountFilterExtra(BUDGET_BUCKET),
  });
}

/**
 * Tailwind class hooks for the shared (unstyled/shadcn) filter panel — the kit
 * adapters supply their own filter components, so this one is class-driven.
 */
const FILTER = {
  panel: "flex flex-col gap-4 text-sm text-foreground",
  group: "m-0 flex flex-col gap-2 border-0 p-0",
  legend:
    "p-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
  chips: "flex flex-wrap gap-1.5",
  // Toggle PILLS (the design's .at-filter chips): the real checkbox stays for
  // a11y but renders invisibly; the label is the visual control and flips to
  // a filled pill when its checkbox is checked.
  chip: "inline-flex cursor-pointer select-none items-center rounded-full border border-input bg-background px-3 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
  checkbox: "sr-only",
  grid: "grid grid-cols-2 gap-2",
  field:
    "flex flex-col gap-1 [&>span]:text-xs [&>span]:font-medium [&>span]:text-muted-foreground [&>input]:h-9 [&>input]:rounded-md [&>input]:border [&>input]:border-input [&>input]:bg-background [&>input]:px-2.5 [&>input]:text-sm [&>input]:text-foreground [&>input]:outline-none focus-within:[&>input]:ring-2 focus-within:[&>input]:ring-ring [&>select]:h-9 [&>select]:rounded-md [&>select]:border [&>select]:border-input [&>select]:bg-background [&>select]:px-2 [&>select]:text-sm [&>select]:text-foreground [&>select]:outline-none",
} as const;

export function DemoFilters({
  source,
  locale,
}: Readonly<{
  source: TableSource<Person>;
  locale: Locale;
}>) {
  const s = STRINGS[locale];
  const selected = selectedTeams(source.extra.team);
  const statuses = selectedStatuses(source.extra.status);
  const countState = countFilterStateFromExtra(ALLOCATION_BUCKET, source.extra);
  const budgetState = countFilterStateFromExtra(BUDGET_BUCKET, source.extra);
  const setCount = (next: CountFilterState) =>
    source.setExtras(countFilterExtra(ALLOCATION_BUCKET, next));
  const setBudget = (next: CountFilterState) =>
    source.setExtras(countFilterExtra(BUDGET_BUCKET, next));
  return (
    <div className={FILTER.panel}>
      <fieldset className={FILTER.group}>
        <legend className={FILTER.legend}>{s.team}</legend>
        <div className={FILTER.chips}>
          {TEAMS.map((team) => (
            <label key={team} className={FILTER.chip}>
              <input
                type="checkbox"
                className={FILTER.checkbox}
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

      <fieldset className={FILTER.group}>
        <legend className={FILTER.legend}>{s.status}</legend>
        <div className={FILTER.chips}>
          {STATUSES.map((status) => (
            <label key={status} className={FILTER.chip}>
              <input
                type="checkbox"
                className={FILTER.checkbox}
                checked={statuses.includes(status)}
                onChange={() =>
                  source.setExtra(
                    "status",
                    statuses.includes(status)
                      ? statuses.filter((item) => item !== status)
                      : [...statuses, status]
                  )
                }
              />
              <span>{status}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={FILTER.group}>
        <legend className={FILTER.legend}>{s.startDate}</legend>
        <div className={FILTER.grid}>
          <label className={FILTER.field}>
            <span>{s.dateFrom}</span>
            <input
              type="date"
              value={String(source.extra.startFrom ?? "")}
              onChange={(event) =>
                source.setExtra("startFrom", event.currentTarget.value)
              }
            />
          </label>
          <label className={FILTER.field}>
            <span>{s.dateTo}</span>
            <input
              type="date"
              value={String(source.extra.startTo ?? "")}
              onChange={(event) =>
                source.setExtra("startTo", event.currentTarget.value)
              }
            />
          </label>
        </div>
      </fieldset>

      <fieldset className={FILTER.group}>
        <legend className={FILTER.legend}>{s.allocationFilter}</legend>
        <div className={FILTER.grid}>
          <label className={FILTER.field}>
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
              <label className={FILTER.field}>
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
              <label className={FILTER.field}>
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
            <label className={FILTER.field}>
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

      <fieldset className={FILTER.group}>
        <legend className={FILTER.legend}>{s.budgetFilter}</legend>
        <div className={FILTER.grid}>
          <label className={FILTER.field}>
            <span>{s.countOperator}</span>
            <select
              value={budgetState.op ?? ""}
              onChange={(event) => {
                const op = (event.currentTarget.value || undefined) as
                  | CountOperator
                  | undefined;
                setBudget({
                  op,
                  value: op && op !== "between" ? budgetState.value : undefined,
                  from: op === "between" ? budgetState.from : undefined,
                  to: op === "between" ? budgetState.to : undefined,
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
          <label className={FILTER.field}>
            <span>{s.countValue}</span>
            <input
              type="number"
              min={0}
              value={budgetState.value ?? ""}
              onChange={(event) =>
                setBudget({
                  ...budgetState,
                  value: event.currentTarget.value
                    ? Number(event.currentTarget.value)
                    : undefined,
                })
              }
            />
          </label>
        </div>
      </fieldset>
    </div>
  );
}
