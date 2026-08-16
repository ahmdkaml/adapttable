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
 * The tree page: hierarchy in a table, and nothing else.
 *
 * A tree grid is a different shape from a grouped table — the rows themselves
 * nest, rather than being collected under synthetic headers — and people search
 * for it by that name. The chevron, the indent and the keyboard path are each
 * kit's own, so the switcher is the subject rather than decoration.
 */
export function TreeDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <section className="sec shell" id="tree">
      <SectionHead title="Rows that contain rows.">
        Point the table at a parent id and it renders a hierarchy: children
        indent under their parent, a chevron opens and closes each branch, and
        the expansion lives in the URL like every other piece of state. Sorting
        and filtering apply within the tree rather than flattening it, so a
        branch keeps its shape.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Layers size={12} /> chevrons open and close a branch
          </span>
          <span className="hint">
            <Check size={12} /> arrow keys walk the tree, Enter toggles
          </span>
          <span className="hint">
            <Check size={12} /> expansion is carried in the URL
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
                urlKey="tree"
                tree
                focused
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
