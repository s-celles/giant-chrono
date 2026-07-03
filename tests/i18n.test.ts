// Requirements under test: I18N-001..I18N-003 (UI language detection)
import { describe, expect, test } from "bun:test";
import { MESSAGES, resolveLang } from "../src/core/i18n";

describe("resolveLang (I18N-001/002: auto-detection with English fallback)", () => {
  test("French browser locales resolve to fr", () => {
    expect(resolveLang(["fr-FR"])).toBe("fr");
    expect(resolveLang(["fr"])).toBe("fr");
    expect(resolveLang(["fr-CA", "en-US"])).toBe("fr");
  });

  test("English locales resolve to en", () => {
    expect(resolveLang(["en-US"])).toBe("en");
    expect(resolveLang(["en-GB", "fr-FR"])).toBe("en");
  });

  test("unavailable languages fall back to the next preference, then en", () => {
    expect(resolveLang(["de-DE", "fr-CH"])).toBe("fr");
    expect(resolveLang(["de-DE", "es-ES"])).toBe("en");
    expect(resolveLang([])).toBe("en");
  });

  test("matching is case-insensitive", () => {
    expect(resolveLang(["FR-fr"])).toBe("fr");
  });
});

describe("MESSAGES catalogs (I18N-001: complete translations)", () => {
  test("fr covers exactly the same keys as en", () => {
    expect(Object.keys(MESSAGES.fr).sort()).toEqual(Object.keys(MESSAGES.en).sort());
  });

  test("no catalog entry is empty", () => {
    for (const lang of ["en", "fr"] as const) {
      for (const [key, value] of Object.entries(MESSAGES[lang])) {
        expect(value.length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });
});
