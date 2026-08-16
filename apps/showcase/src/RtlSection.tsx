import type { ColumnLayoutState } from "@adapttable/core";
import { Suspense, useState } from "react";

import { cssVars } from "./cssVars";
import {
  ADAPTERS,
  DemoFallback,
  KitSwitcher,
  readKitFromUrl,
} from "./kitDemos";
import { SectionHead } from "./sections";
import { ADAPTER_TOKENS } from "./themeTokens";

const RTL_DEFAULT_LAYOUT = {
  hidden: ["email", "team"],
  pinned: { person: "start" },
} as const satisfies Partial<ColumnLayoutState>;

export function RtlSection({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <section className="sec shell" id="rtl">
      <SectionHead title="Right-to-left, for real.">
        This Arabic table mirrors the entire layout — search, sort arrows,
        pinned columns, and pagination. Not just translated strings: a genuinely
        flipped axis.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <div
          className="pad-surface__body"
          style={cssVars({
            "--c": dark ? token.accentDark : token.accentLight,
          })}
        >
          <div key={adapter} data-adapter={adapter}>
            <Suspense fallback={<DemoFallback />}>
              <Demo
                mode="frontend"
                locale="ar"
                dark={dark}
                urlKey="rtl"
                defaultColumnLayout={RTL_DEFAULT_LAYOUT}
                // The filters popover is the point of this page: it has to anchor
                // and flip from the correct edge under RTL, which nothing can show
                // if `focused` strips the control that opens it.
                filterControls
                focused
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
