import type { TableLabels } from "@adapttable/core";
import { Group, Pagination, Select, Text } from "@mantine/core";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/** Props for {@link PaginationFooter}. */
export interface PaginationFooterProps {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  fromIndex: number;
  toIndex: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  labels: Required<TableLabels>;
}

/** Desktop pagination bar: page-size + range on the left, pager on the right. */
export function PaginationFooter({
  page,
  totalPages,
  limit,
  total,
  fromIndex,
  toIndex,
  onPageChange,
  onLimitChange,
  labels,
}: Readonly<PaginationFooterProps>) {
  const safeTotalPages = Math.max(totalPages, 1);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);
  const options = PAGE_SIZE_OPTIONS.map((n) => ({
    value: String(n),
    label: String(n),
  }));

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="md" pt="xs">
      <Group gap="xs" align="center" wrap="nowrap">
        <Text fz="xs" c="dimmed">
          {labels.rowsPerPage}
        </Text>
        <Select
          aria-label={labels.rowsPerPage}
          data={options}
          value={String(limit)}
          onChange={(v) => onLimitChange(Number(v ?? limit))}
          size="xs"
          w={76}
          allowDeselect={false}
          comboboxProps={{ withinPortal: false }}
        />
        {total > 0 && (
          <Text fz="xs" c="dimmed">
            {labels.showing({ from: fromIndex, to: toIndex, total })}
          </Text>
        )}
      </Group>
      <Group gap="sm" align="center" wrap="nowrap">
        <Text fz="xs" c="dimmed">
          {labels.pageOf({ page: safePage, total: safeTotalPages })}
        </Text>
        <Pagination
          total={safeTotalPages}
          value={safePage}
          onChange={onPageChange}
          size="sm"
          siblings={1}
          boundaries={1}
        />
      </Group>
    </Group>
  );
}
