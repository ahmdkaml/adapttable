import { MantineDemo } from "./adapters/MantineDemo";
import { Check, Layers } from "./sectionIcons";
import { SectionHead } from "./sections";

export function GroupingDemo({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="sec shell" id="grouping">
      <SectionHead title="Group rows. Nest them. Subtotal every level.">
        Pass <code>groupBy</code> and rows fold into kit-native group headers
        with counts; pass a list — <code>{'["team", "status"]'}</code> — and
        each key nests inside the one before it. Add{" "}
        <code>groupAggregates</code> for per-group subtotals — the same mapper{" "}
        <code>summaryRow</code> uses — and every header totals its whole
        subtree. Collapse a group, edit a cell inside another, and the numbers
        keep up. All opt-in: omit the props and the table stays flat.
      </SectionHead>
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Layers size={12} /> collapse / expand any level
          </span>
          <span className="hint">
            <Check size={12} /> per-group subtotals from one mapper
          </span>
          <span className="hint">
            <Check size={12} /> double-click a cell to edit it in place
          </span>
        </div>
        <div className="pad-surface__body">
          <MantineDemo
            mode="frontend"
            locale="en"
            dark={dark}
            urlKey="grp"
            grouping
            editing
            cellNavigation
          />
        </div>
      </div>
    </section>
  );
}
