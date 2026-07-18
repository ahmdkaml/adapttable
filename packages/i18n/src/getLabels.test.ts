import { describe, expect, it } from "vitest";

import { getDirection } from "./direction";
import { getLabels, hasLocale, locales } from "./getLabels";
import { ar } from "./locales/ar";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { fa } from "./locales/fa";
import { he } from "./locales/he";
import { ko } from "./locales/ko";
import { ur } from "./locales/ur";
import { zh } from "./locales/zh";
import { zhTW } from "./locales/zh-TW";

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
    expect(getLabels("ko-KR")).toBe(ko);
  });

  it("prefers an exact regional tag over the primary subtag", () => {
    expect(getLabels("zh-TW")).toBe(zhTW);
    expect(getLabels("zh-tw")).toBe(zhTW);
    expect(getLabels("zh_TW")).toBe(zhTW);
  });

  it("falls back to English for unbundled locales", () => {
    expect(getLabels("sv")).toBe(en);
    expect(getLabels("zz-ZZ")).toBe(en);
  });
});

describe("hasLocale", () => {
  it("reports bundled locales", () => {
    expect(hasLocale("ar-EG")).toBe(true);
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("de")).toBe(true);
    expect(hasLocale("ja")).toBe(true);
    expect(hasLocale("ko")).toBe(true);
    expect(hasLocale("zh-TW")).toBe(true);
    expect(hasLocale("fa")).toBe(true);
    expect(hasLocale("ur")).toBe(true);
    expect(hasLocale("sv")).toBe(false);
  });
});

describe("new locales direction", () => {
  it("marks fa and ur as rtl", () => {
    expect(getDirection("fa")).toBe("rtl");
    expect(getDirection("fa-IR")).toBe("rtl");
    expect(getDirection("ur")).toBe("rtl");
    expect(getDirection("ur-PK")).toBe("rtl");
  });

  it("marks the new LTR locales as ltr", () => {
    expect(getDirection("ko")).toBe("ltr");
    expect(getDirection("ru")).toBe("ltr");
    expect(getDirection("tr")).toBe("ltr");
    expect(getDirection("hi")).toBe("ltr");
    expect(getDirection("zh-TW")).toBe("ltr");
  });
});

describe("presets", () => {
  const cmp = (a: string, b: string) => a.localeCompare(b);
  const enKeys = Object.keys(en).sort(cmp);

  it("bundles 17 locales", () => {
    expect(Object.keys(locales)).toHaveLength(17);
  });

  it("exposes the new presets", () => {
    expect(locales.ko).toBe(ko);
    expect(locales.fa).toBe(fa);
    expect(locales.ur).toBe(ur);
    expect(locales["zh-TW"]).toBe(zhTW);
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

it("every function label in every locale formats with its numbers", () => {
  for (const [tag, labels] of Object.entries(locales)) {
    for (const [key, value] of Object.entries(labels)) {
      if (typeof value !== "function") continue;
      let out: string;
      if (key === "showing") {
        out = (
          value as (a: { from: number; to: number; total: number }) => string
        )({ from: 1, to: 8, total: 42 });
      } else if (key === "pageOf") {
        out = (value as (a: { page: number; total: number }) => string)({
          page: 42,
          total: 99,
        });
      } else {
        out = (value as (n: number) => string)(42);
      }
      expect(out, `${tag}.${key}`).toEqual(expect.any(String));
      expect(out, `${tag}.${key}`).toContain("42");
    }
  }
});
