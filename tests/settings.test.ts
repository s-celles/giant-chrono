// Requirements under test: DSP-003..DSP-009, FMT-001/002/005, DLY-001,
// CMD-003, MUL-003, AUD-002, PST-001, PST-003
import { describe, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, parseSettings } from "../src/core/settings";

describe("parseSettings (defensive validation)", () => {
  test("PST-003/DSP-008: null, garbage or non-object input yields defaults", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("not json at all")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(42)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  test("valid partial input merges over defaults", () => {
    const s = parseSettings({ digitColor: "#00ff00", delaySeconds: 5 });
    expect(s.digitColor).toBe("#00ff00");
    expect(s.delaySeconds).toBe(5);
    expect(s.bgColor).toBe(DEFAULT_SETTINGS.bgColor);
    expect(s.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled);
  });

  test("DSP-008: invalid individual fields fall back per-field", () => {
    const s = parseSettings({
      digitColor: 123,
      bgColor: "javascript:alert(1)",
      font: "nonexistent-font",
      sizePct: "huge",
      letterSpacing: null,
      hourMode: "13h",
      delaySeconds: -4,
      stopwatchHours: "sometimes",
      fractionDigits: 7,
    });
    expect(s).toEqual(DEFAULT_SETTINGS);
  });

  test("delaySeconds is clamped to a sane integer range", () => {
    expect(parseSettings({ delaySeconds: 3.7 }).delaySeconds).toBe(3);
    expect(parseSettings({ delaySeconds: 100000 }).delaySeconds).toBe(3600);
    expect(parseSettings({ delaySeconds: 0 }).delaySeconds).toBe(0);
  });

  test("sizePct and letterSpacing are clamped to their ranges", () => {
    expect(parseSettings({ sizePct: 5 }).sizePct).toBe(20);
    expect(parseSettings({ sizePct: 500 }).sizePct).toBe(100);
    expect(parseSettings({ letterSpacing: -10 }).letterSpacing).toBe(0);
    expect(parseSettings({ letterSpacing: 99 }).letterSpacing).toBe(20);
  });

  test("FMT-001/002: hourMode accepts 12h, 24h and auto only", () => {
    expect(parseSettings({ hourMode: "12h" }).hourMode).toBe("12h");
    expect(parseSettings({ hourMode: "24h" }).hourMode).toBe("24h");
    expect(parseSettings({ hourMode: "auto" }).hourMode).toBe("auto");
    expect(parseSettings({ hourMode: "am" }).hourMode).toBe(DEFAULT_SETTINGS.hourMode);
  });

  test("DSP-009: layout accepts auto, inline and stacked only", () => {
    expect(parseSettings({ layout: "auto" }).layout).toBe("auto");
    expect(parseSettings({ layout: "inline" }).layout).toBe("inline");
    expect(parseSettings({ layout: "stacked" }).layout).toBe("stacked");
    expect(parseSettings({ layout: "diagonal" }).layout).toBe(DEFAULT_SETTINGS.layout);
    expect(parseSettings({ layout: 3 }).layout).toBe(DEFAULT_SETTINGS.layout);
  });

  test("colors accept #rgb/#rrggbb only", () => {
    expect(parseSettings({ digitColor: "#ABC" }).digitColor).toBe("#ABC");
    expect(parseSettings({ digitColor: "red" }).digitColor).toBe(DEFAULT_SETTINGS.digitColor);
    expect(parseSettings({ bgColor: "#12345" }).bgColor).toBe(DEFAULT_SETTINGS.bgColor);
  });

  test("defaults are sensible (DSP-008: readable out of the box)", () => {
    expect(DEFAULT_SETTINGS.digitColor).not.toBe(DEFAULT_SETTINGS.bgColor);
    expect(DEFAULT_SETTINGS.hourMode).toBe("auto");
    expect(DEFAULT_SETTINGS.delaySeconds).toBe(0);
    expect(DEFAULT_SETTINGS.multiEnabled).toBe(false);
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.tapCommand).toBe("lap");
    expect(DEFAULT_SETTINGS.layout).toBe("auto");
  });
});
