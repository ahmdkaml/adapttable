import { usePrefersReducedMotion } from "@adapttable/core";
import { type DependencyList, type RefObject, useEffect } from "react";

/** Tuning for the mount stagger. */
export interface MountStaggerOptions {
  /** Master switch. When `false`, the hook is a no-op. */
  enabled: boolean;
  /** Per-item delay in ms. Defaults to 40. */
  step?: number;
  /** Tween duration in ms. Defaults to 320. */
  duration?: number;
}

/**
 * Dependency-free entrance stagger using the Web Animations API. Animates
 * descendants marked with `data-stagger` once on mount (and whenever
 * `deps` change), honoring `prefers-reduced-motion`. Works without GSAP;
 * GSAP fans can swap in their own hook of the same shape.
 *
 * @param ref - Ref to the container whose `[data-stagger]` items animate.
 * @param deps - Re-run the stagger when these change (e.g. the row set).
 * @param options - See {@link MountStaggerOptions}.
 */
export function useMountStagger(
  ref: RefObject<HTMLElement | null>,
  deps: DependencyList,
  options: MountStaggerOptions
): void {
  const reduced = usePrefersReducedMotion();
  const { enabled, step = 40, duration = 320 } = options;

  useEffect(() => {
    if (!enabled || reduced) return;
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>("[data-stagger]");
    items.forEach((el, index) => {
      if (typeof el.animate !== "function") return;
      el.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration,
          delay: index * step,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        }
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reduced, step, duration, ref, ...deps]);
}
