import {
  type ActiveFilterChip,
  type BulkBarChromeProps,
  pageSizeOptions,
  type PaginationInfo,
  type TableLabels,
  type ToolbarChromeProps,
  useBulkActionRunner,
} from "@adapttable/core";
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Drawer,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

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
  const searchProps = table.getSearchInputProps(
    searchPlaceholder ? { placeholder: searchPlaceholder } : undefined
  );
  return (
    <Stack
      direction="row"
      spacing={1}
      flexWrap="wrap"
      alignItems="center"
      justifyContent="space-between"
      useFlexGap
    >
      {!hideSearch && (
        <TextField
          size="small"
          value={searchProps.value}
          placeholder={searchProps.placeholder as string}
          slotProps={{
            htmlInput: { "aria-label": labels.search, type: "search" },
          }}
          onChange={
            searchProps.onChange as (e: {
              currentTarget: { value: string };
            }) => void
          }
          sx={{ flex: 1, minWidth: 200, maxWidth: 360 }}
        />
      )}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        {sortByOptions && sortByOptions.length > 0 && (
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
            {sortByOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        {customToolbar}
        {hasFilters && (
          <Badge color="primary" badgeContent={activeFilterCount}>
            <Button variant="outlined" size="small" onClick={onOpenFilters}>
              {labels.filters}
            </Button>
          </Badge>
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

/** Removable MUI chips. */
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
    <Stack
      direction="row"
      spacing={0.5}
      flexWrap="wrap"
      useFlexGap
      component="ul"
      sx={{ listStyle: "none", p: 0, m: 0 }}
      aria-label={labels.filters}
    >
      {chips.map((chip) => (
        <li key={chip.key}>
          <Chip
            label={chip.label}
            size="small"
            onDelete={chip.onRemove}
            deleteIcon={
              <span aria-label={`${labels.clearAll}: ${chip.label}`}>×</span>
            }
          />
        </li>
      ))}
      {onClearAll && (
        <li>
          <Button size="small" onClick={onClearAll}>
            {labels.clearAll}
          </Button>
        </li>
      )}
    </Stack>
  );
}

/** Selection toolbar. */
export function BulkBar({
  selection,
  bulkActions,
  confirm,
  labels,
}: Readonly<BulkBarChromeProps>) {
  const { selectedIds, selectedCount, clear } = selection;
  const { pending, run } = useBulkActionRunner({
    confirm,
    cancelLabel: labels.cancel,
    onComplete: clear,
  });
  if (selectedCount === 0) return null;
  const ids = [...selectedIds];
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      useFlexGap
    >
      <Typography variant="body2">
        {labels.selectedCount(selectedCount)}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant="text"
          onClick={clear}
          disabled={pending !== null}
        >
          {labels.clearAll}
        </Button>
        {bulkActions.map((action) => {
          const reason = action.disabledReason?.(ids);
          return (
            <Tooltip key={action.key} title={reason ?? ""}>
              <span>
                <Button
                  size="small"
                  variant="contained"
                  color={action.color as "primary" | undefined}
                  startIcon={action.icon}
                  disabled={reason !== undefined || pending !== null}
                  onClick={() => run(action, ids)}
                >
                  {action.label}
                </Button>
              </span>
            </Tooltip>
          );
        })}
      </Stack>
    </Stack>
  );
}

/** Paged footer with a MUI Pagination control. */
export function Footer({
  pagination,
  total,
  setPage,
  labels,
}: Readonly<{
  pagination: PaginationInfo;
  total: number;
  setPage: (n: number) => void;
  labels: Required<TableLabels>;
}>) {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      useFlexGap
    >
      {total > 0 && (
        <Typography variant="caption" color="text.secondary">
          {labels.showing({
            from: pagination.fromIndex,
            to: pagination.toIndex,
            total,
          })}
        </Typography>
      )}
      <Pagination
        count={pagination.totalPages}
        page={pagination.safePage}
        onChange={(_, page) => setPage(page)}
        size="small"
        getItemAriaLabel={(type, page) => {
          if (type === "previous") return labels.previousPage;
          if (type === "next") return labels.nextPage;
          if (type === "page") return `Go to page ${page}`;
          return "";
        }}
      />
    </Stack>
  );
}

/** Error alert. */
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
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {labels.retry}
          </Button>
        ) : undefined
      }
    >
      <strong>{labels.errorTitle}</strong> — {error.message}
    </Alert>
  );
}

/** Skeleton loading placeholder. */
export function LoadingState({
  rows,
  columns,
}: Readonly<{ rows: number; columns: number }>) {
  return (
    <Box aria-busy="true" data-testid="adapttable-loading">
      {Array.from({ length: rows }, (_, r) => (
        <Stack key={r} direction="row" spacing={2} sx={{ py: 1 }}>
          {Array.from({ length: Math.max(columns, 1) }, (_, c) => (
            <Skeleton key={c} variant="text" width={c === 0 ? "30%" : "20%"} />
          ))}
        </Stack>
      ))}
    </Box>
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
}: Readonly<{
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters?: () => void;
  labels: Required<TableLabels>;
}>) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: 360,
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          height: "100%",
        }}
      >
        <Typography variant="h6">{labels.filters}</Typography>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {filters}
        </Box>
        <Stack direction="row" justifyContent="space-between">
          <Button
            onClick={() => onClearFilters?.()}
            disabled={activeFilterCount === 0}
          >
            {labels.clearAll}
          </Button>
          <Button variant="contained" onClick={onClose}>
            {labels.applyFilters}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
