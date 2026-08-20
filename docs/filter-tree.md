# React table advanced filters — AND/OR filter tree

▶ **Try it live:** [Filtering in Mantine](https://orwa-mahmoud.github.io/adapttable/demo/mantine/filtering/)
— open Filters; Advanced is the first block in the popover. Switch the page
to Drawer, or to Header (column icons for one field, Filters for the tree).
[Other UI kits →](./getting-started.md#try-it-in-stackblitz)

The simple filter form is one control per field. When a reader needs
"(Team is Core **or** Platform) **and** Budget ≥ 20k", that is a tree:
nested AND/OR groups, one kit-native builder, one `ft=1.{…}` URL param.

It lives in the **same** Filters popover or drawer as the field list — at
the top, not under it. Header mode keeps a Filters button for the tree
because a column icon cannot express a group.

## Example

```tsx
import { DataTable } from "@adapttable/mantine"; // or mui, chakra, antd, radix, shadcn, unstyled

export function People({ rows }) {
  return (
    <DataTable
      data={rows}
      rowKey={(row) => row.id}
      columns={[
        { key: "name", filter: "text" },
        { key: "team", filter: { type: "select", options: "auto" } },
        { key: "budget", filter: "numberRange" },
      ]}
      filtersMode="popover"
      urlKey="f"
    />
  );
}
```

Pass `filterTreeFn` on `useFrontendData` (or `supports.filterTree` on a
server source) so the engine evaluates the tree. Each adapter's
`FilterTreeBuilder` mounts itself at the top of the Filters form when
`source.setFilterTree` is set; omit the setter and the builder is gone.

## How it works

- **Same chrome.** Popover and drawer are the field list's container. The
  builder is the first child of `data-adapttable-part="filters-form"`.
  Header icons filter one column; `toolbarShowsFilters` keeps the toolbar
  Filters button when the tree setter is on so Advanced is not trapped
  behind a column.
- **Model.** A `QueryFilterGroup` of `QueryCondition`s (`isFilterGroup`
  narrows a child). Combinators are `and` / `or`. Leaves name a field,
  an operator from that type's registry, and a value.
- **URL.** `ft=1.{…}` — versioned JSON. Unknown versions are dropped, never
  reinterpreted. Clear all drops `ft` with the flat `f_*` keys.
- **Chips.** Tree leaves become chips via `useFilterTreeChips`. Removing a
  chip rewrites that node; it does not flatten the group.
- **Server.** A source that declares `supports.filterTree` receives the
  same tree on `query.filterTree`. The server must apply it all-or-nothing
  — dropping one condition out of an AND would lie.

The field widgets, operators and chips are on [filtering](./filtering.md).
The URL codec is on [url-state](./url-state.md).
