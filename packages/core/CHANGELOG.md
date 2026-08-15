# @adapttable/core

## 2.4.0

### Minor Changes

- 49c49f0: Re-evaluate filters and groups from a patch log. `applyRowPatches` already
  mutates rows; an IncrementalView on `useFrontendData` now re-filters,
  re-sorts, re-groups and re-aggregates only the rows a patch touched.
- 56c7ce6: PDF export and a print layout. `import { pdfWriter, openPrintLayout } from
"@adapttable/core/pdf"` — the same export button writes a `.pdf`, or print
  opens on the view the reader can see.
- 28195bb: XLSX export types dates, styles the sheet, and writes group/tree outline plus aggregate rows

### Patch Changes

- 6028b15: One filter chrome at a time. `filtersMode="header"` (and the `headerFilters` alias) hides the toolbar Filters button; header multi-selects open a compact menu instead of a stacked `<select multiple>`.
- 6028b15: Build the default filter registry from its own specs so a new entry point cannot leave every filter type empty.

## 2.3.0

### Minor Changes

- a9992c9: A save the reader can see, and an undo when it fails

  Return a promise from `onCellEdit` and the cell says it is saving until that
  promise settles (`data-save="saving"`, `aria-busy`), then says why if it rejects —
  in a live region beside it, so a failure is heard as well as seen.

  `onEditRollback` puts the row back: a table that showed the new value before the
  server agreed has to restore the old one when it disagrees, and only the host can
  write to its own rows. The failed cell then offers an Undo (`labels.undoEdit`,
  localized in all seventeen locales); without the handler the message shows
  without one, which is right for a table that refetches instead.
  `formatEditError` words the failure.

  A newer save supersedes an older one, so a slow rejection can never mark a value
  the reader has already replaced. A host that saves synchronously pays nothing.

  Headless: `useCellSaveState`, `CellSaveStatus`, `FailedCellSave`; the editable-cell
  controller carries `saveStatus`, `saveFailure`, `canRollback`, `rollback` and
  `dismissFailure`. The unstyled and shadcn kits add `editCellSaveError` and
  `editCellRollback` class hooks.

- ac998d0: Batch editing: many rows, one write

  `batchEditing` + `onBatchEdit` turn every editable cell into a field and hold
  every change until the reader saves them all — the shape of a review pass, where
  someone walks a list correcting values and wants one write at the end rather than
  one per row.

  `onBatchEdit` is called once, with every pending row as `{ row, rowId, patch }`,
  which is what lets the whole batch be a single request. A bar appears as soon as
  something is pending — the count, Save all, Cancel all — and is a live region, so
  the count is heard as well as seen. Cancel restores everything, because nothing
  was ever applied.

  The count is rows, not cells, and a value typed back to what it was stops
  counting. Changed cells carry `data-changed`.

  Labels `pendingRows`, `saveAll` and `cancelAll` are translated in all seventeen
  locales. Headless: `useBatchEditing`, with `BatchEditCell` and `BatchEditBar`
  from `@adapttable/core/adapter`.

- ec12556: Boolean filter type

  A tri-state any / true / false widget — never a checkbox — with chips and
  `f_<key>=true|false` URL serialization.

- 9d334bd: `useQuerySource` pages by cursor. Declare `supports: { cursor: true }` and say
  where the token lives with `nextCursor: (page) => page.next`, and the table sends
  `cursor` alongside the params your query function already receives — the same two
  options `useServerData` takes, so the choice of tier no longer decides whether
  cursor pagination is available.

  Tokens are kept as a trail, so paging back replays the user's own cursors; a
  change to the search, sort, filters or page size resets it, because every held
  token points into a result that no longer exists.

- c2ea3ef: Excel-style checklist filter

  A `checklist` filter type lists distinct values with search, select-all,
  clear, and counts. Frontend reads `allFilteredRows`; a server page that
  omits that list does not offer the widget. Labels land in all 17 locales.

- cdcb992: Size a column to its content

  Double-click a resize handle and the column takes the width of its widest
  rendered cell; the Columns menu's "Size columns to content" does every column at
  once.

  Measurement comes from the DOM rather than the data, because a cell rendering a
  badge, an avatar and a name has no width the data knows. It reads each cell's
  content width, so a column currently clipping its text is sized to fit it, and a
  column with nothing measurable on screen is left alone rather than collapsed.

  The result is an ordinary layout width: it persists, serializes to the URL and
  saved views, and a later drag overrides it. Every cell now carries
  `data-column-key`, which is also a stable hook for styling one column across any
  kit.

  Headless: `measureColumnWidth` and `autoSizeColumns`.

- 9239898: Collapsible multi-level column groups

  `column.group` accepts a path; `collapsibleColumnGroups` adds a toggle.
  A collapsed group keeps its first leaf. State is `collapsedGroups` and
  the URL `colGroupCollapse`.

- bd52b39: Column menu 2.0

  Search, bulk show/hide/unpin, per-column submenu (sort, pin, hide,
  auto-size, filter, reset one), and `lockPosition` / `lockVisibility` /
  `lockWidth` / `lockPin` that gray out the matching controls.

- 96c74d0: Column virtualization

  `virtualizeColumns` windows the horizontal axis: a 500-column table renders the
  two dozen columns a reader can see, plus a margin, with two spacer cells holding
  the rest open. In the benchmark suite that is **45x fewer DOM cells** — 11,001
  down to 243 — on the same table.

  Both axes compose off one scroll box. Pinned columns are never windowed out,
  since a pinned column is on screen by definition, and the spacers are logical,
  so a wide RTL table scrolls correctly. `aria-colindex` stays absolute, so a
  screen reader still hears "column 74 of 120".

  It needs a horizontal scroll container and renders every column until that
  container reports a width — an unmeasured table shows everything rather than
  guessing. Not available in the Ant Design adapter, which renders through antd's
  own `<Table>`.

  Headless: `useColumnWindow` and `ColumnSpacer` from `@adapttable/core/adapter`.

- c20c888: Bring your own cell editor

  `editor: { type: "custom", render }` puts any React component in the cell — an
  autocomplete, a rich-text field, a colour picker. The table keeps everything it
  already owned: double-click / Enter / F2 activates, focus returns to the cell
  afterwards, Enter commits, Escape cancels, Tab moves on, and validators gate the
  commit.

  What the component receives is `draft` and the calls that change it — `setDraft`,
  `commit` (for a picker, where choosing IS the gesture), `cancel`, `onKeyDown`,
  `onBlur`, and `focusRef` to point at what should take focus — plus `error`,
  `validating` and `errorId` so it can mark itself invalid. `parseValue` still
  turns the draft into whatever gets stored.

  Rendered by the gate, so it is the same component in all nine adapters.

  Headless: `CustomCellEditorRender`, `CustomCellEditorCtrl`, `isCustomEditor`, and
  `commit` / `cancel` on the editable-cell controller.

- 1c53d5c: Custom header and footer components

  `renderHeader` / `renderFooter` / `headerTooltip` / `headerActions` on a
  column, plus a `tableFooter` slot. Sort, resize and the menu stay on the
  cell; a custom caption receives a controller.

- 1819d00: Dirty marks on changes nobody has confirmed

  `dirtyIndicators` marks a changed cell with `data-dirty` until its value settles,
  and marks its row too so a long table can be scanned without hunting for the cell
  inside it.

  A mark clears when the save resolves, and stays when it fails — the value is
  still at risk until the reader undoes it or tries again. A rollback clears it,
  since the value it belonged to is gone. Nothing clears on a timer.

  Off by default: a mark is a claim about what the server has agreed to. A host
  that settles its own state another way can call `confirm`, `confirmRow` or
  `confirmAll` on `table.editing?.dirty`, which also carries a `count` for an
  "unsaved changes" line.

  Headless: `useDirtyCells`, `DirtyCellState`, and `rowIsDirty(editing, rowId)`
  from `@adapttable/core/adapter`.

- 2c97e75: Edit conflict handling under live updates

  A row that changes under an open editor is a conflict, not a discard.
  `onEditConflict` and `editConflictPolicy` (`keep` / `take` / `ask`, default
  `ask`) decide; `"ask"` surfaces Keep mine / Take theirs on the validation
  channel (`data-conflict`). `rowVersion` treats any version change as a
  conflict. The same notice appears on a mobile card.

- 71de77b: Editing lifecycle events

  `onEditStart`, `onEditCancel`, `onEditCommit`, `onValidationFail` and
  `onEditError` observe a cell, row or batch edit. They cannot change the
  outcome — a throw is swallowed — so analytics and toasts never rewind a
  commit. The shared payload is `EditEvent`: row, rowId, columnKey, value,
  previousValue, unit, and optional error. The same events fire on a mobile
  card. Headless: `useCellEditing` accepts `UseCellEditingOptions` for start
  and cancel.

- 4c2f4d2: Validation that gates a commit

  A column's `validate(value, row)` judges one value; the table's `validateRow(row)`
  judges the row an edit would produce and answers what no single cell can — an end
  date before its start, a total that must match its parts. Return a message to
  reject, a map of column key → message to mark individual cells, or nothing to
  allow it.

  A rejected value never reaches `onCellEdit`. The editor stays open holding what
  the reader typed, and the message is announced rather than only painted: Mantine
  and MUI show it in their own input's error slot, every other kit renders
  `data-adapttable-part="edit-cell-error"` with `role="alert"` and points the
  editor's `aria-describedby` at it. Escape clears it with the draft.

  Both levels may be async — "is this SKU real" is a request. The editor carries
  `aria-busy` while a check runs, and a newer draft supersedes an older check so a
  stale answer can never mark a value the reader has already changed. A column with
  no validator commits synchronously, exactly as before.

  Headless: `useEditValidation`, `CellValidator` / `RowValidator`,
  `resolveCommitValue`, and `editorValidationProps` / `editorBusyProps` from
  `@adapttable/core/adapter`. The unstyled and shadcn kits add an `editCellError`
  class hook.

- f06b849: Five more cell editors: boolean, date, datetime, time, multi-select

  `editor: "boolean"` renders a checkbox and commits `true` / `false` on the tick —
  a checkbox has one gesture, and a ticked box that changed nothing reads as a bug.
  `"date"`, `"datetime"` and `"time"` use the browser's own controls and commit the
  strings those controls hold (`"2026-08-13"`, `"2026-08-13T14:05"`, `"09:30"`); a
  column storing a `Date` seeds them from its local parts, because converting to an
  instant moves the day for most of the world. `{ type: "multi-select", options }`
  commits the array of chosen values and seeds itself from a stored array, so a
  host stores back exactly what it gave — an empty selection is `[]`, not `""`.

  Headless: `editorInputType`, `isBooleanEditor` / `isSelectEditor` /
  `isMultiSelectEditor`, `booleanDraft` / `isDraftChecked`, `formatMultiDraft` /
  `readMultiDraft`, and `NativeBooleanEditor` / `NativeMultiSelectEditor` with
  `commitBooleanDraft` / `multiDraftFromSelect` from `@adapttable/core/adapter`.

- 9ac9635: Full-width and separator rows via `extraRows`

  Host-injected slots splice into the body by `beforeRowId`. A separator is
  a rule; a full-width row is one spanning cell. Mobile cards keep the same
  slots. Nothing goes in the URL.

- 6e26b32: Facet counts exclude the facet's own filter

  Checklist counts describe what selecting a value would keep. Frontend
  computes them from `allSearchedRows`; a server that declares
  `supports.facets` returns the same map on the page.

- c14991d: Fill handle on the selection's corner

  Select cells with `cellNavigation` on and a small square appears on the bottom
  corner of the selection. Drag it and the values carry on — down, up or sideways
  — with the cells it would write highlighted before anything is committed. Two or
  more numbers a constant step apart continue the series; anything else repeats.
  Ctrl/Cmd+D fills the selection down from its top row and announces what it
  wrote.

  The edits arrive through `onCellEdit`, or `onCellFill` for the batch, so the
  handle appears as soon as a table can be edited and never when it cannot. All
  eight adapters, RTL included.

  Headless: `fillDirection`, `fillTargetRange`, `fillRangeEdits`,
  `cellFillHandler`, and `FillHandle` from `@adapttable/core/adapter`.

- 74a0544: AND/OR filter tree builder

  The filter panel now has a kit-agnostic builder — add condition, add
  group, AND/OR — over the versioned `ft` tree. Leaves show as chips;
  Clear all drops the tree. Labels land in all 17 locales.

- 9227de5: AND/OR filter tree engine

  A versioned `ft` URL param holds a nested `{ combinator, conditions }`
  tree. The frontend predicate evaluates it; a server that declares
  `supports.filterTree` receives the same tree on the query. The builder
  UI is a follow-up.

- 5bdb072: Public filter type registry

  `filterTypes` registers a custom type (widget, predicate, chips,
  serialization) or `registry.extend`s a built-in. Built-ins are the
  first consumers — no `switch (def.type)` remains in the engine.

- d3309cc: Find in table

  `findInTable` puts a find bar over the table on Ctrl/Cmd+F. It leaves every row
  where it is and walks the cells whose text contains the query — Enter forward,
  Shift+Enter back, Escape to close — marking each hit and taking focus to the one
  you are on, so the cell is scrolled into view, announced and selected.

  Matching reads what a cell shows, so a formatted date is found by its formatted
  text, and only the loaded rows are searched: a hit the table cannot take you to
  would be a lie. Hits are painted in the amber browsers use for their own find,
  overridable through `--adapttable-find-match` (or the `cellMatch` /
  `cellMatchCurrent` class hooks in `@adapttable/unstyled`, which the shadcn preset
  fills in).

  Every word is localizable in all seventeen locales. Headless: `findMatches`,
  `useFindInTable` and `FindBar` from `@adapttable/core/adapter`.

- b166133: Flex columns, bounds, and filling the container

  A column now takes `minWidth`, `maxWidth` and `flex` beside its `width`.
  `fitColumns` makes the columns share the container instead of overflowing it:
  columns with a width keep it, columns with a flex take that share, and the rest
  divide what remains — with a width the user dragged winning over all of it.

  Underneath is CSS the browser already knows — a fixed table layout with
  percentage widths — so nothing measures or reflows in JavaScript. The Ant Design
  adapter renders through antd's own `<Table>`, which sets its own layout mode;
  the per-column widths, bounds and shares still apply there.

  Headless: `columnFlexShares`, `columnSizeStyle` and `fittedTableStyle`.

- 62a788e: Control which groups are open, and keep it in a link

  `useGroupCollapseUrlState` puts the collapsed groups in the URL, so a shared
  link carries which groups were folded — part of what someone means when they
  send one. Keys are percent-encoded, so a label containing a comma cannot split
  the list, and the parameter disappears when everything is open again.

  The table's grouping bundle gains `expandAll()`, `collapseAll()` and
  `collapseToDepth(depth)` for a host's own buttons: depth `0` leaves only the
  outermost headers showing, `1` opens the first level inside them.

  The controlled pair remains `collapsedGroupIds` / `onCollapsedGroupIdsChange`,
  which now works unchanged through nested groups because each key carries the
  group's whole path.

- 51deb4b: Group footers

  `groupFooters` closes every group with a row carrying the same aggregates its
  header carries, so the totals read at the bottom of a long group as well as the
  top. A footer shows no chevron and no checkbox — the header owns both — nested
  groups each get their own innermost first, and a collapsed group shows none at
  all.

  `summaryRow` remains the grand total and, under grouping, totals the whole
  filtered set. On mobile the footer is a card of its own; exports are untouched,
  since a footer is chrome rather than a row.

  Captioned through `labels.groupTotal` in all seventeen locales, with
  `group-footer-row` / `group-footer-cell` parts and matching class hooks in
  `@adapttable/unstyled`.

- 9f9ed08: Page the groups, and the rows inside them

  `groupPageSize` shows a screenful of top-level groups and offers the rest;
  `groupRowPageSize` does the same for the rows inside each group. Each limit adds
  one row — "Show 42 more groups", "Show 8 more in this group" — that reveals the
  next page when clicked.

  Only the top level pages: a nested level is already inside a group the reader
  opened. On a server tier, where the rest of a group is not in the browser yet,
  `onGroupLoadMore(groupKey)` fires with the group that needs filling.

  Localized in all seventeen locales, with `group-more-row` / `group-more-cell` /
  `group-more` parts and `groupMoreRow` / `groupMoreCell` class hooks in
  `@adapttable/unstyled`.

- daaa7c0: Order and filter groups

  `groupSort` orders groups within their parent — `"label"`, `"label-desc"`,
  `"count"`, `"count-desc"`, or a comparator over `{ value, label, level,
groupBy, leafRows }`. To sort by an aggregate, compare the leaves the aggregate
  is computed from; comparing rendered aggregate cells would mean comparing
  ReactNodes, which is not an ordering.

  `groupFilter` keeps only the groups it answers true for, at every level, and a
  dropped group takes its leaves with it — so the counts and totals that remain
  describe what is on screen.

  Both apply to every level of a nested group. The pipeline is documented: row
  filters, then grouping, then `groupFilter`, then `groupSort`, with leaf order
  inside a group always the source's own.

- d256fe7: Header filter row

  `headerFilters` adds a compact per-column filter row under the header,
  bound to the same defs and extra bag as the panel. Desktop only; mobile
  cards keep the Filters button. Labels land in all 17 locales.

- 428e1ce: Tree children fetched when a branch is opened

  `hasChildren(row)` draws a chevron on a node whose children the browser has not
  fetched, and `onLoadChildren(row)` fills it when the reader opens it. The node
  opens immediately and shows it is working — `data-loading` and `aria-busy` on its
  chevron — so nobody is left clicking a control that appears to do nothing. One
  request per node however many times it is clicked; a rejection clears the flag
  and leaves the node closed and clickable, so the retry is the same gesture.

  Headless: `useLazyChildren`; the table's tree bundle carries `loadingIds` and
  `failedIds`.

- 61d20c9: Nested row grouping

  `groupBy` takes an ordered list — `groupBy={["team", "status"]}` — and each key
  nests inside the one before it. Every header describes its whole subtree: the
  count beside a team is all of its people, and `groupAggregates` totals the same
  set. Deeper levels indent by logical padding, so nesting mirrors in RTL.

  Each node collapses on its own, because a node's key carries its whole path:
  "Core > blocked" and "Platform > blocked" are different groups, and closing a
  parent hides its subtree in one step.

  The keys travel as one comma-separated value (`?groupBy=team,status`), so links
  and saved views built for a single key keep working; `onGroupByChange` now
  reports the keys as a list.

  Headless: `parseGroupBy`, `formatGroupBy`, and `groupIndentStyle` from
  `@adapttable/core/adapter`.

- a28a2de: A real table under a row

  `nestedTable` puts the same component the page uses inside a row's detail panel,
  instead of the blank slot `renderRowDetail` hands over: name the nested table
  after the row and mount the kit's own `<DataTable>` with the defaults given.

  ```tsx
  nestedTable={(row) => ({
    label: `Orders for ${row.name}`,
    table: (defaults) => (
      <DataTable {...defaults} data={row.orders} columns={orderColumns} rowKey={(o) => o.id} />
    ),
  })}
  ```

  Sorting, selection, keyboard navigation and accessibility come with it because it
  is the whole table. The defaults are the ones a table inside a row cannot do
  without — `urlSync: false`, no second search box, the parent's density and
  labels. Rows that return `undefined` fall back to `renderRowDetail` when one is
  set, so master/detail and nested tables live in the same table.

  Headless: `nestedTableDefaults` and `nestedTableDetail` from
  `@adapttable/core/adapter`; the region carries
  `data-adapttable-part="nested-table"`.

- 5af9a99: Paste a spreadsheet into the table with Ctrl/Cmd+V

  With `cellNavigation` on, Ctrl/Cmd+V parses the tab-separated text Excel, Google
  Sheets, Numbers and LibreOffice write — quoted tabs and newlines intact — and
  commits it through `onCellEdit`, the same channel inline editing uses. A table
  that can be edited can now be pasted into with nothing extra wired. Set
  `onCellPaste` to take the batch whole instead, and `onCellCut` to receive what
  Ctrl/Cmd+X covered.

  The clipboard's shape decides the destination: a 3×2 block pasted into one
  focused cell writes 3×2. Cells landing outside the loaded rows or the rendered
  columns are dropped, columns that are not `editable` are skipped, and every
  value goes through the column's `parseValue`. The outcome is announced in all
  seventeen locales.

  Headless: `readClipboardText`, `parseClipboardTable`, `pasteRangeEdits` and
  `cellPasteHandler`.

- e990107: Range selection reaches the pointer and whole columns. Drag across cells to
  select a block; click a column header to select that column — Ctrl/Cmd+click
  where the header already sorts, so sorting keeps the click it has always had.
  A column selection covers the loaded rows only, never rows the browser has not
  seen.

  The selection is also spoken: `labels.gridRangeSelection` announces the
  rectangle's edges and size when it changes, translated in all seventeen locales,
  and stays quiet for a single cell.

- b050673: Relative date filter tokens

  Date filters gain a Relative operator that stores `today` / `last:7` / …
  in the URL — never a resolved calendar day — and resolves the window at
  query time.

- 69c2338: Rich filter operators per datatype

  Text, number and date filters are operator-first. The comparison is stored
  as `f_<key>Op` so it survives the URL and Saved Views. Existing links
  without an operator keep their old meaning.

- 4e19a68: Row editing: one commit for the whole row

  `rowEditing` + `onRowEdit` change the commit unit from a cell to a row. Every
  editable field of a row opens together, holds its draft, and reaches the host as
  ONE patch of only what changed — the right unit for a row whose fields constrain
  each other, which cannot be edited a cell at a time without passing through
  states that are invalid on the way.

  Each row grows an Edit control; Save hands over the patch, Cancel throws the
  drafts away, and Enter and Escape do the same from any field. An untouched row
  reports nothing. One row is open at a time. The same editors, the same
  `parseValue`, the same per-column `editable` predicate, and the same behaviour on
  a mobile card.

  `onCellEdit` is not required: a table that only wants row-level commits leaves it
  out, and its cells stay display-only until a row is opened.

  Labels `editRow` and `saveRow` are translated in all seventeen locales. Parts:
  `row-edit-begin`, `row-edit-actions`, `row-edit-save`, `row-edit-cancel`.

  Headless: `useRowEditing`, with `RowEditCell`, `RowEditActions` and
  `rowEditControls` from `@adapttable/core/adapter`. Every kit's editor now takes
  its focus ref from the controller (`ctrl.focusRef`), so the table decides which
  field takes focus.

- 9bccc0b: Add, duplicate and delete rows

  Three handlers, three controls. `onAddRow` puts an Add row button in the
  toolbar; `onDuplicateRow` and `onDeleteRow` put Duplicate row and Delete row on
  every row, after your own `rowActions` so a delete stays last. They ride the
  actions column like any other row action — hideable and end-pinnable from the
  Columns menu, buttons on desktop and card buttons on mobile.

  A delete asks first, through the same confirmation dialog a `rowActions` entry
  uses; `confirmDeleteRow={false}` skips it.

  The table stores nothing. A row you add arrives through the source like every
  other row, so it is editable, filterable, sortable, grouped, counted and
  virtualized from the moment it lands.

  Labels `addRow`, `duplicateRow`, `deleteRow` and `deleteRowConfirm` are
  translated in all seventeen locales. Headless: `useRowMutations`.

- 670b772: Row pinning via sticky top and bottom sections

  `pinnedRowIds` / `onPinnedRowIdsChange` take `{ top, bottom }` id lists.
  Pinned rows leave the virtual window and stick above or below the scroll
  box; column pins still apply. Grouping and trees refuse it with a
  `devWarn`. Mobile cards get the actions and no sticky chrome. The lists
  round-trip in the URL (`rowPin`) and in saved views.

- 5392ae4: Row reordering via a reserved drag-handle column

  `onRowReorder(from, to, row)` is the write — dataset-relative indices, never
  a mutate (`applyRowReorder` for in-memory hosts). Keyboard is a grab: Space
  lifts, arrows move, Space drops, Escape cancels, each step announced.
  Grouping and trees refuse it with a `devWarn`. Mobile cards get up/down
  buttons. The column hides and start-pins from the Columns menu
  (`REORDER_COLUMN_KEY`).

- 3c1699e: Row and column spanning via a per-row cell list

  `getCellSpan` and `column.colSpan` / `column.rowSpan` emit one cell list
  per row; covered cells are omitted. Arrow keys skip them, CSV writes the
  origin once. Mobile cards ignore geometry. Nothing goes in the URL.

- df87e16: Conditional row styling and heights via `rowStyle` and `rowHeight`

  A function of the row sets inline style; a number or function sets height
  and the virtualizer's `estimateSize`. Mobile cards keep the same hooks.
  Nothing goes in the URL.

- f0cf1c0: Selection statistics

  `selectionStats` puts a strip under the table saying what the selected cells
  add up to: count, sum, average, min and max. The count covers every selected
  cell and the arithmetic covers the numeric ones, so a rectangle spanning a name
  and a budget still has a sum. Numbers are read the way an export reads them, so
  the total on screen matches the total a spreadsheet computes from the same
  cells.

  A single cell shows nothing. The strip is a status region, so the figures are
  read after the range announcement, and every word is localizable in all
  seventeen locales. Number formatting follows the table's `locale`.

  Headless: `selectionStats` and `SelectionStatsBar` from
  `@adapttable/core/adapter`.

- 2ab6c3a: Grouping on the server

  A source that declares `supports: { grouping: true }` now receives the grouping
  keys with every query — as an array, outermost first — and, with
  `supports: { aggregates: true }`, the `aggregates` it was asked for. Return
  `groups` on the source and the table renders them exactly as it renders local
  groups: same headers, collapsing, footers and selection.

  The counts and aggregates displayed are the server's, so a group of 4,000 whose
  response carried 20 rows says 4,000. A server can send counts only and fill each
  group's rows in when it opens.

  The response shape and a reference endpoint are documented in
  [row grouping](https://adapttable.dev/docs/row-grouping). Headless:
  `serverGroupEntries`, `QueryGroupRow`, `QueryGroupsPage`, `groupLeafCount`.

- 774cd87: Server-side tree data

  `supports: { tree: true }` on `useServerData` / `useQuerySource` sends the ids
  the reader has open as `query.expandedIds`, so the response can return the
  visible rows of the hierarchy — the roots plus the children of every open node.
  The table assembles the tree from what arrived, so nothing about the row model
  changes between tiers.

  Gated like every other capability: without the declaration the field is never
  sent, and development says so once instead of letting a server quietly ignore it.

- 8f55d33: Ctrl/Cmd+C copies the selected cell rectangle as tab-separated text — the format
  Excel, Google Sheets, Numbers and LibreOffice read — so it pastes into columns
  rather than one cell. Ctrl/Cmd+X copies and then calls `onCut(range)`; the table
  clears nothing itself, because a cut that emptied cells before the clipboard
  accepted them would lose the data.

  Values resolve exactly as an export's do, so a copy and a downloaded file agree.
  The outcome is announced through `labels.gridRangeCopied` and
  `gridRangeCopyFailed`, translated in all seventeen locales — the Clipboard API
  needs a secure context and can be refused, and a copy that silently did nothing
  is the thing worth avoiding.

  `clipboardRangeText` and `writeClipboardText` are the headless halves.

- e43e87c: Sparkline chart columns

  `@adapttable/core/sparkline` draws bar, line and area charts as inline
  SVG. The base bundle does not import it. Export writes the numbers.

- bc1b903: Tree data — hierarchical rows in all nine adapters

  Pass `getChildren(row)` for nested data, or `getParentId(row)` for a flat list
  with a parent column, and the table renders the hierarchy: one chevron per
  parent, one indent step per level, in the first column or the one `treeColumn`
  names. `expandedIds` / `onExpandedIdsChange` hand the open set to the host.
  Without either prop the table is the flat list it always was.

  This is a separate model from `groupBy`, deliberately: a group is derived from
  values and regroups when the reader changes the question, a tree is declared by
  the data and holds its shape through a sort.

  Mobile cards keep the hierarchy — each card steps in by its depth and carries
  the same chevron. A tree windows through the same virtualizer a grouped model
  does, so 50,000 hierarchical rows render about 20 of them; the benchmark suite
  records the scenario.

  Headless: `buildTreeEntries`, `useTreeExpansion`, `filterTreeRows`,
  `treeColumnKey`, `treeIndentStyle`, `treeCardStyle`, `bodyRowEntries`, and
  `TreeCell` / `TreeToggle` from `@adapttable/core/adapter`. The unstyled and
  shadcn kits add `treeCell`, `treeToggle` and `treeSpacer` class hooks.

- 24a7199: Undo and redo for edits

  `editHistory` remembers edits so Ctrl/Cmd+Z can take them back, with
  Ctrl/Cmd+Shift+Z and Ctrl+Y to put them forward again. One gesture is one entry:
  a paste of two hundred cells undoes in a single press, as does a fill.

  An undo commits the previous value back through `onCellEdit`, the same call the
  original edit made, so validation, mutations and optimistic updates all run on
  the way back exactly as they ran on the way out — the table still never writes
  to data it does not own. Fifty gestures are kept by default; pass
  `{ depth: 200 }` for more, and `table.editHistory` exposes `undo`, `redo`,
  `canUndo`, `canRedo` and `clear` for your own buttons.

  Announced in all seventeen locales.

- 8cc2690: Row detail works under virtualization

  A table cannot nest a detail panel inside the row it belongs to, so the two are
  separate elements — and a window that measured the row alone reported 56px for
  something 300px tall, which is why `renderRowDetail` carried a "not recommended
  with `virtualize`" warning.

  The window now measures the pair. An open panel reports its real height, one
  that grows later corrects itself, and the warning is gone.

  Headless: `useRowPairMeasurer` from `@adapttable/core/adapter`.

### Patch Changes

- 424bdbc: A fill commits after the drag ends, not during a render

  The fill handle's release ran its commit inside a state updater, which React
  executes during render — it warned in development and ran the work twice under
  StrictMode. The release now reads where the drag reached and commits after it,
  so a fill writes its cells exactly once.

- b321249: Grouped rows carry their cells

  A grouped body renders `grouping.entries`, a list of its own — so its leaves now
  have body cells built for them, and a grouped table draws its rows whatever the
  window is showing.

## 2.2.0

### Minor Changes

- 6cdc2dd: A per-group subtotal now renders in its own column's cell, so it sits under the
  column it totals and inherits that column's alignment. It used to share one
  spanning cell with the group label and settle at the row's end — on a table wide
  enough to scroll, past the right edge of what the user could see.

  Mobile cards show the same numbers captioned by their column, since a card has
  no columns to align to.

  `groupRowLayout` and `groupAggregateEntries` place them, for a custom group
  header that should match.

- 5a6f7d9: Cell range selection. Hold Shift with any movement key, or shift-click a cell,
  and the selection extends from where it began; a plain move collapses it back to
  one cell.

  A range is two corners — the anchor where it started and the head where it
  reaches — not a list of cells. That is why Shift+Down twice then Shift+Up
  shrinks the range rather than starting a new one upward, and why a 50,000-cell
  selection costs two numbers.

  Selected cells carry `data-cell-selected` for styling, and `aria-selected` only
  once a real rectangle exists — marking every focused cell as selected would tell
  a screen reader the table is in selection mode when the user has merely arrowed
  around. `onRangeChange` reports every change and `gridFocus.range` holds the
  current rectangle.

- 007d9d9: Export scopes, per-column export values, and export lifecycle hooks.

  `exportCsv` now chooses its rows with `scope` (`"page"`, `"all"`, or
  `"selected"` — ticked rows are found across pages, not just the visible one)
  and its fields with `columns` (`"visible"`, `"all"`, or an explicit key list in
  file order).

  A column can give the file a different value than the screen through
  `exportValue`, so a cell reading `"$1,240.00"` exports the number a spreadsheet
  can actually sum.

  `onBeforeExport` runs once the rows and columns are resolved and before
  anything is written — return `false` to cancel or `{ filename }` to name the
  file from the data — and `onAfterExport` receives the text that was written.

  Defaults are unchanged: without any of these, the button produces exactly the
  file it did before.

- 453ba05: Cursor pagination on the server tier. Pass `nextCursor` from your API response
  and declare `supports: { cursor: true }`, and the table pages by token instead
  of offset — so rows inserted or deleted while someone reads never duplicate or
  skip an entry. Paging back replays the tokens already issued; a new sort,
  filter or search returns to the first page. Sources that do not declare the
  capability send no `cursor` and are unchanged.
- 4b0e572: `resolveMobileLabel` from `@adapttable/core/adapter` resolves a mobile card
  field's caption — an explicit `mobileLabel`, then a text `header`, then the
  column's key, with `mobileLabel: ""` meaning no caption at all. Every adapter's
  card layout now reads it from there, so a custom card can match them exactly.
- 33e249b: Keyboard cell navigation. Set `cellNavigation` and the table becomes one tab
  stop whose interior is reachable by arrow keys, Home/End, Ctrl+Home/End and
  PageUp/PageDown, with `role="grid"` and a live region announcing the column, the
  cell's text and the absolute position.

  The ARIA indices are dataset-absolute, so a virtualized table rendering 24 rows
  of 100,000 reports row 40,002 rather than row 3 of 24 — and Ctrl+End reaches a
  cell the virtualizer has not mounted by scrolling it into existence first.

  Edges stop rather than wrap, the arrows swap under RTL, and Enter/F2 open the
  editor through the existing editing gate. The position phrase is localizable via
  `labels.gridCellPosition` and ships translated in all seventeen locales.

  Off means absent: with the prop omitted there is no role change, no `tabIndex`,
  no key handler and no live region — asserted as byte-identical markup in every
  adapter.

- 58933b0: Row patches: `applyRowPatches` with `insertRow`, `updateRow`, `upsertRow` and
  `removeRow` apply changes to the rows you already hold, so a save or a pushed
  update does not need a refetch. Untouched rows keep their object identity, and
  a patch that changes nothing returns the very same array — so per-row memos
  stay valid, selection and expansion survive, and a no-op does not re-render.
- 4c5de79: Computed columns. `computed({ key, deps, value, format })` declares a derived
  column once and wires display, sorting, filtering and export from it — so a
  total rendered as `"$1,240.00"` still sorts and exports as `1240` instead of
  sorting as text. The value is cached per row and recomputed only when a
  declared dependency changes.
- b0681ed: Query cache keys: `tableQueryKey` and `tableQueryBaseKey` turn the emitted
  `TableQuery` into stable keys for TanStack Query or SWR. The base key covers
  which rows a view shows, the full key adds page and cursor, and the full key
  starts with the base one — so invalidating the base key refetches every page of
  a view and nothing else. Neither library becomes a dependency.
- 265a58f: The server query gains optional fields for grouping, aggregates, nested filter
  trees, facet counts and cursor pagination, and a `supports` option for
  declaring which of them an endpoint can answer.

  Declare nothing and nothing changes — the query arrives with exactly the fields
  it always has. Declare a capability and its field starts arriving; ask for one
  the source has not declared and the field is omitted rather than sent and
  ignored, with a development warning naming what would unlock it.

- fc6e9cf: The export button names the format it produces. With the spreadsheet writer it
  reads "Export XLSX", and a custom writer calling itself `tsv` gets "Export TSV" —
  from a new `labels.exportFile(format)`, translated in all seventeen locales.

  CSV is untouched: it still reads `labels.exportCsv`, so its existing
  translations, and any wording a host overrode, stand exactly as they were.

- 2e3a6ce: `ColumnDef.formatValue` and `columnText(column, row)` give a cell as plain text
  for the contexts that cannot render JSX — screen-reader announcements,
  `aria-label`, tooltips, the clipboard. `accessor` returns a `ReactNode`, so a
  badge or an avatar cell had no readable form at all.

  Text is always available: it resolves `formatValue` → `exportValue` →
  `sortValue` → `accessor` when that yields a primitive → the key's data path. A
  column that renders its own cell never falls back to the data path, because a
  column with `accessor: () => null` shows an empty cell and announcing its
  underlying value would name something the user cannot see.

- d3568ea: A host-handled export now shows each kit's own loading affordance instead of a
  greyed-out button — Mantine's, MUI's, Chakra's and Ant Design's loading buttons,
  Radix's and Base UI's spinners, and a styleable `exportSpinner` element in the
  unstyled and shadcn presets.

  The outcome is announced. A download is silent and a failed one is silent in the
  same way, so a polite live region beside the button reads `labels.exportDone` or
  `labels.exportFailed`, translated in all seventeen locales. `useExportHandler`
  also returns `exportStatus` — `"idle"`, `"busy"`, `"done"` or `"failed"` — for a
  toolbar that wants to show more.

- 108b6c4: Per-column `parseValue` turns an edited draft into the value committed to
  `onCellEdit`, so a currency column can display `"$1,240.00"`, seed its editor
  with `"1240"`, and commit the number `1240`. It receives the draft as typed
  plus the row, and replaces the editor's built-in parsing rather than layering
  on it. Columns without one behave exactly as before.
- 21c680f: Spreadsheet export and a range scope. `import { xlsxWriter } from
"@adapttable/core/xlsx"` and pass it as `exportCsv={{ writer: xlsxWriter() }}`
  to download a real `.xlsx`: numbers and booleans stay typed so a spreadsheet can
  sum them, text that looks numeric stays text so a postal code of `01730` is not
  `1730`, and no dependency is added. It is a separate entry point, so a table
  exporting CSV ships none of it.

  `scope: "range"` exports the highlighted cell rectangle from `cellNavigation`.
  The rectangle names its own columns, and with nothing selected the current page
  is exported instead.

  Every scope works with every format: rows and columns are resolved once, and a
  writer turns the result into bytes. `csvWriter`, `buildExportTable`,
  `matrixToCsv` and `downloadExportFile` are the pieces, `ExportWriter` the type
  to implement for a format of your own, and a backend `request` now receives
  `format` alongside the query.

- 8507bba: Server-side export. `exportCsv.request` hands the user's current view — search,
  filters, sort, paging and the chosen scope — to your backend instead of
  building the file in the browser, which stops being viable once the rows no
  longer fit in a tab. Return a promise and the Export button disables itself
  with `aria-busy` until it settles, so the same export cannot be started twice.

  Also fixes `scope: "selected"` and `columns: "all"` in the Ant Design and
  unstyled adapters, which built their export handler without the table's
  selection and so silently fell back to the current page.

- 65a8949: `aggregate()` builds a `summaryRow` or `groupAggregates` mapper from a
  declaration instead of a hand-written function: `aggregate({ budget: "sum" })`.
  Built in are `sum`, `avg`, `count`, `min` and `max`, and any function of your
  own is accepted for the rest.

  Values resolve through a column's `sortValue` when columns are passed, so a
  formatted cell still aggregates on its underlying number. Missing values are
  skipped rather than counted as zero, and while a sum of nothing is `0`, an
  average of nothing is `undefined`.

  The mapper props are unchanged and still take a plain function.

## 2.1.2

### Patch Changes

- f121a41: `urlSync={false}` now really stops URL writes, and a lone table no longer warns
  about itself.

  `useResolvedAdapter` resolved an explicitly passed adapter before it checked
  whether the hook was syncing, so `enabled: false` was ignored whenever a caller
  supplied an adapter. Two things followed:

  - A hook told not to sync still wrote through the caller's adapter — with a
    router adapter that meant `urlSync={false}` state landing in the real address
    bar.
  - A table mounts both data tiers on one adapter and disables the inactive one.
    Both tiers therefore claimed the same URL namespace, and every single table
    logged the duplicate-namespace warning about itself. No prop could silence
    it: `urlKey` renamed both sides equally, and the warning that exists to report
    a real two-table collision could not be told apart from the false positive.

  `enabled` is now checked first and beats an explicit adapter, so a disabled hook
  always resolves to its own memory store. The genuine collision — two syncing
  tables sharing a namespace — still warns.

  The table shells that pre-resolve a URL backend no longer forward `urlSync` to
  the tier hooks as well: the choice is already expressed by which adapter they
  resolved, and applying it twice would route the active tier to a private store
  that the saved-views menu could not read.

## 2.1.1

### Patch Changes

- 6934219: The automatic mobile card layout leads each package's Features list, with
  links to the live mobile demo and the responsive-table guide. Docs only —
  no runtime changes.

## 2.1.0

### Minor Changes

- 4b4baa5: The saved-views menu behaves the same in every adapter.

  Two behaviours were split across kits and are now uniform: **applying a view
  closes the panel** (mantine, chakra, radix and base-ui kept it open), and the
  panel no longer repeats the trigger's "Saved views" label as an inner title
  (those same four printed it twice). Saving still clears the field and keeps
  the panel open, so several views can be captured in one sitting. chakra, radix
  and base-ui move to controlled popovers, which is what let their panels ignore
  the close.

  `@adapttable/unstyled` adds `viewsRow` and `viewsSaveRow` class hooks with
  matching `data-adapttable-part` names — its two panel rows carried neither, so
  their spacing could not be styled at all — plus a structural gap so they are
  not flush with no classes set. In the `@adapttable/shadcn` preset the name
  field now takes the row's free space, so the save button no longer overflows
  the panel.

- 4b4baa5: The toolbar reads **Filters · Saved views · Columns · Export CSV** in every
  adapter.

  `ToolbarChromeProps` gains a `savedViewsMenu` slot beside `columnMenu`, so the
  menu has one named place to mount. Previously core offered no slot for it and
  each adapter improvised: four declared the same local prop, mantine passed it
  inside the `columnMenu` slot, and mui injected it into the caller's `toolbar` —
  so a custom `toolbar` no longer has the saved-views node mixed into it.

  The button moves for antd, mui, mantine and the unstyled/shadcn pair. An
  order test now runs in each adapter.

## 2.0.0

### Major Changes

- 7382e6a: AdaptTable 2.0.0 — a truth-and-consistency major. Every documented behavior
  now works as written, the same word means the same thing across all eight
  adapters, and the silent traps became loud. Full guide:
  [Migrating from v1](https://orwa-mahmoud.github.io/adapttable/migrate-from-v1/).

  ### BREAKING CHANGES
  - **v1 names are removed, not aliased** — the compiler surfaces every rename:

    | v1                                         | v2                                                |
    | ------------------------------------------ | ------------------------------------------------- |
    | `useBackendData` / `UseBackendDataOptions` | `useQuerySource` / `UseQuerySourceOptions`        |
    | `enabled` / `adapter` (URL hooks)          | `urlSync` / `urlAdapter`                          |
    | `defaultLayout`                            | `defaultColumnLayout`                             |
    | `selected` / `onChange` (`useSelection`)   | `selectedIds` / `onSelectionChange`               |
    | `collapsedIds` / `onCollapsedIdsChange`    | `collapsedGroupIds` / `onCollapsedGroupIdsChange` |
    | `customToolbar`                            | `toolbar`                                         |
    | `PaginatedResponse.items` / `.hasNext`     | `.rows` / `.hasNextPage`                          |
    | `SortState`                                | `SortLevel`                                       |
    | `hideSearch`                               | `searchable` (positive polarity, default `true`)  |
    | `isMobile` prop                            | `forceMobile`                                     |
    | `labels.applyFilters`                      | `labels.filtersDone`                              |
    | Chakra `colorScheme`                       | `accentColor`                                     |
    | `SavedViewsMenuLabels`                     | `SavedViewsLabels`                                |
    | `classNames.rowsPerPageSelect`             | `classNames.rowsPerPage`                          |
    | `classNames.pageButton`                    | `pagePrev` / `pageNext` / `pageNumber`            |
    | antd `virtualHeight` / `virtualWidth`      | removed — bound the scroller with `maxHeight`     |
    | `PageSelector` returning `{ items }`       | `{ rows }`                                        |
    | `GroupCollapseState.collapsedIds`          | `collapsedGroupIds`                               |
    | `useDataTable` option `isMobile`           | `forceMobile`                                     |
    | unstyled `emptyState` / `loadingState`     | `slots.empty` / `slots.skeleton`                  |

    ```tsx
    // before (v1)
    const source = useBackendData({ usePaginatedQuery, enabled: false });
    <DataTable source={source} hideSearch isMobile customToolbar={<Extra />} />;

    // after (v2)
    const source = useQuerySource({ usePaginatedQuery, urlSync: false });
    <DataTable
      source={source}
      searchable={false}
      forceMobile
      toolbar={<Extra />}
    />;
    ```

  - **One source-flag contract.** `isLoading` is
    first-load only; `isFetching` is any in-flight request;
    `hasNextPage` / `fetchNextPage` are infinite-append only; `refetch`
    really re-runs. The `onQueryChange` tier now **appends** on
    `fetchNextPage` instead of replacing the page, and resolves
    `paginationMode: "auto"` like the other tiers (mobile becomes infinite
    cards — pass `paginationMode="paged"` for the v1 behavior).

    ```tsx
    // before (v1): mobile server tables stayed paged, fetchNextPage replaced rows
    <DataTable data={rows} total={total} onQueryChange={load} />
    // after (v2): auto resolves to infinite cards on mobile; append accumulates
    <DataTable data={rows} total={total} onQueryChange={load} paginationMode="paged" />
    ```

  - **`onGroupByChange` / `onClearFilters` are observers.** The table always
    performs the change itself, then notifies; take full control via
    `source.setGroupBy` / `source.clearExtras`.
  - **Query params are namespaced.** Filter values reach query hooks under
    `params.filters` instead of spread at the top level, and `baseParams`
    never override live state.
  - **Grouped tables render the full filtered set** — footer count,
    select-all scope and page-scope CSV all describe what is on screen; the
    rows-per-page control hides while grouped.
  - **`defaultConfirm` fails safe**: with no dialog available (SSR,
    webviews) destructive actions are now DENIED instead of auto-approved.
  - **CSV export neutralises formula-prefixed cells by default**
    (`escapeFormulas: false` opts out) and always exports the full
    exportable column set regardless of viewport.
  - **An explicit `hideOnMobile: true` always wins** over the mobile
    identity anchor.
  - **Peer floors are truthful**: Chakra `^3.13`, MUI `^6`, Mantine `^7.2`,
    antd `^6`, Radix Themes `^3` — and React 18 works again (v1.2
    accidentally required 19.2; CI now proves 18.3 / 19.0 / 19.2).
  - **~30 internal plumbing exports were removed from `@adapttable/core`**
    (editing/grouping keyboard micro-steps, internal constants, layout math
    helpers). Everything the adapters use remains public and documented.
  - **The adapter-builder tier ships from `@adapttable/core/adapter`.**
    `useDataTableShell`, the render prelude, chrome prop bundles, pinning
    and pager math, keyed virtualization and the inline icons moved to the
    new entry point; `@adapttable/core` keeps the app-facing API. Same
    package, same semver promise — update imports if you consumed these.

  ### Features
  - Explicit `mode` prop: `mode="server"` requires `onQueryChange` at
    compile time; `mode="frontend"` makes it a pure notification.
  - `defaults`, `searchDebounceMs`, `paginationMode` and `error` are real
    component props on every batteries-included `<DataTable>`.
  - The headless tier renders real tables: `useDataTable` resolves bare-key
    columns, `getRowKey` / `getCellContent` cover keys and cell rendering
    without casts, and `getRowProps` is spread-clean.
  - Styling surface is 1:1 — all 127 `classNames` keys map to rendered
    `data-adapttable-part` attributes (enforced by tests); the shadcn preset
    styles every part; MUI and antd gained structural `classNames`.
  - Accessibility: value-named editable cells, focus-restoring menus and
    drawers, roving tab stops on clickable rows, keyboard multi-sort on
    antd, live-region bulk announcements, `aria-current` pagers.
  - i18n: one locale-resolution algorithm for labels and per-column `i18n`
    paths (`ar_EG` ≡ `AR-eg`), count-aware plurals, `labels.removeFilter`,
    script-based RTL list.
  - Packaging: `"use client"` banners in every hook-bearing build, LICENSE
    in every tarball, CLI CJS entry, `adapttable init` usage text on bare
    invocation.
  - The docs now cover the complete export surface of all eleven packages,
    and a gate script keeps it that way.

  ### Fixes
  - Server-tier infinite scroll no longer double-renders rows delivered
    during an in-flight window.
  - `clearAll` clears the multi-sort chain.
  - Persisted column layout and saved views hydrate after mount — no SSR
    hydration mismatch; blocked storage is tolerated.
  - `virtualize` on a paged desktop table dev-warns instead of silently
    doing nothing; `editable` without `onCellEdit` dev-warns too.
  - Plural forms corrected in es / it / pt / he / ru / ur locales; Hausa
    removed from and Assyrian Neo-Aramaic, Western Punjabi and South
    Azerbaijani added to the RTL list.

## 2.0.0-rc.0

### Major Changes

- 7382e6a: AdaptTable 2.0.0 — a truth-and-consistency major. Every documented behavior
  now works as written, the same word means the same thing across all eight
  adapters, and the silent traps became loud. Full guide:
  [Migrating from v1](https://orwa-mahmoud.github.io/adapttable/migrate-from-v1/).

  ### BREAKING CHANGES
  - **v1 names are removed, not aliased** — the compiler surfaces every rename:

    | v1                                         | v2                                                |
    | ------------------------------------------ | ------------------------------------------------- |
    | `useBackendData` / `UseBackendDataOptions` | `useQuerySource` / `UseQuerySourceOptions`        |
    | `enabled` / `adapter` (URL hooks)          | `urlSync` / `urlAdapter`                          |
    | `defaultLayout`                            | `defaultColumnLayout`                             |
    | `selected` / `onChange` (`useSelection`)   | `selectedIds` / `onSelectionChange`               |
    | `collapsedIds` / `onCollapsedIdsChange`    | `collapsedGroupIds` / `onCollapsedGroupIdsChange` |
    | `customToolbar`                            | `toolbar`                                         |
    | `PaginatedResponse.items` / `.hasNext`     | `.rows` / `.hasNextPage`                          |
    | `SortState`                                | `SortLevel`                                       |
    | `hideSearch`                               | `searchable` (positive polarity, default `true`)  |
    | `isMobile` prop                            | `forceMobile`                                     |
    | `labels.applyFilters`                      | `labels.filtersDone`                              |
    | Chakra `colorScheme`                       | `accentColor`                                     |
    | `SavedViewsMenuLabels`                     | `SavedViewsLabels`                                |
    | `classNames.rowsPerPageSelect`             | `classNames.rowsPerPage`                          |
    | `classNames.pageButton`                    | `pagePrev` / `pageNext` / `pageNumber`            |
    | antd `virtualHeight` / `virtualWidth`      | removed — bound the scroller with `maxHeight`     |
    | `PageSelector` returning `{ items }`       | `{ rows }`                                        |
    | `GroupCollapseState.collapsedIds`          | `collapsedGroupIds`                               |
    | `useDataTable` option `isMobile`           | `forceMobile`                                     |
    | unstyled `emptyState` / `loadingState`     | `slots.empty` / `slots.skeleton`                  |

    ```tsx
    // before (v1)
    const source = useBackendData({ usePaginatedQuery, enabled: false });
    <DataTable source={source} hideSearch isMobile customToolbar={<Extra />} />;

    // after (v2)
    const source = useQuerySource({ usePaginatedQuery, urlSync: false });
    <DataTable
      source={source}
      searchable={false}
      forceMobile
      toolbar={<Extra />}
    />;
    ```

  - **One source-flag contract.** `isLoading` is
    first-load only; `isFetching` is any in-flight request;
    `hasNextPage` / `fetchNextPage` are infinite-append only; `refetch`
    really re-runs. The `onQueryChange` tier now **appends** on
    `fetchNextPage` instead of replacing the page, and resolves
    `paginationMode: "auto"` like the other tiers (mobile becomes infinite
    cards — pass `paginationMode="paged"` for the v1 behavior).

    ```tsx
    // before (v1): mobile server tables stayed paged, fetchNextPage replaced rows
    <DataTable data={rows} total={total} onQueryChange={load} />
    // after (v2): auto resolves to infinite cards on mobile; append accumulates
    <DataTable data={rows} total={total} onQueryChange={load} paginationMode="paged" />
    ```

  - **`onGroupByChange` / `onClearFilters` are observers.** The table always
    performs the change itself, then notifies; take full control via
    `source.setGroupBy` / `source.clearExtras`.
  - **Query params are namespaced.** Filter values reach query hooks under
    `params.filters` instead of spread at the top level, and `baseParams`
    never override live state.
  - **Grouped tables render the full filtered set** — footer count,
    select-all scope and page-scope CSV all describe what is on screen; the
    rows-per-page control hides while grouped.
  - **`defaultConfirm` fails safe**: with no dialog available (SSR,
    webviews) destructive actions are now DENIED instead of auto-approved.
  - **CSV export neutralises formula-prefixed cells by default**
    (`escapeFormulas: false` opts out) and always exports the full
    exportable column set regardless of viewport.
  - **An explicit `hideOnMobile: true` always wins** over the mobile
    identity anchor.
  - **Peer floors are truthful**: Chakra `^3.13`, MUI `^6`, Mantine `^7.2`,
    antd `^6`, Radix Themes `^3` — and React 18 works again (v1.2
    accidentally required 19.2; CI now proves 18.3 / 19.0 / 19.2).
  - **~30 internal plumbing exports were removed from `@adapttable/core`**
    (editing/grouping keyboard micro-steps, internal constants, layout math
    helpers). Everything the adapters use remains public and documented.
  - **The adapter-builder tier ships from `@adapttable/core/adapter`.**
    `useDataTableShell`, the render prelude, chrome prop bundles, pinning
    and pager math, keyed virtualization and the inline icons moved to the
    new entry point; `@adapttable/core` keeps the app-facing API. Same
    package, same semver promise — update imports if you consumed these.

  ### Features
  - Explicit `mode` prop: `mode="server"` requires `onQueryChange` at
    compile time; `mode="frontend"` makes it a pure notification.
  - `defaults`, `searchDebounceMs`, `paginationMode` and `error` are real
    component props on every batteries-included `<DataTable>`.
  - The headless tier renders real tables: `useDataTable` resolves bare-key
    columns, `getRowKey` / `getCellContent` cover keys and cell rendering
    without casts, and `getRowProps` is spread-clean.
  - Styling surface is 1:1 — all 127 `classNames` keys map to rendered
    `data-adapttable-part` attributes (enforced by tests); the shadcn preset
    styles every part; MUI and antd gained structural `classNames`.
  - Accessibility: value-named editable cells, focus-restoring menus and
    drawers, roving tab stops on clickable rows, keyboard multi-sort on
    antd, live-region bulk announcements, `aria-current` pagers.
  - i18n: one locale-resolution algorithm for labels and per-column `i18n`
    paths (`ar_EG` ≡ `AR-eg`), count-aware plurals, `labels.removeFilter`,
    script-based RTL list.
  - Packaging: `"use client"` banners in every hook-bearing build, LICENSE
    in every tarball, CLI CJS entry, `adapttable init` usage text on bare
    invocation.
  - The docs now cover the complete export surface of all eleven packages,
    and a gate script keeps it that way.

  ### Fixes
  - Server-tier infinite scroll no longer double-renders rows delivered
    during an in-flight window.
  - `clearAll` clears the multi-sort chain.
  - Persisted column layout and saved views hydrate after mount — no SSR
    hydration mismatch; blocked storage is tolerated.
  - `virtualize` on a paged desktop table dev-warns instead of silently
    doing nothing; `editable` without `onCellEdit` dev-warns too.
  - Plural forms corrected in es / it / pt / he / ru / ur locales; Hausa
    removed from and Assyrian Neo-Aramaic, Western Punjabi and South
    Azerbaijani added to the RTL list.

## 1.2.3

### Patch Changes

- a7e51ba: Depend on sibling packages by caret range instead of an exact pin.

  Adapters declared `workspace:*`, which publishes as an exact version — `@adapttable/mantine@1.2.2` required precisely `@adapttable/core@1.2.2`. Installing an adapter alongside `@adapttable/core` therefore produced **two copies of core**:

  ```
  node_modules/@adapttable/core                                  1.2.2
  node_modules/@adapttable/mantine/node_modules/@adapttable/core 1.2.1
  ```

  Most of core is per-instance state, so a second copy is mainly waste — but the URL-namespace registry is module-level, so two copies means two registries, and two tables that do not set an explicit `urlKey` can claim the same namespace and overwrite each other's URL state.

  The exact pin also forced all eight adapters to republish on every core patch, even when nothing about them changed.

  `workspace:^` publishes as `^1.2.2`: the resolver keeps one copy, and a future core patch releases core alone. This release ships that range into every adapter, which is why all of them are included here — it is the last time a core change requires them.

- a7e51ba: Give these three package pages a Features section and a clip per feature.

  The eight adapters listed their features; `core`, `cli` and `i18n` listed none, so
  their npm pages described the packages without ever saying what they do. Each now
  carries a Features section written for what it actually is — the headless engine, the
  scaffolder, the locale sets — plus clips cut from the cross-kit tour (`core`, `cli`)
  and from the Arabic recording (`i18n`, where every feature is shown running RTL).

## 1.2.2

### Patch Changes

- feed13d: Fix the broken hero image on every npm package page, and add a clip per feature.

  npm renders README images through GitHub's camo proxy, which refuses anything
  over 5 MB. Every demo GIF was 5.2–8.7 MB, so camo returned `Content length
exceeded` and each package page showed a broken image instead of the table.

  The clips are now cut per feature — row grouping, cell editing, filtering,
  column management and RTL — cropped to the table at native resolution rather
  than downscaling the whole page. Each is 232 KB–2.3 MB, and each is sharper
  than the 8 MB version it replaces, because a shorter clip spends its budget on
  pixels instead of length.

## 1.2.1

### Patch Changes

- b535c41: Fix inline editing on grouped rows outside the current page slice. The editing
  guard validated the active cell against the page slice while the grouped body
  renders the full filtered set, so only each group's first rows accepted edits.
  The guard and Tab-advance now follow the rendered leaf set via the new
  `chrome.editingRows`.
- b77bcdc: Point each README's demo image at the live demo instead of a raw `.mp4` file,
  and deep-link it to that package's own adapter (`/demo/?kit=mui`,
  `?kit=radix`, …) now that the kit selector is URL-addressable. Clicking the
  image lands on a table you can actually use rather than a video download.
- a719db6: List inline cell editing and row grouping in each README's feature links. Both
  shipped in 1.2.0 but the package pages never mentioned them, so anyone reading
  on npm had no way to learn they exist.

## 1.2.0

### Minor Changes

- e36b3ee: Add an opt-in `exportCsv` toolbar button on every adapter. Exports the visible columns in display order for the current page (or the full filtered set with `scope: "all"`). New `exportCsv` label key in core defaults and all i18n locales.
- c402908: Add opt-in inline cell editing. Pass `onCellEdit` to enable; mark columns with `editable` / `editor` / `editValue`. Kit-native text, number, and select editors on every adapter (desktop + mobile). New `editCell` label in core defaults and all i18n locales. Without `onCellEdit`, editing stays fully dormant.
- 4546dcd: Add opt-in single-level row grouping. Pass `groupBy` to group by one column (frontend tier only; server sources devWarn and ignore). Optional `groupAggregates` shares the `summaryRow` mapper signature for per-group subtotals. Expand/collapse group headers on every adapter (desktop + mobile), with tri-state group selection when checkboxes are on. New `expandGroup`, `collapseGroup`, and `groupCount` labels in core defaults and all i18n locales. Without `groupBy`, grouping stays fully dormant.

## 1.1.2

### Patch Changes

- e909bf7: Use an animated GIF for the core tour on npm READMEs (click through to mp4), matching the adapter package demos.

## 1.1.1

## 1.1.0

### Minor Changes

- 6c7030b: Bring the whole adapter set to feature parity.

  - **Entrance animation on every adapter.** The opt-in `animate` mount stagger —
    a dependency-free row/card entrance that honours `prefers-reduced-motion` —
    now works on MUI, Chakra, Ant Design, Radix, shadcn/ui and unstyled, not just
    Mantine. `useMountStagger` moved into `@adapttable/core`; the existing
    `@adapttable/mantine` import path is unchanged.
  - **Ant Design mobile-card windowing.** antd already virtualized desktop rows
    through its native table; under `virtualize` its mobile card list now windows
    through the shared engine as well, like every other adapter.
  - **Popover keyboard a11y fix (MUI, Chakra, Ant Design).** Pressing Escape in
    the filter popover now hands focus back to the Filters trigger instead of
    stranding keyboard users, matching the Mantine/Radix/unstyled behaviour and
    the documented overlay contract.
  - Docs and README polish: the `ColumnDef` `filter` JSDoc is attached to the
    right field, and each package README gains a "Try in StackBlitz" link (with
    migration guides where a source library exists); the Chakra README now
    correctly targets v3.

## 1.0.0

### Major Changes

- a94745e: AdaptTable 1.0 — the public API is now stable under semantic versioning.

  This release freezes the committed-stable surface: the `@adapttable/core` engine
  (source builders, `useDataTable` and its prop-getters, the core types, and the
  URL-state hooks), every adapter's `<DataTable>` props and extension points
  (`slots`, `classNames`, `toolbar`, `confirm`), and the `@adapttable/i18n` locale
  presets. From this release on, breaking changes to that surface ship only in a
  major version. There are no runtime behavior changes — this marks the stability
  commitment. `@adapttable/cli` is a scaffolding tool and keeps its own cadence.

## 0.3.3

### Patch Changes

- 761be36: Internal de-duplication: hoist the logic the Chakra and Radix adapters shared
  verbatim into `@adapttable/core` — the `<DataTable>` orchestration
  (`useDataTableShell`), the auto-filter range-widget logic, and the sticky
  cell-style / row-memo helpers. Each adapter now renders only its own kit's
  controls over the shared state. No behaviour, markup, or public-API change for
  consumers; core stays headless (zero UI-kit imports).

## 0.3.2

### Patch Changes

- 682d3b7: Road-to-1.0 prep: document the versioning & stability contract, mark the
  `mergeProps`/`Props` prop-getter plumbing as `@internal` (consumers use the
  `useDataTable` prop-getters, not the merge helper), add a `smoke-dist`
  post-build check that asserts every advertised `exports`/`main`/`module`/`types`
  target is actually emitted, and harden `getPath`/`humanizeKey` to tolerate an
  empty/undefined key so a transiently-malformed column key can never crash a
  render. No behaviour changes; no breaking changes.

## 0.3.1

### Patch Changes

- 6ab1391: docs: every package README now leads with a click-to-play demo — a poster (with
  a play button) that links to an mp4 of the table in action — replacing the
  autoplaying GIF. Republishing so the new READMEs land on npm.

## 0.3.0

### Minor Changes

- a90a2c2: Logical column pinning, so pinning stays correct under RTL.

  **Breaking.** Pinned-side values are now `"start"` / `"end"` (were `"left"` /
  `"right"`) — this is the public `pinned` layout value and the `colPin` URL token
  (e.g. `colPin=name:start`); pre-existing `left`/`right` URLs no longer parse. The
  label keys `pinLeft` / `pinRight` / `moveLeft` / `moveRight` are renamed to
  `pinStart` / `pinEnd` / `moveStart` / `moveEnd`, with logical display strings
  shipped for every locale. Pinning a data column is now a start-only toggle; the
  injected actions column keeps its one-click end-pin.

  To migrate: update any `defaultColumnLayout={{ pinned: { x: "left" } }}` to
  `"start"` (and `"right"` → `"end"`), any persisted `colPin` URLs, and any custom
  `labels` overriding the renamed keys.

- a90a2c2: Numbered page buttons in every adapter's pagination (with first/last and
  ellipsis truncation), replacing the prev/next-only control — driven by a shared
  `paginationItems` builder in `@adapttable/core`.

## 0.2.2

### Patch Changes

- 0fe5eca: Ship the **React Compiler**. The published packages are now built with `babel-plugin-react-compiler` (target 18, **production build only** — not the test build), so components and hooks are auto-memoized for fewer wasted re-renders. Tests still run against un-compiled source, so coverage is unaffected; the compiled output adds `react-compiler-runtime` as a small runtime dependency.

## 0.2.1

### Patch Changes

- dd60cf0: docs: each package readme now links the docs site, live demo, and getting-started guide (top links + a Documentation section deep-linking each feature), the `homepage` field points at the docs site, and the root readme gains npm badges. Tailwind/shadcn is reframed as the unstyled adapter path rather than a batteries-included styled adapter.

## 0.2.0

### Minor Changes

- 83610ec: Support React 19 and the latest major of every UI kit.

  - **core / unstyled**: hook and chrome ref types follow React 19's
    `useRef<T>(null) → RefObject<T | null>` change, and the deprecated
    `MutableRefObject` is replaced with `RefObject`. The prop-getters
    (`getTableProps`, `getHeaderCellProps`, `getSortButtonProps`,
    `getCellProps`, `getSearchInputProps`) now return precise element-prop
    interfaces instead of a bare `Record<string, unknown>`, so adapters spread
    them without unsafe casts. React peer stays `^18 || ^19`.
  - **mantine**: adds `@mantine/core` / `@mantine/hooks` `^9` to the peer range
    (now `^7 || ^8 || ^9`); Mantine 9 requires React 19.
  - **mui**: adds `@mui/material` `^8 || ^9` to the peer range. System props
    that v7 removed from `Stack` / `Box` / `Typography` (`alignItems`, `py`,
    `fontWeight`, …) moved into `sx`, which is backward-compatible to v5.
  - **chakra**: rebuilt for Chakra UI **v3** — compound components
    (`Table.Root`, `Menu.Root`, `Popover.Root`, `Drawer.Root`, …),
    `ChakraProvider value={defaultSystem}`, and the v3 prop renames
    (`colorScheme → colorPalette`, `isOpen → open`, …). Peer is now
    `@chakra-ui/react@^3`; Chakra v2 is no longer supported.
  - **antd**: rebuilt for Ant Design **v6** — `Alert` `message → title`,
    `Drawer` `width → size`, `Popover` `styles.body → styles.content`, `Space`
    `direction → orientation`, `Tag` `bordered={false} → variant="filled"`, and
    the logical fixed-column class names. Peer is now `antd@^6`; Ant Design v5 is
    no longer supported.

## 0.1.1

### Patch Changes

- 4584081: Three fixes surfaced by the new demo pages:
  - **core**: in infinite mode, the window growing at the bottom (the
    sentinel incrementing the page) no longer triggers the scroll-to-top
    reset — only real paged navigation does. Reaching the end of a long
    virtualized list no longer teleports the reader back to the top.
  - **mantine**: `stickyHeader` now actually pins in page-scroll mode —
    Chromium cannot stick a `th` inside a `border-collapse: collapse`
    table (Mantine's default), so the sticky header switches the table to
    separate borders (visually identical).
  - **unstyled**: the chips clear-all button rendered as a bare `<li>` —
    an unstylable stray list bullet. It now carries the same `chip`
    part/class as its siblings, so consumer styling applies.

## 0.1.0

### Minor Changes

- 845ff41: Initial public release of AdaptTable — a headless, UI-agnostic React data
  table: one API, rendered natively by your design system.
  - `@adapttable/core`: the headless engine — declarative `columns` (bare
    keys, dot-paths, auto headers) and `filters` (one definition drives the
    widget, URL params, chips, and predicate, with `"auto"` and async option
    sources), three data tiers (in-memory, server via one consolidated
    `onQueryChange(query, { signal })`, or a full custom `TableSource`),
    URL-synced state with an injectable adapter (`urlSync={false}` for
    in-memory), multi-sort, summary rows, header groups, row expansion,
    saved views, select-all-N-matching, keyboard row navigation, and opt-in
    row/card virtualization that tracks the page or any `maxHeight` scroll
    box — 50,000 rows stay a handful of DOM nodes.
  - Batteries-included adapters for **Mantine**, **MUI**, **Chakra UI**,
    **Ant Design**, and **Tailwind/shadcn** (`@adapttable/unstyled`): native
    filter forms with operator-first number/date ranges, column management
    (hide / reorder / pin / resize — the row-actions column included), a
    built-in saved-views menu, mobile card layouts, and memoized rows.
  - `@adapttable/i18n`: label presets for ten locales (en, ar, de, es, fr,
    he, it, ja, pt, zh) with RTL helpers — headers, cells, sorting and
    filtering can all follow per-locale data paths.
  - `@adapttable/cli`: `npx @adapttable/cli init` detects your kit and
    scaffolds a working table.

  Highlights: shareable URL state, paging and true infinite scroll (auto by
  device), first-class RTL, seamless dark mode, 100% test coverage, and a
  full headless escape hatch at every layer.
