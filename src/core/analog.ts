// Analog clock geometry (CLK-005): pure hand-angle math, kept out of the
// canvas renderer so it can be unit tested.

export interface HandAngles {
  /** Radians clockwise from 12 o'clock. */
  hour: number;
  minute: number;
  second: number;
}

/**
 * Hand angles for a time of day. `seconds` may be fractional to let the
 * second hand sweep smoothly between ticks.
 */
export type SecondHandMode = "sweep" | "tick";

/**
 * Seconds value to feed the second hand (CLK-006): "sweep" keeps the
 * fractional part for continuous motion, "tick" steps once per second.
 */
export function secondHandSeconds(seconds: number, mode: SecondHandMode): number {
  return mode === "tick" ? Math.floor(seconds) : seconds;
}

export function handAngles(hours: number, minutes: number, seconds: number): HandAngles {
  const s = seconds;
  const m = minutes + s / 60;
  const h = (hours % 12) + m / 60;
  return {
    hour: (h * Math.PI) / 6,
    minute: (m * Math.PI) / 30,
    second: (s * Math.PI) / 30,
  };
}
