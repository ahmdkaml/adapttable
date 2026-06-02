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
  { key: "mantine", label: "Mantine", render: (m, l) => <MantineDemo mode={m} locale={l} /> }, // prettier-ignore
  { key: "mui", label: "MUI", render: (m, l) => <MuiDemo mode={m} locale={l} /> }, // prettier-ignore
  { key: "chakra", label: "Chakra", render: (m, l) => <ChakraDemo mode={m} locale={l} /> }, // prettier-ignore
  { key: "antd", label: "Ant Design", render: (m, l) => <AntdDemo mode={m} locale={l} /> }, // prettier-ignore
  { key: "unstyled", label: "Unstyled + Tailwind", render: (m, l) => <UnstyledDemo mode={m} locale={l} /> }, // prettier-ignore
  { key: "shadcn", label: "shadcn", render: (m, l) => <ShadcnDemo mode={m} locale={l} /> }, // prettier-ignore
];

const MODES: { key: DataMode; label: string }[] = [
  { key: "frontend", label: "Frontend (in-memory)" },
  { key: "backend", label: "Backend (mock API)" },
];

const LOCALES: { key: Locale; label: string }[] = [
  { key: "en", label: "English" },
  { key: "ar", label: "العربية (RTL)" },
];

function Segmented<T extends string>({
  options,
  value,
  onChange,
  accent,
}: Readonly<{
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accent: string;
}>) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e4e4e7",
              background: selected ? accent : "#fff",
              color: selected ? "#fff" : "#18181b",
              cursor: "pointer",
              fontWeight: selected ? 600 : 400,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function App() {
  const [active, setActive] = useState(ADAPTERS[0].key);
  const [mode, setMode] = useState<DataMode>("frontend");
  const [locale, setLocale] = useState<Locale>("en");
  const current = ADAPTERS.find((a) => a.key === active) ?? ADAPTERS[0];

  // Switching adapter / mode / locale starts from a clean slate: drop all
  // table state from the URL so search, sort, filter, and page don't leak
  // across demos. The keyed remount below then reads the cleared URL.
  const reset = () =>
    window.history.replaceState(null, "", window.location.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "32px 16px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>
          AdaptTable · playground
        </h1>
        <p style={{ color: "#71717a", marginTop: 0 }}>
          One headless source, every adapter, both data paths, two languages.
          Search, sort, filter, paging, and RTL behave identically across all of
          them.
        </p>

        <div style={{ display: "grid", gap: 10, margin: "16px 0" }}>
          <Segmented
            options={ADAPTERS}
            value={active}
            onChange={(v) => {
              reset();
              setActive(v);
            }}
            accent="#6c5ce7"
          />
          <Segmented
            options={MODES}
            value={mode}
            onChange={(v) => {
              reset();
              setMode(v);
            }}
            accent="#0ea5e9"
          />
          <Segmented
            options={LOCALES}
            value={locale}
            onChange={(v) => {
              reset();
              setLocale(v);
            }}
            accent="#10b981"
          />
        </div>

        {/* Remount on any switch so each starts from a clean source. */}
        <div key={`${current.key}-${mode}-${locale}`}>
          {current.render(mode, locale)}
        </div>
      </div>
    </QueryClientProvider>
  );
}
