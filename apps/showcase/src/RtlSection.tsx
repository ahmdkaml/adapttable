import type { ColumnLayoutState } from "@adapttable/core";

import { ChakraDemo } from "./adapters/ChakraDemo";
import { SectionHead } from "./sections";

const RTL_DEFAULT_LAYOUT = {
  hidden: ["email", "team"],
  pinned: { person: "start" },
} as const satisfies Partial<ColumnLayoutState>;

export function RtlSection({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="sec shell" id="rtl">
      <SectionHead title="Right-to-left, for real.">
        This Arabic table mirrors the entire layout — search, sort arrows,
        pinned columns, and pagination. Not just translated strings: a genuinely
        flipped axis.
      </SectionHead>
      <div className="pad-surface">
        <div className="pad-surface__body">
          <ChakraDemo
            mode="frontend"
            locale="ar"
            dark={dark}
            urlKey="rtl"
            defaultColumnLayout={RTL_DEFAULT_LAYOUT}
            focused
          />
        </div>
      </div>
    </section>
  );
}
