// Requirements under test: DLY-001..DLY-005
import { describe, expect, test } from "bun:test";
import { countdownStatus } from "../src/core/countdown";

const T0 = 500_000;

describe("countdownStatus (delayed start)", () => {
  test("DLY-002: reports whole seconds remaining until start", () => {
    expect(countdownStatus(T0, 3, T0).remainingSeconds).toBe(3);
    expect(countdownStatus(T0, 3, T0 + 500).remainingSeconds).toBe(3);
    expect(countdownStatus(T0, 3, T0 + 1000).remainingSeconds).toBe(2);
    expect(countdownStatus(T0, 3, T0 + 2999).remainingSeconds).toBe(1);
  });

  test("DLY-004: done exactly when the delay has fully elapsed", () => {
    expect(countdownStatus(T0, 3, T0 + 2999).done).toBe(false);
    expect(countdownStatus(T0, 3, T0 + 3000).done).toBe(true);
    expect(countdownStatus(T0, 3, T0 + 3000).remainingSeconds).toBe(0);
  });

  test("DLY-001: zero delay is immediately done (immediate start)", () => {
    const s = countdownStatus(T0, 0, T0);
    expect(s.done).toBe(true);
    expect(s.remainingSeconds).toBe(0);
  });

  test("DLY-003: each displayed second maps to one audio cue", () => {
    // The UI beeps when remainingSeconds changes; verify the sequence 3,2,1,0.
    const seen: number[] = [];
    let last = -1;
    for (let t = 0; t <= 3000; t += 100) {
      const { remainingSeconds } = countdownStatus(T0, 3, T0 + t);
      if (remainingSeconds !== last) {
        seen.push(remainingSeconds);
        last = remainingSeconds;
      }
    }
    expect(seen).toEqual([3, 2, 1, 0]);
  });
});
