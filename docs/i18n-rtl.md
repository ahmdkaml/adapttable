# i18n & RTL

AdaptTable is **i18n-agnostic at its core** — it never imports an i18n
library. Strings come in through a `labels` prop, so you can use your own
stack (i18next, react-intl, …) or the ready presets in `@adapttable/i18n`.

## Injecting labels

Every table accepts a partial `labels` object; missing keys fall back to the
English defaults.

```tsx
<DataTable
  source={source}
  columns={columns}
  rowKey={(r) => r.id}
  labels={{ search: "Buscar", noData: "Sin datos" }}
/>
```

## Ready presets (`@adapttable/i18n`)

Ten languages ship out of the box — **en, ar, de, es, fr, he, it, ja, pt,
zh** (Arabic and Hebrew are right-to-left). `getLabels` matches the primary
subtag (e.g. `"de-AT"` → German) and falls back to English.

```tsx
import { getLabels, getDirection } from "@adapttable/i18n";

<DataTable
  source={source}
  columns={columns}
  rowKey={(r) => r.id}
  labels={getLabels(locale)} // e.g. "de-AT" → German; unknown → English
  dir={getDirection(locale)} // "ar" / "he" → "rtl"
/>;
```

Need another language? Spread a preset and override the few strings you want:

```ts
import { en } from "@adapttable/i18n";
const sw = { ...en, search: "Tafuta", noData: "Hakuna data" };
```

## RTL (right-to-left / Arabic)

RTL is first-class. Pass `dir="rtl"` and the adapter applies it through its
direction provider and logical CSS, flipping layout, alignment, and the
filter drawer side automatically.

Helpers:

- `getDirection(locale)` → `"ltr" | "rtl"`
- `isRtlLocale(locale)` — covers ar, he, fa, ur, ps, and more
- `RTL_LANGUAGES` — the raw list

## Dark mode

The core is style-free, so dark mode is handled by each adapter's host
theming — Mantine/MUI/Chakra color schemes, or `data-theme` / CSS variables
for the unstyled adapter. Wrap your app in the kit's provider and AdaptTable
follows it (and `prefers-color-scheme`) seamlessly.
