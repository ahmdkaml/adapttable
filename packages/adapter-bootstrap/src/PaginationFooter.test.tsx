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
} as Required<
  Pick<
    TableLabels,
    "rowsPerPage" | "previousPage" | "nextPage" | "showing" | "pageOf"
  >
>;

const pagination: PaginationInfo = {
  safePage: 2,
  totalPages: 10,
  fromIndex: 11,
  toIndex: 20,
};

describe("PaginationFooter", () => {
  it("renders pagination controls and rows-per-page selector with custom className", () => {
    const { container } = render(
      <Footer
        pagination={pagination}
        total={100}
        limit={10}
        setPage={vi.fn()}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
        className="custom-footer-class"
      />
    );

    expect(screen.getByLabelText(labels.rowsPerPage)).toBeInTheDocument();
    expect(screen.getByLabelText(labels.previousPage)).toBeInTheDocument();
    expect(screen.getByLabelText(labels.nextPage)).toBeInTheDocument();
    expect(
      screen.getByText(labels.pageOf({ page: 2, total: 10 }))
    ).toBeInTheDocument();
    expect(
      screen.getByText(labels.showing({ from: 11, to: 20, total: 100 }))
    ).toBeInTheDocument();

    // Covers className branch
    expect(container.firstChild).toHaveClass("custom-footer-class");
  });

  it("clicks Previous and Next buttons to change page", () => {
    const setPage = vi.fn();

    render(
      <Footer
        pagination={pagination}
        total={100}
        limit={10}
        setPage={setPage}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
      />
    );

    // Covers lines 67 and 88-89
    fireEvent.click(screen.getByLabelText(labels.previousPage));
    expect(setPage).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByLabelText(labels.nextPage));
    expect(setPage).toHaveBeenCalledWith(3);
  });

  it("changes page when a pagination number item is clicked", () => {
    const setPage = vi.fn();

    render(
      <Footer
        pagination={pagination}
        total={100}
        limit={10}
        setPage={setPage}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    expect(setPage).toHaveBeenCalledWith(1);
  });

  it("changes page size", () => {
    const setLimit = vi.fn();

    render(
      <Footer
        pagination={pagination}
        total={100}
        limit={10}
        setPage={vi.fn()}
        setLimit={setLimit}
        labels={labels as Required<TableLabels>}
      />
    );

    const select = screen.getByLabelText(labels.rowsPerPage);
    fireEvent.change(select, { target: { value: "25" } });
    expect(setLimit).toHaveBeenCalledWith(25);
  });

  it("disables previous on first page and next on last page", () => {
    const { rerender } = render(
      <Footer
        pagination={{ safePage: 1, totalPages: 5, fromIndex: 1, toIndex: 10 }}
        total={50}
        limit={10}
        setPage={vi.fn()}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
      />
    );

    expect(
      screen.getByLabelText(labels.previousPage).closest(".page-item")
    ).toHaveClass("disabled");

    rerender(
      <Footer
        pagination={{ safePage: 5, totalPages: 5, fromIndex: 41, toIndex: 50 }}
        total={50}
        limit={10}
        setPage={vi.fn()}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
      />
    );

    expect(
      screen.getByLabelText(labels.nextPage).closest(".page-item")
    ).toHaveClass("disabled");
  });

  it("hides rows-per-page and total info when total is 0", () => {
    render(
      <Footer
        pagination={{ safePage: 1, totalPages: 1, fromIndex: 0, toIndex: 0 }}
        total={0}
        limit={10}
        setPage={vi.fn()}
        setLimit={vi.fn()}
        labels={labels as Required<TableLabels>}
        showRowsPerPage={false}
      />
    );

    expect(screen.queryByLabelText(labels.rowsPerPage)).not.toBeInTheDocument();
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });
});
