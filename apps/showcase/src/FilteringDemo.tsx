import { Suspense, useState } from "react";

import { ADAPTERS, DemoFallback } from "./kitDemos";
import type { FeatureBodyProps } from "./matrix/featureBodies";
import { Check, Layers } from "./sectionIcons";

/**
 * The filtering page: every way this table narrows a set, and nothing else.
 *
 * Filters are the feature people arrive searching for by name, and they are
 * also the one most obviously kit-native — the popover, its inputs and the
 * chips are each adapter's own components, so the kit switcher is the point
 * rather than decoration.
 */
export function FilteringDemo({ dark, adapter }: Readonly<FeatureBodyProps>) {
  const [headerRow, setHeaderRow] = useState(false);
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <div className="mx-demo">
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
      <div className="mx-demo__body">
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
  );
}
