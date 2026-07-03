// User settings model with defensive parsing: any missing or invalid field
// falls back to a readable default (DSP-008, PST-003).

import type { HoursMode } from "./format";

export type HourMode = "auto" | "12h" | "24h";
export type LayoutMode = "auto" | "inline" | "stacked";
export type TapCommand = "none" | "lap" | "startpause";
export type FontId = "system-mono" | "system-sans" | "system-serif";

export interface Settings {
  /** Digit color, #rgb or #rrggbb (DSP-003). */
  digitColor: string;
  /** Background color (DSP-003). */
  bgColor: string;
  /** Embedded/local font choice (DSP-004). */
  font: FontId;
  /** Relative digit size, 20-100 % of the maximum fit (DSP-005). */
  sizePct: number;
  /** Letter spacing in 1/100 em, 0-20 (DSP-005). */
  letterSpacing: number;
  /** Digit layout: one line, stacked, or auto = stacked in portrait (DSP-009). */
  layout: LayoutMode;
  /** Stopwatch hours display mode (DSP-006). */
  stopwatchHours: HoursMode;
  /** Stopwatch fraction precision (DSP-006). */
  fractionDigits: 0 | 1 | 2;
  /** Clock seconds visibility (CLK-003). */
  clockShowSeconds: boolean;
  /** 12/24 h choice; "auto" derives from the locale (FMT-001, FMT-002). */
  hourMode: HourMode;
  /** Delayed start in seconds, 0 = immediate (DLY-001). */
  delaySeconds: number;
  /** Action for a tap on the display area (CMD-002, CMD-003). */
  tapCommand: TapCommand;
  /** Global sound switch (AUD-002). */
  soundEnabled: boolean;
  /** Multiple stopwatches option (MUL-001, MUL-003). */
  multiEnabled: boolean;
  /** Screen wake lock opt-in (WAK-001). */
  keepAwake: boolean;
}

export const FONT_STACKS: Record<FontId, string> = {
  // All stacks resolve locally without any network request (DSP-004).
  "system-mono": 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  "system-sans": 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  "system-serif": 'ui-serif, Georgia, "Times New Roman", serif',
};

export const DEFAULT_SETTINGS: Settings = {
  digitColor: "#ffffff",
  bgColor: "#000000",
  font: "system-mono",
  sizePct: 100,
  letterSpacing: 2,
  layout: "auto",
  stopwatchHours: "auto",
  fractionDigits: 1,
  clockShowSeconds: true,
  hourMode: "auto",
  delaySeconds: 0,
  tapCommand: "lap",
  soundEnabled: true,
  multiEnabled: false,
  keepAwake: true,
};

/** Swap digit and background colors, e.g. for sunlight readability (DSP-010). */
export function swapColors(s: Settings): Settings {
  return { ...s, digitColor: s.bgColor, bgColor: s.digitColor };
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function color(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_COLOR.test(value) ? value : fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function intInRange(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/** Parse untrusted persisted data into valid settings (PST-003, DSP-008). */
export function parseSettings(raw: unknown): Settings {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ...DEFAULT_SETTINGS };
  }
  const o = raw as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  return {
    digitColor: color(o.digitColor, d.digitColor),
    bgColor: color(o.bgColor, d.bgColor),
    font: oneOf(o.font, ["system-mono", "system-sans", "system-serif"], d.font),
    sizePct: intInRange(o.sizePct, 20, 100, d.sizePct),
    letterSpacing: intInRange(o.letterSpacing, 0, 20, d.letterSpacing),
    layout: oneOf(o.layout, ["auto", "inline", "stacked"], d.layout),
    stopwatchHours: oneOf(o.stopwatchHours, ["auto", "always", "never"], d.stopwatchHours),
    fractionDigits:
      o.fractionDigits === 0 || o.fractionDigits === 1 || o.fractionDigits === 2
        ? o.fractionDigits
        : d.fractionDigits,
    clockShowSeconds: bool(o.clockShowSeconds, d.clockShowSeconds),
    hourMode: oneOf(o.hourMode, ["auto", "12h", "24h"], d.hourMode),
    delaySeconds: intInRange(o.delaySeconds, 0, 3600, d.delaySeconds),
    tapCommand: oneOf(o.tapCommand, ["none", "lap", "startpause"], d.tapCommand),
    soundEnabled: bool(o.soundEnabled, d.soundEnabled),
    multiEnabled: bool(o.multiEnabled, d.multiEnabled),
    keepAwake: bool(o.keepAwake, d.keepAwake),
  };
}
