import { useState } from "react";

import { MantineDemo } from "./adapters/MantineDemo";
import { Check, Monitor, Phone } from "./sectionIcons";
import { SectionHead } from "./sections";

/**
 * The mobile-cards page: the SAME table, flipped between its desktop layout
 * and the automatic phone card layout with one prop. `forceMobile` drives the
 * flip so a desktop visitor sees the phone experience without resizing —
 * in real apps the switch happens by itself at the mobile breakpoint.
 */
export function MobileDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [phone, setPhone] = useState(true);
  return (
    <section className="sec shell" id="mobile">
      <SectionHead title="One table. Cards on phones. Automatically.">
        Below the mobile breakpoint every row becomes a card — same columns,
        same filters, same selection, same URL state. Nothing to configure and
        no second layout to build: the switch is on by default, and{" "}
        <code>forceMobile</code> (behind this page&apos;s toggle) pins either
        layout when you need it. Pagination flips to infinite scroll on phones
        with <code>paginationMode=&quot;auto&quot;</code>, and every card is
        tunable per column with <code>mobileLabel</code> and{" "}
        <code>hideOnMobile</code>.
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
          <span className="hint">
            <Check size={12} /> filters, selection and search stay identical
          </span>
          <span className="hint">
            <Check size={12} /> infinite scroll replaces the pager on phones
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
            />
          </div>
        </div>
      </div>
    </section>
  );
}
