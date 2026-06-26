import {
  type ActiveFilterChip,
  type BulkBarChromeProps,
  type Direction,
  pageSizeOptions,
  type PaginationInfo,
  paginationItems,
  resolveDisabledReason,
  type TableLabels,
  type ToolbarChromeProps,
  useBulkActionRunner,
} from "@adapttable/core";
import {
  Badge,
  Box,
  Button,
  Callout,
  Dialog,
  Flex,
  IconButton,
  Skeleton,
  Text,
  TextField,
  VisuallyHidden,
} from "@radix-ui/themes";
import { isValidElement, type ReactNode } from "react";

import { subtleText } from "../styles";
import type { RadixAccentColor } from "../types";
import { FilterPopover } from "./FilterPopover";
import { NativeSelect, type SelectOption, Tooltip } from "./primitives";

/** Three-line funnel/filter glyph for the Filters button. */
function FiltersIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

/** Magnifier glyph for the search field. */
function SearchIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={11} cy={11} r={7} />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

/** Map the page-size numbers to {@link NativeSelect} options. */
function pageSizeSelectOptions(limit: number): SelectOption[] {
  return pageSizeOptions(limit).map((n) => ({
    value: String(n),
    label: String(n),
  }));
}

/** Props for {@link Toolbar}: the shared chrome surface + Radix extras. */
export interface ToolbarProps<TRow> extends ToolbarChromeProps<TRow> {
  /** Which filter container opens from the Filters button. */
  filtersMode: "popover" | "drawer";
  /** Filter widgets rendered inside the popover container. */
  filters?: ReactNode;
  /** Close the filter popover (Escape / outside click). */
  onCloseFilters: () => void;
  /** Clear-filters handler for the popover header. */
  onClearFilters: () => void;
  /** Built saved-views menu node, when the `savedViews` prop is set. */
  savedViewsMenu?: ReactNode;
  /** Radix accent color for primary accents. */
  accentColor?: RadixAccentColor;
  /** Class hook for the toolbar row. */
  className?: string;
}

/** Search + sort select + filters button + columns menu + rows-per-page. */
export function Toolbar<TRow>({
  table,
  hideSearch,
  searchPlaceholder,
  sortByOptions,
  customToolbar,
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
      {!hideSearch && (
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

/** Removable Radix badge chips. */
export function Chips({
  chips,
  onClearAll,
  labels,
}: Readonly<{
  chips: readonly ActiveFilterChip[];
  onClearAll: () => void;
  labels: Required<TableLabels>;
}>) {
  if (chips.length === 0) return null;
  return (
    <Flex
      asChild
      gap="1"
      wrap="wrap"
      align="center"
      aria-label={labels.filters}
    >
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {chips.map((chip) => (
          <li key={chip.key}>
            <Badge size="2" radius="full">
              {chip.label}
              <IconButton
                size="1"
                variant="ghost"
                radius="full"
                color="gray"
                aria-label={`${labels.clearAll}: ${chip.label}`}
                onClick={chip.onRemove}
              >
                ×
              </IconButton>
            </Badge>
          </li>
        ))}
        <li>
          <Button size="1" variant="ghost" onClick={onClearAll}>
            {labels.clearAll}
          </Button>
        </li>
      </ul>
    </Flex>
  );
}

/** Selection toolbar. */
export function BulkBar({
  selection,
  total,
  bulkActions,
  confirm,
  labels,
  accentColor,
}: Readonly<BulkBarChromeProps & { accentColor?: RadixAccentColor }>) {
  const { selectedIds, selectedCount, clear } = selection;
  const { pending, run } = useBulkActionRunner({
    confirm,
    cancelLabel: labels.cancel,
    onComplete: clear,
  });
  if (selectedCount === 0) return null;
  const ids = [...selectedIds];
  // A full page is selected but more rows match elsewhere → show the
  // two-state "select all N matching" banner instead of the plain count.
  const expandable =
    selection.headerState === "all" && total > selection.visibleIds.length;
  // When "all matching" is active, bulk actions act on the WHOLE filtered
  // set: the context tells the handler (and the confirm count) so.
  const scope = selection.allMatching
    ? { allMatching: true, total }
    : undefined;
  const banner = selection.allMatching
    ? {
        text: labels.allMatchingSelected(total),
        action: labels.clearAll,
        onClick: clear,
      }
    : {
        text: labels.pageSelected(selection.visibleIds.length),
        action: labels.selectAllMatching(total),
        onClick: selection.selectAllMatching,
      };
  return (
    <Flex gap="2" justify="between" wrap="wrap" align="center">
      {expandable ? (
        <Flex gap="2" wrap="wrap" align="center">
          <Text size="2">{banner.text}</Text>
          <Button
            size="1"
            variant="ghost"
            color={accentColor}
            disabled={pending !== null}
            onClick={banner.onClick}
          >
            {banner.action}
          </Button>
        </Flex>
      ) : (
        <Text size="2">{labels.selectedCount(selectedCount)}</Text>
      )}
      <Flex gap="2" wrap="wrap" align="center">
        <Button
          size="1"
          variant="ghost"
          color="gray"
          onClick={clear}
          disabled={pending !== null}
        >
          {labels.clearAll}
        </Button>
        {bulkActions.map((action) => {
          const reason = resolveDisabledReason(action.disabledReason?.(ids));
          return (
            <Tooltip key={action.key} label={reason ?? ""} disabled={!reason}>
              <Button
                size="1"
                color={(action.color as RadixAccentColor) ?? accentColor}
                disabled={reason !== undefined || pending !== null}
                onClick={() => run(action, ids, scope)}
              >
                {isValidElement(action.icon) ? action.icon : null}
                {action.label}
              </Button>
            </Tooltip>
          );
        })}
      </Flex>
    </Flex>
  );
}

/** Paged footer with numbered page buttons. */
export function Footer({
  pagination,
  total,
  limit,
  setPage,
  setLimit,
  labels,
  className,
}: Readonly<{
  pagination: PaginationInfo;
  total: number;
  limit: number;
  setPage: (n: number) => void;
  setLimit: (n: number) => void;
  labels: Required<TableLabels>;
  /** Class hook for the footer row. */
  className?: string;
}>) {
  const { safePage, totalPages, fromIndex, toIndex } = pagination;
  return (
    <Flex
      gap="3"
      justify="between"
      wrap="wrap"
      align="center"
      className={className}
    >
      <Flex gap="2" align="center">
        <Text size="1" {...subtleText}>
          {labels.rowsPerPage}
        </Text>
        <NativeSelect
          size="1"
          width="72px"
          aria-label={labels.rowsPerPage}
          value={String(limit)}
          options={pageSizeSelectOptions(limit)}
          onValueChange={(value) => setLimit(Number(value))}
        />
        {total > 0 && (
          <Text size="1" {...subtleText}>
            {labels.showing({ from: fromIndex, to: toIndex, total })}
          </Text>
        )}
      </Flex>
      <Flex gap="1" align="center">
        <Text size="1" {...subtleText}>
          {labels.pageOf({ page: safePage, total: totalPages })}
        </Text>
        <Button
          size="1"
          variant="soft"
          color="gray"
          aria-label={labels.previousPage}
          disabled={safePage <= 1}
          onClick={() => setPage(safePage - 1)}
        >
          ‹
        </Button>
        {paginationItems(safePage, totalPages).map((item, i) =>
          item === "ellipsis" ? (
            <Text
              key={`ellipsis-${i}`}
              size="1"
              {...subtleText}
              style={{ paddingInline: "var(--space-1)" }}
            >
              …
            </Text>
          ) : (
            <Button
              key={item}
              size="1"
              variant={item === safePage ? "solid" : "soft"}
              aria-current={item === safePage ? "page" : undefined}
              onClick={() => setPage(item)}
            >
              {item}
            </Button>
          )
        )}
        <Button
          size="1"
          variant="soft"
          color="gray"
          aria-label={labels.nextPage}
          disabled={safePage >= totalPages}
          onClick={() => setPage(safePage + 1)}
        >
          ›
        </Button>
      </Flex>
    </Flex>
  );
}

/** Error callout with retry. */
export function ErrorState({
  error,
  labels,
  onRetry,
}: Readonly<{
  error: Error;
  labels: Required<TableLabels>;
  onRetry?: () => void;
}>) {
  return (
    <Callout.Root color="red" role="alert">
      <Callout.Text>
        <Text weight="bold">{labels.errorTitle}</Text> — {error.message}
      </Callout.Text>
      {onRetry && (
        <Box mt="2">
          <Button size="1" color="red" variant="soft" onClick={onRetry}>
            {labels.retry}
          </Button>
        </Box>
      )}
    </Callout.Root>
  );
}

/** Skeleton loading rows. */
export function LoadingState({
  rows,
  columns,
  loadingLabel,
}: Readonly<{ rows: number; columns: number; loadingLabel?: string }>) {
  return (
    <Flex
      direction="column"
      gap="2"
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-testid="adapttable-loading"
    >
      {Array.from({ length: rows }, (_, r) => (
        <Flex key={r} gap="4">
          {Array.from({ length: Math.max(columns, 1) }, (_, c) => (
            <Skeleton key={c} height="14px" width={c === 0 ? "30%" : "20%"} />
          ))}
        </Flex>
      ))}
      {loadingLabel ? <VisuallyHidden>{loadingLabel}</VisuallyHidden> : null}
    </Flex>
  );
}

/** Filters dialog (Radix has no Drawer — a real modal with backdrop + focus trap). */
export function FilterDrawer({
  open,
  onClose,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
  accentColor,
  dir = "ltr",
}: Readonly<{
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters: () => void;
  labels: Required<TableLabels>;
  accentColor?: RadixAccentColor;
  dir?: Direction;
}>) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Content dir={dir} maxWidth="420px">
        <Dialog.Title>{labels.filters}</Dialog.Title>
        <Flex direction="column" gap="4" mt="3">
          {filters}
        </Flex>
        <Flex justify="between" mt="4">
          <Button
            variant="ghost"
            color="gray"
            onClick={onClearFilters}
            disabled={activeFilterCount === 0}
          >
            {labels.clearAll}
          </Button>
          <Button color={accentColor} onClick={onClose}>
            {labels.applyFilters}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
