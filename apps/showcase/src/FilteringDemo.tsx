import { Suspense, useState } from "react";

import { cssVars } from "./cssVars";
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
 * The filtering page: every way this table narrows a set, and nothing else.
 *
 * Filters are the feature people arrive searching for by name, and they are
 * also the one most obviously kit-native — the popover, its inputs and the
 * chips are each adapter's own components, so the kit switcher is the point
 * rather than decoration.
 */
export function FilteringDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const [headerRow, setHeaderRow] = useState(false);
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <section className="sec shell" id="filtering">
      <SectionHead title="Filters your users can actually drive.">
        Declare what a column filters by and the table builds the control: text
        and number operators, date ranges with relative presets, a checklist of
        the values actually present, and an AND/OR tree for the cases a single
        row of inputs cannot express. Every active filter shows as a chip that
        removes itself, and the whole state lives in the URL — so a filtered
        view is a link someone can send.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Layers size={12} /> Filters opens the popover — operators per type
          </span>
          <span className="hint">
            <Check size={12} /> chips clear one filter each
          </span>
          <span className="hint">
            <Check size={12} /> the URL carries the whole filter state
          </span>
          <div className="seg" role="group" aria-label="Filter layout">
            <button
              type="button"
              className={`seg__btn${headerRow ? "" : " is-on"}`}
              aria-pressed={!headerRow}
              onClick={() => setHeaderRow(false)}
            >
              Popover
            </button>
            <button
              type="button"
              className={`seg__btn${headerRow ? " is-on" : ""}`}
              aria-pressed={headerRow}
              onClick={() => setHeaderRow(true)}
            >
              Header row
            </button>
          </div>
        </div>
        <div
          className="pad-surface__body"
          style={cssVars({
            "--c": dark ? token.accentDark : token.accentLight,
          })}
        >
          <div key={`${adapter}-${String(headerRow)}`} data-adapter={adapter}>
            <Suspense fallback={<DemoFallback />}>
              <Demo
                mode="frontend"
                locale="en"
                dark={dark}
                urlKey="flt"
                filterControls
                headerFilters={headerRow}
                focused
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
