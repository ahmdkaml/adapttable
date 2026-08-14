import {
  type ComponentType,
  lazy,
  type ReactNode,
  startTransition,
  Suspense,
  useState,
} from "react";

import { MantineDemo } from "./adapters/MantineDemo";
import { cssVars } from "./cssVars";
import type { Locale } from "./data";
import { type DataMode, type Density, type FiltersUi } from "./Demo";
import { SectionHead, TrialCta } from "./sections";
import { ADAPTER_TOKENS } from "./themeTokens";

type DemoComponent = ComponentType<
  Readonly<{
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
  }>
>;

/** Default kit stays eager so first paint doesn't wait on a chunk. */
const ADAPTERS: Record<string, DemoComponent> = {
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

function DemoFallback() {
  return (
    <div className="demo-surface__fallback" aria-busy="true" aria-live="polite">
      Loading adapter…
    </div>
  );
}

/** The kit lives in the URL (`?kit=mui`) so docs, posts and teammates can
 * link straight to a specific adapter — the same URL-state idea the library
 * ships for filters and sorting. Unknown/missing values fall back to Mantine. */
function readKitFromUrl(): string {
  if (typeof window === "undefined") return "mantine";
  const kit = new URLSearchParams(window.location.search).get("kit");
  return kit && kit in ADAPTERS ? kit : "mantine";
}

export function LiveDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const [mode, setMode] = useState<DataMode>("frontend");
  const [locale, setLocale] = useState<Locale>("en");
  const [density, setDensity] = useState<Density>("comfortable");
  const [filtersUi, setFiltersUi] = useState<FiltersUi>("popover");
  const [motion, setMotion] = useState<"on" | "off">("on");
  const [grouping, setGrouping] = useState<"on" | "off">("off");
  const [tree, setTree] = useState<"on" | "off">("off");
  const [nested, setNested] = useState<"on" | "off">("off");
  const [rowMode, setRowMode] = useState<"on" | "off">("off");
  const [batch, setBatch] = useState<"on" | "off">("off");
  const [rowMutations, setRowMutations] = useState<"on" | "off">("off");
  const [rowReorder, setRowReorder] = useState<"on" | "off">("off");
  const [rowPinning, setRowPinning] = useState<"on" | "off">("off");
  const [cellSpan, setCellSpan] = useState<"on" | "off">("off");
  const [extraRows, setExtraRows] = useState<"on" | "off">("off");
  const [rowStyle, setRowStyle] = useState<"on" | "off">("off");
  const [editing, setEditing] = useState<"on" | "off">("off");
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
            data-testid={`adapter-${a.key}`}
            className={adapter === a.key ? "adtab is-on" : "adtab"}
            style={cssVars({ "--c": dark ? a.accentDark : a.accentLight })}
            onClick={() => {
              const url = new URL(window.location.href);
              if (a.key === "mantine") url.searchParams.delete("kit");
              else url.searchParams.set("kit", a.key);
              window.history.replaceState(null, "", url);
              startTransition(() => setAdapter(a.key));
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

      <TrialCta />

      <div className="controls">
        <Control label="Data">
          <Segmented
            label="data source"
            value={mode}
            onChange={(v) => {
              startTransition(() => setMode(v));
            }}
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
            onChange={(v) => {
              startTransition(() => setLocale(v));
            }}
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
            onChange={(v) => {
              startTransition(() => setFiltersUi(v));
            }}
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
            onChange={(v) => {
              startTransition(() => setDensity(v));
            }}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </Control>
        <div className="controls__break" aria-hidden="true" />
        <Control label="Grouping">
          <Segmented
            label="grouping"
            value={grouping}
            onChange={(v) => {
              startTransition(() => setGrouping(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Tree">
          <Segmented
            label="tree"
            value={tree}
            onChange={(v) => {
              startTransition(() => setTree(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Nested">
          <Segmented
            label="nested"
            value={nested}
            onChange={(v) => {
              startTransition(() => setNested(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Editing">
          <Segmented
            label="editing"
            value={editing}
            onChange={(v) => {
              startTransition(() => setEditing(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Row edit">
          <Segmented
            label="row edit"
            value={rowMode}
            onChange={(v) => {
              startTransition(() => setRowMode(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Add / delete">
          <Segmented
            label="add / delete"
            value={rowMutations}
            onChange={(v) => {
              startTransition(() => setRowMutations(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Reorder">
          <Segmented
            label="reorder"
            value={rowReorder}
            onChange={(v) => {
              startTransition(() => setRowReorder(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Pin rows">
          <Segmented
            label="pin rows"
            value={rowPinning}
            onChange={(v) => {
              startTransition(() => setRowPinning(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Span">
          <Segmented
            label="span cells"
            value={cellSpan}
            onChange={(v) => {
              startTransition(() => setCellSpan(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Extras">
          <Segmented
            label="extra rows"
            value={extraRows}
            onChange={(v) => {
              startTransition(() => setExtraRows(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Style">
          <Segmented
            label="row style"
            value={rowStyle}
            onChange={(v) => {
              startTransition(() => setRowStyle(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Batch">
          <Segmented
            label="batch"
            value={batch}
            onChange={(v) => {
              startTransition(() => setBatch(v));
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Control>
        <Control label="Motion">
          <Segmented
            label="motion"
            value={motion}
            onChange={(v) => {
              startTransition(() => setMotion(v));
            }}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
          />
        </Control>
      </div>

      <div className="demo-surface" style={cssVars({ "--c": accent })}>
        {/* Remount only on kit change — density/locale/filters/motion/dark
            update as props so lighter toggles don't tear the table down. */}
        <div
          className="demo-surface__body"
          key={adapter}
          data-adapter={adapter}
        >
          <Suspense fallback={<DemoFallback />}>
            <Demo
              mode={mode}
              locale={locale}
              dark={dark}
              density={density}
              filtersUi={filtersUi}
              animate={motion === "on"}
              grouping={grouping === "on"}
              tree={tree === "on"}
              nested={nested === "on"}
              rowMode={rowMode === "on"}
              batch={batch === "on"}
              rowMutations={rowMutations === "on"}
              rowReorder={rowReorder === "on"}
              rowPinning={rowPinning === "on"}
              cellSpan={cellSpan === "on"}
              extraRows={extraRows === "on"}
              rowStyle={rowStyle === "on"}
              editing={editing === "on"}
              urlKey="live"
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
