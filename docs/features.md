# Features

Requirement IDs (e.g. `DSP-001`) are stable identifiers used for traceability in code comments and tests.

## Giant display and theme (DSP)

The active value — stopwatch or clock — fills the available screen area; digit size is recomputed on every resize or rotation (DSP-001, DSP-002). The **Settings** dialog (⚙) provides:

- Digit color and background color (DSP-003), with a **⇄ Swap colors** button to invert them in one tap — e.g. for sunlight readability (DSP-010)
- Font: monospace, sans-serif, or serif — local system font stacks, no network request (DSP-004)
- Relative size (20–100 %) and letter spacing (DSP-005)
- Stopwatch format: hours automatic/always/never, precision seconds/tenths/hundredths (DSP-006)
- Digit layout: **automatic** (stacked in portrait, single line in landscape), **single line**, or **stacked** — each hours/minutes/seconds group on its own line, with the stopwatch fraction shown small in the bottom-right corner, so digits stay as large as possible in any orientation (DSP-009)

All theme settings persist across sessions (DSP-007); missing or invalid stored values fall back to readable defaults (DSP-008).

## Stopwatch (STW) and laps (LAP)

- **Start** begins counting; **Pause** freezes; **Start** again resumes; **Reset** returns to zero and clears laps (STW-001…005).
- Elapsed time is computed from timestamps, so it stays exact after the tab is backgrounded or the app is reloaded mid-run (STW-006, STW-007, CTR-005).
- **Lap** records the current time without interrupting the count; the list shows each lap's cumulative time and split (interval since the previous lap), newest first (LAP-001, LAP-002).

## Delayed start (DLY) and audio (AUD)

Set a **start delay** in seconds in Settings (0 = immediate, DLY-001). Starting from zero with a delay shows a full-screen countdown (DLY-002) with a beep per second and a longer, higher tone at go (DLY-003, DLY-004) — generated locally with the Web Audio API (AUD-001). Pressing Start/Pause or Reset during the countdown cancels it (DLY-005). Sound can be muted globally (🔊/🔇, AUD-002); when audio is unavailable or muted the countdown flashes instead (AUD-003).

## Clock (CLK) and 12 h / 24 h format (FMT)

The clock view shows the local time in giant digits, updated continuously (CLK-001, CLK-002), with optional seconds (CLK-003) and the same theme as the stopwatch (CLK-004). A **Face** setting switches between the digital display and an **analog dial** — hour/minute/second hands, tick marks and numbers 1–12 drawn with the theme colors and font, sized to fill the screen (CLK-005). A **Second hand** setting picks its motion: **tick** (one step per second, the default) or **sweep** (continuous) (CLK-006). The time format is:

- **Automatic** — derived from your system locale (FMT-002)
- **12-hour** — with an AM/PM indicator (FMT-003)
- **24-hour** — hours 00–23, no indicator (FMT-004)

Format changes apply immediately and persist (FMT-005).

## Views and commands (NAV, CMD)

- Swipe vertically on the display to switch between stopwatch and clock (NAV-001); the top-left button does the same without a gesture (NAV-004). The stopwatch keeps counting in the background (NAV-002) and the last view is restored at startup (NAV-003).
- Large on-screen buttons: Reset, Start/Pause, Lap (CMD-001).
- A tap on the display (outside buttons) triggers a configurable secondary command — Lap by default, Start/Pause, or disabled (CMD-002, CMD-003).
- Hardware volume keys are not exposed by web browsers (CTR-002); all functions remain fully available through the touch controls (CMD-005).
- Keyboard: **Space** start/pause, **L** lap, **R** reset, **V**/**↑**/**↓** switch view (NFR-004).

## Lock mode (LCK)

Tap 🔓 to lock: all stopwatch commands from taps and buttons are ignored (LCK-001) while a clear indicator is shown (LCK-002). Counting and display refresh continue (LCK-004). To unlock, press and hold anywhere on the display (or on the lock button) for one second (LCK-003).

## Multiple stopwatches (MUL)

Enable **Multiple stopwatches** in Settings to manage several independent stopwatches (MUL-001), each with its own Start/Pause and Reset (MUL-002). Disabled (default), the app behaves as a single-stopwatch app (MUL-003).

## Wake lock (WAK)

Where the Screen Wake Lock API is available, the screen stays on while a stopwatch counts or the clock view is active, and the lock is released otherwise (WAK-001, WAK-002). Without the API the app runs normally (WAK-003). Can be disabled in Settings.

## Interface language (I18N)

The UI is available in **English and French**. The language is detected automatically from the browser's language preferences, with English as the fallback for unsupported languages (I18N-001, I18N-002). A **Language** setting (Automatic / English / Français) forces a specific language and persists (I18N-003). Time and number formatting keep following the system locale (NFR-005).

## Help and about (HLP)

The **?** button in the top bar opens an offline help dialog summarizing the stopwatch commands, gestures, and keyboard shortcuts (HLP-001), with links to the source code repository and this documentation (HLP-002).

## Persistence (PST)

Settings, the 12/24 h choice, delay, options, the active view, and full stopwatch state (start timestamp, paused value, laps) are stored locally in `localStorage` (PST-001, PST-002). Corrupted or missing data is replaced by defaults without crashing (PST-003).

## PWA

GiantChrono is installable (manifest + icons, PWA-001/002). A service worker precaches every asset at install, so the app starts and works fully offline (PWA-003, PWA-004); at runtime it serves requests network-first with cache fallback. When a new version is deployed, an in-app "Update available" prompt applies it without losing persisted data (PWA-005). The app makes no tracking, analytics, or advertising requests (PWA-006).
