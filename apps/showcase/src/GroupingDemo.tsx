import { MantineDemo } from "./adapters/MantineDemo";
import { Check, Layers } from "./sectionIcons";
import { SectionHead } from "./sections";

export function GroupingDemo({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="sec shell" id="grouping">
      <SectionHead title="Group rows. Subtotal groups. One column key.">
        Pass <code>groupBy</code> and rows fold into kit-native group headers
        with counts; add <code>groupAggregates</code> for per-group subtotals —
        the same mapper <code>summaryRow</code> uses. Collapse a group, edit a
        cell inside another, and the totals keep up. Both are opt-in: omit the
        props and the table stays flat.
      </SectionHead>
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Layers size={12} /> collapse / expand a group header
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
          />
        </div>
      </div>
    </section>
  );
}
