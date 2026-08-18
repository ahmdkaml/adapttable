import { Suspense } from "react";

import { GROUPS_DEFAULT_LAYOUT } from "./data";
import { ADAPTERS, DemoFallback } from "./kitDemos";
import type { FeatureBodyProps } from "./matrix/featureBodies";
import { Check, Columns } from "./sectionIcons";

export function ColumnGroupsDemo({
  dark,
  adapter,
}: Readonly<FeatureBodyProps>) {
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <div className="mx-demo">
      <div className="hint-row">
        <span className="hint">
          <Columns size={12} /> Contact folds to a chevron, Assignment keeps
          Team, Delivery shows $25,300 for 35 days
        </span>
        <span className="hint">
          <Check size={12} /> groups start open — collapse one to see its mode
        </span>
      </div>
      <div className="mx-demo__body">
        <div key={adapter} data-adapter={adapter}>
          <Suspense fallback={<DemoFallback />}>
            <Demo
              mode="frontend"
              locale="en"
              dark={dark}
              urlKey="cgrp"
              columnGroups
              defaultColumnLayout={GROUPS_DEFAULT_LAYOUT}
              focused
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
