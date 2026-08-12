# React table keyboard navigation — arrow keys, ARIA grid, screen readers

A table with a hundred cells should not be a hundred tab stops. Set
`cellNavigation` and the table becomes **one** tab stop whose interior is
reachable by arrow keys, with correct ARIA grid semantics and a screen reader
that says where you are.

**Related:** [Cell editing](./cell-editing.md) ·
[Virtualization](./virtualization.md) · [Columns](./columns.md) ·
[Accessibility in the FAQ](./faq.md)

## Example

```tsx
<DataTable
  data={people}
  columns={columns}
  rowKey={(row) => row.id}
  cellNavigation
/>
```

That is the whole opt-in. Omit it and nothing changes — see
[Off means absent](#off-means-absent).

## The keys

| Key                          | Where focus goes                                |
| ---------------------------- | ----------------------------------------------- |
| `↑` `↓` `←` `→`              | One cell, stopping at the edges                 |
| `Home` / `End`               | Start / end of the current row                  |
| `Ctrl`+`Home` / `Ctrl`+`End` | First / last cell of the whole grid             |
| `PageUp` / `PageDown`        | A viewport's worth of rows                      |
| `Enter` / `F2`               | Opens the editor, when the column is `editable` |
| `Tab`                        | Leaves the table — it is one stop, not hundreds |

Edges **stop rather than wrap.** Wrapping off the last column would move the
user to a different record without saying so; a table is not a spreadsheet.

Under `dir="rtl"` the left and right arrows swap, because arrow keys describe
the screen rather than the data — in a mirrored table the visually-next column
is the previous one. `Home` and `End` do not swap: they mean the start and end
of the row either way.

## What a screen reader hears

Focus alone announces a cell's contents, which is not navigation — "1,240" says
nothing about which column it belongs to or where it sits in a dataset whose end
you cannot see. So a live region announces the column, the cell's text, and the
absolute position:

> Budget, 1,240, row 40,002 of 100,000

The cell's text comes from [`columnText`](./columns.md), so a column whose cell
renders a badge or an avatar needs a `formatValue` to have anything readable.
The position phrase is localizable through `labels.gridCellPosition`, and ships
translated in all seventeen locales.

## Virtualization

This is where a naive implementation is wrong and looks right. With 24 rows of
100,000 rendered, `aria-rowindex` must number rows **within the dataset**, not
within the window — otherwise assistive technology reports "row 3 of 24" while
the user is at row 40,000. AdaptTable carries absolute `aria-rowindex` /
`aria-colindex` and dataset-wide `aria-rowcount` / `aria-colcount`.

`Ctrl`+`End` on a 100,000-row table also asks for a cell that is not in the DOM
at all. Focus scrolls it into existence and lands on it once it mounts.

## Mobile

Cell navigation applies to the **desktop table layout**. Mobile cards are a
list, not a grid: they keep list semantics, and arrow keys are not hijacked
there. This is deliberate — a card is one record's worth of stacked
label/value pairs, and a two-dimensional focus model does not describe it.

## Off means absent

With `cellNavigation` omitted there is no `role="grid"`, no `tabIndex`, no key
handler, no live region, and no extra attributes. Not "disabled" — absent. A
test asserts the rendered markup is byte-identical to a table built without the
prop at all, in every one of the eight adapters.

Focus position is also deliberately **not** saved to the URL or a Saved View.
Where the keyboard is sitting is ephemeral UI state, not part of a view someone
would share.

## Headless

| Export                                                    | Purpose                                                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `useGridFocus` / `UseGridFocusOptions` / `GridFocusState` | The hook, its options, and the state it returns (`getGridProps`, `getCellPropsAt`, `getRowPropsAt`, `focusCell`, `announcement`). |
| `GridFocusAnnouncer` / `GridFocusAnnouncerProps`          | The live region, from `@adapttable/core/adapter`. Renders nothing when navigation is off.                                         |
| `moveGridFocus` / `GridFocusMove` / `GridBounds`          | The pure move arithmetic and its vocabulary — no React, no DOM.                                                                   |
| `gridFocusMoveForKey` / `GridKeyPress`                    | Maps a key press to a move, applying the RTL swap.                                                                                |
| `GridCell` / `sameGridCell`                               | A cell address, and address equality.                                                                                             |
| `GRID_CELL_ATTR` / `gridCellAttr`                         | The `data-grid-cell` attribute focus uses to find a cell in the DOM.                                                              |

`getCellPropsAt(windowIndex, col)` and `getRowPropsAt(windowIndex)` take the
index an adapter already has — its position in the rendered rows — and convert
to the absolute address internally. That conversion lives in core precisely
because getting it wrong is invisible on screen.

## Notes

- Works in all eight adapters, verified by the same parity test in each.
- Enter and F2 are handled by the editing gate on the focused cell, so the two
  keyboard models never race for one key press.
- A click moves focus too: state follows the DOM rather than fighting it.
