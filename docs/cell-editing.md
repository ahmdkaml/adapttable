# React table inline cell editing — edit rows in place, validate & commit

▶ **Try it live:** [open a Mantine starter in StackBlitz](https://stackblitz.com/github/orwa-mahmoud/adapttable/tree/main/starters/mantine?file=src%2FApp.tsx) — this page's feature is already wired in `src/App.tsx` (`editable` columns + `onCellEdit`); edit it in the browser, no install. [Other UI kits →](./getting-started.md#try-it-in-stackblitz)

▶ **See it working:** [edit cells in the live demo](https://orwa-mahmoud.github.io/adapttable/demo/editing/) — a real table you can type into, not a recording.

Edit a cell in place by passing `onCellEdit` and marking columns `editable`.
Omit `onCellEdit` and the table never opens an editor — even if columns
declare `editable`. The table never mutates rows; your handler applies the
change.

## Example

```tsx
import { useState } from "react";
import { DataTable } from "@adapttable/mantine"; // or mui, chakra, antd, radix, base-ui, shadcn, unstyled

interface Person {
  id: string;
  name: string;
  role: string;
  status: "Active" | "Planned" | "Blocked";
}

const SEED: Person[] = [
  { id: "1", name: "Aisha", role: "Engineer", status: "Active" },
  { id: "2", name: "Jonas", role: "Designer", status: "Planned" },
];

export function People() {
  const [rows, setRows] = useState(SEED);
  return (
    <DataTable
      data={rows}
      columns={[
        { key: "name", sortable: true, editable: true },
        {
          key: "status",
          editable: true,
          editor: {
            type: "select",
            options: ["Active", "Planned", "Blocked"],
          },
        },
        { key: "role", editable: (row) => row.status !== "Blocked" },
      ]}
      rowKey={(r) => r.id}
      onCellEdit={(row, key, nextValue) => {
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, [key]: nextValue as never } : r
          )
        );
      }}
    />
  );
}
```

## How it works

- **Opt-in.** `onCellEdit` is the switch. Without it, cells stay plain display
  (package DNA: nothing is pushed on the developer).
- **Per-column.** `editable` is `true`, `false`, or `(row) => boolean`. The
  editor defaults to `"text"`; use `"number"` or
  `{ type: "select", options }` for the other kits.
- **Keyboard.** Double-click / Enter / F2 begins; Enter commits; Escape
  cancels and restores focus; Tab / Shift+Tab commits and advances to the
  next editable cell.
- **One-way data flow.** The commit payload is
  `onCellEdit(row, key, nextValue)` — adapters render kit-native inputs;
  core owns the state machine so every kit behaves the same.
- Out of scope (by design): row-level edit mode, validation UI, and
  optimistic-update helpers — persistence stays with the host.

## Options

| Prop / field  | Type                                                    | Default  | Description                                                                |
| ------------- | ------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| `onCellEdit`  | `(row: TRow, key: string, nextValue: unknown) => void`  | —        | Change channel; its presence enables editing.                              |
| `editable`    | `boolean \| ((row: TRow) => boolean)`                   | —        | Whether this column can open an editor (still requires `onCellEdit`).      |
| `editor`      | `"text" \| "number" \| { type: "select"; options }`     | `"text"` | Widget for the active cell.                                                |
| `editValue`   | `(row: TRow) => string`                                 | —        | Draft seed when the displayed cell is formatted but editing needs the raw. |
| `parseValue`  | `(draft: string, row: TRow) => unknown`                 | —        | Turns the edited text into the value committed to `onCellEdit`.            |
| `labels`      | `TableLabels`                                           | English  | Override `editCell` for the activate control's accessible name.            |
| `validate`    | `(value, row) => string \| undefined \| Promise<…>`     | —        | Column rule: return a message to reject the commit (see below).            |
| `validateRow` | `(row) => string \| Record<string,string> \| undefined` | —        | Table rule over the row the edit would produce (cross-field).              |
| `applyEdit`   | `(row, columnKey, value) => TRow`                       | spread   | How an edit lands on a row for `validateRow` to judge.                     |

### The editor set

| `editor`                            | Control           | Commits                         |
| ----------------------------------- | ----------------- | ------------------------------- |
| `"text"` (default)                  | text input        | the string                      |
| `"number"`                          | number input      | `number \| null` (empty → null) |
| `"boolean"`                         | checkbox          | `true` / `false`                |
| `"date"`                            | date input        | `"YYYY-MM-DD"`                  |
| `"datetime"`                        | datetime input    | `"YYYY-MM-DDTHH:mm"`            |
| `"time"`                            | time input        | `"HH:mm"`                       |
| `{ type: "select", options }`       | the kit's select  | the chosen value                |
| `{ type: "multi-select", options }` | a multiple select | the chosen values, an array     |

The date, time and checkbox editors use the platform's own controls: they are
keyboard-complete and localized by the browser, which is a better answer than
nine hand-built pickers.

**Dates commit strings, not `Date` objects.** `"2026-08-13"` is a day; a `Date`
is an instant in a timezone the reader never chose, and converting to one moves
the day for most of the world. A column storing a `Date` still seeds its editor
correctly — the local parts are read off it — and `parseValue` turns the committed
string back into whatever you store.

**A boolean commits on the tick.** A checkbox has one gesture, so waiting for
Enter would leave a ticked box that changed nothing.

**A multi-select seeds itself from a stored array** and commits an array back, so
a host stores exactly what it gave — no separator to parse, no single-value
special case. An empty selection commits `[]`, not `""`.

### Bring your own editor

An autocomplete, a rich-text field, a colour picker — anything that is not one
of the eight. The table keeps everything it already owned; the component owns
only what the reader looks at:

```tsx
{
  key: "colour",
  editable: true,
  editor: {
    type: "custom",
    render: (ctrl) => (
      <SwatchPicker
        value={ctrl.draft}
        onKeyDown={ctrl.onKeyDown}
        firstSwatchRef={ctrl.focusRef}
        onPick={(swatch) => {
          ctrl.setDraft(swatch);
          ctrl.commit();
        }}
      />
    ),
  },
}
```

Double-click / Enter / F2 still activates the cell, focus still returns to it
afterwards, Enter still commits, Escape still cancels, Tab still moves on, and
validators still gate the commit — none of that is yours to write again. What
arrives is `draft` and the calls that change it: `setDraft`, `commit` (for a
picker, where choosing IS the gesture), `cancel`, `onKeyDown` (wire it to keep
the keyboard flow; an editor that owns Enter simply does not call it for Enter),
`onBlur`, and `focusRef` to point at what should take focus. `error`,
`validating` and `errorId` are there so a component can mark itself invalid —
the table renders the message either way.

The draft is a string, as it is for every editor; `parseValue` is still how a
column turns it into whatever gets stored.

### Display, draft, and committed value

Three moments in a cell's life, and a formatted column needs a different value
at each:

| Moment    | Field        | For a currency column |
| --------- | ------------ | --------------------- |
| Displayed | `accessor`   | `"$1,240.00"`         |
| Edited    | `editValue`  | `"1240"`              |
| Committed | `parseValue` | `1240`                |

```tsx
{
  key: "budget",
  editable: true,
  editor: "number",
  accessor: (row) => money.format(row.budget),
  editValue: (row) => String(row.budget),
  parseValue: (draft) => Number(draft.replace(/[^0-9.-]/g, "")),
}
```

`parseValue` receives the draft exactly as typed plus the row, and replaces the
editor's own parsing rather than running after it — so a column that says how
to read its drafts is in full control. Return anything `onCellEdit` should
receive, including a value no built-in editor produces, such as a `Date`.

Without it nothing changes: a `number` editor commits `number | null` and every
other editor commits the raw string.

## Validation

A validator gates the commit and nothing else. It never rejects a keystroke,
never rewrites a value, and never decides what to save — the host still owns
persistence, and will usually validate again on the server.

Two levels, because they answer different questions. A **column** rule knows one
value:

```tsx
const columns: ColumnDef<Task>[] = [
  {
    key: "title",
    editable: true,
    validate: (value) =>
      String(value).trim() === "" ? "A title is required" : undefined,
  },
];
```

A **table** rule sees the row the edit would produce, and answers what no single
cell can:

```tsx
<DataTable
  {...props}
  onCellEdit={apply}
  validateRow={(task) =>
    task.end <= task.start ? "The end must come after the start" : undefined
  }
/>
```

Return a string for a row-level problem, or a map of column key → message to
mark individual cells — which is how a cross-field rule points at the field the
reader should look at. Return nothing to allow the commit. When a column key is
not the field (a nested path), pass `applyEdit` so the rule sees the right row.

**A rejected value never reaches `onCellEdit`.** The editor stays open holding
what the reader typed, and the message is announced rather than only painted.
Where it renders depends on the kit: Mantine and MUI put it in their own input's
error slot (their components own the field's `aria-describedby`), and every other
kit renders `data-adapttable-part="edit-cell-error"` with `role="alert"`, the
editor carrying `aria-invalid` and `aria-describedby` pointing at it. Either way
the message exists once in the DOM and is read with the field. Escape clears it
with the draft.

Both levels may be async — "is this SKU real" is a request. The editor stays open
and carries `aria-busy` while the check runs, and a newer draft supersedes an
older check, so a stale answer can never mark a value the reader has already
changed. A column with no validator commits synchronously, exactly as before.

## Saving, and what happens when it fails

Return a promise from `onCellEdit` and the table knows something the reader
cannot see: the value is on its way somewhere. The cell says so until the promise
settles — `data-save="saving"` and `aria-busy` on the cell — and says why if it
rejects, in a live region beside it (`data-adapttable-part="edit-cell-save-error"`,
`role="alert"`).

```tsx
<DataTable
  {...props}
  onCellEdit={async (row, key, value) => {
    setRows(applyOptimistically(row, key, value));
    await api.save(row.id, { [key]: value });
  }}
  onEditRollback={(previous, columnKey) => {
    setRows((current) => restore(current, previous));
  }}
  formatEditError={(error) => humanize(error)}
/>
```

A table that shows the new value before the server has agreed has to put the old
one back when it disagrees — and only the host can write to its own rows, so
`onEditRollback` receives the row as it was and restores it. The failed cell then
offers an **Undo** (`labels.undoEdit`, localized in all seventeen locales), and
pressing it calls that handler. Omit `onEditRollback` and the message shows
without an undo, which is right for a table that refetches instead.

A newer save supersedes an older one, so a slow rejection can never mark a value
the reader has already replaced. A host that saves synchronously pays nothing:
with nothing to wait for, there is no saving state to render.

Headless: `useCellSaveState` (`CellSaveState`, `CellSaveStatus`,
`FailedCellSave`, `UseCellSaveStateOptions`); the controller carries
`saveStatus`, `saveFailure`, `canRollback`, `rollback` and `dismissFailure`.

## Dirty marks

A table that looks identical before and after a save leaves the reader no way to
tell what is still at risk. Pass `dirtyIndicators` and a changed cell carries
`data-dirty` until its value settles — and so does its row, so a long table can
be scanned without hunting for the cell inside it.

```tsx
<DataTable {...props} dirtyIndicators onCellEdit={save} />
```

A mark clears when the save **resolves**, and stays when it fails: the value is
still at risk until the reader undoes it or tries again. A rollback clears it too,
since the value it belonged to is gone. Nothing clears on a timer — a mark that
fades on its own says the change is safe when nobody checked.

Off by default, because a mark is a claim about what the server has agreed to and
a table whose host never says would be guessing. For a table that confirms its
own state another way — a refetch that agrees, a websocket echoing the value back
— `table.editing?.dirty` exposes `confirm`, `confirmRow` and `confirmAll`, plus a
`count` for an "unsaved changes" line.

Headless: `useDirtyCells` (`DirtyCellState`, `UseDirtyCellsOptions`) and
`rowIsDirty(editing, rowId)` from `@adapttable/core/adapter`.

## Headless editing

The editing engine is exported for custom adapters and fully custom tables.
`useCellEditing` is the state machine (one active cell, a draft string, and
the Enter / Escape / Tab keyboard flow); `EditableCellGate` is the reusable
activation wrapper every built-in adapter renders (double-click / Enter / F2
to begin, with the cell value as the accessible name and the edit hint as
its `title`).

| Export                                                                   | Purpose                                                                                                         |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `useCellEditing` / `CellEditingState`                                    | The state machine hook and the state it returns.                                                                |
| `EditableCellGate` / `EditableCellGateProps`                             | Activation wrapper: display content when idle, the kit's editor while active.                                   |
| `EditableCellEditing`                                                    | The editing bundle adapters receive from the chrome (`chrome.editing`).                                         |
| `CellEditCommit` / `CellEditTarget`                                      | A commit payload (`row`, `key`, `value`) and the active-cell address.                                           |
| `CellEditor` / `CellEditorOption`                                        | The column `editor` descriptor and one option of a select editor.                                               |
| `CellEditKeyAction` / `CellEditKeyOutcome` / `CellEditNavigation`        | Keyboard-flow vocabulary: what a key press means and where focus goes next.                                     |
| `EditableCellController` / `EditableCellEditorCtrl` / `EditableCellMode` | The controller handed to a custom editor: draft, commit/cancel, mode.                                           |
| `EditableColumnLike` / `isCellEditable` / `hasEditableColumns`           | The minimal column shape editing reads, plus the two predicates the chrome uses.                                |
| `parseCellEditValue` / `resolveCellEditor` / `normalizeEditorOptions`    | Draft parsing (number editors yield `number \| null`) and editor/option resolution.                             |
| `useEditValidation` / `EditValidationState` / `UseEditValidationOptions` | Validation state: which cells carry a message, which are still checking, and the `check` that gates one commit. |
| `CellValidator` / `RowValidator` / `ValidationTarget`                    | The two validator signatures and the cell address a check is about.                                             |
| `resolveCommitValue`                                                     | The row, column and parsed value a commit resolves to — what a validator judges before the host sees it.        |
| `editorValidationProps`                                                  | The `aria-invalid` / `aria-describedby` / `aria-busy` a kit's editor spreads while validation is in play.       |

## Applying changes without a refetch

A commit hands you a change; what you do with your data is yours. Refetching
the page to reflect it costs a round trip and throws away the user's scroll
position, open rows, and sometimes their selection.

`applyRowPatches` applies changes to the rows you already hold:

```tsx
import { applyRowPatches, updateRow, removeRow } from "@adapttable/core";

const [rows, setRows] = useState(initial);
const byId = (row: Person) => row.id;

<DataTable
  data={rows}
  columns={columns}
  rowKey={byId}
  editing
  onCellEdit={({ row, key, value }) =>
    setRows((current) =>
      applyRowPatches(current, [updateRow(byId(row), { [key]: value })], byId)
    )
  }
/>;
```

Four builders — `insertRow`, `updateRow`, `upsertRow`, `removeRow` — and a
batch is just an array, applied in order, so a later patch acts on what an
earlier one did.

Two guarantees make it safe to call on every commit:

- **Untouched rows keep their object identity.** React reconciles them as
  unchanged, and per-row memos — a [computed column](./columns.md)'s cache, a
  `memo`'d cell — stay valid instead of recomputing for the whole page.
- **A patch that changes nothing returns the very same array.** An update whose
  values already match, an upsert of the row already in place, a removal of an
  id that is not there, or an empty batch hands back the original reference, so
  the `setState` does not re-render.

Selection and expansion survive for the same reason: both are keyed by row id,
and a patch never changes the id of a row it did not touch.

`applyRowPatches` is a pure function over an array — the table does not own
your data and this does not make it start.

The patch shapes are exported for code that builds them dynamically:
`RowPatch` is the union, with `InsertPatch`, `UpdatePatch`, `UpsertPatch` and
`RemovePatch` as its members.

## Notes

- Works on desktop rows and mobile cards, LTR and RTL.
- Custom `Cell` / `accessor` still render in display mode; the editor replaces
  them only while that cell is active.
- Prefer updating your row list immutably in `onCellEdit` so React sees a new
  `data` / source identity.

See it live in the [demo](https://orwa-mahmoud.github.io/adapttable/demo/) —
double-click an editable cell (Person, Email, or Team) in the editing
section.

## Undo and redo

Set `editHistory` and edits can be taken back:

```tsx
<DataTable
  cellNavigation
  editHistory
  columns={[{ key: "budget", header: "Budget", editable: true }]}
  onCellEdit={commit}
/>
```

**Ctrl/Cmd+Z** undoes, **Ctrl/Cmd+Shift+Z** and **Ctrl+Y** redo. Both announce
what moved — `labels.editUndone`, `labels.editRedone`, or
`labels.editNothingToUndo` when the history is empty.

An undo does not rewrite your data, because the table never owned it. It
**commits the previous value back through `onCellEdit`**, the same call the
original edit made — so validation, a mutation, an optimistic update, a toast,
whatever you wrapped around editing, all run on the way back exactly as they ran
on the way out.

**One gesture is one entry.** A paste of two hundred cells undoes in a single
press, as does a fill; an inline edit is a gesture of one. Fifty gestures are
kept by default — pass `{ depth: 200 }` to keep more.

The keys live on the grid, so they need `cellNavigation`. For your own buttons,
`table.editHistory` carries `undo()`, `redo()`, `canUndo`, `canRedo` and
`clear()` — call `clear()` when you replace the data underneath, since a
history of rows that no longer exist can only put back values nobody wants.
