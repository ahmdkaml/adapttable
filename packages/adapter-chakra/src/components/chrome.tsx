import {
  type ActiveFilterChip,
  type BulkAction,
  type ConfirmHandler,
  type Direction,
  pageSizeOptions,
  type PaginationInfo,
  resolveDisabledReason,
  type SelectionState,
  type TableLabels,
  type ToolbarChromeProps,
  useBulkActionRunner,
} from "@adapttable/core";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Skeleton,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Tooltip,
  VisuallyHidden,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { isValidElement, type ReactNode } from "react";

import { subtleText } from "../styles";
import { FilterPopover } from "./FilterPopover";

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

/** Props for {@link Toolbar}: the shared chrome surface + Chakra extras. */
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
  colorScheme?: string;
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
  columnMenu,
  showRowsPerPage,
  colorScheme,
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
      colorScheme={colorScheme}
      leftIcon={<FiltersIcon />}
      aria-expanded={filtersMode === "popover" ? filtersOpen : undefined}
      data-active={filtersOpen || undefined}
      onPointerDown={onFiltersTriggerPointerDown}
      onClick={onToggleFilters}
    >
      {labels.filters}
      {activeFilterCount > 0 && (
        <Badge ml={2} colorScheme={colorScheme} borderRadius="full">
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <HStack
      spacing={2}
      flexWrap="nowrap"
      justify="space-between"
      align="center"
      className={className}
    >
      {!hideSearch && (
        <InputGroup size="sm" maxW="360px" flex="1" minW="160px">
          <InputLeftElement pointerEvents="none" {...subtleText}>
            <SearchIcon />
          </InputLeftElement>
          <Input
            aria-label={labels.search}
            type="search"
            value={searchProps.value as string}
            placeholder={searchProps.placeholder as string}
            onChange={
              searchProps.onChange as (e: {
                currentTarget: { value: string };
              }) => void
            }
          />
        </InputGroup>
      )}
      <HStack spacing={2} flexWrap="nowrap" align="center">
        {sortOptions && sortOptions.length > 0 && (
          <Select
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
          </Select>
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
              colorScheme={colorScheme}
              dir={dir}
            >
              {filtersButton}
            </FilterPopover>
          ) : (
            filtersButton
          ))}
        {columnMenu}
        {showRowsPerPage && (
          <Select
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
          </Select>
        )}
      </HStack>
    </HStack>
  );
}

/** Removable Chakra tag chips. */
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
    <Wrap aria-label={labels.filters} as="ul" listStyleType="none">
      {chips.map((chip) => (
        <WrapItem key={chip.key} as="li">
          <Tag size="md" borderRadius="full">
            <TagLabel>{chip.label}</TagLabel>
            <TagCloseButton
              aria-label={`${labels.clearAll}: ${chip.label}`}
              onClick={chip.onRemove}
            />
          </Tag>
        </WrapItem>
      ))}
      <WrapItem as="li">
        <Button size="xs" variant="link" onClick={onClearAll}>
          {labels.clearAll}
        </Button>
      </WrapItem>
    </Wrap>
  );
}

/** Selection toolbar. */
export function BulkBar({
  selection,
  bulkActions,
  confirm,
  labels,
  colorScheme,
}: Readonly<{
  selection: SelectionState;
  bulkActions: BulkAction[];
  confirm: ConfirmHandler;
  labels: Required<TableLabels>;
  colorScheme?: string;
}>) {
  const { selectedIds, selectedCount, clear } = selection;
  const { pending, run } = useBulkActionRunner({
    confirm,
    cancelLabel: labels.cancel,
    onComplete: clear,
  });
  if (selectedCount === 0) return null;
  const ids = [...selectedIds];
  return (
    <HStack spacing={2} justify="space-between" flexWrap="wrap">
      <Text fontSize="sm">{labels.selectedCount(selectedCount)}</Text>
      <HStack spacing={2} flexWrap="wrap">
        <Button
          size="xs"
          variant="ghost"
          onClick={clear}
          isDisabled={pending !== null}
        >
          {labels.clearAll}
        </Button>
        {bulkActions.map((action) => {
          const reason = resolveDisabledReason(action.disabledReason?.(ids));
          return (
            <Tooltip key={action.key} label={reason ?? ""} isDisabled={!reason}>
              <Button
                size="xs"
                colorScheme={action.color ?? colorScheme}
                leftIcon={isValidElement(action.icon) ? action.icon : undefined}
                isDisabled={reason !== undefined || pending !== null}
                onClick={() => run(action, ids)}
              >
                {action.label}
              </Button>
            </Tooltip>
          );
        })}
      </HStack>
    </HStack>
  );
}

/** Paged footer with prev/next. */
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
    <HStack
      spacing={3}
      justify="space-between"
      flexWrap="wrap"
      className={className}
    >
      <HStack spacing={2}>
        <Text fontSize="xs" {...subtleText}>
          {labels.rowsPerPage}
        </Text>
        <Select
          size="xs"
          w="72px"
          aria-label={labels.rowsPerPage}
          value={String(limit)}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          {pageSizeOptions(limit).map((n) => (
            <option key={n} value={String(n)}>
              {n}
            </option>
          ))}
        </Select>
        {total > 0 && (
          <Text fontSize="xs" {...subtleText}>
            {labels.showing({ from: fromIndex, to: toIndex, total })}
          </Text>
        )}
      </HStack>
      <HStack spacing={2}>
        <Text fontSize="xs" {...subtleText}>
          {labels.pageOf({ page: safePage, total: totalPages })}
        </Text>
        <Button
          size="xs"
          aria-label={labels.previousPage}
          isDisabled={safePage <= 1}
          onClick={() => setPage(safePage - 1)}
        >
          ‹
        </Button>
        <Button
          size="xs"
          aria-label={labels.nextPage}
          isDisabled={safePage >= totalPages}
          onClick={() => setPage(safePage + 1)}
        >
          ›
        </Button>
      </HStack>
    </HStack>
  );
}

/** Error alert with retry. */
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
    <Alert status="error" borderRadius="md">
      <AlertIcon />
      <Box flex="1">
        <Text fontWeight="bold">{labels.errorTitle}</Text>
        <Text fontSize="sm">{error.message}</Text>
      </Box>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          {labels.retry}
        </Button>
      )}
    </Alert>
  );
}

/** Skeleton loading rows. */
export function LoadingState({
  rows,
  columns,
  loadingLabel,
}: Readonly<{ rows: number; columns: number; loadingLabel?: string }>) {
  return (
    <Stack
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-testid="adapttable-loading"
    >
      {Array.from({ length: rows }, (_, r) => (
        <HStack key={r} spacing={4}>
          {Array.from({ length: Math.max(columns, 1) }, (_, c) => (
            <Skeleton key={c} height="14px" width={c === 0 ? "30%" : "20%"} />
          ))}
        </HStack>
      ))}
      {loadingLabel ? <VisuallyHidden>{loadingLabel}</VisuallyHidden> : null}
    </Stack>
  );
}

/** Filters drawer. */
export function FilterDrawer({
  open,
  onClose,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
  colorScheme,
  dir = "ltr",
}: Readonly<{
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters: () => void;
  labels: Required<TableLabels>;
  colorScheme?: string;
  dir?: Direction;
}>) {
  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      placement={dir === "rtl" ? "left" : "right"}
      size="sm"
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton aria-label={labels.cancel} />
        <DrawerHeader>{labels.filters}</DrawerHeader>
        <DrawerBody>
          <Stack spacing={4}>{filters}</Stack>
        </DrawerBody>
        <DrawerFooter justifyContent="space-between">
          <Button
            variant="ghost"
            onClick={onClearFilters}
            isDisabled={activeFilterCount === 0}
          >
            {labels.clearAll}
          </Button>
          <Button colorScheme={colorScheme} onClick={onClose}>
            {labels.applyFilters}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
