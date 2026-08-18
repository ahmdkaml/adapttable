# Accessible React data table — keyboard, screen readers, labelled controls

▶ **See it working:** [use a Mantine table from the keyboard](https://orwa-mahmoud.github.io/adapttable/demo/mantine/accessibility/) — Tab in, arrow between cells, and read what a screen reader would hear. The same page exists for MUI, Chakra, antd, Radix, Base UI, shadcn and Tailwind.

An accessible data table is one a person can use without a mouse, and one a
screen reader can describe. AdaptTable ships that way. There is no
`accessible` prop to turn on.

**Related:** [Keyboard & cell navigation](./cell-navigation.md) ·
[i18n & RTL](./i18n-rtl.md) · [FAQ](./faq.md)

## What is on by default

Every table you render already:

- uses a real `<table>` with header and body cells
- names every control it draws (Filters, checkboxes, close, Done — not icon-only)
- marks sortable headers with `aria-sort`
- honours `prefers-reduced-motion` when rows animate in

Every adapter is audited with `axe` in CI, on desktop and mobile card layouts.

## Try it yourself

On the [accessibility demo](https://orwa-mahmoud.github.io/adapttable/demo/mantine/accessibility/):

1. Press **Tab** until a cell shows a focus ring.
2. Press the **arrow keys**. The ring moves cell to cell.
3. Read the **transcript**. Each move adds a line — column, value, row of how
   many — the same words a screen reader speaks.

If Tab never enters the table, arrows do nothing, or the transcript stays
empty, that page is failing.

## What this page is not

The optional spreadsheet grid — one Tab stop, arrow keys through every cell,
`role="grid"` — is a separate feature. See
[keyboard & cell navigation](./cell-navigation.md). Omit that prop and the
grid extras are absent; the default table above still stands.

## Notes

- Works in all eight adapters. The demo is the same walk on each kit.
- Labels you pass through `labels` are the accessible names, including in
  Arabic and the other [bundled locales](./i18n-rtl.md).
