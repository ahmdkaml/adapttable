/** Search field, sort select, filters trigger, menus and rows-per-page. */
import { pageSizeOptions } from "@adapttable/core";
import {
  FiltersIcon,
  SearchIcon,
  type ToolbarChromeProps,
} from "@adapttable/core/adapter";
import { Badge, Button, HStack, Input, InputGroup } from "@chakra-ui/react";
import { type ReactNode } from "react";

import { FilterPopover } from "./FilterPopover";
import { NativeSelect } from "./primitives";

export interface ToolbarProps<TRow> extends ToolbarChromeProps<TRow> {
  /** Which filter container opens from the Filters button. */
  filtersMode: "popover" | "drawer";
  /** Filter widgets rendered inside the popover container. */
  filters?: ReactNode;
  /** Close the filter popover (Escape / outside click). */
  onCloseFilters: () => void;
  /** Clear-filters handler for the popover header. */
  onClearFilters: () => void;
  /** Chakra color scheme for primary accents. */
  accentColor?: string;
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
  exportBusy,
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
      size="sm"
      variant="outline"
      colorPalette={accentColor}
      aria-expanded={filtersMode === "popover" ? filtersOpen : undefined}
      data-active={filtersOpen || undefined}
      onPointerDown={onFiltersTriggerPointerDown}
      onClick={onToggleFilters}
    >
      <FiltersIcon />
      {labels.filters}
      {activeFilterCount > 0 && (
        <Badge ml={2} colorPalette={accentColor} borderRadius="full">
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <HStack
      gap={2}
      flexWrap="wrap"
      rowGap={2}
      justify="space-between"
      align="center"
      className={className}
    >
      {searchable !== false && (
        <InputGroup
          maxW="360px"
          flex="1"
          minW="160px"
          startElement={<SearchIcon />}
        >
          <Input
            size="sm"
            aria-label={labels.search}
            type="search"
            value={searchProps.value}
            placeholder={searchProps.placeholder}
            onChange={searchProps.onChange}
          />
        </InputGroup>
      )}
      <HStack gap={2} flexWrap="wrap" rowGap={2} align="center">
        {sortOptions && sortOptions.length > 0 && (
          <NativeSelect
            size="sm"
            w="160px"
            aria-label={labels.sortBy}
            placeholder={labels.sortBy}
            value={source.sortBy ?? ""}
            onChange={(e) =>
              source.setSort(
                e.target.value || undefined,
                source.sortDir ?? "asc"
              )
            }
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
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
            size="sm"
            variant="outline"
            colorPalette={accentColor}
            onClick={onExportCsv}
            disabled={exportBusy}
            aria-busy={exportBusy}
          >
            {labels.exportCsv}
          </Button>
        )}
        {showRowsPerPage && (
          <NativeSelect
            size="sm"
            w="90px"
            aria-label={labels.rowsPerPage}
            value={source.limit}
            onChange={(e) => source.setLimit(Number(e.target.value))}
          >
            {pageSizeOptions(source.limit).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </NativeSelect>
        )}
      </HStack>
    </HStack>
  );
}
