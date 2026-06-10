/**
 * Covers MobileCards' trailing virtual-spacer branch (`paddingBottom > 0`).
 * We mock `useTableVirtualization` to return a non-zero `paddingBottom`, which
 * is only rendered in the virtualized mobile layout.
 */
import {
  createMemoryAdapter,
  useFrontendData,
  useTableVirtualization,
} from "@adapttable/core";
import { MantineProvider } from "@mantine/core";
import { render } from "@testing-library/react";
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

beforeEach(() => {
  vi.mocked(useTableVirtualization).mockImplementation(({ rows, rowKey }) => ({
    enabled: true,
    rows: rows.map((row, index) => ({ row, index, key: rowKey(row) })),
    paddingTop: 0,
    // Non-zero trailing padding renders the bottom spacer div.
    paddingBottom: 40,
  }));
});

const adapter = createMemoryAdapter("");

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
        isMobile
        virtualize
      />
    </MantineProvider>
  );
}

describe("MobileCards trailing virtual spacer", () => {
  it("renders a bottom spacer when paddingBottom > 0", () => {
    const { container } = render(<Harness />);
    const spacers = container.querySelectorAll("div[aria-hidden][style]");
    const hasBottomSpacer = Array.from(spacers).some(
      (el) => (el as HTMLElement).style.height === "40px"
    );
    expect(hasBottomSpacer).toBe(true);
  });
});
