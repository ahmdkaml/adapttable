import "./App.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { AntdDemo } from "./adapters/AntdDemo";
import { ChakraDemo } from "./adapters/ChakraDemo";
import { MantineDemo } from "./adapters/MantineDemo";
import { MuiDemo } from "./adapters/MuiDemo";
import { ShadcnDemo } from "./adapters/ShadcnDemo";
import { UnstyledDemo } from "./adapters/UnstyledDemo";
import { type Locale } from "./data";
import { type DataMode } from "./Demo";

const queryClient = new QueryClient();

type Render = (mode: DataMode, locale: Locale) => ReactNode;

const ADAPTERS: { key: string; label: string; render: Render }[] = [
  {
    key: "mantine",
    label: "Mantine",
    render: (m, l) => <MantineDemo mode={m} locale={l} />,
  },
  {
    key: "mui",
    label: "MUI",
    render: (m, l) => <MuiDemo mode={m} locale={l} />,
  },
  {
    key: "chakra",
    label: "Chakra",
    render: (m, l) => <ChakraDemo mode={m} locale={l} />,
  },
  {
    key: "antd",
    label: "Ant Design",
    render: (m, l) => <AntdDemo mode={m} locale={l} />,
  },
  {
    key: "unstyled",
    label: "Unstyled + Tailwind",
    render: (m, l) => <UnstyledDemo mode={m} locale={l} />,
  },
  {
    key: "shadcn",
    label: "shadcn",
    render: (m, l) => <ShadcnDemo mode={m} locale={l} />,
  },
];

const MODES: { key: DataMode; label: string }[] = [
  { key: "frontend", label: "Frontend (in-memory)" },
  { key: "backend", label: "Backend (mock API)" },
];

const LOCALES: { key: Locale; label: string }[] = [
  { key: "en", label: "English" },
  { key: "ar", label: "العربية (RTL)" },
];

const PROOFS = [
  {
    label: "Responsive by design",
    value: "Table -> cards",
    detail:
      "Narrow screens get readable cards instead of broken horizontal scroll.",
  },
  {
    label: "Same data contract",
    value: "Client + server",
    detail:
      "Flip between in-memory and mock API without changing table markup.",
  },
  {
    label: "Performance path",
    value: "Virtual rows",
    detail: "Long infinite lists can opt into windowed row/card rendering.",
  },
  {
    label: "Global-ready",
    value: "RTL + i18n",
    detail: "Arabic direction and labels run through the exact same demo.",
  },
];

/** Read a selection param from the URL, falling back when missing/invalid. */
function readParam<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T
): T {
  const value = new URLSearchParams(window.location.search).get(key);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/**
 * Persist the demo selection (adapter / mode / locale) to the URL — and only
 * those — so a refresh restores the UI, while switching drops all table state
 * (search / sort / filter / page) from the URL for a clean slate.
 */
function writeSelection(adapter: string, mode: DataMode, locale: Locale) {
  const params = new URLSearchParams();
  params.set("adapter", adapter);
  params.set("mode", mode);
  params.set("locale", locale);
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}?${params.toString()}`
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: Readonly<{
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}>) {
  return (
    <div className="control-group">
      <span className="control-label">{label}</span>
      <div className="segmented" role="list" aria-label={label}>
        {options.map((o) => {
          const selected = o.key === value;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={selected}
              className={selected ? "segment segment-active" : "segment"}
              onClick={() => onChange(o.key)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function App() {
  const [active, setActive] = useState(() =>
    readParam(
      "adapter",
      ADAPTERS.map((a) => a.key),
      ADAPTERS[0].key
    )
  );
  const [mode, setMode] = useState<DataMode>(() =>
    readParam(
      "mode",
      MODES.map((m) => m.key),
      "frontend"
    )
  );
  const [locale, setLocale] = useState<Locale>(() =>
    readParam(
      "locale",
      LOCALES.map((l) => l.key),
      "en"
    )
  );
  const current = ADAPTERS.find((a) => a.key === active) ?? ADAPTERS[0];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="playground-shell">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">AdaptTable laboratory</p>
            <h1>One table engine. Every UI kit. No broken mobile tables.</h1>
            <p className="hero-text">
              Test the same headless source through Mantine, MUI, Chakra, Ant
              Design, and class-driven Tailwind/shadcn styling. Switch data
              mode, locale, and adapter without changing the table contract.
            </p>
          </div>
          <div className="proof-grid" aria-label="AdaptTable proof points">
            {PROOFS.map((proof) => (
              <article key={proof.label} className="proof-card">
                <span>{proof.label}</span>
                <strong>{proof.value}</strong>
                <p>{proof.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="switchboard" aria-label="Playground controls">
          <Segmented
            label="Adapter"
            options={ADAPTERS}
            value={active}
            onChange={(v) => {
              writeSelection(v, mode, locale);
              setActive(v);
            }}
          />
          <Segmented
            label="Data source"
            options={MODES}
            value={mode}
            onChange={(v) => {
              writeSelection(active, v, locale);
              setMode(v);
            }}
          />
          <Segmented
            label="Locale"
            options={LOCALES}
            value={locale}
            onChange={(v) => {
              writeSelection(active, mode, v);
              setLocale(v);
            }}
          />
        </section>

        <div className="demo-shell">
          <div className="demo-header">
            <div>
              <p className="eyebrow">Live adapter</p>
              <h2>{current.label}</h2>
            </div>
            <p>
              Virtualization is enabled where the adapter supports custom
              rendering; AntD uses its native virtual table mode.
            </p>
          </div>

          {/* Remount on any switch so each starts from a clean source. */}
          <div className="demo-stage" key={`${current.key}-${mode}-${locale}`}>
            {current.render(mode, locale)}
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}
