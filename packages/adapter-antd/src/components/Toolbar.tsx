/** Search field, sort select, filters trigger, menus and rows-per-page. */
import { pageSizeOptions } from "@adapttable/core";
import {
  ExportAnnouncer,
  type ToolbarChromeProps,
} from "@adapttable/core/adapter";
import { Badge, Button, Flex, Input, Select, Spin } from "antd";
import type { ReactNode } from "react";

import { FiltersIcon, SearchIcon } from "../icons";
import { FilterPopover } from "./FilterPopover";

export interface ToolbarProps<TRow> extends ToolbarChromeProps<TRow> {
  /** Filter content (anchored popover or drawer). */
  filters?: ReactNode;
  /** Whether to anchor a popover or open the drawer. */
  filtersMode: "popover" | "drawer";
  /** Close the filter container. */
  onCloseFilters: () => void;
  /** Clear every active filter (always wired — falls back to `clearExtras`). */
  onClearFilters: () => void;
  /** Show the subtle background-refresh spinner in the toolbar. */
  isRefreshing: boolean;
}

/** Search field + sort select + filters button + rows-per-page. */
export function Toolbar<TRow>({
  table,
  searchable,
  searchPlaceholder,
  sortByOptions,
  toolbar,
  hasFilters,
  activeFilterCount,
  filters,
  filtersMode,
  filtersOpen,
  onToggleFilters,
  onFiltersTriggerPointerDown,
  onCloseFilters,
  onClearFilters,
  isRefreshing,
  dir,
  columnMenu,
  onExportCsv,
  exportBusy,
  exportAnnouncement = "",
  savedViewsMenu,
  showRowsPerPage,
}: Readonly<ToolbarProps<TRow>>) {
  const { labels, source } = table;
  const sortOptions =
    sortByOptions ?? (table.isMobile ? table.sortByOptions : undefined);
  const searchProps = table.getSearchInputProps(
    searchPlaceholder ? { placeholder: searchPlaceholder } : undefined
  );

  const filtersButton = (
    <Badge count={activeFilterCount} size="small">
      <Button
        icon={<FiltersIcon size={16} />}
        aria-expanded={filtersMode === "popover" ? filtersOpen : undefined}
        data-active={filtersOpen || undefined}
        onPointerDown={onFiltersTriggerPointerDown}
        onClick={onToggleFilters}
      >
        {labels.filters}
      </Button>
    </Badge>
  );

  return (
    <Flex gap="small" wrap align="center" justify="space-between">
      {searchable !== false && (
        <Input
          type="search"
          allowClear
          prefix={<SearchIcon size={14} />}
          style={{ flex: 1, minWidth: 160, maxWidth: 360 }}
          aria-label={labels.search}
          value={searchProps.value}
          placeholder={searchProps.placeholder}
          onChange={searchProps.onChange}
        />
      )}
      <Flex gap="small" wrap align="center">
        {isRefreshing && <Spin size="small" aria-label={labels.loading} />}
        {sortOptions && sortOptions.length > 0 && (
          <Select
            style={{ minWidth: 160 }}
            aria-label={labels.sortBy}
            placeholder={labels.sortBy}
            allowClear
            value={source.sortBy ?? undefined}
            options={sortOptions.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(value?: string) =>
              source.setSort(value, source.sortDir ?? "asc")
            }
          />
        )}
        {toolbar}
        {hasFilters &&
          (filtersMode === "popover" ? (
            <FilterPopover
              open={filtersOpen}
              onClose={onCloseFilters}
              filters={filters}
              activeFilterCount={activeFilterCount}
              onClearFilters={onClearFilters}
              labels={labels}
              dir={dir}
            >
              {filtersButton}
            </FilterPopover>
          ) : (
            filtersButton
          ))}
        {savedViewsMenu}
        {columnMenu}
        {onExportCsv && (
          <>
            {/* antd's own loading Button: the spinner replaces its icon slot
                and the button disables itself, which is the kit's language for
                "working" rather than a bare greyed-out control. */}
            <Button
              onClick={onExportCsv}
              loading={exportBusy}
              aria-busy={exportBusy}
            >
              {labels.exportCsv}
            </Button>
            <ExportAnnouncer announcement={exportAnnouncement} />
          </>
        )}
        {showRowsPerPage && (
          <Select
            style={{ minWidth: 110 }}
            aria-label={labels.rowsPerPage}
            value={source.limit}
            options={pageSizeOptions(source.limit).map((n) => ({
              value: n,
              label: String(n),
            }))}
            onChange={(value: number) => source.setLimit(value)}
          />
        )}
      </Flex>
    </Flex>
  );
}
