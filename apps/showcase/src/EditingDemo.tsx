import { Suspense } from "react";

import { ADAPTERS, DemoFallback } from "./kitDemos";
import type { FeatureBodyProps } from "./matrix/featureBodies";
import { Bolt, Check } from "./sectionIcons";

export function EditingDemo({ dark, adapter }: Readonly<FeatureBodyProps>) {
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <div className="mx-demo">
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
      <div className="mx-demo__body">
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
  );
}
