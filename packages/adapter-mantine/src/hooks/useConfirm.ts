import { useMemo } from "react";

import type { ConfirmHandler } from "../types";

/**
 * The default confirmation handler — a dependency-free `window.confirm`.
 * Consumers wanting a styled dialog (e.g. `@mantine/modals`) pass their
 * own {@link ConfirmHandler} via the `confirm` prop.
 */
export const defaultConfirm: ConfirmHandler = ({ message, onConfirm }) => {
  if (typeof globalThis.confirm !== "function" || globalThis.confirm(message)) {
    onConfirm();
  }
};

/**
 * Resolve the confirmation handler, falling back to {@link defaultConfirm}.
 *
 * @param confirm - An optional caller-supplied handler.
 * @returns A stable confirmation handler.
 */
export function useConfirm(confirm?: ConfirmHandler): ConfirmHandler {
  return useMemo(() => confirm ?? defaultConfirm, [confirm]);
}
