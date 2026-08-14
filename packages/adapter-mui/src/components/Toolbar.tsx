/** Search field, sort select, filters trigger, menus and rows-per-page. */
import { pageSizeOptions } from "@adapttable/core";
import {
  ExportAnnouncer,
  type ToolbarChromeProps,
} from "@adapttable/core/adapter";
import {
  Badge,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { type ReactNode, useRef } from "react";

import { FilterPopover } from "./FilterPopover";

function FiltersIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z" />
    </svg>
  );
}

/** Magnifying-glass glyph for the search field (currentColor, no icon-lib). */
function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * Toolbar props: the shared {@link ToolbarChromeProps} plus the filter-container
 * wiring (mode + open/close handlers) so the Filters button can act as either
 * the popover anchor (default) or the drawer trigger.
 */
export interface MuiToolbarProps<TRow> extends ToolbarChromeProps<TRow> {
  /** Which filter container the Filters button drives. */
  filtersMode: "popover" | "drawer";
  /** Filter content (rendered inside the popover when in popover mode). */
  filters?: ReactNode;
  /** Close the filter container (popover mode). */
  onCloseFilters: () => void;
  /** Clear all active filters. */
  onClearFilters: () => void;
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
  showRowsPerPage,
  filtersMode,
  filters,
  filtersOpen,
  onToggleFilters,
  onFiltersTriggerPointerDown,
  onCloseFilters,
  onClearFilters,
  dir,
  savedViewsMenu,
  columnMenu,
  onAddRow,
  addRowLabel,
  onExportCsv,
  exportBusy,
  exportAnnouncement = "",
  exportLabel,
}: Readonly<MuiToolbarProps<TRow>>) {
  const { labels, source } = table;
  const sortOptions =
    sortByOptions ?? (table.isMobile ? table.sortByOptions : undefined);
  const searchProps = table.getSearchInputProps(
    searchPlaceholder ? { placeholder: searchPlaceholder } : undefined
  );
  const filtersAnchorRef = useRef<HTMLButtonElement>(null);

  const filtersButton = hasFilters ? (
    <Badge color="primary" badgeContent={activeFilterCount}>
      <Button
        ref={filtersAnchorRef}
        variant="outlined"
        size="small"
        startIcon={<FiltersIcon />}
        aria-expanded={filtersMode === "popover" ? filtersOpen : undefined}
        onPointerDown={onFiltersTriggerPointerDown}
        onClick={onToggleFilters}
      >
        {labels.filters}
      </Button>
    </Badge>
  ) : null;

  return (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      sx={{
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {searchable !== false && (
        <TextField
          size="small"
          value={searchProps.value}
          placeholder={searchProps.placeholder}
          slotProps={{
            htmlInput: { "aria-label": labels.search, type: "search" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          onChange={searchProps.onChange}
          sx={{ flex: 1, minWidth: 160, maxWidth: 360 }}
        />
      )}
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ alignItems: "center", flexWrap: "wrap" }}
      >
        {sortOptions && sortOptions.length > 0 && (
          <TextField
            select
            size="small"
            label={labels.sortBy}
            value={source.sortBy ?? ""}
            onChange={(e) =>
              source.setSort(
                e.target.value || undefined,
                source.sortDir ?? "asc"
              )
            }
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">—</MenuItem>
            {sortOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        {toolbar}
        {filtersButton}
        {hasFilters && filtersMode === "popover" && (
          <FilterPopover
            open={filtersOpen}
            onClose={onCloseFilters}
            anchorEl={filtersAnchorRef.current}
            filters={filters}
            activeFilterCount={activeFilterCount}
            onClearFilters={onClearFilters}
            labels={labels}
            dir={dir}
          />
        )}
        {savedViewsMenu}
        {columnMenu}
        {onExportCsv && (
          <>
            {/* MUI's own progress indicator in the button's icon slot rather
                than the Button `loading` prop, which only exists from 6.4 and
                the supported floor is 6.1 — the affordance is the kit's either
                way, and it works on every version this adapter claims. */}
            <Button
              variant="outlined"
              size="small"
              onClick={onExportCsv}
              disabled={exportBusy}
              aria-busy={exportBusy}
              startIcon={
                exportBusy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : undefined
              }
            >
              {exportLabel}
            </Button>
            <ExportAnnouncer announcement={exportAnnouncement} />
          </>
        )}
        {onAddRow && (
          <Button
            variant="contained"
            size="small"
            data-adapttable-part="add-row"
            onClick={onAddRow}
          >
            {addRowLabel}
          </Button>
        )}
        {showRowsPerPage && (
          <TextField
            select
            size="small"
            label={labels.rowsPerPage}
            value={source.limit}
            onChange={(e) => source.setLimit(Number(e.target.value))}
            sx={{ minWidth: 110 }}
          >
            {pageSizeOptions(source.limit).map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>
    </Stack>
  );
}
