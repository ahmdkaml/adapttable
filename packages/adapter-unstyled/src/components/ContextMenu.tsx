import {
  ContextMenuChrome,
  type ContextMenuChromeProps,
  type ContextMenuItemProps,
  type ContextMenuSlots,
  type ContextMenuSurfaceProps,
} from "@adapttable/core/adapter";
import { type ReactNode, useEffect, useMemo, useRef } from "react";

import type { DataTableClassNames } from "../types";

/** The entries, as elements, for the keyboard walk below. */
function entriesOf(root: HTMLElement | null): HTMLElement[] {
  return [...(root?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
}

/**
 * The native menu.
 *
 * Every other kit anchors its own menu to the ref the chrome supplies and
 * gets focus management, portalling and dismissal from that kit. There is
 * no kit here, so this supplies them: focus lands on the first entry, the
 * arrows walk and wrap, and a mousedown outside dismisses. Escape is the
 * chrome's, and works from anywhere inside.
 */
function Surface({
  label,
  className,
  onClose,
  children,
}: Readonly<{
  label: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}>) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    entriesOf(ref.current)[0]?.focus();
    const dismiss = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    // Capture, so the dismiss happens before whatever the click would do.
    document.addEventListener("mousedown", dismiss, true);
    return () => {
      document.removeEventListener("mousedown", dismiss, true);
    };
  }, [onClose]);
  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      data-adapttable-part="context-menu"
      className={className}
      style={{ position: "fixed", zIndex: 1000 }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        const items = entriesOf(ref.current);
        const at = items.indexOf(document.activeElement as HTMLElement);
        const step = event.key === "ArrowDown" ? 1 : -1;
        items[(at + step + items.length) % items.length]?.focus();
      }}
    >
      {children}
    </div>
  );
}

function MenuSeparator({ className }: Readonly<{ className?: string }>) {
  return (
    <hr data-adapttable-part="context-menu-separator" className={className} />
  );
}

/** Unstyled context menu: semantic markup with class hooks, no styles. */
export function ContextMenu(
  props: Readonly<
    Omit<ContextMenuChromeProps, "slots"> & {
      classNames?: DataTableClassNames;
    }
  >
) {
  const { classNames, ...rest } = props;
  // Read out before the slots close over them: the lint rule reads a
  // `props.classNames.x` inside a slot as an unvalidated prop of that slot.
  const menuClass = classNames?.contextMenu;
  const itemClass = classNames?.contextMenuItem;
  const separatorClass = classNames?.contextMenuSeparator;
  const slots = useMemo<ContextMenuSlots>(
    () => ({
      Surface: ({
        label,
        className,
        onClose,
        children,
      }: ContextMenuSurfaceProps) => (
        <Surface label={label} className={className} onClose={onClose}>
          {children}
        </Surface>
      ),
      Item: ({ item, onSelect }: ContextMenuItemProps) => (
        <button
          type="button"
          role="menuitem"
          tabIndex={-1}
          disabled={item.disabled}
          data-adapttable-part="context-menu-item"
          data-danger={item.danger === true ? "" : undefined}
          className={itemClass}
          onClick={onSelect}
        >
          {item.label}
        </button>
      ),
      Separator: () => <MenuSeparator className={separatorClass} />,
    }),
    [itemClass, separatorClass]
  );
  return <ContextMenuChrome {...rest} className={menuClass} slots={slots} />;
}
