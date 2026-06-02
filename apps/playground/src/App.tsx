import { type ReactNode, useState } from "react";

import { AntdDemo } from "./adapters/AntdDemo";
import { ChakraDemo } from "./adapters/ChakraDemo";
import { MantineDemo } from "./adapters/MantineDemo";
import { MuiDemo } from "./adapters/MuiDemo";
import { UnstyledDemo } from "./adapters/UnstyledDemo";

const ADAPTERS: { key: string; label: string; render: () => ReactNode }[] = [
  { key: "mantine", label: "Mantine", render: () => <MantineDemo /> },
  { key: "mui", label: "MUI", render: () => <MuiDemo /> },
  { key: "chakra", label: "Chakra", render: () => <ChakraDemo /> },
  { key: "antd", label: "Ant Design", render: () => <AntdDemo /> },
  { key: "unstyled", label: "Unstyled + Tailwind", render: () => <UnstyledDemo /> }, // prettier-ignore
];

export function App() {
  const [active, setActive] = useState(ADAPTERS[0].key);
  const current = ADAPTERS.find((a) => a.key === active) ?? ADAPTERS[0];

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>AdaptTable · playground</h1>
      <p style={{ color: "#71717a", marginTop: 0 }}>
        The same headless source, one adapter at a time. Search, sort, and page
        work identically across all of them.
      </p>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}
      >
        {ADAPTERS.map((a) => {
          const selected = a.key === active;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => setActive(a.key)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #e4e4e7",
                background: selected ? "#6c5ce7" : "#fff",
                color: selected ? "#fff" : "#18181b",
                cursor: "pointer",
                fontWeight: selected ? 600 : 400,
              }}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Remount on switch so each adapter's provider starts clean. */}
      <div key={current.key}>{current.render()}</div>
    </div>
  );
}
