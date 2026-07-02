// Requirements under test: STW-001..STW-007, LAP-001..LAP-003, CTR-005
import { describe, expect, test } from "bun:test";
import {
  createStopwatch,
  elapsed,
  lap,
  pause,
  reset,
  start,
} from "../src/core/stopwatch";

const T0 = 1_000_000; // arbitrary epoch origin (ms)

describe("stopwatch engine (timestamp-based)", () => {
  test("initial state is stopped at zero with no laps", () => {
    const s = createStopwatch();
    expect(s.running).toBe(false);
    expect(elapsed(s, T0)).toBe(0);
    expect(s.laps).toEqual([]);
  });

  test("STW-001: start begins counting from zero", () => {
    const s = start(createStopwatch(), T0);
    expect(s.running).toBe(true);
    expect(elapsed(s, T0)).toBe(0);
    expect(elapsed(s, T0 + 1234)).toBe(1234);
  });

  test("STW-006/CTR-005: elapsed derives from timestamps, not tick accumulation", () => {
    const s = start(createStopwatch(), T0);
    // Simulate a long background gap: no intermediate ticks ever happened.
    expect(elapsed(s, T0 + 3_600_000)).toBe(3_600_000);
  });

  test("STW-003: pause freezes the elapsed value", () => {
    let s = start(createStopwatch(), T0);
    s = pause(s, T0 + 5000);
    expect(s.running).toBe(false);
    expect(elapsed(s, T0 + 5000)).toBe(5000);
    // Time passing while paused must not change the value.
    expect(elapsed(s, T0 + 99_000)).toBe(5000);
  });

  test("STW-004: resume continues from the frozen value", () => {
    let s = start(createStopwatch(), T0);
    s = pause(s, T0 + 5000);
    s = start(s, T0 + 60_000); // resume 55 s later
    expect(s.running).toBe(true);
    expect(elapsed(s, T0 + 60_000)).toBe(5000);
    expect(elapsed(s, T0 + 61_000)).toBe(6000);
  });

  test("starting an already running stopwatch is a no-op", () => {
    const s1 = start(createStopwatch(), T0);
    const s2 = start(s1, T0 + 1000);
    expect(elapsed(s2, T0 + 2000)).toBe(2000);
  });

  test("pausing an already paused stopwatch is a no-op", () => {
    let s = start(createStopwatch(), T0);
    s = pause(s, T0 + 5000);
    const s2 = pause(s, T0 + 9000);
    expect(elapsed(s2, T0 + 9000)).toBe(5000);
  });

  test("STW-005/LAP-003: reset returns to zero and clears laps", () => {
    let s = start(createStopwatch(), T0);
    s = lap(s, T0 + 1000);
    s = lap(s, T0 + 2500);
    s = reset();
    expect(s.running).toBe(false);
    expect(elapsed(s, T0 + 9999)).toBe(0);
    expect(s.laps).toEqual([]);
  });

  test("LAP-001: lap records current elapsed without stopping the count", () => {
    let s = start(createStopwatch(), T0);
    s = lap(s, T0 + 1000);
    s = lap(s, T0 + 2500);
    expect(s.laps).toEqual([1000, 2500]);
    expect(s.running).toBe(true);
    expect(elapsed(s, T0 + 3000)).toBe(3000);
  });

  test("LAP-001: lap is ignored while the stopwatch is not counting", () => {
    let s = createStopwatch();
    s = lap(s, T0);
    expect(s.laps).toEqual([]);
    s = pause(start(s, T0), T0 + 1000);
    s = lap(s, T0 + 2000);
    expect(s.laps).toEqual([]);
  });

  test("STW-007: a persisted running state restores a coherent elapsed after reload", () => {
    const before = start(createStopwatch(), T0);
    // Simulate persistence: plain JSON round-trip, then a much later "now".
    const restored = JSON.parse(JSON.stringify(before)) as typeof before;
    expect(elapsed(restored, T0 + 42_000)).toBe(42_000);
    expect(restored.running).toBe(true);
  });

  test("elapsed never goes negative even with a clock set backwards", () => {
    const s = start(createStopwatch(), T0);
    expect(elapsed(s, T0 - 5000)).toBe(0);
  });
});
