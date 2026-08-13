import { useCallback, useMemo, useState } from "react";

/** Collapse state + actions returned by {@link useGroupCollapse}. */
export interface GroupCollapseState {
  /** Ids of currently collapsed groups (`group:…` keys). */
  collapsedGroupIds: ReadonlySet<string>;
  /** Whether a group is collapsed. */
  isCollapsed: (groupKey: string) => boolean;
  /** Toggle a group's collapsed state. */
  toggle: (groupKey: string) => void;
  /** Expand every group (clear the collapsed set). */
  expandAll: () => void;
  /** Collapse every group in `groupKeys`. */
  collapseAll: (groupKeys: readonly string[]) => void;
  /**
   * Show the tree down to `depth` and no further: every group at that depth or
   * deeper closes, everything above it opens. Depth 0 collapses the top level,
   * so only the outermost headers show.
   */
  collapseToDepth: (
    depth: number,
    groups: readonly { key: string; level: number }[]
  ) => void;
}

/**
 * Headless collapse state for single-level row groups. Ephemeral — not
 * URL-synced (punch-list #62). Groups default to expanded (empty set).
 */
export function useGroupCollapse(controlled?: {
  collapsedGroupIds?: readonly string[];
  onCollapsedGroupIdsChange?: (ids: string[]) => void;
}): GroupCollapseState {
  const controlledIds = controlled?.collapsedGroupIds;
  const isControlled = controlledIds !== undefined;
  const [uncontrolled, setUncontrolled] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const collapsedGroupIds = useMemo(
    () => (isControlled ? new Set(controlledIds ?? []) : uncontrolled),
    [isControlled, controlledIds, uncontrolled]
  );

  const commit = useCallback(
    (next: Set<string>) => {
      if (isControlled) {
        controlled?.onCollapsedGroupIdsChange?.([...next]);
      } else {
        setUncontrolled(next);
      }
    },
    [controlled, isControlled]
  );

  const isCollapsed = useCallback(
    (groupKey: string) => collapsedGroupIds.has(groupKey),
    [collapsedGroupIds]
  );

  const toggle = useCallback(
    (groupKey: string) => {
      const next = new Set(collapsedGroupIds);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      commit(next);
    },
    [collapsedGroupIds, commit]
  );

  const expandAll = useCallback(() => {
    commit(new Set());
  }, [commit]);

  const collapseAll = useCallback(
    (groupKeys: readonly string[]) => {
      commit(new Set(groupKeys));
    },
    [commit]
  );

  const collapseToDepth = useCallback(
    (depth: number, groups: readonly { key: string; level: number }[]) => {
      commit(
        new Set(
          groups.filter((group) => group.level >= depth).map((g) => g.key)
        )
      );
    },
    [commit]
  );

  return useMemo(
    () => ({
      collapsedGroupIds,
      isCollapsed,
      toggle,
      expandAll,
      collapseAll,
      collapseToDepth,
    }),
    [
      collapsedGroupIds,
      isCollapsed,
      toggle,
      expandAll,
      collapseAll,
      collapseToDepth,
    ]
  );
}
