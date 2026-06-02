/** Text direction. */
export type Direction = "ltr" | "rtl";

/**
 * Base language codes that render right-to-left. Matched against the
 * primary subtag of a BCP-47 locale (e.g. `"ar-EG"` → `"ar"`).
 */
export const RTL_LANGUAGES = [
  "ar", // Arabic
  "arc", // Aramaic
  "ckb", // Sorani Kurdish
  "dv", // Divehi
  "fa", // Persian
  "ha", // Hausa (Ajami)
  "he", // Hebrew
  "ks", // Kashmiri
  "ps", // Pashto
  "sd", // Sindhi
  "syr", // Syriac
  "ug", // Uyghur
  "ur", // Urdu
  "yi", // Yiddish
] as const;

/** The primary language subtag of a BCP-47 locale, lower-cased. */
export function primarySubtag(locale: string): string {
  return locale.toLowerCase().split(/[-_]/, 1).join("");
}

/**
 * Whether a locale is written right-to-left.
 *
 * @param locale - A BCP-47 locale such as `"ar"`, `"ar-EG"`, or `"he-IL"`.
 * @returns `true` for RTL locales.
 */
export function isRtlLocale(locale: string): boolean {
  return (RTL_LANGUAGES as readonly string[]).includes(primarySubtag(locale));
}

/**
 * Resolve the text direction for a locale.
 *
 * @param locale - A BCP-47 locale.
 * @returns `"rtl"` for RTL locales, otherwise `"ltr"`.
 */
export function getDirection(locale: string): Direction {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}
