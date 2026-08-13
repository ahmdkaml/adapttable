---
"@adapttable/core": minor
---

A real table under a row

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
