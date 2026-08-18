import { Suspense, useState } from "react";

import type { FiltersUi } from "./Demo";
import { ADAPTERS, DemoFallback } from "./kitDemos";
import type { FeatureBodyProps } from "./matrix/featureBodies";
import { Check, Layers } from "./sectionIcons";

type FilterLayout = FiltersUi;

/**
 * The filtering page: every way this table narrows a set, and nothing else.
 *
 * Filters are the feature people arrive searching for by name, and they are
 * also the one most obviously kit-native — the popover, its inputs and the
 * chips are each adapter's own components, so the kit switcher is the point
 * rather than decoration.
 */
export function FilteringDemo({ dark, adapter }: Readonly<FeatureBodyProps>) {
  const [layout, setLayout] = useState<FilterLayout>("popover");
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <div className="mx-demo">
      <div className="hint-row">
        <span className="hint">
          <Layers size={12} /> Filters opens the popover or drawer
        </span>
        <span className="hint">
          <Check size={12} /> chips clear one filter each
        </span>
        <span className="hint">
          <Check size={12} /> Header puts a filter icon on each column
        </span>
        <div className="seg" role="group" aria-label="Filter layout">
          {(
            [
              ["popover", "Popover"],
              ["drawer", "Drawer"],
              ["header", "Header"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`seg__btn${layout === value ? " is-on" : ""}`}
              aria-pressed={layout === value}
              onClick={() => setLayout(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-demo__body">
        <div key={`${adapter}-${layout}`} data-adapter={adapter}>
          <Suspense fallback={<DemoFallback />}>
            <Demo
              mode="frontend"
              locale="en"
              dark={dark}
              urlKey="flt"
              filterControls
              filtersUi={layout === "header" ? "popover" : layout}
              headerFilters={layout === "header"}
              focused
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
