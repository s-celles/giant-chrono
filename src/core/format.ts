// Time formatting for the stopwatch and clock views.

export type HoursMode = "auto" | "always" | "never";

export interface ElapsedFormat {
  /** Whether to display the hours group (DSP-006). */
  hours: HoursMode;
  /** 0 = seconds only, 1 = tenths, 2 = hundredths (DSP-006). */
  fractionDigits: 0 | 1 | 2;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Format an elapsed duration in ms for the giant stopwatch display. */
export function formatElapsed(ms: number, fmt: ElapsedFormat): string {
  const clamped = Math.max(0, ms);
  // Truncate (not round) so the display never runs ahead of real time.
  const totalSeconds = Math.floor(clamped / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const showHours = fmt.hours === "always" || (fmt.hours === "auto" && hours > 0);

  const minutes = showHours
    ? Math.floor((totalSeconds % 3600) / 60)
    : Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let out = showHours ? `${hours}:${pad2(minutes)}:${pad2(seconds)}` : `${pad2(minutes)}:${pad2(seconds)}`;
  if (fmt.fractionDigits > 0) {
    const frac = Math.floor((clamped % 1000) / (fmt.fractionDigits === 1 ? 100 : 10));
    out += `.${String(frac).padStart(fmt.fractionDigits, "0")}`;
  }
  return out;
}

export interface StackedTime {
  /** Digit groups, one per display line, top to bottom (DSP-009). */
  lines: string[];
  /** Trailing fraction including the dot (".3"), shown small, or null. */
  fraction: string | null;
}

/** Split a formatted time into stacked lines for portrait display (DSP-009). */
export function stackTime(text: string): StackedTime {
  const dot = text.indexOf(".");
  const fraction = dot >= 0 ? text.slice(dot) : null;
  const head = dot >= 0 ? text.slice(0, dot) : text;
  return { lines: head.split(":"), fraction };
}

export interface LapRow {
  index: number;
  /** Cumulative elapsed ms at the lap (LAP-002). */
  total: number;
  /** Interval since the previous lap (LAP-002). */
  split: number;
}

export function lapRows(laps: readonly number[]): LapRow[] {
  return laps.map((total, i) => ({
    index: i + 1,
    total,
    split: total - (laps[i - 1] ?? 0),
  }));
}

export interface ClockFormatOptions {
  hour12: boolean;
  showSeconds: boolean;
  /** BCP 47 locale for digit/number formatting (NFR-005). */
  locale: string;
}

export interface ClockDisplay {
  /** e.g. "15:04:05" or "3:04:05". */
  time: string;
  /** AM/PM indicator in 12 h mode (FMT-003), null in 24 h mode (FMT-004). */
  meridiem: string | null;
}

/** Format a local time for the giant clock via Intl (NFR-005). */
export function formatClock(date: Date, opts: ClockFormatOptions): ClockDisplay {
  const parts = new Intl.DateTimeFormat(opts.locale, {
    // Explicit hour cycles: h23 gives 00-23 (FMT-004), h12 gives 12-hour with
    // 12 at midnight (FMT-003), independent of locale quirks.
    hourCycle: opts.hour12 ? "h12" : "h23",
    hour: opts.hour12 ? "numeric" : "2-digit",
    minute: "2-digit",
    ...(opts.showSeconds ? { second: "2-digit" as const } : {}),
  }).formatToParts(date);

  let time = "";
  let meridiem: string | null = null;
  for (const part of parts) {
    if (part.type === "dayPeriod") {
      meridiem = part.value;
    } else if (part.type === "hour" || part.type === "minute" || part.type === "second") {
      time += part.value;
    } else if (part.type === "literal" && /[:.]/.test(part.value)) {
      time += ":";
    }
  }
  return { time, meridiem: opts.hour12 ? meridiem : null };
}

/** Locale-derived 12/24 h default when the user made no choice (FMT-002). */
export function defaultHour12(locale: string): boolean {
  const resolved = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions();
  return resolved.hour12 ?? false;
}
