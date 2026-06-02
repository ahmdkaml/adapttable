/**
 * `@adapttable/i18n` — locale presets and RTL helpers for AdaptTable.
 *
 * Bundles ready label sets for 10 languages (English, Arabic, German,
 * Spanish, French, Hebrew, Italian, Japanese, Portuguese, Chinese) plus
 * direction utilities, so consumers get multilingual + right-to-left
 * support without wiring an i18n library. The core stays i18n-agnostic;
 * this package is purely optional.
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
export { de } from "./locales/de";
export { en } from "./locales/en";
export { es } from "./locales/es";
export { fr } from "./locales/fr";
export { he } from "./locales/he";
export { it } from "./locales/it";
export { ja } from "./locales/ja";
export { pt } from "./locales/pt";
export { zh } from "./locales/zh";
