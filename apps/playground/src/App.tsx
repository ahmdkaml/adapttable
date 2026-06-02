import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { AntdDemo } from "./adapters/AntdDemo";
import { ChakraDemo } from "./adapters/ChakraDemo";
import { MantineDemo } from "./adapters/MantineDemo";
import { MuiDemo } from "./adapters/MuiDemo";
import { UnstyledDemo } from "./adapters/UnstyledDemo";
import { type DataMode } from "./Demo";

const queryClient = new QueryClient();

const ADAPTERS: {
  key: string;
  label: string;
  render: (m: DataMode) => ReactNode;
}[] = [
  // prettier-ignore
  { key: "mantine", label: "Mantine", render: (m) => <MantineDemo mode={m} /> },
  { key: "mui", label: "MUI", render: (m) => <MuiDemo mode={m} /> },
  { key: "chakra", label: "Chakra", render: (m) => <ChakraDemo mode={m} /> },
  { key: "antd", label: "Ant Design", render: (m) => <AntdDemo mode={m} /> },
  { key: "unstyled", label: "Unstyled + Tailwind", render: (m) => <UnstyledDemo mode={m} /> }, // prettier-ignore
];

const MODES: { key: DataMode; label: string }[] = [
  { key: "frontend", label: "Frontend (in-memory)" },
  { key: "backend", label: "Backend (mock API)" },
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
  const current = ADAPTERS.find((a) => a.key === active) ?? ADAPTERS[0];

  return (
    <QueryClientProvider client={queryClient}>
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "32px 16px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>
          AdaptTable · playground
        </h1>
        <p style={{ color: "#71717a", marginTop: 0 }}>
          One headless source, every adapter, both data paths. Search, sort,
          filter, and paging behave identically across all of them.
        </p>

        <div style={{ display: "grid", gap: 10, margin: "16px 0" }}>
          <Segmented
            options={ADAPTERS}
            value={active}
            onChange={setActive}
            accent="#6c5ce7"
          />
          <Segmented
            options={MODES}
            value={mode}
            onChange={setMode}
            accent="#0ea5e9"
          />
        </div>

        {/* Remount on adapter/mode change so each starts from a clean source. */}
        <div key={`${current.key}-${mode}`}>{current.render(mode)}</div>
      </div>
    </QueryClientProvider>
  );
}
