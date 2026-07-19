import { useCallback, useMemo, useRef, useState } from "react";

import {
  type CellEditCommit,
  type CellEditTarget,
  type EditableColumnLike,
  isCellEditable,
  readEditableCellValue,
  stepEditableCell,
} from "./cellEditing";

/** Keyboard outcome from {@link CellEditingState.handleKeyDown}. */
export type CellEditKeyAction = "commit" | "cancel" | "commit-advance";

/** Row/column context for Tab / Shift+Tab advance. */
export interface CellEditNavigation {
  rows: readonly unknown[];
  columns: readonly EditableColumnLike[];
  rowKey: (row: unknown) => string;
}

/** Outcome of {@link CellEditingState.handleKeyDown}. */
export interface CellEditKeyOutcome {
  action: CellEditKeyAction;
  commit: CellEditCommit | null;
  advanceTarget: CellEditTarget | null;
}

/** Headless cell-editing state returned by {@link useCellEditing}. */
export interface CellEditingState {
  /** The cell currently being edited, or `null` when idle. */
  active: CellEditTarget | null;
  /** Live draft string for the active editor. */
  draft: string;
  /** Whether `(rowId, columnKey)` is the active cell. */
  isActive: (rowId: string, columnKey: string) => boolean;
  /**
   * Start editing a cell. Re-beginning the same cell keeps the draft;
   * switching cells abandons the previous draft without committing.
   */
  begin: (rowId: string, columnKey: string, initialValue: string) => void;
  /** Update the draft without committing. */
  setDraft: (value: string) => void;
  /**
   * Commit the draft. Returns the commit payload, or `null` when idle.
   * Clears the active cell. The table never mutates rows — callers must
   * apply the result through `onCellEdit` (see {@link applyCellEditCommit}).
   */
  commit: () => CellEditCommit | null;
  /**
   * Cancel editing and clear the active cell (Escape). Adapters should
   * restore focus to the cell that was being edited.
   */
  cancel: () => void;
  /**
   * Drop the active edit when its row leaves the current page/filter set
   * (no commit). No-op when idle or the row is still present.
   */
  discardIfRowMissing: (
    rows: readonly unknown[],
    rowKey: (row: unknown) => string
  ) => void;
  /**
   * Keyboard flow:
   * - Enter → commit
   * - Escape → cancel (adapters restore focus)
   * - Tab → commit and advance; Shift+Tab → commit and go previous
   *
   * Returns `null` when idle or for unrelated keys (so the input keeps
   * default behaviour).
   */
  handleKeyDown: (
    event: { key: string; preventDefault: () => void; shiftKey?: boolean },
    navigation?: CellEditNavigation
  ) => CellEditKeyOutcome | null;
}

/**
 * Headless editing state machine: one active cell, draft value, and the
 * Enter / Escape / Tab keyboard flow.
 *
 * Opt-in by design — calling this hook alone does nothing visible. Adapters
 * only surface editors when the table passes `onCellEdit` (see
 * {@link TableChrome.editing}) and a column sets `editable`.
 */
export function useCellEditing(): CellEditingState {
  const [active, setActive] = useState<CellEditTarget | null>(null);
  const [draft, setDraft] = useState("");
  // Refs so commit/cancel always see the latest values without stale
  // closures when wired through a keydown listener.
  const activeRef = useRef(active);
  const draftRef = useRef(draft);
  activeRef.current = active;
  draftRef.current = draft;

  /** Update draft state and the sync ref in the same tick. */
  const writeDraft = useCallback((value: string) => {
    draftRef.current = value;
    setDraft(value);
  }, []);

  const isActive = useCallback(
    (rowId: string, columnKey: string) =>
      active?.rowId === rowId && active.columnKey === columnKey,
    [active]
  );

  const begin = useCallback(
    (rowId: string, columnKey: string, initialValue: string) => {
      const current = activeRef.current;
      if (current?.rowId === rowId && current.columnKey === columnKey) {
        return;
      }
      setActive({ rowId, columnKey });
      writeDraft(initialValue);
    },
    [writeDraft]
  );

  const commit = useCallback((): CellEditCommit | null => {
    const current = activeRef.current;
    if (!current) return null;
    const result: CellEditCommit = {
      rowId: current.rowId,
      columnKey: current.columnKey,
      draft: draftRef.current,
    };
    setActive(null);
    writeDraft("");
    return result;
  }, [writeDraft]);

  const cancel = useCallback(() => {
    setActive(null);
    writeDraft("");
  }, [writeDraft]);

  const discardIfRowMissing = useCallback(
    (rows: readonly unknown[], rowKey: (row: unknown) => string) => {
      const current = activeRef.current;
      if (!current) return;
      if (rows.some((row) => rowKey(row) === current.rowId)) return;
      setActive(null);
      writeDraft("");
    },
    [writeDraft]
  );

  const handleKeyDown = useCallback(
    (
      event: { key: string; preventDefault: () => void; shiftKey?: boolean },
      navigation?: CellEditNavigation
    ): CellEditKeyOutcome | null => {
      if (!activeRef.current) return null;

      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
        return { action: "cancel", commit: null, advanceTarget: null };
      }

      if (event.key === "Enter") {
        event.preventDefault();
        return {
          action: "commit",
          commit: commit(),
          advanceTarget: null,
        };
      }

      if (event.key === "Tab" && navigation) {
        event.preventDefault();
        const result = commit();
        const advanceTarget = result
          ? stepEditableCell({
              rows: navigation.rows,
              columns: navigation.columns,
              rowKey: navigation.rowKey,
              from: { rowId: result.rowId, columnKey: result.columnKey },
              direction: event.shiftKey ? -1 : 1,
            })
          : null;
        return {
          action: "commit-advance",
          commit: result,
          advanceTarget,
        };
      }

      return null;
    },
    [cancel, commit]
  );

  return useMemo(
    () => ({
      active,
      draft,
      isActive,
      begin,
      setDraft: writeDraft,
      commit,
      cancel,
      discardIfRowMissing,
      handleKeyDown,
    }),
    [
      active,
      draft,
      isActive,
      begin,
      writeDraft,
      commit,
      cancel,
      discardIfRowMissing,
      handleKeyDown,
    ]
  );
}

/**
 * Begin editing when the column is editable for this row; no-op otherwise.
 * Prefer this over raw `begin` so adapters never open an editor the host
 * didn't opt into.
 */
export function beginCellEdit<TRow>(
  editing: CellEditingState,
  row: TRow,
  column: EditableColumnLike<TRow>,
  rowKey: (row: TRow) => string
): boolean {
  if (!isCellEditable(column, row)) return false;
  editing.begin(rowKey(row), column.key, readEditableCellValue(row, column));
  return true;
}
