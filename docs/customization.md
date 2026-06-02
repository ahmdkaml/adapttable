# Customization

AdaptTable is designed as a spectrum: a beginner ships in five lines, a
power user controls every node. From least to most effort — all opt-in:

## 1. Props

`columns`, `source`, `searchPlaceholder`, `sortByOptions`, `rowActions`,
`bulkActions`, `filters`, `dir`, and more.

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
  }}
/>
```

## 4. Row & bulk actions

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

## 5. Prop-getters (fully headless)

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
