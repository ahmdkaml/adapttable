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
 * The selection page: choosing rows, and doing something with them.
 *
 * Selection is half a feature on its own — what people search for is the pair,
 * "select rows and act on them in bulk". Bulk actions are what turn selection
 * on, so this page asks for them and nothing else competes for the toolbar.
 */
export function SelectionDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <section className="sec shell" id="selection">
      <SectionHead title="Pick rows. Then do something with them.">
        Tick rows one at a time or take the whole page from the header box — the
        selection is a set of ids, not a slice of what is rendered, so a row
        chosen on page one is still chosen while page three is on screen. Bulk
        actions run against that set and can ask for confirmation first.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Check size={12} /> the header box takes the whole page
          </span>
          <span className="hint">
            <Layers size={12} /> selection survives paging — it is a set of ids
          </span>
          <span className="hint">
            <Check size={12} /> bulk actions run over the selection
          </span>
        </div>
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
                locale="en"
                dark={dark}
                urlKey="sel"
                bulkActions
                focused
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
