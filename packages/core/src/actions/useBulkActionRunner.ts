import { useCallback, useState } from "react";

import type { BulkAction } from "../types";
import type { ConfirmHandler } from "./confirm";

/** Options for {@link useBulkActionRunner}. */
export interface UseBulkActionRunnerOptions {
  /** Confirmation handler for actions that declare a `confirm` block. */
  confirm: ConfirmHandler;
  /** Cancel label for confirm dialogs. */
  cancelLabel: string;
  /** Called after a successful run (e.g. to clear the selection). */
  onComplete?: () => void;
}

/** The runner returned by {@link useBulkActionRunner}. */
export interface BulkActionRunner {
  /** Key of the action currently running, or `null`. */
  pending: string | null;
  /** Run a bulk action against the given ids (confirming first if needed). */
  run: (action: BulkAction, ids: string[]) => void;
}

/**
 * Headless runner for bulk actions: tracks the in-flight action key,
 * routes through the confirmation handler, and calls `onComplete` after a
 * successful run. Adapters render the buttons and call `run`.
 *
 * @param options - See {@link UseBulkActionRunnerOptions}.
 * @returns The {@link BulkActionRunner}.
 */
export function useBulkActionRunner({
  confirm,
  cancelLabel,
  onComplete,
}: UseBulkActionRunnerOptions): BulkActionRunner {
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(
    (action: BulkAction, ids: string[]) => {
      if (ids.length === 0) return;
      const fire = async () => {
        try {
          setPending(action.key);
          await action.onClick(ids);
          onComplete?.();
        } finally {
          setPending(null);
        }
      };
      if (action.confirm) {
        confirm({
          title: action.confirm.title,
          message: action.confirm.message(ids.length),
          confirmLabel: action.confirm.confirmLabel,
          cancelLabel,
          danger: action.confirm.danger,
          onConfirm: () => void fire(),
        });
      } else {
        void fire();
      }
    },
    [confirm, cancelLabel, onComplete]
  );

  return { pending, run };
}
