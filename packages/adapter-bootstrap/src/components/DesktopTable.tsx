import type { SharedTableRenderProps } from "@adapttable/core/adapter";
import { Table } from "react-bootstrap";

export function DesktopTable<TRow>(
  props: Readonly<SharedTableRenderProps<TRow>>,
) {
  const { table, rows } = props;

  return (
    <Table bordered hover responsive>
      <thead>
        <tr {...table.getHeaderRowProps()}>
          {table.columns.map((column) => (
            <th
              key={String(column.key)}
              {...table.getHeaderCellProps(column)}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, index) => (
          <tr
            key={table.getRowKey(row)}
            {...table.getRowProps(row, index)}
          >
            {table.columns.map((column) => (
              <td
                key={String(column.key)}
                {...table.getCellProps(column)}
              >
                {table.getCellContent(column, row, index)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
