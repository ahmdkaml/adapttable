import {
  type Direction,
  pageSizeOptions,
  type SortByOption,
  type UseDataTableResult,
} from "@adapttable/core";
import { Badge, Button, Group, Select, Text, TextInput } from "@mantine/core";
import type { ReactNode } from "react";

import { FiltersIcon, SearchIcon } from "../icons";
import { FilterPopover } from "./FilterPopover";

/** Props for {@link Toolbar}. */
export interface ToolbarProps<TRow> {
  table: UseDataTableResult<TRow>;
  hideSearch?: boolean;
  searchPlaceholder?: string;
  sortByOptions?: SortByOption[];
  customToolbar?: ReactNode;
  hasFilters: boolean;
  activeFilterCount: number;
  /** Toggle the filter container open/closed (popover mode). */
  onToggleFilters: () => void;
  /** Close the filter container. */
  onCloseFilters: () => void;
  /** Whether the filter container is open. */
  filtersOpen: boolean;
  /** Filter content + how to render its container. */
  filtersMode: "popover" | "drawer";
  filters?: ReactNode;
  onClearFilters?: () => void;
  dir?: Direction;
  /** The Columns menu, rendered inline at the end of the toolbar row. */
  columnMenu?: ReactNode;
  showRowsPerPage: boolean;
  className?: string;
}

/** Sticky toolbar: search, optional sort select, custom slot, filters, size. */
export function Toolbar<TRow>({
  table,
  hideSearch,
  searchPlaceholder,
  sortByOptions,
  customToolbar,
  hasFilters,
  activeFilterCount,
  onToggleFilters,
  onCloseFilters,
  filtersOpen,
  filtersMode,
  filters,
  onClearFilters,
  dir,
  columnMenu,
  showRowsPerPage,
  className,
}: Readonly<ToolbarProps<TRow>>) {
  const { labels, source } = table;
  const searchProps = table.getSearchInputProps(
    searchPlaceholder ? { placeholder: searchPlaceholder } : undefined
  );
  // Explicit options win; otherwise auto-derive on mobile, where the card
  // layout has no clickable headers to sort by.
  const sortOptions =
    sortByOptions ?? (table.isMobile ? table.sortByOptions : undefined);

  const filtersButton = (
    <Button
      variant="default"
      size="sm"
      aria-expanded={filtersMode === "popover" ? filtersOpen : undefined}
      data-active={filtersOpen || undefined}
      leftSection={<FiltersIcon size={16} />}
      rightSection={
        activeFilterCount > 0 ? (
          <Badge size="sm" circle>
            {activeFilterCount}
          </Badge>
        ) : undefined
      }
      onClick={onToggleFilters}
    >
      {labels.filters}
    </Button>
  );

  return (
    <Group
      gap="sm"
      wrap="nowrap"
      justify="space-between"
      align="center"
      className={className}
    >
      {!hideSearch && (
        <TextInput
          {...searchProps}
          leftSection={<SearchIcon size={14} />}
          size="sm"
          style={{ flex: 1, minWidth: 160, maxWidth: 360 }}
        />
      )}
      <Group gap="xs" wrap="nowrap" align="center">
        {sortOptions && sortOptions.length > 0 && (
          <Select
            aria-label={labels.sortBy}
            placeholder={labels.sortBy}
            data={sortOptions}
            value={source.sortBy ?? null}
            onChange={(v) =>
              source.setSort(v ?? undefined, source.sortDir ?? "asc")
            }
            clearable
            size="sm"
            w={160}
            comboboxProps={{ withinPortal: false }}
          />
        )}
        {customToolbar}
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
        {columnMenu}
        {showRowsPerPage && (
          <Group gap="xs" align="center">
            <Text fz="xs" c="dimmed">
              {labels.rowsPerPage}
            </Text>
            <Select
              aria-label={labels.rowsPerPage}
              data={pageSizeOptions(source.limit).map((n) => ({
                value: String(n),
                label: String(n),
              }))}
              value={String(source.limit)}
              // `allowDeselect={false}` keeps the value non-null.
              onChange={(v) => source.setLimit(Number(v!))}
              size="sm"
              w={80}
              allowDeselect={false}
              comboboxProps={{ withinPortal: false }}
            />
          </Group>
        )}
      </Group>
    </Group>
  );
}
