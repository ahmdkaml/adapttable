import type { BaseDataTableProps } from "@adapttable/core";
import type { ReactNode } from "react";

/** Overridable sub-components. Each defaults to a styled Mantine part. */
export interface DataTableSlots {
  /** Replace the loading skeleton. */
  skeleton?: ReactNode;
  /** Replace the empty-state. */
  empty?: ReactNode;
}

/** Per-part class name overrides. */
export interface DataTableClassNames {
  root?: string;
  toolbar?: string;
  table?: string;
  card?: string;
  footer?: string;
}

/** Props for the Mantine `<DataTable>`. */
export interface DataTableProps<TRow> extends BaseDataTableProps<TRow> {
  /** Replace sub-components (skeleton, empty-state). */
  slots?: DataTableSlots;
  /** Per-part class name overrides. */
  classNames?: DataTableClassNames;
  /**
   * Animate rows/cards on mount (dependency-free; honors reduced motion).
   * Off by default.
   */
  animate?: boolean;
  /** Keep the desktop table header sticky. Defaults to true. */
  stickyHeader?: boolean;
}

/** Mantine color alias re-export for action colors. */
export type { MantineColor } from "@mantine/core";
