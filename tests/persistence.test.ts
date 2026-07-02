// Requirements under test: PST-001, PST-002, PST-003, NAV-003
import { describe, expect, test } from "bun:test";
import { createStopwatch, start } from "../src/core/stopwatch";
import { DEFAULT_SETTINGS } from "../src/core/settings";
import {
  loadSettings,
  loadStopwatches,
  loadView,
  saveSettings,
  saveStopwatches,
  saveView,
} from "../src/core/persistence";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe("settings persistence (PST-001)", () => {
  test("round-trips settings", () => {
    const store = memoryStorage();
    const s = { ...DEFAULT_SETTINGS, digitColor: "#ff0000", hourMode: "12h" as const };
    saveSettings(store, s);
    expect(loadSettings(store)).toEqual(s);
  });

  test("PST-003: corrupted JSON falls back to defaults without throwing", () => {
    const store = memoryStorage();
    store.setItem("giantchrono:settings", "{broken json!!");
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
  });

  test("missing data falls back to defaults", () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
  });
});

describe("stopwatch persistence (PST-002)", () => {
  test("round-trips a running stopwatch (start timestamp preserved)", () => {
    const store = memoryStorage();
    const sw = start(createStopwatch(), 123_456);
    saveStopwatches(store, [sw]);
    const [restored] = loadStopwatches(store);
    expect(restored).toEqual(sw);
  });

  test("PST-003: corrupted stopwatch state yields a fresh single stopwatch", () => {
    const store = memoryStorage();
    store.setItem("giantchrono:stopwatches", '[{"running": "maybe"}]');
    const list = loadStopwatches(store);
    expect(list).toEqual([createStopwatch()]);
  });

  test("empty persisted array yields a fresh single stopwatch", () => {
    const store = memoryStorage();
    store.setItem("giantchrono:stopwatches", "[]");
    expect(loadStopwatches(store)).toEqual([createStopwatch()]);
  });

  test("invalid laps entries are dropped", () => {
    const store = memoryStorage();
    store.setItem(
      "giantchrono:stopwatches",
      JSON.stringify([{ running: false, startEpoch: null, accumulated: 500, laps: [100, "x", 200] }]),
    );
    const [restored] = loadStopwatches(store);
    expect(restored?.laps).toEqual([100, 200]);
    expect(restored?.accumulated).toBe(500);
  });
});

describe("view persistence (NAV-003)", () => {
  test("round-trips the active view", () => {
    const store = memoryStorage();
    saveView(store, "clock");
    expect(loadView(store)).toBe("clock");
  });

  test("invalid stored view falls back to stopwatch", () => {
    const store = memoryStorage();
    store.setItem("giantchrono:view", "banana");
    expect(loadView(store)).toBe("stopwatch");
  });
});
