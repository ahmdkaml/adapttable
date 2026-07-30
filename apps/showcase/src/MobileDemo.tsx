import { useState } from "react";

import { MantineDemo } from "./adapters/MantineDemo";
import type { PageMode } from "./Demo";
import { Check, Monitor, Phone } from "./sectionIcons";
import { SectionHead } from "./sections";

/**
 * The mobile-cards page: the SAME table, flipped between its desktop layout
 * and the automatic phone card layout with one prop. `forceMobile` drives the
 * flip so a desktop visitor sees the phone experience without resizing —
 * in real apps the switch happens by itself at the mobile breakpoint.
 *
 * Both pagination styles are demoed explicitly: infinite scroll (what
 * `paginationMode="auto"` picks on phones) and the classic pager.
 */
export function MobileDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [phone, setPhone] = useState(true);
  const [pageMode, setPageMode] = useState<PageMode>("infinite");
  return (
    <section className="sec shell" id="mobile">
      <SectionHead title="One table. Cards on phones. Automatically.">
        Below the mobile breakpoint every row becomes a card — same columns,
        same filters, same selection, same URL state. Nothing to configure and
        no second layout to build: the switch is on by default, and{" "}
        <code>forceMobile</code> (behind this page&apos;s toggle) pins either
        layout when you need it. On phones{" "}
        <code>paginationMode=&quot;auto&quot;</code> resolves to infinite scroll
        — both styles are here to try — and every card is tunable per column
        with <code>mobileLabel</code> and <code>hideOnMobile</code>.
      </SectionHead>
      <div className="pad-surface">
        <div className="hint-row">
          <div className="seg" role="group" aria-label="Layout">
            <button
              type="button"
              className={`seg__btn${phone ? " is-on" : ""}`}
              onClick={() => setPhone(true)}
            >
              <Phone size={12} /> Phone cards
            </button>
            <button
              type="button"
              className={`seg__btn${phone ? "" : " is-on"}`}
              onClick={() => setPhone(false)}
            >
              <Monitor size={12} /> Desktop table
            </button>
          </div>
          <div className="seg" role="group" aria-label="Pagination">
            <button
              type="button"
              className={`seg__btn${pageMode === "infinite" ? " is-on" : ""}`}
              onClick={() => setPageMode("infinite")}
            >
              Infinite scroll
            </button>
            <button
              type="button"
              className={`seg__btn${pageMode === "paged" ? " is-on" : ""}`}
              onClick={() => setPageMode("paged")}
            >
              Paged
            </button>
          </div>
          <span className="hint">
            <Check size={12} /> filters, selection and search stay identical
          </span>
        </div>
        <div className="pad-surface__body">
          <div className={phone ? "phone-frame" : undefined}>
            <MantineDemo
              mode="frontend"
              locale="en"
              dark={dark}
              urlKey="mob"
              forceMobile={phone}
              pageMode={pageMode}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
