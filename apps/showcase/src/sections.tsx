import { type ReactNode, useState } from "react";

import { cssVars } from "./cssVars";
import {
  Bolt,
  Check,
  Database,
  External,
  Globe,
  Layers,
  Moon,
  Resize,
  Server,
  Sun,
} from "./sectionIcons";
import { ADAPTER_TOKENS } from "./themeTokens";

function Wordmark() {
  return (
    <a className="wm" href="#top">
      <span className="wm__mark">
        <span className="wm__bar" />
        <span className="wm__bar" />
        <span className="wm__bar" />
      </span>
      <span className="wm__txt">
        Adapt<strong>Table</strong>
      </span>
    </a>
  );
}

export function Nav({
  dark,
  onToggleDark,
}: Readonly<{ dark: boolean; onToggleDark: () => void }>) {
  return (
    <header className="nav" id="top">
      <div className="nav__inner shell">
        <Wordmark />
        <nav className="nav__links">
          <a href="#demo">Live demo</a>
          <a href="#columns">Columns</a>
          <a href="#scale">Scale</a>
          <a href="#custom">Customize</a>
        </nav>
        <div className="nav__right">
          <button
            type="button"
            className="nav__icon"
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <a className="nav__ghost" href="#top">
            Docs
          </a>
          <a
            className="nav__cta"
            href="https://github.com/"
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

function Install({ large = false }: Readonly<{ large?: boolean }>) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={large ? "install install--lg" : "install"}>
      <span className="install__prompt">$</span>
      <code>npm i @adapttable/core</code>
      {!large && (
        <button
          type="button"
          className={copied ? "install__copy ok" : "install__copy"}
          aria-label="Copy install command"
          onClick={() => {
            void navigator.clipboard?.writeText("npm i @adapttable/core");
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

export function Hero({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="hero shell">
      <div className="hero__badge">
        <Bolt size={13} /> Headless engine · batteries-included adapters
      </div>
      <h1 className="hero__h1">
        One headless engine.
        <br />
        <span className="hero__accent">Every UI kit.</span>
      </h1>
      <p className="hero__sub">
        TanStack-style headless freedom — but batteries-included for{" "}
        <em>your</em> kit. The same table features render natively in Mantine,
        MUI, Chakra, Ant Design, or unstyled Tailwind. URL state, RTL, and a
        real filter UX, out of the box.
      </p>
      <div className="hero__cta">
        <Install />
        <a className="hero__link" href="#demo">
          Try the live demo ↓
        </a>
      </div>
      <div className="hero__adapters">
        <span className="hero__adapters-l">Renders natively in</span>
        {ADAPTER_TOKENS.map((a) => (
          <span
            key={a.key}
            className="hero__chip"
            style={cssVars({ "--c": dark ? a.accentDark : a.accentLight })}
          >
            <span className="hero__chip-dot" />
            {a.label}
          </span>
        ))}
      </div>
    </section>
  );
}

export function SectionHead({
  kicker,
  title,
  children,
}: Readonly<{ kicker: string; title: string; children?: ReactNode }>) {
  return (
    <div className="sec__head">
      <span className="sec__kicker">{kicker}</span>
      <h2 className="sec__title">{title}</h2>
      {children ? <p className="sec__lead">{children}</p> : null}
    </div>
  );
}

const SPECTRUM = [
  {
    t: "Props",
    d: "Pass data + columns. Sensible defaults do the rest.",
    code: "<DataTable source={src}\n  columns={cols} />",
  },
  {
    t: "Slots",
    d: "Swap the empty, loading, and skeleton states.",
    code: "slots={{ empty: <NoResults/>,\n  skeleton: <Shimmer/> }}",
  },
  {
    t: "classNames + data-*",
    d: "Style any part; target rows by state.",
    code: "classNames={{ row: 'hover:bg…' }}\n// [data-selected] [data-pinned]",
  },
  {
    t: "Custom toolbar",
    d: "Inject your own toolbar + confirm dialog.",
    code: "renderToolbar={(api) => …}\nconfirm={myConfirm}",
  },
  {
    t: "Fully headless",
    d: "Prop-getters. You own every element.",
    code: "const { getRowProps,\n  getHeaderProps } = useTable()",
  },
];

export function Spectrum() {
  return (
    <div className="spectrum">
      <div className="spectrum__track">
        {SPECTRUM.map((s, i) => (
          <div key={s.t} className="spcard" style={cssVars({ "--i": i })}>
            <div className="spcard__rank">0{i + 1}</div>
            <h4>{s.t}</h4>
            <p>{s.d}</p>
            <pre className="spcard__code">
              <code>{s.code}</code>
            </pre>
          </div>
        ))}
      </div>
      <div className="spectrum__scale">
        <span>Easy</span>
        <span className="spectrum__line" />
        <span>Pro</span>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    Ic: Globe,
    t: "i18n + RTL",
    d: "10 locales including Arabic & Hebrew. Layout mirrors, not just text.",
  },
  {
    Ic: Database,
    t: "Frontend or backend",
    d: "One TableSource contract. Swap client- and server-side freely — the table never knows.",
  },
  {
    Ic: Layers,
    t: "URL-synced state",
    d: "Search, sort, filter & page live in the URL. Every view is a shareable link.",
  },
  {
    Ic: Check,
    t: "Accessible",
    d: "Roles, aria-sort, focus management and full keyboard nav — by default.",
  },
  {
    Ic: Resize,
    t: "Column management",
    d: "Show/hide, reorder, pin left/right, drag- or keyboard-resize. Persist anywhere.",
  },
  {
    Ic: Server,
    t: "Selection + bulk",
    d: "Row select, bulk actions, per-row actions with disabledReason and injectable confirm.",
  },
];

export function FeatureGrid() {
  return (
    <div className="fgrid">
      {FEATURES.map(({ Ic, t, d }) => (
        <div key={t} className="fcard">
          <span className="fcard__ic">
            <Ic size={18} />
          </span>
          <h4>{t}</h4>
          <p>{d}</p>
        </div>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot__inner shell">
        <div className="foot__lead">
          <Wordmark />
          <p>Headless freedom, batteries included.</p>
        </div>
        <Install large />
        <div className="foot__links">
          {["Docs", "Adapters", "Migrating from TanStack", "GitHub", "npm"].map(
            (l) => (
              <a key={l} href="#top">
                {l}
              </a>
            )
          )}
        </div>
      </div>
    </footer>
  );
}
