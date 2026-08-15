import { useDataTableShell } from "@adapttable/core/adapter";
import type { ReactNode } from "react";

import { DesktopTable } from "./components/DesktopTable";
import type { DataTableProps } from "./types";

function renderNoAutoForm() {
  return null;
}

export function DataTable<TRow>(
  props: Readonly<DataTableProps<TRow>>
): ReactNode {
  const shell = useDataTableShell<TRow>(props, renderNoAutoForm);
  return <DesktopTable {...shell.tableProps} />;
}
