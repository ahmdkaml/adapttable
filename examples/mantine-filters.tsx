import {
  type ColumnDef,
  DataTable,
  type ExtraFilters,
  useFrontendData,
} from "@adapttable/mantine";
import { Checkbox, MantineProvider, Stack } from "@mantine/core";

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: string;
}

const INVOICES: Invoice[] = [
  { id: "1", number: "INV-001", amount: 120, status: "paid" },
  { id: "2", number: "INV-002", amount: 980, status: "open" },
  { id: "3", number: "INV-003", amount: 50, status: "void" },
  { id: "4", number: "INV-004", amount: 300, status: "open" },
];

const columns: ColumnDef<Invoice>[] = [
  {
    key: "number",
    header: "Number",
    accessor: (r) => r.number,
    sortable: true,
  },
  {
    key: "amount",
    header: "Amount",
    accessor: (r) => `$${r.amount}`,
    sortValue: (r) => r.amount,
    sortable: true,
  },
  {
    key: "status",
    header: "Status",
    accessor: (r) => r.status,
    sortable: true,
  },
];

const STATUSES = ["paid", "open", "void"];

/** Normalise the `status` extra value to a string[]. */
function selectedStatuses(value: ExtraFilters["status"]): string[] {
  if (Array.isArray(value)) return value;
  if (value != null) return [String(value)];
  return [];
}

/**
 * The full client-side filter loop in one place — the four pieces that must
 * share the same key (`"status"`):
 *
 * 1. `filterFn` — filters the rows from the active `extra` bag.
 * 2. `filters` — the widget, wired to `source.setExtra("status", …)`.
 * 3. `filterLabels` — turns each active value into a removable chip.
 * 4. `arrayExtraKeys` — parses `status` as an array (multi-select).
 */
export function MantineFiltersExample() {
  const source = useFrontendData({
    data: INVOICES,
    columns,
    arrayExtraKeys: ["status"],
    filterFn: (row, extra) => {
      const selected = selectedStatuses(extra.status);
      return selected.length === 0 || selected.includes(row.status);
    },
  });
  const selected = selectedStatuses(source.extra.status);

  return (
    <MantineProvider>
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        filterLabels={{ status: (value) => `Status: ${value}` }}
        onClearFilters={() => source.setExtra("status", undefined)}
        filters={
          <Checkbox.Group
            label="Status"
            value={selected}
            onChange={(value) => source.setExtra("status", value)}
          >
            <Stack gap="xs" mt="xs">
              {STATUSES.map((s) => (
                <Checkbox key={s} value={s} label={s} />
              ))}
            </Stack>
          </Checkbox.Group>
        }
      />
    </MantineProvider>
  );
}
