import type { PaginationInfo, TableLabels } from "@adapttable/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Footer } from "./components/PaginationFooter";

const labels = {
  rowsPerPage: "Rows per page",
  previousPage: "Previous page",
  nextPage: "Next page",
  showing: ({ from, to, total }: { from: number; to: number; total: number }) =>
    `Showing ${from}-${to} of ${total}`,
  pageOf: ({ page, total }: { page: number; total: number }) =>
    `Page ${page} of ${total}`,
} as Required<Pick<
  TableLabels,
  "rowsPerPage" | "previousPage" | "nextPage" | "showing" | "pageOf"
>>;

const pagination: PaginationInfo = {
  safePage: 2,
  totalPages: 5,
  fromIndex: 11,
  toIndex: 20,
};

describe("PaginationFooter", () => {
  it("renders pagination controls and rows-per-page selector", () => {
    render(
      <Footer
        pagination={pagination}
        total={50}
        limit={10}
        setPage={vi.fn()}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
      />,
    );

    expect(screen.getByLabelText(labels.rowsPerPage)).toBeInTheDocument();
    expect(
      screen.getByLabelText(labels.previousPage),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(labels.nextPage)).toBeInTheDocument();

    expect(
      screen.getByText(labels.pageOf({ page: 2, total: 5 })),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        labels.showing({
          from: 11,
          to: 20,
          total: 50,
        }),
      ),
    ).toBeInTheDocument();
  });

  it("changes page when a pagination item is clicked", () => {
    const setPage = vi.fn();

    render(
      <Footer
        pagination={pagination}
        total={50}
        limit={10}
        setPage={setPage}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "3" }));

    expect(setPage).toHaveBeenCalledWith(3);
  });

  it("changes page size", () => {
    const setLimit = vi.fn();

    render(
      <Footer
        pagination={pagination}
        total={50}
        limit={10}
        setPage={vi.fn()}
        setLimit={setLimit}
        labels={labels as Required<TableLabels>}
      />,
    );

    const select = screen.getByLabelText(labels.rowsPerPage);

    fireEvent.change(select, {
      target: { value: "25" },
    });

    expect(setLimit).toHaveBeenCalledWith(25);
  });

  it("disables previous on the first page and next on the last page", () => {
    const { rerender } = render(
      <Footer
        pagination={{
          safePage: 1,
          totalPages: 5,
          fromIndex: 1,
          toIndex: 10,
        }}
        total={50}
        limit={10}
        setPage={vi.fn()}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
      />,
    );

    expect(
    screen.getByLabelText(labels.previousPage).closest(".page-item"),
    ).toHaveClass("disabled");

    expect(
    screen.getByLabelText(labels.nextPage).closest(".page-item"),
    ).not.toHaveClass("disabled");

    rerender(
      <Footer
        pagination={{
          safePage: 5,
          totalPages: 5,
          fromIndex: 41,
          toIndex: 50,
        }}
        total={50}
        limit={10}
        setPage={vi.fn()}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
      />,
    );

    expect(
    screen.getByLabelText(labels.previousPage).closest(".page-item"),
    ).not.toHaveClass("disabled");

    expect(
    screen.getByLabelText(labels.nextPage).closest(".page-item"),
    ).toHaveClass("disabled");
  });

  it("hides rows-per-page controls when disabled", () => {
    render(
      <Footer
        pagination={pagination}
        total={50}
        limit={10}
        setPage={vi.fn()}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
        showRowsPerPage={false}
      />,
    );

    expect(
      screen.queryByLabelText(labels.rowsPerPage),
    ).not.toBeInTheDocument();
  });
});
