import { useDataTableShell } from "@adapttable/core/adapter";
import type { ReactNode } from "react";

import { ColumnMenu } from "./components/ColumnMenu";
import { DesktopTable } from "./components/DesktopTable";
import { Footer } from "./components/PaginationFooter";
import { Toolbar } from "./components/Toolbar";
import type { DataTableProps } from "./types";

function renderNoAutoForm() {
  return null;
}

export function DataTable<TRow>(
  props: Readonly<DataTableProps<TRow>>
): ReactNode {
  const shell = useDataTableShell<TRow>(props, renderNoAutoForm);
  const { filtersMode = "popover" } = props;
  const {
    chrome,
    source,
    table,
    labels,
    toolbarProps,
    filtersOpen,
    filtersTrigger,
    setFiltersOpen,
  } = shell;
  return (
    <div className="d-flex flex-column gap-3">
      <Toolbar
        {...toolbarProps}
        filtersMode={filtersMode}
        filtersOpen={filtersOpen}
        onToggleFilters={filtersTrigger.onClick}
        onCloseFilters={() => setFiltersOpen(false)}
        columnMenu={
          props.enableColumnMenu && !chrome.isMobile ? (
            <ColumnMenu
              allColumns={chrome.allColumns}
              onAutoSize={shell.autoSizeColumns}
              onAutoSizeColumn={shell.autoSizeColumn}
              onSortColumn={(key, dir) => source.setSort(key, dir)}
              onFilterColumn={() => setFiltersOpen(true)}
              sortBy={source.sortBy}
              sortDir={source.sortDir}
              layout={chrome.columnLayout}
              labels={table.labels}
              hasRowActions={shell.hasRowActions}
              hasRowReorder={shell.hasRowReorder}
              dir={props.dir}
            />
          ) : undefined
        }
      />
      <DesktopTable {...shell.tableProps} />

      {props.tableFooter ? (
        <div data-adapttable-part="table-footer">{props.tableFooter}</div>
      ) : null}

      {chrome.showFooter && (
        <Footer
          pagination={table.pagination}
          total={source.total}
          limit={source.limit}
          setPage={source.setPage}
          setLimit={source.setLimit}
          labels={labels}
          showRowsPerPage={!chrome.grouping}
        />
      )}
    </div>
  );
}
