import type { BaseDataTableProps } from "@adapttable/core";
import type { ReactNode } from "react";

/** Overridable sub-components. */
export interface DataTableSlots {
  /** Replace the loading skeleton. */
  skeleton?: ReactNode;
  /** Replace the empty-state. */
  empty?: ReactNode;
}

/** Props for the Material UI `<DataTable>`. */
export interface DataTableProps<TRow> extends BaseDataTableProps<TRow> {
  /** Replace sub-components (skeleton, empty-state). */
  slots?: DataTableSlots;
  /** Class name applied to the root `<Paper>`. */
  className?: string;
  /** MUI table density. Defaults to `"medium"`. */
  size?: "small" | "medium";
}
