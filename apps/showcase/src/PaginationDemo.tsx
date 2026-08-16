import { Suspense, useState } from "react";

import { cssVars } from "./cssVars";
import type { PageMode } from "./Demo";
import {
  ADAPTERS,
  DemoFallback,
  KitSwitcher,
  readKitFromUrl,
} from "./kitDemos";
import { Check, Layers } from "./sectionIcons";
import { SectionHead } from "./sections";
import { ADAPTER_TOKENS } from "./themeTokens";

/**
 * The pagination page: both styles of moving through a long set, side by
 * switchable, and nothing else on the page to distract from the difference.
 */
export function PaginationDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const [pageMode, setPageMode] = useState<PageMode>("paged");
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <section className="sec shell" id="pagination">
      <SectionHead title="Pages, or one growing list. Same table.">
        A classic pager and infinite scroll are the same query with a different
        way of asking for more, so switching between them is one prop rather
        than a second table. Page size, page number and the loaded window all
        live in the URL, which means a link reopens the view someone was
        actually looking at.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Layers size={12} /> the pager carries page and size in the URL
          </span>
          <span className="hint">
            <Check size={12} /> infinite mode extends one window as you scroll
          </span>
          <div className="seg" role="group" aria-label="Pagination">
            <button
              type="button"
              className={`seg__btn${pageMode === "paged" ? " is-on" : ""}`}
              aria-pressed={pageMode === "paged"}
              onClick={() => setPageMode("paged")}
            >
              Paged
            </button>
            <button
              type="button"
              className={`seg__btn${pageMode === "infinite" ? " is-on" : ""}`}
              aria-pressed={pageMode === "infinite"}
              onClick={() => setPageMode("infinite")}
            >
              Infinite
            </button>
          </div>
        </div>
        <div
          className="pad-surface__body"
          style={cssVars({
            "--c": dark ? token.accentDark : token.accentLight,
          })}
        >
          <div key={`${adapter}-${pageMode}`} data-adapter={adapter}>
            <Suspense fallback={<DemoFallback />}>
              <Demo
                mode="frontend"
                locale="en"
                dark={dark}
                urlKey="pg"
                pageMode={pageMode}
                focused
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
