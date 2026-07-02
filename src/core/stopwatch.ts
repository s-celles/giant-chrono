// Stopwatch engine. Purely functional and timestamp-based (CTR-005, STW-006):
// elapsed time is always derived from an absolute start epoch plus previously
// accumulated time, never from tick accumulation, so it stays exact through
// background throttling and page reloads (STW-007).

export interface StopwatchState {
  /** True while the stopwatch is counting. */
  running: boolean;
  /** Epoch ms of the current run segment start, or null when not running. */
  startEpoch: number | null;
  /** Elapsed ms accumulated by previous run segments. */
  accumulated: number;
  /** Elapsed ms captured at each lap (cumulative values, LAP-001). */
  laps: number[];
}

export function createStopwatch(): StopwatchState {
  return { running: false, startEpoch: null, accumulated: 0, laps: [] };
}

/** Elapsed ms at `now`. Never negative, even if the wall clock moved back. */
export function elapsed(state: StopwatchState, now: number): number {
  if (!state.running || state.startEpoch === null) return state.accumulated;
  return state.accumulated + Math.max(0, now - state.startEpoch);
}

/** Start or resume counting (STW-001, STW-004). No-op if already running. */
export function start(state: StopwatchState, now: number): StopwatchState {
  if (state.running) return state;
  return { ...state, running: true, startEpoch: now };
}

/** Freeze the elapsed value (STW-003). No-op if not running. */
export function pause(state: StopwatchState, now: number): StopwatchState {
  if (!state.running) return state;
  return { ...state, running: false, startEpoch: null, accumulated: elapsed(state, now) };
}

/** Back to zero, laps cleared (STW-005, LAP-003). */
export function reset(): StopwatchState {
  return createStopwatch();
}

/** Record the current elapsed value without interrupting the count (LAP-001). */
export function lap(state: StopwatchState, now: number): StopwatchState {
  if (!state.running) return state;
  return { ...state, laps: [...state.laps, elapsed(state, now)] };
}

/** Convenience for a single Start/Pause control (CMD-001). */
export function toggle(state: StopwatchState, now: number): StopwatchState {
  return state.running ? pause(state, now) : start(state, now);
}
