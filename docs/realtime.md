# Realtime React data table — live row updates, websockets

▶ **See it working:** [watch rows patch in on the Mantine demo](https://orwa-mahmoud.github.io/adapttable/demo/mantine/realtime/) — budgets change while you read them; sort and selection hold. The same page exists for MUI, Chakra, antd, Radix, Base UI, shadcn and Tailwind.

A realtime table is one whose rows update as data arrives — a websocket, a
poll, another tab. AdaptTable does not open the socket. You do. When a change
lands, you patch the rows you already hold. There is no `realtime` prop.

**Related:** [Inline cell editing](./cell-editing.md) · [API](./api.md) ·
[Data tiers](./data-tiers.md)

## Apply a patch

`applyRowPatches` updates the array you pass as `data`. Untouched rows keep
their object identity, so React does not redraw the whole page, and scroll,
sort, filters and selection survive.

```tsx
import { DataTable } from "@adapttable/mantine";
import { applyRowPatches, updateRow } from "@adapttable/core";

export function People({ rows, columns, setRows }) {
  const byId = (row) => row.id;

  // Your socket / poll calls this when a row changes.
  const onMessage = (id, budget) =>
    setRows(applyRowPatches(rows, [updateRow(id, { budget })], byId));

  return <DataTable data={rows} columns={columns} rowKey={byId} />;
}
```

`insertRow`, `updateRow`, `upsertRow` and `removeRow` build the batch. A later
patch sees what an earlier one did.

## What this page is not

A websocket that changes the row **under an open editor** is a conflict, not
this page. That lives under [cell editing](./cell-editing.md#live-update-conflicts).

## Notes

- Works in all eight adapters. The demo is the same feed on each kit.
- The table never owns your data. A patch is a new array you hand back.
- [API reference](./api.md) lists `applyRowPatches`, `applyRowPatchesWithLog`
  and the patch shapes.
