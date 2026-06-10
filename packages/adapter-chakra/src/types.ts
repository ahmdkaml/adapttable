import type { BaseDataTableProps } from "@adapttable/core";
import type { ReactNode } from "react";

/** Overridable sub-components. */
export interface DataTableSlots {
  /** Replace the loading skeleton. */
  skeleton?: ReactNode;
  /** Replace the empty-state. */
  empty?: ReactNode;
}

/** Per-part class hooks — restyle without replacing components. */
export interface DataTableClassNames {
  root?: string;
  toolbar?: string;
  table?: string;
  card?: string;
  footer?: string;
}

/** Props for the Chakra UI `<DataTable>`. */
export interface DataTableProps<TRow> extends BaseDataTableProps<TRow> {
  /** Replace sub-components (skeleton, empty-state). */
  slots?: DataTableSlots;
  /** Per-part class hooks (root / toolbar / table / card / footer). */
  classNames?: DataTableClassNames;
  /** Chakra color scheme for primary accents (buttons, badges). */
  colorScheme?: string;
  /** Chakra table size. Defaults to `"md"`. */
  size?: "sm" | "md" | "lg";
}
