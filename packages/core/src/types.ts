/**
 * Public type surface for `@adapttable/core`.
 *
 * Everything here is framework- and UI-kit-agnostic. Adapters
 * (`@adapttable/mantine`, …) build their styled components on top of
 * these contracts; headless consumers import them directly.
 *
 * @packageDocumentation
 */

import type { ComponentType, ReactNode } from "react";

/** Sort direction for a column. */
export type SortDirection = "asc" | "desc";

/** Text direction. Adapters apply it; logical CSS does the rest. */
export type Direction = "ltr" | "rtl";

/**
 * Colour scheme preference. `"auto"` follows the host /
 * `prefers-color-scheme`; adapters resolve it to their theming.
 */
export type ColorScheme = "light" | "dark" | "auto";

/** How the table paginates. `"auto"` resolves by viewport (mobile → infinite). */
export type PaginationMode = "infinite" | "paged" | "auto";

/** The resolved (non-auto) pagination mode a source actually runs in. */
export type ResolvedPaginationMode = "infinite" | "paged";

/** Comparable primitive returned by a sort-value extractor. */
export type SortableValue = string | number | boolean | null | undefined;

/** A single extra-filter value as it round-trips through URL state. */
export type FilterValue = string | string[] | number | undefined;

/** The bag of extra (caller-defined) filter values keyed by filter name. */
export type ExtraFilters = Record<string, FilterValue>;

/** Props every {@link ColumnDef.Cell} component receives. */
export interface CellProps<TRow> {
  /** The row being rendered. */
  readonly row: TRow;
  /** Zero-based index of the row within the current materialised slice. */
  readonly rowIndex: number;
}

/**
 * Definition of a single column. `TRow` is the row item type.
 *
 * Provide either a {@link ColumnDef.Cell} component (stable identity →
 * memoisable sub-trees, preferred for statically-known columns) or the
 * lighter {@link ColumnDef.accessor} function.
 */
export interface ColumnDef<TRow> {
  /** Unique within the table. Also the value sent to a backend as `sortBy`. */
  key: string;
  /** Header content. Pre-translated by the caller. */
  header: ReactNode;
  /**
   * Component rendered per row. Define at module level (or memoise) so
   * its identity is stable across renders.
   */
  Cell?: ComponentType<CellProps<TRow>>;
  /** Lightweight alternative to {@link ColumnDef.Cell}; returns cell content. */
  accessor?: (row: TRow) => ReactNode;
  /**
   * Primitive extractor used by the client-side sort comparator
   * (`useFrontendData`). Unused for server-sorted data.
   */
  sortValue?: (row: TRow) => SortableValue;
  /** Enable sorting for this column. Off by default. */
  sortable?: boolean;
  /** Column width passed through to the rendered header/cell. */
  width?: number | string;
  /** Text alignment within the cell. Defaults to `"start"`. */
  align?: "start" | "center" | "end";
  /** Label used on mobile card layouts; falls back to `header` when a string. */
  mobileLabel?: string;
  /** Hide this column entirely on mobile layouts. */
  hideOnMobile?: boolean;
  /** Hide this column entirely on desktop layouts. */
  hideOnDesktop?: boolean;
  /** Arbitrary metadata adapters may read (e.g. a custom renderer flag). */
  meta?: Record<string, unknown>;
}

/** Confirmation wiring shared by row and bulk actions. */
export interface ActionConfirm<TArg> {
  /** Dialog title (pre-translated). */
  title: string;
  /** Builds the dialog message from the action argument. */
  message: (arg: TArg) => string;
  /** Confirm button label (pre-translated). */
  confirmLabel: string;
  /** Marks the action destructive (adapters style it accordingly). */
  danger?: boolean;
}

/** A per-row action — trailing icon buttons on desktop, card buttons on mobile. */
export interface RowAction<TRow> {
  /** Identifier — not shown to the user. */
  key: string;
  /** Pre-translated label; also used as the accessible name. */
  label: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Click handler; fires after confirmation when `confirm` is set. */
  onClick: (row: TRow) => void;
  /** Adapter-defined colour token (e.g. `"red"` for destructive). */
  color?: string;
  /** Disable conditionally — e.g. delete when the row is referenced. */
  isDisabled?: (row: TRow) => boolean;
  /**
   * Disable conditionally and explain why. A non-empty string disables the
   * action and adapters surface it as tooltip/title copy where possible.
   */
  disabledReason?: (row: TRow) => string | undefined;
  /** Hide entirely when the action is structurally inapplicable. */
  isHidden?: (row: TRow) => boolean;
  /** Optional confirmation dialog wiring. */
  confirm?: ActionConfirm<TRow>;
}

/** A bulk action invoked from the selection toolbar with the selected ids. */
export interface BulkAction {
  /** Identifier — not shown to the user. */
  key: string;
  /** Pre-translated button label. */
  label: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Adapter-defined colour token. */
  color?: string;
  /**
   * Single disabled-state probe. A non-empty return greys the button out
   * and is shown as its tooltip; `undefined` leaves it enabled. One probe
   * (instead of `isDisabled` + `reason`) enforces that every disabled
   * bulk button explains itself.
   */
  disabledReason?: (ids: string[]) => string | undefined;
  /** Action handler; receives the selected ids. May be async. */
  onClick: (ids: string[]) => void | Promise<unknown>;
  /** Optional confirmation dialog wiring (receives the selection count). */
  confirm?: ActionConfirm<number>;
}

/** Option entry for a sort-by select control. */
export interface SortByOption {
  value: string;
  label: string;
}

/** Baseline query params a backend list endpoint receives. */
export interface TableQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDirection;
}

/** Standard paginated response envelope. */
export interface PaginatedResponse<TRow> {
  items: TRow[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

/**
 * Strings the table renders. Pass pre-translated values (or wire them to
 * your i18n stack). Every key is optional; sensible English defaults fill
 * the gaps — see {@link defaultLabels}.
 */
export interface TableLabels {
  /** Accessible label for an unlabeled table. */
  table?: string;
  search?: string;
  searchPlaceholder?: string;
  noData?: string;
  loading?: string;
  loadMore?: string;
  filters?: string;
  clearAll?: string;
  /** Label for the filter panel action that accepts the current live filters. */
  applyFilters?: string;
  sortBy?: string;
  rowsPerPage?: string;
  actions?: string;
  selectAll?: string;
  selectRow?: string;
  cancel?: string;
  retry?: string;
  errorTitle?: string;
  errorMessage?: string;
  /** Accessible label for the previous-page control. */
  previousPage?: string;
  /** Accessible label for the next-page control. */
  nextPage?: string;
  /** Builds the accessible "go to page N" label for numbered pagers. */
  goToPage?: (page: number) => string;
  /** Builds the "selected N" label. */
  selectedCount?: (count: number) => string;
  /** Builds the "showing X–Y of Z" label. */
  showing?: (range: { from: number; to: number; total: number }) => string;
  /** Builds the "page X of Y" label. */
  pageOf?: (range: { page: number; total: number }) => string;
  /** Label for the column-management menu trigger. */
  columns?: string;
  /** Pin-column menu actions. */
  pinLeft?: string;
  pinRight?: string;
  unpin?: string;
  /** Reorder-column menu actions. */
  moveLeft?: string;
  moveRight?: string;
  /** Reset the column layout to defaults. */
  resetColumns?: string;
}
