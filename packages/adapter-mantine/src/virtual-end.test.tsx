/**
 * Covers DataTable's `handleVirtualEndReached`: when the virtualizer signals
 * the end of the list, the table fetches the next page (but only while one is
 * available and not already loading). We mock `useTableVirtualization` to
 * capture and invoke the `onEndReached` callback the table wires in.
 */
import {
  createMemoryAdapter,
  useFrontendData,
  useTableVirtualization,
} from "@adapttable/core";
import { MantineProvider } from "@mantine/core";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";
import type { ColumnDef } from "./index";

interface Row {
  id: string;
  name: string;
}
const ROWS: Row[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];
const columns: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name },
];

vi.mock("@adapttable/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useTableVirtualization: vi.fn(),
  };
});

let endReached: (() => void) | undefined;

beforeEach(() => {
  endReached = undefined;
  vi.mocked(useTableVirtualization).mockImplementation(
    ({ rows, rowKey, onEndReached }) => {
      endReached = onEndReached;
      return {
        enabled: false,
        rows: rows.map((row, index) => ({ row, index, key: rowKey(row) })),
        paddingTop: 0,
        paddingBottom: 0,
      };
    }
  );
});

const adapter = createMemoryAdapter("limit=1");

function Harness() {
  const source = useFrontendData<Row>({
    data: ROWS,
    adapter,
    columns,
    paginationMode: "infinite",
  });
  return (
    <MantineProvider>
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        virtualize
      />
    </MantineProvider>
  );
}

describe("DataTable handleVirtualEndReached", () => {
  it("fetches the next page when the virtualizer reaches the end", () => {
    render(<Harness />);
    // First page shows only Alice (limit=1) and another page is available.
    expect(screen.getByRole("cell", { name: "Alice" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Bob" })).toBeNull();
    // A next page is available (the Load more button is rendered).
    expect(
      screen.getByRole("button", { name: /load more/i })
    ).toBeInTheDocument();

    // The table wired a real end-reached callback into the virtualizer.
    expect(typeof endReached).toBe("function");

    // Reaching the virtual end loads the next page.
    act(() => endReached?.());
    expect(screen.getByRole("cell", { name: "Bob" })).toBeInTheDocument();

    // A second end-reached is a no-op once everything is loaded (guards the
    // `hasNextPage` branch on the false side).
    act(() => endReached?.());
    expect(screen.getByRole("cell", { name: "Bob" })).toBeInTheDocument();
  });
});
