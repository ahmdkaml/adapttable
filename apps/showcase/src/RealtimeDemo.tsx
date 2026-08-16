import { Suspense, useState } from "react";

import { cssVars } from "./cssVars";
import {
  ADAPTERS,
  DemoFallback,
  KitSwitcher,
  readKitFromUrl,
} from "./kitDemos";
import { Bolt, Check } from "./sectionIcons";
import { SectionHead } from "./sections";
import { ADAPTER_TOKENS } from "./themeTokens";

/**
 * The realtime page: rows changing under the reader while they work.
 *
 * The updates arrive through the patch API rather than by replacing the array,
 * which is what keeps the patch log the incremental engine reads — only the
 * touched rows re-run search, filters and sort. The feed beside the table
 * lists what was applied, so the changes can be followed rather than spotted.
 */
export function RealtimeDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <section className="sec shell" id="realtime">
      <SectionHead title="Rows that change while you are reading them.">
        A live feed patches rows as they arrive, the way a websocket would.
        Patches go through the row-patch API rather than replacing the array, so
        the incremental engine re-runs search, filters and sort for the touched
        rows only — sorting and filtering stay applied as values move under
        them, and your scroll position and selection survive.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Bolt size={12} /> budgets update on a timer, one row at a time
          </span>
          <span className="hint">
            <Check size={12} /> sort by Budget and watch rows re-order live
          </span>
          <span className="hint">
            <Check size={12} /> the feed lists every patch as it lands
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
                urlKey="rt"
                realtime
                focused
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
