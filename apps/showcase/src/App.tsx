import type { ConfirmRequest } from "@adapttable/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";

import { AntdDemo } from "./adapters/AntdDemo";
import { ChakraDemo } from "./adapters/ChakraDemo";
import { MantineDemo } from "./adapters/MantineDemo";
import { MuiDemo } from "./adapters/MuiDemo";
import { ShadcnDemo } from "./adapters/ShadcnDemo";
import { UnstyledDemo } from "./adapters/UnstyledDemo";
import { cssVars } from "./cssVars";
import {
  DEMO_CONFIRM_EVENT,
  DEMO_NOTICE_EVENT,
  type DemoNotice,
  type Locale,
} from "./data";
import {
  type DataMode,
  type Density,
  type FiltersUi,
  type PageMode,
} from "./Demo";
import { ScaleDemo } from "./ScaleDemo";
import { Columns, Layers, Pin, Resize } from "./sectionIcons";
import { AppNav, type DemoPage, Footer, SectionHead } from "./sections";
import { ADAPTER_TOKENS } from "./themeTokens";

const queryClient = new QueryClient();

type DemoComponent = (
  props: Readonly<{
    mode: DataMode;
    locale: Locale;
    dark?: boolean;
    pageMode?: PageMode;
    filtersUi?: FiltersUi;
    urlKey?: string;
    density?: Density;
  }>
) => ReactNode;

const ADAPTERS: Record<string, DemoComponent> = {
  mantine: MantineDemo,
  mui: MuiDemo,
  chakra: ChakraDemo,
  antd: AntdDemo,
  shadcn: ShadcnDemo,
  tailwind: UnstyledDemo,
};

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: Readonly<{
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}>) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? "seg__btn is-on" : "seg__btn"}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Control({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="ctrl">
      <span className="ctrl__label">{label}</span>
      {children}
    </div>
  );
}

export function LiveDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState("mantine");
  const [mode, setMode] = useState<DataMode>("frontend");
  const [locale, setLocale] = useState<Locale>("en");
  const [density, setDensity] = useState<Density>("comfortable");
  const [filtersUi, setFiltersUi] = useState<FiltersUi>("popover");
  const token =
    ADAPTER_TOKENS.find((a) => a.key === adapter) ?? ADAPTER_TOKENS[0];
  const accent = dark ? token.accentDark : token.accentLight;
  const Demo = ADAPTERS[adapter] ?? MantineDemo;

  return (
    <section className="sec shell" id="demo">
      <SectionHead title="Same features. Any kit. Watch it switch.">
        One dataset, one feature set — re-rendered by each real adapter. Flip
        the data source and the locale; nothing about the table changes but its
        skin.
      </SectionHead>

      <div className="adapterbar">
        {ADAPTER_TOKENS.map((a) => (
          <button
            key={a.key}
            type="button"
            className={adapter === a.key ? "adtab is-on" : "adtab"}
            style={cssVars({ "--c": dark ? a.accentDark : a.accentLight })}
            onClick={() => setAdapter(a.key)}
          >
            <span className="adtab__dot" />
            <span className="adtab__l">
              <strong>{a.label}</strong>
              <small>{a.blurb}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="controls">
        <Control label="Data">
          <Segmented
            label="data source"
            value={mode}
            onChange={setMode}
            options={[
              { value: "frontend", label: "Frontend" },
              { value: "backend", label: "Backend" },
            ]}
          />
        </Control>
        <Control label="Locale">
          <Segmented
            label="locale"
            value={locale}
            onChange={setLocale}
            options={[
              { value: "en", label: "EN" },
              { value: "ar", label: "العربية" },
            ]}
          />
        </Control>
        <Control label="Filters">
          <Segmented
            label="filters container"
            value={filtersUi}
            onChange={setFiltersUi}
            options={[
              { value: "popover", label: "Popover" },
              { value: "drawer", label: "Drawer" },
            ]}
          />
        </Control>
        <Control label="Density">
          <Segmented
            label="density"
            value={density}
            onChange={setDensity}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </Control>
      </div>

      <div className="demo-surface" style={cssVars({ "--c": accent })}>
        <div className="demo-surface__bar">
          <span className="demo-surface__tag">{token.label} adapter</span>
          <span className="demo-surface__url">
            <Layers size={12} />
            ?live.q=&live.sort=&live.page=1 · each table namespaced in the URL
          </span>
        </div>
        <div
          className="demo-surface__body"
          key={`${adapter}-${mode}-${locale}-${density}-${filtersUi}-${dark ? "d" : "l"}`}
        >
          <Demo
            mode={mode}
            locale={locale}
            dark={dark}
            density={density}
            filtersUi={filtersUi}
            urlKey="live"
          />
        </div>
      </div>
    </section>
  );
}

export function ColumnsDemo({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="sec shell" id="columns">
      <SectionHead title="Wide tables, fully handled.">
        Show/hide, drag-reorder, pin left or right, and resize by drag or
        keyboard — open the Columns menu, grab a header edge, or tap the pin to
        cycle left → right → unpinned. Persist the layout to localStorage, the
        URL, or your server.
      </SectionHead>
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Pin size={12} /> Pin a column left or right
          </span>
          <span className="hint">
            <Resize size={12} /> drag a column edge to resize
          </span>
          <span className="hint">
            <Columns size={12} /> Columns menu reorders &amp; hides
          </span>
        </div>
        <div className="pad-surface__body">
          <AntdDemo
            mode="frontend"
            locale="en"
            dark={dark}
            urlKey="cols"
            wide
          />
        </div>
      </div>
    </section>
  );
}

export function ScaleSection({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="sec shell" id="scale">
      <SectionHead title="Scrolls 50,000 rows without flinching.">
        This page really holds fifty thousand people, but the DOM only ever
        contains the handful of rows in view — the header stays pinned while the
        rest streams past with zero lag. Type to filter: the whole set is
        searched and the window re-computes instantly.
      </SectionHead>
      {/* No pad-surface here: its overflow clipping would break the
          page-level sticky header, and this table owns the page. */}
      <ScaleDemo dark={dark} />
    </section>
  );
}

export function RtlSection({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="sec shell" id="rtl">
      <SectionHead title="Right-to-left, for real.">
        Switch to Arabic and the entire layout mirrors — toolbar, sort arrows,
        pinned columns, pagination. Not just translated strings: a genuinely
        flipped axis.
      </SectionHead>
      <div className="pad-surface">
        <div className="pad-surface__body">
          <ChakraDemo mode="frontend" locale="ar" dark={dark} urlKey="rtl" />
        </div>
      </div>
    </section>
  );
}

/**
 * Shared chrome for every demo page: theme state, the app nav (page tabs),
 * footer, and the notice/confirm overlays the adapter demos dispatch to.
 * `root` is the relative prefix back to the demo home ("." on the home
 * page, ".." on subpages) so plain static links work from any depth.
 */
const THEME_KEY = "adapttable-demo-theme";

const readStoredTheme = (): boolean => {
  try {
    return window.localStorage.getItem(THEME_KEY) === "dark";
  } catch {
    return false;
  }
};

const storeTheme = (dark: boolean): void => {
  try {
    window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {
    // Storage can be unavailable (private mode) — the theme simply
    // won't persist across pages then.
  }
};

export function PageShell({
  active,
  root,
  children,
}: Readonly<{
  active: DemoPage;
  root: string;
  children: (dark: boolean) => ReactNode;
}>) {
  // Each demo page is its own static app, so the theme must live in
  // storage to survive page-to-page navigation.
  const [dark, setDark] = useState(readStoredTheme);
  const [notice, setNotice] = useState<DemoNotice | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(
    null
  );

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    storeTheme(dark);
  }, [dark]);

  useEffect(() => {
    const onNotice = (event: Event) => {
      setNotice((event as CustomEvent<DemoNotice>).detail);
      window.setTimeout(() => setNotice(null), 2600);
    };
    const onConfirm = (event: Event) => {
      setConfirmRequest((event as CustomEvent<ConfirmRequest>).detail);
    };
    window.addEventListener(DEMO_NOTICE_EVENT, onNotice);
    window.addEventListener(DEMO_CONFIRM_EVENT, onConfirm);
    return () => {
      window.removeEventListener(DEMO_NOTICE_EVENT, onNotice);
      window.removeEventListener(DEMO_CONFIRM_EVENT, onConfirm);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppNav
        active={active}
        root={root}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
      />
      <main>{children(dark)}</main>
      <Footer root={root} />

      {notice && (
        <div
          role="status"
          style={{
            position: "fixed",
            insetInlineEnd: 20,
            bottom: 20,
            zIndex: 100,
            padding: "10px 16px",
            borderRadius: 10,
            background: notice.tone === "danger" ? "#b91c1c" : "#111827",
            color: "#fff",
            fontSize: 14,
            boxShadow: "0 8px 24px rgba(0,0,0,.25)",
          }}
        >
          {notice.message}
        </div>
      )}
      {confirmRequest && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,.45)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={confirmRequest.title}
            style={{
              background: "var(--page-surface)",
              color: "var(--ink)",
              borderRadius: 14,
              padding: 24,
              maxWidth: 380,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>
              {confirmRequest.title}
            </h2>
            <p style={{ margin: "0 0 18px", color: "var(--ink-2)" }}>
              {confirmRequest.message}
            </p>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <button
                type="button"
                className="nav__icon"
                style={{ width: "auto", padding: "0 14px" }}
                onClick={() => setConfirmRequest(null)}
              >
                {confirmRequest.cancelLabel}
              </button>
              <button
                type="button"
                className="nav__cta"
                onClick={() => {
                  confirmRequest.onConfirm();
                  setConfirmRequest(null);
                }}
              >
                {confirmRequest.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}
    </QueryClientProvider>
  );
}
