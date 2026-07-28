/** Search field, sort select, filters trigger, menus and rows-per-page. */
import { pageSizeOptions } from "@adapttable/core";
import {
  FiltersIcon,
  SearchIcon,
  type ToolbarChromeProps,
} from "@adapttable/core/adapter";
import { type ReactNode } from "react";

import type { BaseUiAccentColor } from "../types";
import { Badge, Box, Button, Flex, TextField } from "../ui";
import { FilterPopover } from "./FilterPopover";
import { NativeSelect, type SelectOption } from "./primitives";

export function pageSizeSelectOptions(limit: number): SelectOption[] {
  return pageSizeOptions(limit).map((n) => ({
    value: String(n),
    label: String(n),
  }));
}

/** Props for {@link Toolbar}: the shared chrome surface + Base UI extras. */
export interface ToolbarProps<TRow> extends ToolbarChromeProps<TRow> {
  /** Which filter container opens from the Filters button. */
  filtersMode: "popover" | "drawer";
  /** Filter widgets rendered inside the popover container. */
  filters?: ReactNode;
  /** Close the filter popover (Escape / outside click). */
  onCloseFilters: () => void;
  /** Clear-filters handler for the popover header. */
  onClearFilters: () => void;
  /** Accent color for primary accents. */
  accentColor?: BaseUiAccentColor;
  /** Class hook for the toolbar row. */
  className?: string;
}

/** Search + sort select + filters button + columns menu + rows-per-page. */
export function Toolbar<TRow>({
  table,
  searchable,
  searchPlaceholder,
  sortByOptions,
  toolbar,
  hasFilters,
  activeFilterCount,
  filtersMode,
  filters,
  filtersOpen,
  onToggleFilters,
  onFiltersTriggerPointerDown,
  onCloseFilters,
  onClearFilters,
  savedViewsMenu,
  columnMenu,
  onExportCsv,
  showRowsPerPage,
  accentColor,
  dir,
  className,
}: Readonly<ToolbarProps<TRow>>) {
  const { labels, source } = table;
  const sortOptions =
    sortByOptions ?? (table.isMobile ? table.sortByOptions : undefined);
  const searchProps = table.getSearchInputProps(
    searchPlaceholder ? { placeholder: searchPlaceholder } : undefined
  );

  const filtersButton = (
    <Button
      size="2"
      variant="outline"
      color={accentColor}
      aria-expanded={filtersMode === "popover" ? filtersOpen : undefined}
      data-active={filtersOpen || undefined}
      onPointerDown={onFiltersTriggerPointerDown}
      onClick={onToggleFilters}
    >
      <FiltersIcon />
      {labels.filters}
      {activeFilterCount > 0 && (
        <Badge color={accentColor} radius="full">
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Flex
      gap="2"
      wrap="wrap"
      justify="between"
      align="center"
      className={className}
    >
      {searchable !== false && (
        <Box style={{ flex: 1, minWidth: 160, maxWidth: 360 }}>
          <TextField.Root
            size="2"
            aria-label={labels.search}
            type="search"
            value={searchProps.value}
            placeholder={searchProps.placeholder}
            onChange={searchProps.onChange}
          >
            <TextField.Slot side="left">
              <SearchIcon />
            </TextField.Slot>
          </TextField.Root>
        </Box>
      )}
      <Flex gap="2" wrap="wrap" align="center">
        {sortOptions && sortOptions.length > 0 && (
          <NativeSelect
            size="2"
            width="160px"
            aria-label={labels.sortBy}
            placeholder={labels.sortBy}
            value={source.sortBy ?? ""}
            options={[
              { value: "", label: labels.sortBy },
              ...sortOptions.map((o) => ({ value: o.value, label: o.label })),
            ]}
            onValueChange={(value) =>
              source.setSort(value || undefined, source.sortDir ?? "asc")
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
              accentColor={accentColor}
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
          <Button
            size="2"
            variant="outline"
            color={accentColor}
            onClick={onExportCsv}
          >
            {labels.exportCsv}
          </Button>
        )}
        {showRowsPerPage && (
          <NativeSelect
            size="2"
            width="90px"
            aria-label={labels.rowsPerPage}
            value={String(source.limit)}
            options={pageSizeSelectOptions(source.limit)}
            onValueChange={(value) => source.setLimit(Number(value))}
          />
        )}
      </Flex>
    </Flex>
  );
}
