import { useMemo } from "react";

import type { FilterValue } from "../types";

/** A single removable filter chip. */
export interface ActiveFilterChip {
  /** Stable identifier, e.g. `"status:Active"`. */
  key: string;
  /** Pre-translated label shown in the chip. */
  label: string;
  /** Remove-this-chip handler. */
  onRemove: () => void;
}

/** Translate a single raw filter value into a chip label. */
export type ChipLabelResolver = (value: string) => string;

/** Options for {@link useActiveFilterChips}. */
export interface UseActiveFilterChipsOptions {
  /** Map of filter key → current value (typically a source's `extra`). */
  readonly values: Readonly<Record<string, FilterValue>>;
  /** Map of filter key → label resolver. Keys without a resolver are skipped. */
  readonly labels: Readonly<Record<string, ChipLabelResolver>>;
  /**
   * Called when a chip's ✕ is clicked. Receives the key and the next
   * desired value (the remaining array, or `undefined` when cleared).
   */
  readonly onChange: (key: string, next: FilterValue) => void;
}

/**
 * Flatten a bag of filter values into removable chips. Array values
 * become one chip per element (removing one keeps the rest); scalars
 * become a single chip. Empty values and keys without a resolver are
 * skipped.
 *
 * @param options - See {@link UseActiveFilterChipsOptions}.
 * @returns The derived chips, memoised on their inputs.
 */
export function useActiveFilterChips({
  values,
  labels,
  onChange,
}: UseActiveFilterChipsOptions): ActiveFilterChip[] {
  return useMemo(() => {
    const chips: ActiveFilterChip[] = [];
    for (const [key, value] of Object.entries(values)) {
      const resolve = labels[key];
      if (!resolve || value == null || value === "") {
        continue;
      }
      if (Array.isArray(value)) {
        for (const entry of value) {
          chips.push({
            key: `${key}:${entry}`,
            label: resolve(entry),
            onRemove: () => {
              const remaining = value.filter((v) => v !== entry);
              onChange(key, remaining.length > 0 ? remaining : undefined);
            },
          });
        }
      } else {
        const text = String(value);
        chips.push({
          key: `${key}:${text}`,
          label: resolve(text),
          onRemove: () => onChange(key, undefined),
        });
      }
    }
    return chips;
  }, [values, labels, onChange]);
}
