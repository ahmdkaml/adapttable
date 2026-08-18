import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Check, External, Moon, Sun } from "./sectionIcons";

function Wordmark({ href }: Readonly<{ href: string }>) {
  return (
    <a className="wm" href={href}>
      <svg
        className="wm__mark"
        viewBox="0 0 32 32"
        width="20"
        height="20"
        aria-hidden="true"
      >
        <rect
          x="8.5"
          y="1.5"
          width="22"
          height="22"
          rx="5.5"
          fill="var(--brand)"
          opacity="0.25"
        />
        <rect
          x="5"
          y="5"
          width="22"
          height="22"
          rx="5.5"
          fill="var(--brand)"
          opacity="0.5"
        />
        <rect
          x="1.5"
          y="8.5"
          width="22"
          height="22"
          rx="5.5"
          fill="var(--brand)"
        />
        <rect x="4.5" y="12.5" width="16" height="2.8" rx="1.2" fill="#fff" />
        <rect
          x="11.1"
          y="12.5"
          width="2.8"
          height="14.5"
          rx="1.2"
          fill="#fff"
        />
        <rect
          x="4.5"
          y="18.8"
          width="4.6"
          height="2.2"
          rx="1"
          fill="#fff"
          opacity="0.4"
        />
        <rect
          x="4.5"
          y="23"
          width="4.6"
          height="2.2"
          rx="1"
          fill="#fff"
          opacity="0.4"
        />
        <rect
          x="15.9"
          y="18.8"
          width="4.6"
          height="2.2"
          rx="1"
          fill="#fff"
          opacity="0.4"
        />
        <rect
          x="15.9"
          y="23"
          width="4.6"
          height="2.2"
          rx="1"
          fill="#fff"
          opacity="0.4"
        />
      </svg>
      <span className="wm__txt">
        Adapt<strong>Table</strong>
      </span>
    </a>
  );
}

export type DemoPage =
  | "demo"
  | "columns"
  | "filtering"
  | "tree"
  | "selection"
  | "pagination"
  | "accessibility"
  | "realtime"
  | "editing"
  | "grouping"
  | "pivot"
  | "formulas"
  | "saved-views"
  | "export"
  | "all-options"
  | "mobile"
  | "scale"
  | "rtl";

/** One demo page — a static HTML entry, linked with a plain anchor. */
type NavPage = Readonly<{ key: DemoPage; label: string; path: string }>;

/** One nav dropdown: a labelled trigger and the pages it holds. */
type NavGroupSpec = Readonly<{
  key: string;
  label: string;
  pages: readonly NavPage[];
}>;

/** The destinations that stay at the top level: the demo itself, and the one
 * page that turns every option on at once. */
const TOP_PAGES: readonly NavPage[] = [
  { key: "demo", label: "Live demo", path: "" },
  { key: "all-options", label: "Feature Lab", path: "all-options" },
];

/**
 * The sixteen feature pages, in three menus.
 *
 * This is the nav's whole shape: five things across the bar, and a page is
 * reached in two moves rather than read out of a wall of tabs. The split is by
 * what a reader is looking for — the table features everyone needs, the
 * analysis layer on top of them, and the environments the table has to survive.
 */
const NAV_GROUPS: readonly NavGroupSpec[] = [
  {
    key: "features",
    label: "Features",
    pages: [
      { key: "columns", label: "Columns", path: "columns" },
      { key: "filtering", label: "Filtering", path: "filtering" },
      { key: "tree", label: "Tree", path: "tree" },
      { key: "selection", label: "Selection", path: "selection" },
      { key: "pagination", label: "Pagination", path: "pagination" },
      { key: "editing", label: "Editing", path: "editing" },
      { key: "grouping", label: "Grouping", path: "grouping" },
      { key: "realtime", label: "Realtime", path: "realtime" },
    ],
  },
  {
    key: "power",
    label: "Power",
    pages: [
      { key: "pivot", label: "Pivot", path: "pivot" },
      { key: "formulas", label: "Formulas", path: "formulas" },
      { key: "saved-views", label: "Saved views", path: "saved-views" },
      { key: "export", label: "Export & print", path: "export" },
    ],
  },
  {
    key: "platform",
    label: "Platform",
    pages: [
      { key: "mobile", label: "Mobile", path: "mobile" },
      { key: "rtl", label: "RTL", path: "rtl" },
      { key: "scale", label: "Scale", path: "scale" },
      { key: "accessibility", label: "Accessibility", path: "accessibility" },
    ],
  },
];

/**
 * Every page, flat and in nav order — the phone `<select>`'s option list.
 *
 * Derived rather than written twice: a page added to a group appears in the
 * menu and in the phone picker from the same line.
 */
const PAGES: readonly NavPage[] = [
  ...TOP_PAGES,
  ...NAV_GROUPS.flatMap((group) => group.pages),
];

/**
 * How long an open menu waits after the pointer leaves before it closes.
 *
 * A menu that closes the instant the pointer clears the trigger is unusable
 * with a mouse: the trip from the trigger to an item on the far side of the
 * panel crosses the gap between them, and the diagonal shortcut everyone takes
 * leaves the trigger's box before it enters the panel's.
 */
const HOVER_CLOSE_MS = 220;

/** The gap kept between an open menu and the viewport edge when it is clamped. */
const EDGE_MARGIN = 8;

/**
 * Which menu is showing, and whether it stays.
 *
 * A menu the pointer merely uncovered goes away when the pointer does; a menu a
 * click or a key opened is `held`, and waits for Escape, a click outside, or a
 * destination.
 */
type OpenMenu = Readonly<{ key: string; held: boolean }>;

function Chevron() {
  return (
    <svg
      className="nav__chev"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 9l7 7 7-7" />
    </svg>
  );
}

/**
 * One dropdown: a real `<button>` trigger and a `role="menu"` panel of real
 * `<a>` links.
 *
 * The links are always in the DOM — the panel is hidden with `visibility`, not
 * unmounted — so a crawler reads every destination from the served markup and a
 * middle click opens one in a new tab. `visibility: hidden` is what takes the
 * closed panel out of the accessibility tree and the tab order at the same
 * time, which conditional rendering would have to do by hand.
 */
function NavGroup({
  group,
  href,
  active,
  open,
  onPress,
  onHoverOpen,
  onHoverLeave,
  onClose,
}: Readonly<{
  group: NavGroupSpec;
  href: (path: string) => string;
  active: DemoPage;
  open: boolean;
  onPress: () => void;
  onHoverOpen: () => void;
  onHoverLeave: () => void;
  onClose: () => void;
}>) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  /** Which item to land on once the panel is visible — hidden items cannot
   * take focus, so an arrow key that opens the menu has to wait for the
   * commit that reveals it. */
  const pendingFocus = useRef<number | null>(null);
  const [shift, setShift] = useState(0);

  const menuId = `nav-menu-${group.key}`;
  const holdsActive = group.pages.some((page) => page.key === active);

  const items = useCallback(
    () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLAnchorElement>(
          "[data-nav-item]"
        ) ?? []
      ),
    []
  );

  const focusItem = useCallback(
    (index: number) => {
      const nodes = items();
      if (nodes.length === 0) return;
      const wrapped = ((index % nodes.length) + nodes.length) % nodes.length;
      nodes[wrapped]?.focus();
    },
    [items]
  );

  // Escape closes and hands focus back to the trigger; a pointer press outside
  // the group closes without stealing focus. Both are documented listeners
  // rather than blur handlers, so a click on the page behind the panel — not
  // just on another focusable — dismisses it.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && wrapRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    if (index !== null) focusItem(index);
  }, [open, focusItem]);

  // The panel hangs off the start edge of its trigger, which keeps every menu
  // inside the bar on a normal desktop. A narrow window, or a longer label
  // later, can still push the last menu past the edge — so it is measured on
  // open and slid back, because a panel that widens the document turns the
  // whole page into a sideways scroller.
  useLayoutEffect(() => {
    if (!open) {
      setShift(0);
      return;
    }
    const menu = menuRef.current;
    if (!menu) return;
    const box = menu.getBoundingClientRect();
    const overRight =
      box.right - (document.documentElement.clientWidth - EDGE_MARGIN);
    const overLeft = EDGE_MARGIN - box.left;
    if (overRight > 0) setShift(-overRight);
    else if (overLeft > 0) setShift(overLeft);
  }, [open]);

  const openToItem = (index: number) => {
    if (open) {
      focusItem(index);
      return;
    }
    pendingFocus.current = index;
    onPress();
  };

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openToItem(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openToItem(-1);
    }
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const nodes = items();
    const current = nodes.findIndex((node) => node === document.activeElement);
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusItem(current + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusItem(current < 0 ? -1 : current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusItem(0);
        break;
      case "End":
        event.preventDefault();
        focusItem(nodes.length - 1);
        break;
      case "Tab":
        // Tab leaves the menu the way it leaves anything else — the panel just
        // gets out of the way rather than trapping focus, because this is site
        // navigation, not a dialog.
        onClose();
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="nav__group"
      ref={wrapRef}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") onHoverOpen();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        // Focus inside the group means someone is reading the menu with the
        // keyboard; a pointer wandering off must not take the panel with it.
        if (wrapRef.current?.contains(document.activeElement)) return;
        onHoverLeave();
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        className={holdsActive ? "nav__trigger is-on" : "nav__trigger"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={onPress}
        onKeyDown={onTriggerKeyDown}
      >
        {group.label}
        <Chevron />
      </button>
      <div
        className="nav__menu"
        id={menuId}
        ref={menuRef}
        role="menu"
        aria-label={group.label}
        /* The panel owns the arrow keys for the items inside it, so it is a
           focus target in its own right — out of the tab order, reachable
           programmatically, which is what an interactive role requires. */
        tabIndex={-1}
        data-open={open ? "true" : "false"}
        style={shift ? { transform: `translateX(${shift}px)` } : undefined}
        onKeyDown={onMenuKeyDown}
      >
        {group.pages.map((page) => (
          <a
            key={page.key}
            data-nav-item=""
            role="menuitem"
            tabIndex={-1}
            href={href(page.path)}
            className={active === page.key ? "is-on" : undefined}
            aria-current={active === page.key ? "page" : undefined}
            onClick={onClose}
          >
            {page.label}
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * App-style toolbar: the landing owns the marketing, so the demo's nav is
 * two direct links, three menus, and Docs/GitHub. `root` is the relative prefix
 * back to the demo home ("." on the home page, ".." on subpages) — plain static
 * links, no router.
 *
 * One menu is open at a time, so the open group lives here rather than in each
 * dropdown: sliding along the bar with the mouse hands the panel from one group
 * to the next instead of stacking two open panels.
 */
export function AppNav({
  active,
  root,
  dark,
  onToggleDark,
}: Readonly<{
  active: DemoPage;
  root: string;
  dark: boolean;
  onToggleDark: () => void;
}>) {
  const href = (path: string) =>
    path === "" ? `${root}/` : `${root}/${path}/`;

  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const cancelClose = useCallback(() => {
    if (closeTimer.current === undefined) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
  }, []);

  useEffect(() => cancelClose, [cancelClose]);

  /** The pointer arriving over a group shows its menu, and sliding along the
   * bar hands the panel to the next one. */
  const hoverOpen = useCallback(
    (key: string) => {
      cancelClose();
      setOpenMenu((prev) => (prev?.key === key ? prev : { key, held: false }));
    },
    [cancelClose]
  );

  /** A click is deliberate: it holds the menu open so it survives the pointer
   * wandering off, and a second one puts it away. A click landing on a menu the
   * hover already showed therefore reads as "keep this", never as "close it" —
   * which is what a mouse user means by clicking something they can see. */
  const press = useCallback(
    (key: string) => {
      cancelClose();
      setOpenMenu((prev) => {
        if (prev?.key !== key) return { key, held: true };
        return prev.held ? null : { key, held: true };
      });
    },
    [cancelClose]
  );

  const closeNow = useCallback(() => {
    cancelClose();
    setOpenMenu(null);
  }, [cancelClose]);

  /** Only the group the pointer left, and only if a click never held it. */
  const closeAfterDelay = useCallback(
    (key: string) => {
      cancelClose();
      closeTimer.current = window.setTimeout(() => {
        setOpenMenu((prev) => (prev?.key === key && !prev.held ? null : prev));
      }, HOVER_CLOSE_MS);
    },
    [cancelClose]
  );

  return (
    <header className="nav">
      <div className="nav__inner shell">
        <Wordmark href={href("")} />
        <nav className="nav__links" aria-label="Demo pages">
          {TOP_PAGES.map((p) => (
            <a
              key={p.key}
              href={href(p.path)}
              className={active === p.key ? "is-on" : undefined}
              aria-current={active === p.key ? "page" : undefined}
            >
              {p.label}
            </a>
          ))}
          {NAV_GROUPS.map((group) => (
            <NavGroup
              key={group.key}
              group={group}
              href={href}
              active={active}
              open={openMenu?.key === group.key}
              onPress={() => press(group.key)}
              onHoverOpen={() => hoverOpen(group.key)}
              onHoverLeave={() => closeAfterDelay(group.key)}
              onClose={closeNow}
            />
          ))}
        </nav>
        <label className="nav__mobile">
          <select
            aria-label="Demo page"
            value={active}
            onChange={(event) => {
              const page = PAGES.find(
                (candidate) => candidate.key === event.currentTarget.value
              );
              if (page) window.location.assign(href(page.path));
            }}
          >
            {PAGES.map((page) => (
              <option key={page.key} value={page.key}>
                {page.label}
              </option>
            ))}
          </select>
          <span aria-hidden>▾</span>
        </label>
        <div className="nav__right">
          <button
            type="button"
            className="nav__icon"
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <a
            className="nav__docs"
            href={`${DOCS_URL}getting-started/`}
            target="_blank"
            rel="noreferrer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Docs
          </a>
          <a
            className="nav__cta"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <External size={14} /> GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

/** The nav's own default height, and the offset before it is measured. */
const NAV_HEIGHT = 63;

/**
 * How far down the page the sticky nav reaches, for a table that pins its
 * header under it (`stickyTop`).
 *
 * Measured rather than written down: the bar is shared chrome that every demo
 * page pins against, and a header parked at a hardcoded offset slides under the
 * nav the moment the bar's own metrics move. A `ResizeObserver` costs nothing
 * and cannot go stale.
 */
export function useNavHeight(): number {
  const [height, setHeight] = useState(NAV_HEIGHT);
  useEffect(() => {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const observer = new ResizeObserver(() => {
      setHeight(Math.ceil(nav.getBoundingClientRect().height));
    });
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);
  return height;
}

const DOCS_URL = "https://orwa-mahmoud.github.io/adapttable/";
const REPO_URL = "https://github.com/orwa-mahmoud/adapttable";

export function Install({ large = false }: Readonly<{ large?: boolean }>) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={large ? "install install--lg" : "install"}>
      <span className="install__prompt">$</span>
      <code>npx @adapttable/cli init</code>
      {!large && (
        <button
          type="button"
          className={copied ? "install__copy ok" : "install__copy"}
          aria-label="Copy install command"
          onClick={() => {
            void navigator.clipboard?.writeText("npx @adapttable/cli init");
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          <Check size={14} />
        </button>
      )}
    </div>
  );
}

const STACKBLITZ_URL =
  "https://stackblitz.com/github/orwa-mahmoud/adapttable/tree/main/starters/mantine";

/** Install + try-in-browser CTAs parked at the moment of kit-switch delight. */
export function TrialCta() {
  return (
    <div className="trial-cta">
      <Install />
      <a
        className="trial-cta__blitz"
        href={STACKBLITZ_URL}
        target="_blank"
        rel="noreferrer"
      >
        <External size={14} /> Open in StackBlitz
      </a>
      <a className="trial-cta__docs" href={`${DOCS_URL}getting-started/`}>
        Docs
      </a>
    </div>
  );
}

/** One small title + one helper line — the active nav tab already says
 * which page this is, so no kicker.
 *
 * The heading is an `h1`: every showcase page renders exactly one of these
 * and it is that page's title, so it is the document heading. Screen readers
 * and crawlers both read a page with no `h1` as having no subject — Bing
 * reports "H1 tag missing" for a client-rendered page whose markup carries
 * one only before React mounts. `sec__title` still carries the styling, so
 * this changes semantics and nothing visual. */
export function SectionHead({
  title,
  children,
}: Readonly<{ title: string; children?: ReactNode }>) {
  return (
    <div className="sec__head">
      <h1 className="sec__title">{title}</h1>
      {children ? <p className="sec__lead">{children}</p> : null}
    </div>
  );
}

/** Same link set as the landing's footer, with Landing in Demo's place.
 * Landing is the same product site, so it navigates in place; the truly
 * external destinations open in a new tab. */
const FOOT_LINKS = [
  {
    label: "Landing",
    href: DOCS_URL,
    icon: ["M3 10.5 12 3l9 7.5", "M5 9.5V21h14V9.5", "M9 21v-7h6v7"],
    newTab: false,
  },
  {
    label: "Docs",
    href: `${DOCS_URL}getting-started/`,
    icon: [
      "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
      "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
    ],
  },
  {
    label: "npm",
    href: "https://www.npmjs.com/org/adapttable",
    icon: [
      "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
      "M3.27 6.96L12 12.01l8.73-5.05",
      "M12 22.08V12",
    ],
  },
  {
    label: "GitHub",
    href: REPO_URL,
    icon: [
      "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.55 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
    ],
  },
];

export function Footer({ root }: Readonly<{ root: string }>) {
  return (
    <footer className="foot">
      <div className="foot__inner shell">
        <div className="foot__lead">
          <Wordmark href={`${root}/`} />
          <p>Headless freedom, batteries included.</p>
        </div>
        <Install large />
        <div className="foot__links">
          {FOOT_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.newTab === false ? undefined : "_blank"}
              rel={l.newTab === false ? undefined : "noreferrer"}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {l.icon.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
