# Responsive React table — automatic mobile card layout

▶ **See it before you install:** [the live mobile demo](https://orwa-mahmoud.github.io/adapttable/demo/mobile/) — the same table flipped between desktop rows and phone cards with one toggle.

[![The same AdaptTable data table as phone cards — scrolling the card list, then switching to the desktop table](https://orwa-mahmoud.github.io/adapttable/media/features/mobile.gif)](https://orwa-mahmoud.github.io/adapttable/demo/mobile/)

Most React data tables answer the phone problem with a horizontal scrollbar.
AdaptTable answers it with a different layout: below the mobile breakpoint,
every row renders as a **card** — same columns, same filters, same search,
same selection, same URL state — and the switch happens by itself. There is
no second component to build, no `isMobile` plumbing, and nothing to
configure to get the default behavior.

```tsx
<DataTable data={rows} columns={columns} rowKey={(r) => r.id} />
```

That is already responsive. On a desktop viewport it renders the full table;
on a phone it renders the card list. Everything below is tuning.

## What changes on mobile — and what deliberately doesn't

| Surface                                                             | Desktop                           | Mobile                                              |
| ------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------- |
| Rows                                                                | `<table>` rows                    | Cards — one per row, labels from the column headers |
| Sorting                                                             | Clickable column headers          | A sort-by `<select>` (options via `sortByOptions`)  |
| Pagination                                                          | Pager (or infinite)               | `paginationMode="auto"` resolves to infinite scroll |
| Row actions                                                         | Trailing icon buttons             | Card buttons                                        |
| Long lists                                                          | Row virtualization (`virtualize`) | Card virtualization through the same prop           |
| Filters, chips, search, selection, bulk bar, saved views, URL state | identical                         | identical                                           |

The second half of that table is the point: behavior that took real work to
get right — declarative filters, select-across-pages, shareable URL state —
does not fork into a second code path on phones. One table, one state, two
layouts.

## Tuning the cards

- **`mobileLabel`** (per column) — the label a card shows for that field;
  falls back to the column's string `header`.
- **`hideOnMobile`** (per column) — drop a column from cards entirely.
- **`mobileIdentityColumns`** (default `3`) — how many leading desktop-visible
  columns the cards always keep.
- **`sortByOptions`** — the options offered by the mobile sort-by select.
- **`forceMobile`** — pin either layout regardless of viewport: cards inside a
  desktop dashboard panel, or the full table in a tablet kiosk. The
  [mobile demo](https://orwa-mahmoud.github.io/adapttable/demo/mobile/) uses
  exactly this prop for its toggle.
- **`rowClassName`** applies to desktop rows and mobile cards alike, and the
  [class-hook / `data-adapttable-part` surface](./customization.md) names the
  card regions (`cardDetail`, `group-card`, `summaryCard`) for styling.

## It composes with everything else

- **Grouping** renders group header blocks between cards, with the same
  collapse behavior as desktop — see [row grouping](./row-grouping.md).
- **Virtualization** windows the card list the same way it windows rows:
  one `virtualize` prop, measured in a real browser across every adapter —
  see [virtualization](./virtualization.md).
- **RTL** flips the cards along with everything else — see
  [i18n & RTL](./i18n-rtl.md).
- **Every adapter ships it**: Mantine, MUI, Chakra, Ant Design, Radix,
  Base UI, shadcn/ui and unstyled all render the card layout natively —
  the [comparison table](./comparison.md) tracks it as a built-in across
  the board.

## When you still want the table on phones

Set `forceMobile={false}` and the desktop layout renders everywhere —
sticky header, pinned columns and horizontal scrolling included. The cards
are the default because thumb-reach beats pinch-zoom for row-by-row work,
but the choice stays yours per table.

Related: [Getting started](./getting-started.md) ·
[API reference](./api.md) ·
[Live mobile demo](https://orwa-mahmoud.github.io/adapttable/demo/mobile/)
