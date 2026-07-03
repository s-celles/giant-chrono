// Requirements under test: CLK-005 (analog clock face)
import { describe, expect, test } from "bun:test";
import { handAngles, secondHandSeconds } from "../src/core/analog";

const PI = Math.PI;

describe("handAngles (CLK-005: analog hand positions)", () => {
  test("midnight points every hand at 12", () => {
    const a = handAngles(0, 0, 0);
    expect(a.hour).toBeCloseTo(0);
    expect(a.minute).toBeCloseTo(0);
    expect(a.second).toBeCloseTo(0);
  });

  test("3:00:00 puts the hour hand at a quarter turn", () => {
    const a = handAngles(3, 0, 0);
    expect(a.hour).toBeCloseTo(PI / 2);
    expect(a.minute).toBeCloseTo(0);
  });

  test("6:30 puts the minute hand at half turn and the hour hand past 6", () => {
    const a = handAngles(6, 30, 0);
    expect(a.minute).toBeCloseTo(PI);
    expect(a.hour).toBeCloseTo((6.5 * PI) / 6);
  });

  test("afternoon hours wrap onto the 12-hour dial", () => {
    expect(handAngles(15, 0, 0).hour).toBeCloseTo(PI / 2);
    expect(handAngles(12, 0, 0).hour).toBeCloseTo(0);
  });

  test("seconds advance the second hand and nudge minute and hour hands", () => {
    const a = handAngles(0, 0, 30);
    expect(a.second).toBeCloseTo(PI);
    expect(a.minute).toBeCloseTo(PI / 60);
    expect(a.hour).toBeCloseTo(PI / 720);
  });

  test("fractional seconds allow a smooth sweep", () => {
    expect(handAngles(0, 0, 0.5).second).toBeCloseTo(PI / 60);
  });
});

describe("secondHandSeconds (CLK-006: sweep vs tick second hand)", () => {
  test("sweep keeps fractional seconds for a continuous motion", () => {
    expect(secondHandSeconds(30.7, "sweep")).toBeCloseTo(30.7);
  });

  test("tick truncates to whole elapsed seconds", () => {
    expect(secondHandSeconds(30.7, "tick")).toBe(30);
    expect(secondHandSeconds(59.999, "tick")).toBe(59);
  });

  test("whole seconds are identical in both modes", () => {
    expect(secondHandSeconds(42, "sweep")).toBe(42);
    expect(secondHandSeconds(42, "tick")).toBe(42);
  });
});
