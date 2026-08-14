import { useDataTableShell } from "@adapttable/core/adapter";
import type { ReactNode } from "react";

export interface DataTableProps<TRow> {
  columns: Array<{
    key: keyof TRow & string;
    header: ReactNode;
  }>;
  data: readonly TRow[];
}

export function DataTable<TRow>({
  columns,
  data,
}: Readonly<DataTableProps<TRow>>) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>{column.header}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column) => (
              <td key={column.key}>{String(row[column.key] ?? "")}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
