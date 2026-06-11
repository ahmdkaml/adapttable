import {
  useWindowVirtualizer,
  type VirtualItem,
  type Virtualizer,
} from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";

import { VIRTUAL_OVERSCAN } from "../constants";
import { devWarn } from "../utils/devWarn";

/** One row/card entry materialized from a virtual window. */
export interface VirtualTableRow<TRow> {
  /** Row data for this visual slot. */
  row: TRow;
  /** Original index in the source row array. */
  index: number;
  /** Stable key resolved from the caller's rowKey. */
  key: string;
  /** Virtualizer item metadata; absent when virtualization is disabled. */
  virtualItem?: VirtualItem;
}

/** Result consumed by adapters that opt into virtualized rendering. */
export interface TableVirtualization<TRow> {
  /** Whether the returned rows represent a virtual window. */
  enabled: boolean;
  /** Rows to render: either every source row or only the virtual slice. */
  rows: readonly VirtualTableRow<TRow>[];
  /** Spacer before the rendered slice. */
  paddingTop: number;
  /** Spacer after the rendered slice. */
  paddingBottom: number;
  /** Element measurement callback for virtualized rows/cards. */
  measureElement?: Virtualizer<Window, Element>["measureElement"];
}

/** Options for {@link useTableVirtualization}. */
export interface UseTableVirtualizationOptions<TRow> {
  /** Source rows from the table source. */
  rows: readonly TRow[];
  /** Stable row key resolver. */
  rowKey: (row: TRow) => string;
  /** Master switch; adapters keep this optional. */
  enabled?: boolean;
  /** Estimated row/card size in px. */
  estimateSize?: number;
  /** Extra items rendered before/after the visible window. */
  overscan?: number;
  /** Window virtualizer scroll margin, usually sticky header height. */
  scrollMargin?: number;
  /** Called when the virtual window reaches the last source row. */
  onEndReached?: () => void;
}

/** Resolve either virtual entries or the full source rows into render entries. */
export function resolveVirtualRows<TRow>(
  rows: readonly TRow[],
  rowKey: (row: TRow) => string,
  rowEntries?: readonly VirtualTableRow<TRow>[]
): readonly VirtualTableRow<TRow>[] {
  return (
    rowEntries ??
    rows.map((row, index) => ({
      row,
      index,
      key: rowKey(row),
    }))
  );
}

/** Column span for spacer/detail/summary cells in table-based adapters. */
export function virtualColumnSpan(
  columnCount: number,
  hasSelection: boolean,
  hasActions: boolean,
  hasExpansion = false
): number {
  return (
    columnCount +
    (hasSelection ? 1 : 0) +
    (hasActions ? 1 : 0) +
    (hasExpansion ? 1 : 0)
  );
}

/**
 * Headless window virtualization for adapter tables. When disabled, it returns
 * every row and no spacer/measurement data, so adapters can use the same render
 * path for virtual and non-virtual tables.
 */
export function useTableVirtualization<TRow>({
  rows,
  rowKey,
  enabled = false,
  estimateSize = 56,
  overscan = VIRTUAL_OVERSCAN,
  scrollMargin = 0,
  onEndReached,
}: UseTableVirtualizationOptions<TRow>): TableVirtualization<TRow> {
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    enabled,
    estimateSize: () => estimateSize,
    getItemKey: (index) => {
      const row = rows[index];
      return row === undefined ? String(index) : rowKey(row);
    },
    overscan,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const active = enabled && virtualItems.length > 0;
  const materializedRows = useMemo<readonly VirtualTableRow<TRow>[]>(() => {
    if (!active) {
      return rows.map((row, index) => ({
        row,
        index,
        key: rowKey(row),
      }));
    }
    return virtualItems.flatMap((virtualItem) => {
      const row = rows[virtualItem.index];
      if (row === undefined) return [];
      return [
        {
          row,
          index: virtualItem.index,
          key: rowKey(row),
          virtualItem,
        },
      ];
    });
  }, [active, rowKey, rows, virtualItems]);

  // `virtualItems` is a fresh array every render, so a naive effect would call
  // `onEndReached` on every render while the last row stays in view. Notify at
  // most once per row count: re-arm only when more rows actually load (the
  // count grows) or the user scrolls back off the end.
  const notifiedAtCount = useRef(-1);
  useEffect(() => {
    if (!active || rows.length === 0) return;
    const last = virtualItems.at(-1);
    const atEnd = last !== undefined && last.index >= rows.length - 1;
    if (!atEnd) {
      notifiedAtCount.current = -1;
      return;
    }
    if (notifiedAtCount.current !== rows.length) {
      notifiedAtCount.current = rows.length;
      onEndReached?.();
    }
  }, [active, onEndReached, rows.length, virtualItems]);

  if (!active) {
    return {
      enabled: false,
      rows: materializedRows,
      paddingTop: 0,
      paddingBottom: 0,
    };
  }

  // `active` guarantees a non-empty window, so the edges always exist.
  const first = virtualItems[0]!;
  const last = virtualItems.at(-1)!;
  const resolvedScrollMargin = virtualizer.options.scrollMargin ?? 0;
  const paddingTop = first.start - resolvedScrollMargin;
  const paddingBottom =
    virtualizer.getTotalSize() - (last.end - resolvedScrollMargin);

  return {
    enabled: true,
    rows: materializedRows,
    paddingTop: Math.max(0, paddingTop),
    paddingBottom: Math.max(0, paddingBottom),
    measureElement: virtualizer.measureElement,
  };
}

/**
 * Dev-only: `virtualize` windows against the PAGE scroll and cannot observe
 * rows inside a `maxHeight` scroll box — combined, the window never moves and
 * the slice never updates. Adapters call this once per render so the
 * misconfiguration is caught in development instead of failing silently.
 */
export function warnVirtualizeInScrollBox(
  virtualize: boolean,
  maxHeight: number | undefined
): void {
  if (virtualize && maxHeight != null) {
    devWarn(
      "`virtualize` uses window scrolling and cannot see rows inside a `maxHeight` scroll box — use one or the other (antd is the exception: it virtualizes natively inside its own box)."
    );
  }
}
