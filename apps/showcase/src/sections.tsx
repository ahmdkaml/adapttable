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
  Star,
  Sun,
} from "./sectionIcons";
import { ADAPTER_TOKENS } from "./themeTokens";

function Wordmark() {
  return (
    <a className="wm" href="#top">
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
          <a href="#rtl">RTL</a>
          <a href="#custom">Customize</a>
          <a href="#get-started">Get started</a>
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
          <a
            className="nav__ghost"
            href={`${DOCS_URL}getting-started/`}
            target="_blank"
            rel="noreferrer"
          >
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

const DOCS_URL = "https://orwa-mahmoud.github.io/adapttable/";
const REPO_URL = "https://github.com/orwa-mahmoud/adapttable";

function Install({ large = false }: Readonly<{ large?: boolean }>) {
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

export function Hero({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="hero shell">
      <div className="hero__badge">
        <Bolt size={13} /> Headless engine · native UI-kit adapters
      </div>
      <h1 className="hero__h1">
        One headless engine.
        <br />
        <span className="hero__accent">Every UI kit.</span>
      </h1>
      <p className="hero__sub">
        Headless freedom, batteries included for <em>your</em> kit. The same
        table features render natively in Mantine, MUI, Chakra, Ant Design, or
        unstyled Tailwind. URL state, RTL, and a real filter UX, out of the box.
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

const FOOT_LINKS = [
  { label: "Docs", href: `${DOCS_URL}getting-started/` },
  { label: "API", href: `${DOCS_URL}api/` },
  { label: "Compare", href: `${DOCS_URL}comparison/` },
  { label: "GitHub", href: REPO_URL },
];

/**
 * Install + first-table section: the showcase is the marketing surface, so
 * it must answer "how do I actually run this?" inline and hand off to the
 * docs site for everything deeper.
 */
export function GetStarted() {
  return (
    <section className="sec shell" id="get-started">
      <SectionHead kicker="Get started" title="Five lines to your first table.">
        The CLI detects your UI kit and scaffolds a working table; the docs
        cover every prop, the three data tiers, theming, i18n/RTL and the
        TanStack comparison.
      </SectionHead>
      <div className="getstarted">
        <pre className="spcard__code getstarted__code">
          <code>{GETTING_STARTED_SNIPPET}</code>
        </pre>
        <div className="getstarted__actions">
          <Install large />
          <div className="getstarted__btns">
            <a
              className="gs-btn gs-btn--primary"
              href={`${DOCS_URL}getting-started/`}
              target="_blank"
              rel="noreferrer"
            >
              Get started
            </a>
            <a
              className="gs-btn gs-btn--ghost"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              <Star size={15} /> Star it on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const GETTING_STARTED_SNIPPET = `import { DataTable } from "@adapttable/mantine"; // or mui, chakra, antd, unstyled

<DataTable
  data={people}
  columns={[
    { key: "name" },
    { key: "team", filter: "multiSelect" },
    { key: "hiredAt", filter: "dateRange" },
  ]}
/>`;

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
          {FOOT_LINKS.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
