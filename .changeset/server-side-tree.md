---
"@adapttable/core": minor
---

Server-side tree data

`supports: { tree: true }` on `useServerData` / `useQuerySource` sends the ids
the reader has open as `query.expandedIds`, so the response can return the
visible rows of the hierarchy — the roots plus the children of every open node.
The table assembles the tree from what arrived, so nothing about the row model
changes between tiers.

Gated like every other capability: without the declaration the field is never
sent, and development says so once instead of letting a server quietly ignore it.
