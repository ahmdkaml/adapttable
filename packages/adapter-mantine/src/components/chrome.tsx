/**
 * Toolbar, filter chips, bulk bar, pager footer, skeleton, empty and error
 * states, and the filter drawer — everything framing the table itself.
 */
import {
  type ActiveFilterChip,
  type BulkAction,
  type Direction,
  pageSizeOptions,
  type SelectionState,
  type TableLabels,
  useBulkActionRunner,
} from "@adapttable/core";
import {
  bulkActionErrorMessage,
  type BulkBarChromeProps,
  resolveDisabledReason,
  type ToolbarChromeProps,
} from "@adapttable/core/adapter";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Drawer,
  Group,
  Pagination,
  Pill,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import { type ReactNode } from "react";

import {
  AlertIcon,
  FiltersIcon,
  InboxIcon,
  RefreshIcon,
  SearchIcon,
} from "../icons";
import { FilterPopover } from "./FilterPopover";

// ── Toolbar ───────────────────────────────────────────────────

export interface ToolbarProps<TRow> extends ToolbarChromeProps<TRow> {
  /** Close the filter container. */
  onCloseFilters: () => void;
  /** Filter content + how to render its container. */
  filtersMode: "popover" | "drawer";
  filters?: ReactNode;
  /** Clear-filters handler used by the popover's clear-all button. */
  onClearFilters: () => void;
  className?: string;
}

/** Sticky toolbar: search, optional sort select, custom slot, filters, size. */
export function Toolbar<TRow>({
  table,
  searchable,
  searchPlaceholder,
  sortByOptions,
  toolbar,
  hasFilters,
  activeFilterCount,
  onToggleFilters,
  onFiltersTriggerPointerDown,
  onCloseFilters,
  filtersOpen,
  filtersMode,
  filters,
  onClearFilters,
  dir,
  savedViewsMenu,
  columnMenu,
  onExportCsv,
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
      onPointerDown={onFiltersTriggerPointerDown}
      onClick={onToggleFilters}
    >
      {labels.filters}
    </Button>
  );

  return (
    <Group
      gap="sm"
      justify="space-between"
      align="center"
      className={className}
    >
      {searchable !== false && (
        <TextInput
          {...searchProps}
          leftSection={<SearchIcon size={14} />}
          size="sm"
          style={{ flex: 1, minWidth: 160, maxWidth: 360 }}
        />
      )}
      <Group gap="xs" align="center">
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
          <Button variant="default" size="sm" onClick={onExportCsv}>
            {labels.exportCsv}
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

// ── ActiveFilterChips ─────────────────────────────────────────

export interface ActiveFilterChipsProps {
  /** The chips to render. */
  chips: readonly ActiveFilterChip[];
  /** Optional clear-all handler; the link is hidden when omitted. */
  onClearAll?: () => void;
  /** Accessible label for the strip. */
  label: string;
  /** Clear-all link text. */
  clearAllLabel: string;
}

/** A wrapping strip of removable filter chips. Renders nothing when empty. */
export function ActiveFilterChips({
  chips,
  onClearAll,
  label,
  clearAllLabel,
}: Readonly<ActiveFilterChipsProps>) {
  if (chips.length === 0) return null;
  return (
    <Group
      gap={6}
      aria-label={label}
      component="ul"
      style={{ listStyle: "none", padding: 0, margin: 0 }}
    >
      {chips.map((chip) => (
        <Pill
          key={chip.key}
          component="li"
          withRemoveButton
          onRemove={chip.onRemove}
          removeButtonProps={{
            "aria-label": `${clearAllLabel}: ${chip.label}`,
          }}
        >
          {chip.label}
        </Pill>
      ))}
      {onClearAll && (
        <Anchor
          component="button"
          type="button"
          fz="xs"
          fw={600}
          onClick={onClearAll}
        >
          {clearAllLabel}
        </Anchor>
      )}
    </Group>
  );
}

// ── BulkActionBar ─────────────────────────────────────────────

export function BulkActionBar({
  selection,
  total,
  bulkActions,
  confirm,
  labels,
}: Readonly<BulkBarChromeProps>) {
  const { selectedIds, selectedCount, clear, allMatching } = selection;
  const { pending, error, run } = useBulkActionRunner({
    confirm,
    cancelLabel: labels.cancel,
    // Clear only on success — a failed run keeps the selection for retry.
    onComplete: (outcome) => {
      if (outcome.status === "success") clear();
    },
  });

  if (selectedCount === 0) return null;

  const errorMessage = bulkActionErrorMessage(error);
  const ids = [...selectedIds];
  return (
    <Stack gap="xs">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text fz="sm">{labels.selectedCount(selectedCount)}</Text>
        <Group gap="xs" wrap="wrap">
          <Button
            size="xs"
            variant="subtle"
            onClick={clear}
            disabled={pending !== null}
          >
            {labels.clearAll}
          </Button>
          {bulkActions.map((action) => (
            <BulkButton
              key={action.key}
              action={action}
              ids={ids}
              pending={pending}
              onRun={(a) => {
                // Widened scope: the action receives the page ids plus the
                // all-matching context, so confirm counts size by `total`.
                if (allMatching) run(a, ids, { allMatching: true, total });
                else run(a, ids);
              }}
            />
          ))}
        </Group>
      </Group>
      <ScopeBanner selection={selection} total={total} labels={labels} />
      {errorMessage !== null && (
        <Text fz="sm" c="red" role="alert">
          {`${labels.errorTitle}: ${errorMessage}`}
        </Text>
      )}
    </Stack>
  );
}

/**
 * Gmail-style scope banner. When every row on the page is selected but more
 * rows match elsewhere, offer to widen the selection to all matching rows;
 * once widened, announce the scope and offer to clear it.
 */
function ScopeBanner({
  selection,
  total,
  labels,
}: Readonly<{
  selection: SelectionState;
  total: number;
  labels: Required<TableLabels>;
}>) {
  if (selection.headerState !== "all" || total <= selection.visibleIds.length) {
    return null;
  }
  return (
    <Group role="status" gap="xs" wrap="wrap">
      {selection.allMatching ? (
        <>
          <Text fz="sm">{labels.allMatchingSelected(total)}</Text>
          <Button size="xs" variant="subtle" onClick={selection.clear}>
            {labels.clearAll}
          </Button>
        </>
      ) : (
        <>
          <Text fz="sm">{labels.pageSelected(selection.selectedCount)}</Text>
          <Button
            size="xs"
            variant="light"
            onClick={selection.selectAllMatching}
          >
            {labels.selectAllMatching(total)}
          </Button>
        </>
      )}
    </Group>
  );
}

function BulkButton({
  action,
  ids,
  pending,
  onRun,
}: Readonly<{
  action: BulkAction;
  ids: string[];
  pending: string | null;
  onRun: (action: BulkAction) => void;
}>) {
  const reason = resolveDisabledReason(action.disabledReason?.(ids));
  const ineligible = reason !== undefined;
  const button = (
    <Button
      size="xs"
      color={action.color}
      leftSection={action.icon}
      onClick={() => onRun(action)}
      loading={pending === action.key}
      disabled={ineligible || (pending !== null && pending !== action.key)}
    >
      {action.label}
    </Button>
  );
  if (reason !== undefined) {
    return (
      <Tooltip label={reason} withArrow openDelay={150}>
        <div>{button}</div>
      </Tooltip>
    );
  }
  return button;
}

// ── PaginationFooter ──────────────────────────────────────────

export interface PaginationFooterProps {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  fromIndex: number;
  toIndex: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  labels: Required<TableLabels>;
  /** Hidden in the grouped full-set view, where page size has no effect. */
  showRowsPerPage?: boolean;
}

/** Desktop pagination bar: page-size + range on the left, pager on the right. */
export function PaginationFooter({
  page,
  totalPages,
  limit,
  total,
  fromIndex,
  toIndex,
  onPageChange,
  onLimitChange,
  labels,
  showRowsPerPage = true,
}: Readonly<PaginationFooterProps>) {
  const safeTotalPages = Math.max(totalPages, 1);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);
  const options = pageSizeOptions(limit).map((n) => ({
    value: String(n),
    label: String(n),
  }));

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="md" pt="xs">
      <Group gap="xs" align="center" wrap="nowrap">
        {showRowsPerPage && (
          <>
            <Text fz="xs" c="dimmed">
              {labels.rowsPerPage}
            </Text>
            <Select
              aria-label={labels.rowsPerPage}
              data={options}
              value={String(limit)}
              // `allowDeselect={false}` keeps the value non-null.
              onChange={(v) => onLimitChange(Number(v!))}
              size="xs"
              w={76}
              allowDeselect={false}
              comboboxProps={{ withinPortal: false }}
            />
          </>
        )}
        {total > 0 && (
          <Text fz="xs" c="dimmed">
            {labels.showing({ from: fromIndex, to: toIndex, total })}
          </Text>
        )}
      </Group>
      <Group gap="sm" align="center" wrap="nowrap">
        <Text fz="xs" c="dimmed">
          {labels.pageOf({ page: safePage, total: safeTotalPages })}
        </Text>
        <Pagination
          total={safeTotalPages}
          value={safePage}
          onChange={onPageChange}
          size="sm"
          siblings={1}
          boundaries={1}
          // Only previous/next control buttons render (boundaries keep
          // first/last away), so a total ternary labels them both.
          getControlProps={(control) => ({
            "aria-label":
              control === "previous" ? labels.previousPage : labels.nextPage,
          })}
        />
      </Group>
    </Group>
  );
}

// ── TableSkeleton ─────────────────────────────────────────────

export interface TableSkeletonProps {
  /** Number of placeholder columns. */
  columns: number;
  /** Number of placeholder rows. Defaults to 5. */
  rows?: number;
  /** Screen-reader text announcing the loading state. */
  loadingLabel?: string;
}

/** Loading placeholder that mirrors the table shape to avoid layout shift. */
export function TableSkeleton({
  columns,
  rows = 5,
  loadingLabel,
}: Readonly<TableSkeletonProps>) {
  const colKeys = Array.from({ length: Math.max(columns, 1) }, (_, i) => i);
  const rowKeys = Array.from({ length: rows }, (_, i) => i);
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <Table>
        <Table.Thead>
          <Table.Tr>
            {colKeys.map((c) => (
              <Table.Th key={c}>
                <Skeleton
                  height={12}
                  radius="sm"
                  width={c === 0 ? "55%" : "40%"}
                />
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rowKeys.map((r) => (
            <Table.Tr key={r}>
              {colKeys.map((c) => (
                <Table.Td key={c}>
                  <Skeleton
                    height={14}
                    radius="sm"
                    width={c === 0 ? "70%" : "55%"}
                  />
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {loadingLabel ? <VisuallyHidden>{loadingLabel}</VisuallyHidden> : null}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────

export interface EmptyStateProps {
  /** Headline text. */
  title: string;
  /** Optional supporting description. */
  description?: string;
  /** Optional custom icon (defaults to an inbox glyph). */
  icon?: ReactNode;
  /** Optional call-to-action (e.g. a clear-filters button). */
  action?: ReactNode;
}

/** Centred "nothing to show" placeholder. */
export function EmptyState({
  title,
  description,
  icon,
  action,
}: Readonly<EmptyStateProps>) {
  return (
    <Stack
      role="status"
      align="center"
      justify="center"
      gap={6}
      py={48}
      px={16}
    >
      <Text c="dimmed" aria-hidden>
        {icon ?? <InboxIcon size={40} />}
      </Text>
      <Text fw={600} fz="md">
        {title}
      </Text>
      {description && (
        <Text c="dimmed" fz="sm" ta="center" maw={360}>
          {description}
        </Text>
      )}
      {action}
    </Stack>
  );
}

// ── ErrorState ────────────────────────────────────────────────

export interface ErrorStateProps {
  /** The error to surface. */
  error: Error;
  /** Title line. */
  title: string;
  /** Supporting message. */
  message: string;
  /** Retry button label. */
  retryLabel: string;
  /** Optional retry handler; the button is hidden when omitted. */
  onRetry?: () => void;
  /** Whether a retry is in flight. */
  isRetrying?: boolean;
}

/** Inline error alert with an optional retry button. */
export function ErrorState({
  error,
  title,
  message,
  retryLabel,
  onRetry,
  isRetrying,
}: Readonly<ErrorStateProps>) {
  return (
    <Alert
      icon={<AlertIcon size={16} />}
      color="red"
      variant="light"
      title={title}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="md">
        <div>
          <Text fz="sm">{message}</Text>
          <Text fz="xs" c="dimmed" mt={2}>
            {error.message}
          </Text>
        </div>
        {onRetry && (
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<RefreshIcon size={14} />}
            onClick={onRetry}
            loading={isRetrying}
          >
            {retryLabel}
          </Button>
        )}
      </Group>
    </Alert>
  );
}

// ── FilterDrawer ──────────────────────────────────────────────

export interface FilterDrawerProps {
  opened: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  /** Clear-filters handler (always supplied by the table chrome). */
  onClearFilters: () => void;
  labels: Required<TableLabels>;
  dir?: Direction;
}

/** Right-side drawer holding the caller's filter widgets + apply/clear. */
export function FilterDrawer({
  opened,
  onClose,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
  dir = "ltr",
}: Readonly<FilterDrawerProps>) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position={dir === "rtl" ? "left" : "right"}
      size={380}
      title={labels.filters}
      overlayProps={{ opacity: 0.4, blur: 2 }}
      closeButtonProps={{ "aria-label": labels.cancel }}
    >
      <Stack gap="md" mih="60vh" justify="space-between">
        <Stack gap="md">{filters}</Stack>
        <Group justify="space-between" pt="md">
          <Button
            variant="subtle"
            onClick={onClearFilters}
            disabled={activeFilterCount === 0}
          >
            {labels.clearAll}
          </Button>
          <Button onClick={onClose}>{labels.filtersDone}</Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
