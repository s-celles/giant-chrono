// Requirements under test: DSP-006, DSP-009, LAP-002, CLK-003, FMT-001..FMT-004, NFR-005
import { describe, expect, test } from "bun:test";
import {
  defaultHour12,
  formatClock,
  formatElapsed,
  lapRows,
  stackTime,
} from "../src/core/format";

describe("formatElapsed (stopwatch display, DSP-006)", () => {
  test("default format shows minutes:seconds.hundredths", () => {
    expect(formatElapsed(0, { hours: "auto", fractionDigits: 2 })).toBe("00:00.00");
    expect(formatElapsed(61_230, { hours: "auto", fractionDigits: 2 })).toBe("01:01.23");
  });

  test("hours appear automatically past one hour in auto mode", () => {
    expect(formatElapsed(3_599_999, { hours: "auto", fractionDigits: 0 })).toBe("59:59");
    expect(formatElapsed(3_600_000, { hours: "auto", fractionDigits: 0 })).toBe("1:00:00");
  });

  test("hours always shown in always mode", () => {
    expect(formatElapsed(0, { hours: "always", fractionDigits: 0 })).toBe("0:00:00");
  });

  test("hours never shown in never mode (minutes overflow instead)", () => {
    expect(formatElapsed(3_660_000, { hours: "never", fractionDigits: 0 })).toBe("61:00");
  });

  test("fraction precision: none, tenths, hundredths", () => {
    expect(formatElapsed(12_345, { hours: "auto", fractionDigits: 0 })).toBe("00:12");
    expect(formatElapsed(12_345, { hours: "auto", fractionDigits: 1 })).toBe("00:12.3");
    expect(formatElapsed(12_345, { hours: "auto", fractionDigits: 2 })).toBe("00:12.34");
  });

  test("negative input clamps to zero", () => {
    expect(formatElapsed(-50, { hours: "auto", fractionDigits: 2 })).toBe("00:00.00");
  });
});

describe("stackTime (DSP-009: stacked portrait layout)", () => {
  test("minutes:seconds with fraction splits into two lines plus fraction", () => {
    expect(stackTime("05:09.3")).toEqual({ lines: ["05", "09"], fraction: ".3" });
  });

  test("hours produce three lines", () => {
    expect(stackTime("1:02:03.45")).toEqual({ lines: ["1", "02", "03"], fraction: ".45" });
  });

  test("no fraction yields a null fraction", () => {
    expect(stackTime("00:00")).toEqual({ lines: ["00", "00"], fraction: null });
  });

  test("clock time stacks hours, minutes and seconds", () => {
    expect(stackTime("15:04:05")).toEqual({ lines: ["15", "04", "05"], fraction: null });
  });

  test("clock time without seconds stacks two lines", () => {
    expect(stackTime("12:04")).toEqual({ lines: ["12", "04"], fraction: null });
  });
});

describe("lapRows (LAP-002: cumulative and split times)", () => {
  test("computes split as interval since previous lap", () => {
    const rows = lapRows([1000, 2500, 6000]);
    expect(rows).toEqual([
      { index: 1, total: 1000, split: 1000 },
      { index: 2, total: 2500, split: 1500 },
      { index: 3, total: 6000, split: 3500 },
    ]);
  });

  test("empty laps give empty rows", () => {
    expect(lapRows([])).toEqual([]);
  });
});

describe("formatClock (CLK, FMT)", () => {
  // 2026-07-02 15:04:05 local time
  const afternoon = new Date(2026, 6, 2, 15, 4, 5);
  const morning = new Date(2026, 6, 2, 9, 4, 5);
  const midnight = new Date(2026, 6, 2, 0, 4, 5);

  test("FMT-004: 24 h format shows 00-23 hours and no meridiem", () => {
    const r = formatClock(afternoon, { hour12: false, showSeconds: true, locale: "fr-FR" });
    expect(r.time).toBe("15:04:05");
    expect(r.meridiem).toBeNull();
    const m = formatClock(midnight, { hour12: false, showSeconds: true, locale: "fr-FR" });
    expect(m.time).toBe("00:04:05");
  });

  test("FMT-003: 12 h format exposes an AM/PM indicator", () => {
    const r = formatClock(afternoon, { hour12: true, showSeconds: true, locale: "en-US" });
    expect(r.time).toBe("3:04:05");
    expect(r.meridiem).toBe("PM");
    const m = formatClock(morning, { hour12: true, showSeconds: true, locale: "en-US" });
    expect(m.meridiem).toBe("AM");
  });

  test("12 h format shows 12 (not 0) at midnight", () => {
    const r = formatClock(midnight, { hour12: true, showSeconds: false, locale: "en-US" });
    expect(r.time).toBe("12:04");
  });

  test("CLK-003: seconds can be hidden", () => {
    const r = formatClock(afternoon, { hour12: false, showSeconds: false, locale: "fr-FR" });
    expect(r.time).toBe("15:04");
  });
});

describe("defaultHour12 (FMT-002: locale-derived default)", () => {
  test("en-US defaults to 12 h", () => {
    expect(defaultHour12("en-US")).toBe(true);
  });
  test("fr-FR defaults to 24 h", () => {
    expect(defaultHour12("fr-FR")).toBe(false);
  });
});
