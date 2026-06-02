import "./App.css";

import type { ConfirmRequest } from "@adapttable/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";

import { AntdDemo } from "./adapters/AntdDemo";
import { ChakraDemo } from "./adapters/ChakraDemo";
import { MantineDemo } from "./adapters/MantineDemo";
import { MuiDemo } from "./adapters/MuiDemo";
import { ShadcnDemo } from "./adapters/ShadcnDemo";
import { UnstyledDemo } from "./adapters/UnstyledDemo";
import {
  DEMO_CONFIRM_EVENT,
  DEMO_NOTICE_EVENT,
  type DemoNotice,
  type Locale,
} from "./data";
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
  const [notice, setNotice] = useState<DemoNotice | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(
    null
  );
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
  const direction = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const onNotice = (event: Event) => {
      const detail = (event as CustomEvent<DemoNotice>).detail;
      setNotice(detail);
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
      <div className={`playground-shell locale-${locale}`} dir={direction}>
        {notice && (
          <div
            className={
              notice.tone === "danger"
                ? "demo-toast demo-toast-danger"
                : "demo-toast"
            }
            role="status"
          >
            {notice.message}
          </div>
        )}
        {confirmRequest && (
          <div className="demo-modal-backdrop" role="presentation">
            <section
              className="demo-modal"
              role="dialog"
              aria-modal="true"
              aria-label={confirmRequest.title}
            >
              <p className="eyebrow">Confirm action</p>
              <h2>{confirmRequest.title}</h2>
              <p>{confirmRequest.message}</p>
              <div className="demo-modal-actions">
                <button type="button" onClick={() => setConfirmRequest(null)}>
                  {confirmRequest.cancelLabel}
                </button>
                <button
                  type="button"
                  className={confirmRequest.danger ? "danger" : "primary"}
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
              This playground exercises responsive cards, live filters, count
              operators, row actions, URL state, RTL, and virtualization support
              across the adapter set.
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
