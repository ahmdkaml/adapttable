---
"@adapttable/core": minor
---

Control which groups are open, and keep it in a link

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
