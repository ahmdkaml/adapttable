import { type ReactNode, useState } from "react";

import { Check, External, Moon, Sun } from "./sectionIcons";

function Wordmark({ href }: Readonly<{ href: string }>) {
  return (
    <a className="wm" href={href}>
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

export type DemoPage = "demo" | "scale" | "rtl";

/** The demo pages — each a static HTML entry, linked with plain anchors. */
const PAGES: { key: DemoPage; label: string; path: string }[] = [
  { key: "demo", label: "Live demo", path: "" },
  { key: "scale", label: "Scale", path: "scale" },
  { key: "rtl", label: "RTL", path: "rtl" },
];

/**
 * App-style toolbar: the landing owns the marketing, so the demo's nav is
 * page tabs + Docs/GitHub. `root` is the relative prefix back to the demo
 * home ("." on the home page, ".." on subpages) — plain static links, no
 * router.
 */
export function AppNav({
  active,
  root,
  dark,
  onToggleDark,
}: Readonly<{
  active: DemoPage;
  root: string;
  dark: boolean;
  onToggleDark: () => void;
}>) {
  const href = (path: string) =>
    path === "" ? `${root}/` : `${root}/${path}/`;
  return (
    <header className="nav">
      <div className="nav__inner shell">
        <Wordmark href={href("")} />
        <nav className="nav__links">
          {PAGES.map((p) => (
            <a
              key={p.key}
              href={href(p.path)}
              className={active === p.key ? "is-on" : undefined}
              aria-current={active === p.key ? "page" : undefined}
            >
              {p.label}
            </a>
          ))}
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

const FOOT_LINKS = [
  { label: "Docs", href: `${DOCS_URL}getting-started/` },
  { label: "API", href: `${DOCS_URL}api/` },
  { label: "Compare", href: `${DOCS_URL}comparison/` },
  { label: "GitHub", href: REPO_URL },
];

export function Footer({ root }: Readonly<{ root: string }>) {
  return (
    <footer className="foot">
      <div className="foot__inner shell">
        <div className="foot__lead">
          <Wordmark href={`${root}/`} />
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
