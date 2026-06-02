import {
  pageSizeOptions,
  type SortByOption,
  type UseDataTableResult,
} from "@adapttable/core";
import { Badge, Button, Group, Select, Text, TextInput } from "@mantine/core";
import type { ReactNode } from "react";

import { FiltersIcon, SearchIcon } from "../icons";

/** Props for {@link Toolbar}. */
export interface ToolbarProps<TRow> {
  table: UseDataTableResult<TRow>;
  hideSearch?: boolean;
  searchPlaceholder?: string;
  sortByOptions?: SortByOption[];
  customToolbar?: ReactNode;
  hasFilters: boolean;
  activeFilterCount: number;
  onOpenFilters: () => void;
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
  onOpenFilters,
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

  return (
    <Group
      gap="sm"
      wrap="wrap"
      justify="space-between"
      align="center"
      className={className}
    >
      {!hideSearch && (
        <TextInput
          {...searchProps}
          leftSection={<SearchIcon size={14} />}
          size="sm"
          style={{ flex: 1, minWidth: 200, maxWidth: 360 }}
        />
      )}
      <Group gap="xs" wrap="wrap" align="center">
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
        {hasFilters && (
          <Button
            variant="default"
            size="sm"
            leftSection={<FiltersIcon size={16} />}
            rightSection={
              activeFilterCount > 0 ? (
                <Badge size="sm" circle>
                  {activeFilterCount}
                </Badge>
              ) : undefined
            }
            onClick={onOpenFilters}
          >
            {labels.filters}
          </Button>
        )}
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
              onChange={(v) => source.setLimit(Number(v ?? source.limit))}
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
