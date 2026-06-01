# @adapttable/i18n

Locale presets and **RTL** helpers for [AdaptTable](https://github.com/orwamahmoud/adapttable).
The core stays i18n-agnostic; this optional package gives you ready
English and Arabic label sets plus direction utilities so you get
bilingual, right-to-left support for free.

```bash
pnpm add @adapttable/i18n
```

## Usage

```tsx
import { DataTable, useFrontendData } from "@adapttable/mantine";
import { getLabels, getDirection } from "@adapttable/i18n";

function LocalizedTable({ locale }: { locale: string }) {
  const source = useFrontendData({ data, columns });
  return (
    <DataTable
      source={source}
      columns={columns}
      rowKey={(r) => r.id}
      labels={getLabels(locale)} // "ar" → Arabic, otherwise English
      dir={getDirection(locale)} // "ar" → "rtl"
    />
  );
}
```

## API

- `getLabels(locale)` — the label preset for a locale (matches the primary
  subtag, e.g. `"ar-EG"` → Arabic); falls back to English.
- `getDirection(locale)` → `"ltr" | "rtl"`.
- `isRtlLocale(locale)` / `primarySubtag(locale)` / `RTL_LANGUAGES`.
- `en`, `ar` — the raw preset objects. `locales` — the keyed map.

Bring your own languages by spreading a preset and overriding strings:

```ts
import { en } from "@adapttable/i18n";
const fr = { ...en, search: "Rechercher", noData: "Aucune donnée" };
```

## License

[MIT](../../LICENSE) © Orwa Mahmoud
