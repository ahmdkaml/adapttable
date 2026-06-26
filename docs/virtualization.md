# Virtualization

<video src="https://orwa-mahmoud.github.io/adapttable/media/demo-scale.mp4" autoplay loop muted playsinline style="width:100%;border-radius:8px"></video>

Long lists can opt into row/card windowing with one prop: `virtualize`. Fifty
thousand rows render as a handful of DOM nodes, on the page or inside a
fixed-height box.

## Example

```tsx
import { DataTable } from "@adapttable/mantine"; // or @adapttable/mui, chakra, antd, shadcn, unstyled

interface Reading {
  id: string;
  sensor: string;
  value: number;
}

const data: Reading[] = Array.from({ length: 50_000 }, (_, i) => ({
  id: String(i + 1),
  sensor: `Sensor ${(i % 40) + 1}`,
  value: Math.round(Math.sin(i) * 1000) / 10,
}));

export function Readings() {
  return (
    <DataTable
      data={data}
      columns={[{ key: "sensor", sortable: true }, { key: "value" }]}
      rowKey={(r) => r.id}
      paginationMode="infinite"
      virtualize
      maxHeight={380}
      estimateRowSize={56}
      estimateCardSize={140}
    />
  );
}
```

## How it works

- `virtualize` is opt-in (default `false`) and applies in **infinite (non-paged)
  mode** — paged tables already cap the row count, so they never virtualize.
- **Window mode** (no `maxHeight`): the virtual window tracks the page scroll.
  Use `virtualScrollMargin` to offset it under sticky chrome (e.g. a sticky
  header above the table).
- **Element mode** (any `maxHeight` box): the same prop virtualizes inside the
  scroll box instead — the box is the scroller and the window tracks it.
- Rows/cards are measured after render; `estimateRowSize` (desktop rows) and
  `estimateCardSize` (mobile cards) seed the math, and `virtualOverscan` rows
  are rendered beyond the visible window to keep scrolling smooth.
- Inside a `maxHeight` box the page-level **Load more** button and
  infinite-scroll sentinel are suppressed: the box never grows, so the virtual
  window extends itself at the box's scroll end instead.
- Ant Design maps `virtualize` to antd's **native** virtual table mode on
  desktop; mobile cards there keep the shared sentinel.

## Options

| Prop                  | Type      | Default | Description                                                       |
| --------------------- | --------- | ------- | ----------------------------------------------------------------- |
| `virtualize`          | `boolean` | `false` | Window the rendered rows/cards on long infinite lists.            |
| `maxHeight`           | `number`  | —       | Fixed-height scroll box (px); switches to element-mode windowing. |
| `estimateRowSize`     | `number`  | `56`    | Desktop row-height estimate in px.                                |
| `estimateCardSize`    | `number`  | —       | Mobile card-height estimate in px.                                |
| `virtualOverscan`     | `number`  | `8`     | Extra rows/cards rendered before and after the visible window.    |
| `virtualScrollMargin` | `number`  | `0`     | Window-mode scroll offset, usually sticky chrome height.          |

## Notes

- Virtualization is optional — leave it off for small lists or paged tables.
- Combining `virtualize` with `renderRowDetail` is not recommended: desktop
  detail panels render as unmeasured sibling rows, so scroll heights can drift
  (a dev-mode warning says so). Prefer paged data with row details.
- The headless hook is exported as `useTableVirtualization` for custom markup;
  when disabled it returns every row with no spacers, so one render path
  serves both cases.

See it live in the [demo](https://orwa-mahmoud.github.io/adapttable/demo/).
