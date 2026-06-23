# @adapttable/i18n

**[📖 Documentation](https://orwa-mahmoud.github.io/adapttable/)** · **[🚀 Live demo](https://orwa-mahmoud.github.io/adapttable/demo/)** · **[Get started](https://orwa-mahmoud.github.io/adapttable/getting-started/)**

Locale presets and **RTL** helpers for [AdaptTable](https://github.com/orwa-mahmoud/adapttable).
The core stays i18n-agnostic; this optional package gives you ready label
sets for **10 languages** — English, Arabic, German, Spanish, French,
Hebrew, Italian, Japanese, Portuguese, and Chinese — plus direction
utilities, so you get multilingual, right-to-left support for free.

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
      labels={getLabels(locale)} // primary subtag → preset; unknown → English
      dir={getDirection(locale)} // "ar" / "he" → "rtl"
    />
  );
}
```

## API

- `getLabels(locale)` — the label preset for a locale (matches the primary
  subtag, e.g. `"de-AT"` → German); falls back to English.
- `getDirection(locale)` → `"ltr" | "rtl"`.
- `isRtlLocale(locale)` / `primarySubtag(locale)` / `RTL_LANGUAGES`.
- Raw preset objects: `en`, `ar`, `de`, `es`, `fr`, `he`, `it`, `ja`, `pt`,
  `zh`. `locales` — the keyed map; `hasLocale(locale)` — membership check.

Bring your own languages by spreading a preset and overriding strings:

```ts
import { en } from "@adapttable/i18n";
const fr = { ...en, search: "Rechercher", noData: "Aucune donnée" };
```

## License

[MIT](../../LICENSE) © Orwa Mahmoud
