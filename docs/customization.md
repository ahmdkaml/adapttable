# Customization

AdaptTable is designed as a spectrum: a beginner ships in five lines, a
power user controls every node. From least to most effort — all opt-in:

## 1. Props

`columns`, `source`, `searchPlaceholder`, `sortByOptions`, `rowActions`,
`bulkActions`, `filters`, `dir`, `virtualize`, `mobileIdentityColumns`,
`stickyTop`, and more.

## 2. Slots

Replace sub-parts with your own components (where the adapter supports it):

```tsx
<DataTable
  /* … */
  slots={{ empty: <MyEmptyState />, skeleton: <MySkeleton /> }}
/>
```

## 3. `classNames`

Restyle without replacing. The **unstyled** adapter exposes a `className`
hook for every part plus stable `data-adapttable-part` and `data-*` state
attributes:

```tsx
<DataTable
  classNames={{
    table: "w-full text-sm",
    row: "border-b hover:bg-zinc-50 data-[selected]:bg-blue-50",
    cell: "px-3 py-2",
    filtersBackdrop: "fixed inset-0 bg-black/40",
    filtersPanel: "fixed inset-y-0 end-0 w-96 bg-white shadow-xl",
    filtersDone: "rounded-md bg-zinc-900 text-white px-3 py-2",
  }}
/>
```

## 4. Filter panels

Filter panels are live by default: your filter controls call
`source.setExtra(...)` as the user changes them, and the drawer action simply
accepts the current state and closes the panel. If you prefer staged filters,
keep draft state in your filter component and commit it with `setExtras`.

## 5. Row & bulk actions

```tsx
const rowActions = [
  {
    key: "edit",
    label: "Edit",
    icon: <EditIcon />,
    onClick: (row) => edit(row),
  },
  {
    key: "delete",
    label: "Delete",
    color: "red",
    confirm: {
      title: "Delete?",
      message: (r) => `Delete ${r.name}?`,
      confirmLabel: "Delete",
      danger: true,
    },
    onClick: (row) => remove(row),
  },
];

const bulkActions = [
  {
    key: "archive",
    label: "Archive",
    disabledReason: (ids) => (ids.length > 100 ? "Too many" : undefined),
    onClick: (ids) => archive(ids),
  },
];
```

Confirmation is injectable via the `confirm` prop (defaults to
`window.confirm`); pass your own dialog handler for a styled experience.

Row actions can use `disabledReason(row)` when an action should be disabled
and explain why. Bulk actions have the same pattern for selected ids.

## 6. Virtualization and sticky polish

Virtualization is opt-in:

```tsx
<DataTable
  virtualize
  estimateRowSize={56}
  estimateCardSize={140}
  virtualOverscan={8}
/>
```

Mantine also supports sticky offset and scroll restoration knobs:

```tsx
<DataTable stickyTop={56} scrollToTopOnChange scrollTopGap={8} />
```

Consumers rendering their own markup can use the headless
`useTableVirtualization` and `useScrollToTableTop` hooks directly.

## 7. Column management

Let users show/hide, reorder, pin, and resize columns. All opt-in, all driven
from `@adapttable/core`, so every adapter gets them by passing a prop.

```tsx
<DataTable
  source={source}
  columns={columns}
  rowKey={(r) => r.id}
  enableColumnMenu // "Columns" menu: show/hide, drag- or keyboard-reorder, pin
  resizableColumns // drag or arrow-key resize handles on every header
  maxHeight={420} // scroll box so pinned columns stick while scrolling
  defaultColumnLayout={{ pinned: { name: "left" }, widths: { name: 220 } }}
/>
```

- **Show/hide, reorder, pin** live in the built-in menu (`enableColumnMenu`).
  Reorder by dragging a row or with the arrow keys on its grip. The pin
  control cycles **none → left → right → none**; pinning is logical
  (inline start/end), so a "left" pin sticks to the correct edge in RTL too.
- **Resize** (`resizableColumns`) adds a handle to each header — drag it, or
  focus it and press ←/→. It is direction-aware, so it widens the right way in
  RTL.
- **Pinning needs a horizontal scroll context** to visibly stick: set
  `maxHeight` (a scroll box that also scrolls sideways) or let the table exceed
  its container width.
- Start from a preset with `defaultColumnLayout` (uncontrolled), or drive it
  yourself with `columnLayout` + `onColumnLayoutChange` (controlled). The layout
  shape is `{ hidden, order, pinned, widths }`.

See [examples/mantine-columns.tsx](../examples/mantine-columns.tsx) for a full
example.

## 8. Prop-getters (fully headless)

Build the entire markup yourself with `@adapttable/core`:

```tsx
const t = useDataTable({ source, columns, rowKey });

<table {...t.getTableProps()}>
  <thead>
    <tr {...t.getHeaderRowProps()}>
      {t.columns.map((c) => (
        <th key={c.key} {...t.getHeaderCellProps(c)}>
          {c.sortable ? (
            <button {...t.getSortButtonProps(c)}>{c.header}</button>
          ) : (
            c.header
          )}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {t.rows.map((row, i) => (
      <tr {...t.getRowProps(row, i)}>
        {t.columns.map((c) => (
          <td key={c.key} {...t.getCellProps(c)}>
            {c.accessor?.(row)}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>;
```

Prop-getters merge your overrides: event handlers compose, `className`
strings concatenate, and `style` objects merge.

## Clickable rows

```tsx
<DataTable onRowClick={(row) => navigate(`/people/${row.id}`)} … />
```

Rows get the pointer cursor and Enter-key activation; clicks on row actions,
the selection checkbox, or links inside cells never trigger it.

## CSV export

```tsx
import { downloadCsv, rowsToCsv } from "@adapttable/core";

<DataTable
  toolbar={
    <Button onClick={() => downloadCsv("people.csv", rowsToCsv(rows, columns))}>
      Export CSV
    </Button>
  }
  …
/>;
```

Cells resolve via `accessor` (when primitive) → `sortValue`, so JSX cells
export their underlying value. Pass `getValue` for full control.

## Persisting column layout

- Shareable links: `useColumnLayoutUrlState({ urlKey })`.
- User preference: `useColumnLayoutStorageState({ storageKey })` —
  localStorage-backed, SSR-safe, cleared when the layout returns to the
  default.

```tsx
const { layout, onLayoutChange } = useColumnLayoutStorageState({
  storageKey: "people-columns",
});
<DataTable columnLayout={layout} onColumnLayoutChange={onLayoutChange} … />;
```

## Animations

Adapters can animate row/card entrance on mount. It is **opt-in**, honours
`prefers-reduced-motion`, and is dependency-free by default (no GSAP
required) — enable it with `animate` where supported (Mantine):

```tsx
<DataTable source={source} columns={columns} rowKey={(r) => r.id} animate />
```

### Bring your own animation (GSAP, Framer Motion, anything)

Every animatable row/card is tagged with a `data-stagger` attribute, so you
can drive the entrance with whatever library you prefer. Leave the built-in
off (`animate` defaults to `false`) and target the elements yourself:

```tsx
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { DataTable, useFrontendData } from "@adapttable/mantine";

function People({ data }) {
  const ref = useRef<HTMLDivElement>(null);
  const source = useFrontendData({ data, columns });

  useEffect(() => {
    const items = ref.current?.querySelectorAll("[data-stagger]");
    if (items?.length) {
      gsap.from(items, { opacity: 0, y: 8, duration: 0.32, stagger: 0.04 });
    }
  }, [source.rows]);

  return (
    <div ref={ref}>
      <DataTable source={source} columns={columns} rowKey={(r) => r.id} />
    </div>
  );
}
```

So the choice is yours: the built-in WAAPI stagger, your own GSAP/Framer
timeline via `data-stagger`, or no animation at all.

## Conditional row styling

```tsx
<DataTable
  rowClassName={(row) => (row.status === "overdue" ? "row-overdue" : undefined)}
/>
```

Applied to desktop rows and mobile cards alike, merged after the adapter's
own row classes.

## Controlled selection

Selection is uncontrolled by default — observe it with `onSelectionChange`.
To own it (preselect rows, sync to a store), pass `selectedIds` and apply the
change requests:

```tsx
const [ids, setIds] = useState<string[]>(["42"]);
<DataTable
  bulkActions={actions}
  selectedIds={ids}
  onSelectionChange={setIds}
/>;
```
