import type {
  BaseDataTableProps,
  UrlStateAdapter,
  UseSavedViewsOptions,
  UseTableDataOptions,
} from "@adapttable/core";
import type { ReactNode } from "react";

/** Overridable sub-components. */
export interface DataTableSlots {
  /** Replace the loading state shown while the first page loads. */
  skeleton?: ReactNode;
  /** Replace the empty-state shown when there are no rows. */
  empty?: ReactNode;
}

/** Props for the Ant Design `<DataTable>`. */
export interface DataTableProps<TRow>
  extends
    Omit<BaseDataTableProps<TRow>, "source">,
    Pick<
      UseTableDataOptions<TRow>,
      "source" | "data" | "total" | "loading" | "onQueryChange" | "urlKey"
    > {
  /**
   * URL-state backend for the built-in `data` / `onQueryChange` tiers.
   * Defaults to the browser History API; pass a router adapter
   * (react-router / Next.js) to integrate with an existing navigation stack.
   * Ignored when a prebuilt `source` is supplied (the source owns its state).
   */
  urlAdapter?: UrlStateAdapter;
  /**
   * Mount the built-in saved-views menu in the toolbar. Options are forwarded
   * to core's `useSavedViews`; `adapter` and `urlKey` default to the table's
   * own `urlAdapter` / `urlKey` so views capture THIS table's params.
   */
  savedViews?: UseSavedViewsOptions;
  /** Replace sub-components (skeleton, empty-state). */
  slots?: DataTableSlots;
  /** Class name applied to the outer wrapper. */
  className?: string;
  /**
   * antd table size. Overrides the size derived from `density`
   * (`"compact"` → `"small"`, `"comfortable"` → `"middle"`); use it to opt
   * into `"large"`.
   */
  size?: "small" | "middle" | "large";
  /** Render the table with cell borders. Defaults to `false`. */
  bordered?: boolean;
  /** Vertical scroll height used when `virtualize` is true. Defaults to 480. */
  virtualHeight?: number;
  /** Horizontal scroll width used when `virtualize` is true. Defaults to 960. */
  virtualWidth?: number;
}
