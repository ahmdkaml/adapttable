import type { TableLabels } from "@adapttable/core";

import { primarySubtag } from "./direction";
import { ar } from "./locales/ar";
import { en } from "./locales/en";

/** The bundled locale presets, keyed by primary language subtag. */
export const locales = { en, ar } as const;

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
