import { MantineDemo } from "./adapters/MantineDemo";
import { Bolt, Check } from "./sectionIcons";
import { SectionHead } from "./sections";

export function EditingDemo({ dark }: Readonly<{ dark: boolean }>) {
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
        selection&rsquo;s corner to carry its values on.
      </SectionHead>
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
        </div>
        <div className="pad-surface__body">
          <MantineDemo
            mode="frontend"
            locale="en"
            dark={dark}
            urlKey="edit"
            editing
            cellNavigation
          />
        </div>
      </div>
    </section>
  );
}
