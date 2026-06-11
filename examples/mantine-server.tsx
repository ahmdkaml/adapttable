import "@mantine/core/styles.css";

import { DataTable, type TableQuery } from "@adapttable/mantine";
import { MantineProvider } from "@mantine/core";
import { useState } from "react";

interface Person {
  id: string;
  name: string;
  city: string;
}

/**
 * Server data WITHOUT a query library: the table owns the query state (URL,
 * filters, debounce) and emits ONE consolidated `onQueryChange` per real
 * change — including the initial mount with URL-restored values. Forward
 * the `signal` to `fetch` and superseded (out-of-order) responses are
 * aborted for you. Your only job: call the API, hand back rows + total.
 */
export function MantineServerExample() {
  const [rows, setRows] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  async function load(query: TableQuery, signal: AbortSignal) {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(query.page),
        limit: String(query.limit),
        ...(query.search ? { q: query.search } : {}),
        ...(typeof query.filters.city === "string"
          ? { city: query.filters.city }
          : {}),
      });
      const res = await fetch(`/api/people?${qs.toString()}`, { signal });
      const page = (await res.json()) as { items: Person[]; total: number };
      setRows(page.items);
      setTotal(page.total);
      setLoading(false);
    } catch (error) {
      // Aborted requests are expected (a newer query superseded this one).
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setLoading(false);
        throw error;
      }
    }
  }

  return (
    <MantineProvider>
      <DataTable
        data={rows}
        total={total}
        loading={loading}
        onQueryChange={(query, { signal }) => void load(query, signal)}
        columns={[
          { key: "name", sortable: true },
          {
            key: "city",
            // The same declarative filter drives the widget, chip and URL —
            // the VALUE arrives in `query.filters.city` for your API.
            filter: {
              type: "select",
              options: [
                { value: "Dubai", label: "Dubai" },
                { value: "Riyadh", label: "Riyadh" },
              ],
            },
          },
        ]}
        rowKey={(r) => r.id}
      />
    </MantineProvider>
  );
}
