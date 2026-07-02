// Local persistence (PST-001..PST-003). Everything stays on-device (NFR-006).
// All readers are defensive: absent or corrupted data yields defaults, never a crash.

import { createStopwatch, type StopwatchState } from "./stopwatch";
import { DEFAULT_SETTINGS, parseSettings, type Settings } from "./settings";

export type View = "stopwatch" | "clock";

const KEY_SETTINGS = "giantchrono:settings";
const KEY_STOPWATCHES = "giantchrono:stopwatches";
const KEY_VIEW = "giantchrono:view";

function readJson(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota errors or private-mode restrictions must never break the app (PST-003).
  }
}

export function loadSettings(storage: Storage): Settings {
  const raw = readJson(storage, KEY_SETTINGS);
  return raw === null ? { ...DEFAULT_SETTINGS } : parseSettings(raw);
}

export function saveSettings(storage: Storage, settings: Settings): void {
  writeJson(storage, KEY_SETTINGS, settings);
}

function parseStopwatch(raw: unknown): StopwatchState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.running !== "boolean") return null;
  if (typeof o.accumulated !== "number" || !Number.isFinite(o.accumulated) || o.accumulated < 0) {
    return null;
  }
  const startEpoch =
    typeof o.startEpoch === "number" && Number.isFinite(o.startEpoch) ? o.startEpoch : null;
  if (o.running && startEpoch === null) return null;
  const laps = Array.isArray(o.laps)
    ? o.laps.filter((l): l is number => typeof l === "number" && Number.isFinite(l) && l >= 0)
    : [];
  return { running: o.running, startEpoch: o.running ? startEpoch : null, accumulated: o.accumulated, laps };
}

/** Restore persisted stopwatches; always returns at least one (PST-002, STW-007). */
export function loadStopwatches(storage: Storage): StopwatchState[] {
  const raw = readJson(storage, KEY_STOPWATCHES);
  if (!Array.isArray(raw)) return [createStopwatch()];
  const list = raw.map(parseStopwatch).filter((s): s is StopwatchState => s !== null);
  return list.length > 0 ? list : [createStopwatch()];
}

export function saveStopwatches(storage: Storage, list: readonly StopwatchState[]): void {
  writeJson(storage, KEY_STOPWATCHES, list);
}

export function loadView(storage: Storage): View {
  const raw = readJson(storage, KEY_VIEW);
  return raw === "clock" ? "clock" : "stopwatch";
}

export function saveView(storage: Storage, view: View): void {
  writeJson(storage, KEY_VIEW, view);
}
