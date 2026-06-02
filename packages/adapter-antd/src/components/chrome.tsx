import {
  type ActiveFilterChip,
  type BulkBarChromeProps,
  pageSizeOptions,
  type TableLabels,
  type ToolbarChromeProps,
  useBulkActionRunner,
} from "@adapttable/core";
import {
  Alert,
  Badge,
  Button,
  Drawer,
  Flex,
  Input,
  Select,
  Space,
  Tag,
} from "antd";
import type { ReactNode } from "react";

import { isDangerColor } from "../colors";

/** Search field + sort select + filters button + rows-per-page. */
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
}: Readonly<ToolbarChromeProps<TRow>>) {
  const { labels, source } = table;
  const sortOptions =
    sortByOptions ?? (table.isMobile ? table.sortByOptions : undefined);
  const searchProps = table.getSearchInputProps(
    searchPlaceholder ? { placeholder: searchPlaceholder } : undefined
  );
  return (
    <Flex gap="small" wrap align="center" justify="space-between">
      {!hideSearch && (
        <Input
          type="search"
          allowClear
          style={{ flex: 1, minWidth: 200, maxWidth: 360 }}
          aria-label={labels.search}
          value={searchProps.value as string}
          placeholder={searchProps.placeholder as string}
          onChange={
            searchProps.onChange as (e: {
              currentTarget: { value: string };
            }) => void
          }
        />
      )}
      <Flex gap="small" wrap align="center">
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
        {customToolbar}
        {hasFilters && (
          <Badge count={activeFilterCount} size="small">
            <Button onClick={onOpenFilters}>{labels.filters}</Button>
          </Badge>
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

/** Removable antd tag chips. */
export function Chips({
  chips,
  onClearAll,
  labels,
}: Readonly<{
  chips: readonly ActiveFilterChip[];
  onClearAll?: () => void;
  labels: Required<TableLabels>;
}>) {
  if (chips.length === 0) return null;
  return (
    <Flex
      gap={4}
      wrap
      align="center"
      component="ul"
      aria-label={labels.filters}
    >
      {chips.map((chip) => (
        <li key={chip.key} style={{ listStyle: "none" }}>
          <Tag closable onClose={chip.onRemove} aria-label={chip.label}>
            {chip.label}
          </Tag>
        </li>
      ))}
      {onClearAll && (
        <li style={{ listStyle: "none" }}>
          <Button size="small" type="link" onClick={onClearAll}>
            {labels.clearAll}
          </Button>
        </li>
      )}
    </Flex>
  );
}

/**
 * Selection bar, rendered with antd's idiomatic `Alert` + `action` slot
 * (the pattern antd's own Table docs use for batch operations).
 */
export function BulkBar(props: Readonly<BulkBarChromeProps>) {
  const { selection, bulkActions, confirm, labels } = props;
  const runner = useBulkActionRunner({
    confirm,
    cancelLabel: labels.cancel,
    onComplete: selection.clear,
  });
  if (selection.selectedCount === 0) return null;
  const ids = [...selection.selectedIds];
  const busy = runner.pending !== null;
  return (
    <Alert
      type="info"
      banner
      message={labels.selectedCount(selection.selectedCount)}
      action={
        <Space size="small" wrap>
          <Button
            size="small"
            type="text"
            disabled={busy}
            onClick={selection.clear}
          >
            {labels.clearAll}
          </Button>
          {bulkActions.map((action) => (
            <Button
              key={action.key}
              size="small"
              type="primary"
              danger={isDangerColor(action.color)}
              icon={action.icon}
              title={action.disabledReason?.(ids)}
              disabled={action.disabledReason?.(ids) !== undefined || busy}
              onClick={() => runner.run(action, ids)}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      }
    />
  );
}

/** Error banner with optional retry. */
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
    <Alert
      type="error"
      showIcon
      message={labels.errorTitle}
      description={error.message}
      action={
        onRetry ? (
          <Button size="small" danger onClick={onRetry}>
            {labels.retry}
          </Button>
        ) : undefined
      }
    />
  );
}

/** Slide-over filter panel. */
export function FilterDrawer({
  open,
  onClose,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters?: () => void;
  labels: Required<TableLabels>;
}>) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={labels.filters}
      placement="right"
      width={360}
      footer={
        <Flex justify="space-between">
          <Button
            disabled={activeFilterCount === 0}
            onClick={() => onClearFilters?.()}
          >
            {labels.clearAll}
          </Button>
          <Button type="primary" onClick={onClose}>
            {labels.applyFilters}
          </Button>
        </Flex>
      }
    >
      {filters}
    </Drawer>
  );
}
