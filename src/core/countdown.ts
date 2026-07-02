// Delayed-start countdown logic (DLY-001..DLY-005). Pure computation from
// timestamps; the UI layer drives rendering and audio cues from this status.

export interface CountdownStatus {
  /** Whole seconds still displayed ("3", "2", "1"); 0 once done. */
  remainingSeconds: number;
  /** True when the delay has fully elapsed and the stopwatch must start (DLY-004). */
  done: boolean;
}

export function countdownStatus(
  startEpoch: number,
  delaySeconds: number,
  now: number,
): CountdownStatus {
  const remainingMs = startEpoch + delaySeconds * 1000 - now;
  if (remainingMs <= 0) return { remainingSeconds: 0, done: true };
  return { remainingSeconds: Math.ceil(remainingMs / 1000), done: false };
}
