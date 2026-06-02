import type { BaseDataTableProps } from "@adapttable/core";
import type { ReactNode } from "react";

/** Overridable sub-components. */
export interface DataTableSlots {
  /** Replace the loading state shown while the first page loads. */
  skeleton?: ReactNode;
  /** Replace the empty-state shown when there are no rows. */
  empty?: ReactNode;
}

/** Props for the Ant Design `<DataTable>`. */
export interface DataTableProps<TRow> extends BaseDataTableProps<TRow> {
  /** Replace sub-components (skeleton, empty-state). */
  slots?: DataTableSlots;
  /** Class name applied to the outer wrapper. */
  className?: string;
  /** antd table density. Defaults to `"middle"`. */
  size?: "small" | "middle" | "large";
  /** Render the table with cell borders. Defaults to `false`. */
  bordered?: boolean;
  /** Vertical scroll height used when `virtualize` is true. Defaults to 480. */
  virtualHeight?: number;
  /** Horizontal scroll width used when `virtualize` is true. Defaults to 960. */
  virtualWidth?: number;
}
