import type { DataTableProps } from "@adapttable/mantine";
import {
  type ComponentType,
  lazy,
  type ReactNode,
  startTransition,
} from "react";

import { MantineDemo } from "./adapters/MantineDemo";
import { cssVars } from "./cssVars";
import type { Locale, Person } from "./data";
import {
  type DataMode,
  type Density,
  type FiltersUi,
  type PageMode,
} from "./Demo";
import { ADAPTER_TOKENS } from "./themeTokens";

export type KitDemoProps = Readonly<{
  mode: DataMode;
  locale: Locale;
  dark?: boolean;
  filtersUi?: FiltersUi;
  urlKey?: string;
  density?: Density;
  animate?: boolean;
  grouping?: boolean;
  tree?: boolean;
  nested?: boolean;
  rowMode?: boolean;
  batch?: boolean;
  rowMutations?: boolean;
  rowReorder?: boolean;
  rowPinning?: boolean;
  cellSpan?: boolean;
  extraRows?: boolean;
  rowStyle?: boolean;
  editing?: boolean;
  headerFilters?: boolean;
  columnGroups?: boolean;
  sparkline?: boolean;
  columnMenu?: boolean;
  filterControls?: boolean;
  /** Use the wide, horizontally-scrolling column set with Person pinned. */
  wide?: boolean;
  /** Arrow-key cell navigation and Shift+arrow range selection. */
  cellNavigation?: boolean;
  /** The toolbar Export button's configuration. */
  exportCsv?: DataTableProps<Person>["exportCsv"];
  forceMobile?: boolean;
  pageMode?: PageMode;
  focused?: boolean;
}>;

export type DemoComponent = ComponentType<KitDemoProps>;

/** Default kit stays eager so first paint doesn't wait on a chunk. */
export const ADAPTERS: Record<string, DemoComponent> = {
  mantine: MantineDemo,
  mui: lazy(() =>
    import("./adapters/MuiDemo").then((m) => ({ default: m.MuiDemo }))
  ),
  chakra: lazy(() =>
    import("./adapters/ChakraDemo").then((m) => ({ default: m.ChakraDemo }))
  ),
  antd: lazy(() =>
    import("./adapters/AntdDemo").then((m) => ({ default: m.AntdDemo }))
  ),
  radix: lazy(() =>
    import("./adapters/RadixDemo").then((m) => ({ default: m.RadixDemo }))
  ),
  "base-ui": lazy(() =>
    import("./adapters/BaseUiDemo").then((m) => ({ default: m.BaseUiDemo }))
  ),
  shadcn: lazy(() =>
    import("./adapters/ShadcnDemo").then((m) => ({ default: m.ShadcnDemo }))
  ),
  tailwind: lazy(() =>
    import("./adapters/UnstyledDemo").then((m) => ({
      default: m.UnstyledDemo,
    }))
  ),
};

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: Readonly<{
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; disabled?: boolean; title?: string }[];
  label: string;
}>) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? "seg__btn is-on" : "seg__btn"}
          aria-pressed={value === o.value}
          disabled={o.disabled}
          title={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Control({
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

export function ControlPanel({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="opt-panel">
      <h2 className="opt-panel__title">{title}</h2>
      <div className="opt-panel__row">{children}</div>
    </section>
  );
}

export function DemoFallback() {
  return (
    <div className="demo-surface__fallback" aria-busy="true" aria-live="polite">
      Loading adapter…
    </div>
  );
}

/** The kit lives in the URL (`?kit=mui`) so docs, posts and teammates can
 * link straight to a specific adapter. Unknown/missing values fall back
 * to Mantine. */
export function readKitFromUrl(): string {
  if (typeof window === "undefined") return "mantine";
  const kit = new URLSearchParams(window.location.search).get("kit");
  return kit && kit in ADAPTERS ? kit : "mantine";
}

export function KitSwitcher({
  adapter,
  dark,
  onChange,
}: Readonly<{
  adapter: string;
  dark: boolean;
  onChange: (key: string) => void;
}>) {
  return (
    <div className="adapterbar">
      {ADAPTER_TOKENS.map((a) => (
        <button
          key={a.key}
          type="button"
          data-testid={`adapter-${a.key}`}
          className={adapter === a.key ? "adtab is-on" : "adtab"}
          aria-pressed={adapter === a.key}
          style={cssVars({ "--c": dark ? a.accentDark : a.accentLight })}
          onClick={() => {
            const url = new URL(window.location.href);
            if (a.key === "mantine") url.searchParams.delete("kit");
            else url.searchParams.set("kit", a.key);
            window.history.replaceState(null, "", url);
            startTransition(() => onChange(a.key));
          }}
        >
          <span className="adtab__dot" />
          <span className="adtab__l">
            <strong>{a.label}</strong>
            <small>{a.blurb}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
