import { Skeleton, Table } from "@mantine/core";

/** Props for {@link TableSkeleton}. */
export interface TableSkeletonProps {
  /** Number of placeholder columns. */
  columns: number;
  /** Number of placeholder rows. Defaults to 5. */
  rows?: number;
}

/** Loading placeholder that mirrors the table shape to avoid layout shift. */
export function TableSkeleton({
  columns,
  rows = 5,
}: Readonly<TableSkeletonProps>) {
  const colKeys = Array.from({ length: Math.max(columns, 1) }, (_, i) => i);
  const rowKeys = Array.from({ length: rows }, (_, i) => i);
  return (
    <Table>
      <Table.Tbody>
        {rowKeys.map((r) => (
          <Table.Tr key={r}>
            {colKeys.map((c) => (
              <Table.Td key={c}>
                <Skeleton
                  height={14}
                  radius="sm"
                  width={c === 0 ? "70%" : "55%"}
                />
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
