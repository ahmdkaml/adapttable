/**
 * `@adapttable/i18n` — locale presets and RTL helpers for AdaptTable.
 *
 * Bundles ready English and Arabic label sets and direction utilities so
 * consumers get bilingual + right-to-left support without wiring an i18n
 * library. The core stays i18n-agnostic; this package is purely optional.
 *
 * @packageDocumentation
 */

export {
  type Direction,
  getDirection,
  isRtlLocale,
  primarySubtag,
  RTL_LANGUAGES,
} from "./direction";
export { getLabels, hasLocale, type LocaleKey, locales } from "./getLabels";
export { ar } from "./locales/ar";
export { en } from "./locales/en";
