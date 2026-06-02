import { type RefObject, useEffect, useRef } from "react";

/** Options for {@link useScrollToTableTop}. */
export interface UseScrollToTableTopOptions {
  /** Table/container element to bring back below sticky chrome. */
  ref: RefObject<HTMLElement | null>;
  /** Dependency values that represent table view changes. */
  deps: readonly unknown[];
  /** Master switch. Defaults to true. */
  enabled?: boolean;
  /** Sticky top offset in px. Defaults to 0. */
  offset?: number;
  /** Extra breathing room below the sticky chrome. Defaults to 8px. */
  gap?: number;
  /** Scroll behavior. Defaults to smooth. */
  behavior?: ScrollBehavior;
}

/**
 * Scroll the table back below sticky chrome after search/filter/page changes.
 * The initial render is skipped so deep links and restored browser positions
 * are not disturbed on first paint.
 */
export function useScrollToTableTop({
  ref,
  deps,
  enabled = true,
  offset = 0,
  gap = 8,
  behavior = "smooth",
}: UseScrollToTableTopOptions): void {
  const firstRef = useRef(true);
  const depsKey = deps.map(String).join("|");

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    if (!enabled) return;
    queueMicrotask(() => {
      const node = ref.current;
      if (!node) return;
      const top = node.getBoundingClientRect().top;
      if (top < offset) {
        window.scrollBy({
          top: top - offset - gap,
          behavior,
        });
      }
    });
  }, [behavior, depsKey, enabled, gap, offset, ref]);
}
