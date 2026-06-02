import { describe, expect, it } from "vitest";

import { getLabels, hasLocale } from "./getLabels";
import { ar } from "./locales/ar";
import { en } from "./locales/en";

describe("getLabels", () => {
  it("returns the English preset for en", () => {
    expect(getLabels("en")).toBe(en);
    expect(getLabels("en-US")).toBe(en);
  });

  it("returns the Arabic preset for ar and its variants", () => {
    expect(getLabels("ar")).toBe(ar);
    expect(getLabels("ar-EG")).toBe(ar);
  });

  it("falls back to English for unknown locales", () => {
    expect(getLabels("fr")).toBe(en);
    expect(getLabels("zz-ZZ")).toBe(en);
  });
});

describe("hasLocale", () => {
  it("reports bundled locales", () => {
    expect(hasLocale("ar-EG")).toBe(true);
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("de")).toBe(false);
  });
});

describe("presets", () => {
  const cmp = (a: string, b: string) => a.localeCompare(b);

  it("every English key has an Arabic counterpart", () => {
    expect(Object.keys(ar).sort(cmp)).toEqual(Object.keys(en).sort(cmp));
  });

  it("all label builders produce non-empty strings in both locales", () => {
    for (const preset of [en, ar]) {
      expect(preset.selectedCount(3).length).toBeGreaterThan(0);
      expect(
        preset.showing({ from: 1, to: 10, total: 50 }).length
      ).toBeGreaterThan(0);
      expect(preset.pageOf({ page: 2, total: 5 }).length).toBeGreaterThan(0);
      expect(preset.goToPage(2).length).toBeGreaterThan(0);
    }
  });
});
