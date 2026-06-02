import type { TableLabels } from "@adapttable/core";

import { primarySubtag } from "./direction";
import { ar } from "./locales/ar";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { he } from "./locales/he";
import { it } from "./locales/it";
import { ja } from "./locales/ja";
import { pt } from "./locales/pt";
import { zh } from "./locales/zh";

/** The bundled locale presets, keyed by primary language subtag. */
export const locales = {
  en,
  ar,
  de,
  es,
  fr,
  he,
  it,
  ja,
  pt,
  zh,
} as const;

/** A key of {@link locales}. */
export type LocaleKey = keyof typeof locales;

/** Whether a locale has a bundled preset. */
export function hasLocale(locale: string): boolean {
  return primarySubtag(locale) in locales;
}

/**
 * Resolve the label preset for a locale, matching on the primary subtag
 * (e.g. `"ar-EG"` → Arabic). Falls back to English for unknown locales.
 *
 * @param locale - A BCP-47 locale such as `"en"`, `"ar"`, or `"ar-EG"`.
 * @returns The matching {@link TableLabels} preset, or English.
 */
export function getLabels(locale: string): Required<TableLabels> {
  const key = primarySubtag(locale);
  return key in locales ? locales[key as LocaleKey] : en;
}
