import { Suspense, useEffect, useRef, useState } from "react";

import { cssVars } from "./cssVars";
import {
  ADAPTERS,
  DemoFallback,
  KitSwitcher,
  readKitFromUrl,
} from "./kitDemos";
import { Check, Keyboard } from "./sectionIcons";
import { SectionHead } from "./sections";
import { ADAPTER_TOKENS } from "./themeTokens";

/** How many past announcements the transcript keeps on screen. */
const TRANSCRIPT_LENGTH = 6;

/**
 * Mirror what the table announces, as visible text.
 *
 * Screen-reader output is the one part of a table a sighted reader cannot
 * check, so this page shows it: an observer watches the live regions the table
 * already renders and repeats each message here. It reads the SAME nodes a
 * screen reader would — it does not reimplement the wording — so if the
 * transcript is empty, nothing was announced.
 */
function useAnnouncements(root: HTMLElement | null): string[] {
  const [lines, setLines] = useState<string[]>([]);
  const last = useRef("");
  useEffect(() => {
    if (!root) return undefined;
    const read = () => {
      const regions = root.querySelectorAll<HTMLElement>(
        '[aria-live], [role="status"], [role="alert"]'
      );
      for (const region of regions) {
        const text = region.textContent?.trim() ?? "";
        if (text === "" || text === last.current) continue;
        last.current = text;
        setLines((prev) => [text, ...prev].slice(0, TRANSCRIPT_LENGTH));
      }
    };
    const observer = new MutationObserver(read);
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    read();
    return () => {
      observer.disconnect();
    };
  }, [root]);
  return lines;
}

export function AccessibilityDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const announcements = useAnnouncements(root);
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <section className="sec shell" id="accessibility">
      <SectionHead title="A table you can use without a mouse, or a screen.">
        Tab into the grid and the arrow keys move a real focus point, one cell
        at a time, with a visible ring wherever it lands. Every move, sort,
        filter and edit is announced through a live region — the part of a table
        a sighted reader normally cannot check, so this page repeats it below in
        plain text as it happens. <code>columnSelectionCheckbox</code> adds the
        other way into a column selection: Ctrl/Cmd+click on a header needs a
        modifier key a touchscreen does not have, so each header also carries a
        checkbox that names its column — visible on hover or focus here, always
        visible where there is no pointer to hover with.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Keyboard size={12} /> Tab into the grid, then arrow between cells
          </span>
          <span className="hint">
            <Keyboard size={12} /> Home / End jump to the row&apos;s edges
          </span>
          <span className="hint">
            <Check size={12} /> every announcement appears in the transcript
          </span>
          <span className="hint">
            <Check size={12} /> hover a header to select its whole column
          </span>
        </div>
        <div
          className="pad-surface__body"
          style={cssVars({
            "--c": dark ? token.accentDark : token.accentLight,
          })}
        >
          <div key={adapter} data-adapter={adapter} ref={setRoot}>
            <Suspense fallback={<DemoFallback />}>
              <Demo
                mode="frontend"
                locale="en"
                dark={dark}
                urlKey="a11y"
                cellNavigation
                columnSelectionCheckbox
                focused
              />
            </Suspense>
          </div>
        </div>
        <div className="pad-surface__body" data-testid="announcements">
          <strong>Announced to a screen reader</strong>
          {announcements.length === 0 ? (
            <p>
              Nothing yet — move through the grid and each announcement appears
              here as it is made.
            </p>
          ) : (
            <ol>
              {announcements.map((line, index) => (
                <li key={`${line}-${String(index)}`}>{line}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
