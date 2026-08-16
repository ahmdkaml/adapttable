/**
 * One hook that turns the `contextMenu` prop into something an adapter can
 * bind.
 *
 * The pieces already exist separately — the routes in, the target read back
 * out of the DOM, the entries a target deserves — and each is separately
 * testable, which is why they are separate. But an adapter should not have
 * to assemble them: eight kits assembling the same four calls is eight
 * chances to bind the pointer handlers and forget the keyboard ones, which
 * is the failure this whole feature exists to avoid.
 *
 * So this composes them into two things. `regionProps` goes on whatever
 * element contains the headers, rows and cells. `menu` is everything the
 * chrome needs. There is no third thing to remember.
 */
import { useCallback, useMemo } from "react";

import type { ColumnDef, TableLabels } from "../types";
import {
  type ContextMenuActions,
  type ContextMenuItem,
  contextMenuItems,
  type ContextMenuTarget,
} from "./contextMenuModel";
import { resolveContextTarget } from "./contextMenuRegion";
import { type ContextMenuPoint, useContextMenu } from "./useContextMenu";

/** How a host arms the context menu. */
export interface ContextMenuOptions<TRow> {
  /**
   * Extra entries, appended behind a divider so a custom action is never
   * mistaken for a built-in one.
   */
  items?: (target: ContextMenuTarget<TRow>) => readonly ContextMenuItem[];
}

/** What {@link useTableContextMenu} needs. */
export interface TableContextMenuOptions<TRow> {
  /** The prop as the host wrote it: `true`, an options object, or absent. */
  contextMenu?: boolean | ContextMenuOptions<TRow>;
  columns: readonly ColumnDef<TRow>[];
  labels: TableLabels;
  /** The row behind an id, since the DOM only carries the id. */
  rowFor: (rowId: string) => TRow | undefined;
  /** The handlers the built-in entries call. */
  actions: ContextMenuActions<TRow>;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  isPinned?: (columnKey: string) => boolean;
}

/** What an adapter binds and renders. */
export interface TableContextMenu {
  /** Spread onto the element containing the headers, rows and cells. */
  regionProps: Record<string, unknown>;
  /** The entries for whatever is open; empty when nothing is. */
  items: readonly ContextMenuItem[];
  /** Where it was opened, or `null` when it is closed. */
  at: ContextMenuPoint | null;
  /** Close it, putting focus back where it came from. */
  close: () => void;
}

/**
 * Arm a table's context menu.
 *
 * @param options - The prop, the columns, and the handlers behind the
 *   built-in entries.
 * @returns The props to bind and the state to render.
 */
export function useTableContextMenu<TRow>(
  options: TableContextMenuOptions<TRow>
): TableContextMenu {
  const enabled =
    options.contextMenu !== undefined && options.contextMenu !== false;
  const menu = useContextMenu<TRow>(enabled);
  const { rowFor } = options;

  // The region's handlers are the trigger's, with the target resolved from
  // whatever the event started at rather than fixed at bind time.
  const forEvent = useCallback(
    <E extends { target: EventTarget | null }>(
      event: E,
      run: (
        props: ReturnType<typeof menu.triggerProps>,
        element: Element
      ) => void
    ) => {
      const from = event.target;
      if (!(from instanceof Element)) return;
      const found = resolveContextTarget<TRow>(from, rowFor);
      if (!found) return;
      run(menu.triggerProps(found.target), found.element);
    },
    [menu, rowFor]
  );

  const regionProps = useMemo(
    () =>
      enabled
        ? {
            onContextMenu: (event: React.MouseEvent<HTMLElement>) => {
              const prevent = () => {
                event.preventDefault();
              };
              forEvent(event, (props, element) => {
                // Built field by field, never spread: a React synthetic
                // event keeps `clientX` and the rest on its prototype, so
                // `{...event}` yields an object with none of them and a
                // menu that silently never opens.
                props.onContextMenu({
                  preventDefault: prevent,
                  clientX: event.clientX,
                  clientY: event.clientY,
                  currentTarget: element,
                });
              });
            },
            onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
              const prevent = () => {
                event.preventDefault();
              };
              forEvent(event, (props, element) => {
                props.onKeyDown({
                  key: event.key,
                  shiftKey: event.shiftKey,
                  preventDefault: prevent,
                  currentTarget: element,
                });
              });
            },
            onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
              forEvent(event, (props, element) => {
                props.onPointerDown({
                  pointerType: event.pointerType,
                  clientX: event.clientX,
                  clientY: event.clientY,
                  currentTarget: element,
                });
              });
            },
            onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
              forEvent(event, (props) => {
                props.onPointerMove({
                  clientX: event.clientX,
                  clientY: event.clientY,
                });
              });
            },
            onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
              forEvent(event, (props) => {
                props.onPointerUp();
              });
            },
            onPointerCancel: (event: React.PointerEvent<HTMLElement>) => {
              forEvent(event, (props) => {
                props.onPointerCancel();
              });
            },
          }
        : {},
    [enabled, forEvent]
  );

  const items = useMemo(() => {
    if (!menu.open) return [];
    const extra =
      typeof options.contextMenu === "object"
        ? options.contextMenu.items
        : undefined;
    return contextMenuItems<TRow>({
      target: menu.open.target,
      columns: options.columns,
      labels: options.labels,
      actions: options.actions,
      sortBy: options.sortBy,
      sortDir: options.sortDir,
      isPinned: options.isPinned,
      extra,
    });
  }, [menu.open, options]);

  return { regionProps, items, at: menu.open?.at ?? null, close: menu.close };
}
