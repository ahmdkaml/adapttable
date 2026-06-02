import {
  type ActiveFilterChip,
  type BulkAction,
  type ConfirmHandler,
  pageSizeOptions,
  type PaginationInfo,
  type SelectionState,
  type TableLabels,
  useBulkActionRunner,
} from "@adapttable/core";

import { cx } from "../cx";
import type { DataTableClassNames } from "../types";

/** Removable filter-chip strip. Renders nothing when empty. */
export function Chips({
  chips,
  onClearAll,
  labels,
  classNames,
}: Readonly<{
  chips: readonly ActiveFilterChip[];
  onClearAll?: () => void;
  labels: Required<TableLabels>;
  classNames: DataTableClassNames;
}>) {
  if (chips.length === 0) return null;
  return (
    <ul
      aria-label={labels.filters}
      data-adapttable-part="chips"
      className={classNames.chips}
    >
      {chips.map((chip) => (
        <li
          key={chip.key}
          data-adapttable-part="chip"
          className={classNames.chip}
        >
          {chip.label}
          <button
            type="button"
            aria-label={`${labels.clearAll}: ${chip.label}`}
            data-adapttable-part="chip-remove"
            className={classNames.chipRemove}
            onClick={chip.onRemove}
          >
            ×
          </button>
        </li>
      ))}
      {onClearAll && (
        <li>
          <button
            type="button"
            onClick={onClearAll}
            className={classNames.chipRemove}
          >
            {labels.clearAll}
          </button>
        </li>
      )}
    </ul>
  );
}

/** Selection toolbar with bulk-action buttons. */
export function BulkBar({
  selection,
  bulkActions,
  confirm,
  labels,
  classNames,
}: Readonly<{
  selection: SelectionState;
  bulkActions: BulkAction[];
  confirm: ConfirmHandler;
  labels: Required<TableLabels>;
  classNames: DataTableClassNames;
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
    <div data-adapttable-part="bulk-bar" className={classNames.bulkBar}>
      <span>{labels.selectedCount(selectedCount)}</span>
      <button type="button" onClick={clear} disabled={pending !== null}>
        {labels.clearAll}
      </button>
      {bulkActions.map((action) => {
        const reason = action.disabledReason?.(ids);
        return (
          <button
            key={action.key}
            type="button"
            title={reason}
            disabled={reason !== undefined || pending !== null}
            data-adapttable-part="bulk-button"
            data-color={action.color}
            className={classNames.bulkButton}
            onClick={() => run(action, ids)}
          >
            {action.icon}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

/** Prev/next pager with a rows-per-page select. */
export function Footer({
  pagination,
  source,
  labels,
  classNames,
}: Readonly<{
  pagination: PaginationInfo;
  source: {
    limit: number;
    total: number;
    setPage: (n: number) => void;
    setLimit: (n: number) => void;
  };
  labels: Required<TableLabels>;
  classNames: DataTableClassNames;
}>) {
  const { safePage, totalPages, fromIndex, toIndex } = pagination;
  return (
    <div data-adapttable-part="footer" className={classNames.footer}>
      <label>
        {labels.rowsPerPage}{" "}
        <select
          aria-label={labels.rowsPerPage}
          value={source.limit}
          onChange={(e) => source.setLimit(Number(e.currentTarget.value))}
        >
          {pageSizeOptions(source.limit).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      {source.total > 0 && (
        <span>
          {labels.showing({
            from: fromIndex,
            to: toIndex,
            total: source.total,
          })}
        </span>
      )}
      <span>{labels.pageOf({ page: safePage, total: totalPages })}</span>
      <button
        type="button"
        aria-label={labels.previousPage}
        data-adapttable-part="page-prev"
        className={classNames.pageButton}
        disabled={safePage <= 1}
        onClick={() => source.setPage(safePage - 1)}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label={labels.nextPage}
        data-adapttable-part="page-next"
        className={classNames.pageButton}
        disabled={safePage >= totalPages}
        onClick={() => source.setPage(safePage + 1)}
      >
        ›
      </button>
    </div>
  );
}

/** Inline error with optional retry. */
export function ErrorState({
  error,
  labels,
  onRetry,
  classNames,
}: Readonly<{
  error: Error;
  labels: Required<TableLabels>;
  onRetry?: () => void;
  classNames: DataTableClassNames;
}>) {
  return (
    <div role="alert" data-adapttable-part="error" className={classNames.error}>
      <strong>{labels.errorTitle}</strong>
      <p>{labels.errorMessage}</p>
      <small>{error.message}</small>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          data-adapttable-part="retry"
          className={classNames.retryButton}
        >
          {labels.retry}
        </button>
      )}
    </div>
  );
}

/** Skeleton-ish loading placeholder (semantic, unstyled). */
export function LoadingState({
  rows,
  columns,
  variant,
  labels,
  classNames,
}: Readonly<{
  rows: number;
  columns: number;
  variant: "table" | "cards";
  labels: Required<TableLabels>;
  classNames: DataTableClassNames;
}>) {
  const rowKeys = Array.from({ length: rows }, (_, i) => i);
  const columnKeys = Array.from({ length: Math.max(columns, 1) }, (_, i) => i);
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-adapttable-part="loading"
      className={cx(classNames.loading)}
    >
      {variant === "table" ? (
        <table data-adapttable-part="loading-table">
          <tbody>
            {rowKeys.map((row) => (
              <tr key={row} data-adapttable-part="loading-row">
                {columnKeys.map((column) => (
                  <td key={column} data-adapttable-part="loading-cell">
                    <span data-adapttable-part="loading-line" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div data-adapttable-part="loading-cards">
          {rowKeys.map((row) => (
            <div key={row} data-adapttable-part="loading-card">
              {columnKeys.slice(0, 3).map((column) => (
                <span key={column} data-adapttable-part="loading-line" />
              ))}
            </div>
          ))}
        </div>
      )}
      <span className="adapttable-sr-only">{labels.loading}</span>
    </div>
  );
}
