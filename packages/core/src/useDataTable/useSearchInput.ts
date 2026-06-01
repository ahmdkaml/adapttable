import { useEffect, useState } from "react";

import { useDebounce } from "../hooks/useDebounce";

/** A controlled, debounced search input bound to a committed value. */
export interface SearchInputState {
  /** The live (uncommitted) input value. */
  value: string;
  /** Update the live input value. */
  setValue: (next: string) => void;
}

/**
 * Bridge a fast-typing search box to a slower committed search value.
 * Local input updates immediately; the trimmed value is flushed to
 * `setSearch` after the debounce, and external `search` changes (back
 * button, deep link, clear-all) mirror back into the input.
 *
 * @param search - The committed search value (from a source).
 * @param setSearch - Commit a new search value.
 * @param debounceMs - Debounce delay; defaults to 300.
 * @returns The controlled input state.
 */
export function useSearchInput(
  search: string,
  setSearch: (next: string) => void,
  debounceMs = 300
): SearchInputState {
  const [value, setValue] = useState(search);
  const debounced = useDebounce(value, debounceMs);

  // External change → mirror into the input (setting the same string is a
  // no-op, so this never fights in-flight typing).
  useEffect(() => {
    setValue(search);
  }, [search]);

  // Debounced input → commit, skipping when already in sync.
  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed !== search) setSearch(trimmed);
  }, [debounced, search, setSearch]);

  return { value, setValue };
}
