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

export function EditingDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <section className="sec shell" id="editing">
      <SectionHead title="Edit a cell in place. Your handler owns the write.">
        Mark columns <code>editable</code> and pass <code>onCellEdit</code> —
        the table opens a kit-native editor and hands you the new value. It
        never mutates your rows. Text, number and select editors are built in;
        Enter commits, Escape cancels, Tab moves to the next editable cell. Omit{" "}
        <code>onCellEdit</code> and no cell ever opens, even where columns
        declare <code>editable</code>.
        <br />
        With <code>cellNavigation</code> on, that same handler receives whole
        blocks: paste a spreadsheet with Ctrl/Cmd+V, or drag the square on the
        selection&rsquo;s corner to carry its values on. Add{" "}
        <code>selectionStats</code> and the strip under the table counts and
        totals whatever is selected. <code>editHistory</code> makes Ctrl/Cmd+Z
        put a whole paste back in one press — through your handler, never behind
        your back.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Bolt size={12} /> double-click any cell to edit it
          </span>
          <span className="hint">
            <Check size={12} /> Enter commits · Escape cancels · Tab advances
          </span>
          <span className="hint">
            <Check size={12} /> text, number and select editors
          </span>
          <span className="hint">
            <Bolt size={12} /> select cells, then drag the corner or paste with
            Ctrl/Cmd+V
          </span>
          <span className="hint">
            <Check size={12} /> Ctrl/Cmd+Z undoes · Ctrl/Cmd+F finds in place
          </span>
          <span className="hint">
            <Bolt size={12} /> Simulate incoming update asks Keep mine / Take
            theirs while any editor is open
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
                urlKey="edit"
                editing
                focused
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
