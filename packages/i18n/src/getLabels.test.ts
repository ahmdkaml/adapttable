import { describe, expect, it } from "vitest";

import { getLabels, hasLocale, locales } from "./getLabels";
import { ar } from "./locales/ar";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { he } from "./locales/he";
import { zh } from "./locales/zh";

describe("getLabels", () => {
  it("returns the English preset for en", () => {
    expect(getLabels("en")).toBe(en);
    expect(getLabels("en-US")).toBe(en);
  });

  it("returns the Arabic preset for ar and its variants", () => {
    expect(getLabels("ar")).toBe(ar);
    expect(getLabels("ar-EG")).toBe(ar);
  });

  it("resolves the other bundled locales by primary subtag", () => {
    expect(getLabels("de-AT")).toBe(de);
    expect(getLabels("zh-CN")).toBe(zh);
    expect(getLabels("he-IL")).toBe(he);
  });

  it("falls back to English for unbundled locales", () => {
    expect(getLabels("ko")).toBe(en);
    expect(getLabels("zz-ZZ")).toBe(en);
  });
});

describe("hasLocale", () => {
  it("reports bundled locales", () => {
    expect(hasLocale("ar-EG")).toBe(true);
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("de")).toBe(true);
    expect(hasLocale("ja")).toBe(true);
    expect(hasLocale("ko")).toBe(false);
  });
});

describe("presets", () => {
  const cmp = (a: string, b: string) => a.localeCompare(b);
  const enKeys = Object.keys(en).sort(cmp);

  it("bundles at least 10 locales", () => {
    expect(Object.keys(locales).length).toBeGreaterThanOrEqual(10);
  });

  it("every locale has exactly the English key set", () => {
    for (const [key, preset] of Object.entries(locales)) {
      expect({ key, keys: Object.keys(preset).sort(cmp) }).toEqual({
        key,
        keys: enKeys,
      });
    }
  });

  it("all label builders produce non-empty strings in every locale", () => {
    for (const preset of Object.values(locales)) {
      expect(preset.selectedCount(3).length).toBeGreaterThan(0);
      expect(
        preset.showing({ from: 1, to: 10, total: 50 }).length
      ).toBeGreaterThan(0);
      expect(preset.pageOf({ page: 2, total: 5 }).length).toBeGreaterThan(0);
      expect(preset.goToPage(2).length).toBeGreaterThan(0);
    }
  });
});
