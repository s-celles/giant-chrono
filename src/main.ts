// GiantChrono application shell: state, views, commands and rendering.

import { countdownStatus } from "./core/countdown";
import { defaultHour12, formatClock, formatElapsed, lapRows, stackTime } from "./core/format";
import {
  loadSettings,
  loadStopwatches,
  loadView,
  saveSettings,
  saveStopwatches,
  saveView,
  type View,
} from "./core/persistence";
import { DEFAULT_SETTINGS, FONT_STACKS, swapColors, type Settings } from "./core/settings";
import {
  createStopwatch,
  elapsed,
  lap,
  pause,
  reset,
  start,
  toggle,
  type StopwatchState,
} from "./core/stopwatch";
import { drawAnalogClock } from "./analog";
import { Beeper } from "./audio";
import { fitDigits, widthTemplate } from "./fit";
import { registerServiceWorker } from "./sw-register";
import { WakeLockManager } from "./wakelock";

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
};

// ---------- State ----------

const storage = window.localStorage;
let settings: Settings = loadSettings(storage);
let stopwatches: StopwatchState[] = loadStopwatches(storage); // restore (STW-007, PST-002)
let view: View = loadView(storage); // restore last view (NAV-003)
let locked = false;
let countdown: { startEpoch: number; delaySeconds: number } | null = null;
let lastAnnouncedSecond = -1;

const beeper = new Beeper();
const wakeLock = new WakeLockManager();

// ---------- Elements ----------

const display = $("display");
const viewStopwatch = $("view-stopwatch");
const viewClock = $("view-clock");
const singleStopwatch = $("single-stopwatch");
const multiContainer = $("multi-stopwatches");
const swDigits = $("sw-digits");
const swFraction = $("sw-fraction");
const clockDigits = $("clock-digits");
const clockDigital = $("clock-digital");
const clockAnalog = $<HTMLCanvasElement>("clock-analog");
const meridiemEl = $("meridiem");
const lapsList = $<HTMLOListElement>("laps");
const countdownOverlay = $("countdown-overlay");
const countdownDigits = $("countdown-digits");
const lockIndicator = $("lock-indicator");
const controls = $("controls");
const btnStartPause = $<HTMLButtonElement>("btn-startpause");
const btnLap = $<HTMLButtonElement>("btn-lap");
const btnReset = $<HTMLButtonElement>("btn-reset");
const btnView = $<HTMLButtonElement>("btn-view");
const btnLock = $<HTMLButtonElement>("btn-lock");
const btnSound = $<HTMLButtonElement>("btn-sound");
const btnSettings = $<HTMLButtonElement>("btn-settings");
const btnHelp = $<HTMLButtonElement>("btn-help");
const helpDialog = $<HTMLDialogElement>("help-dialog");
const settingsDialog = $<HTMLDialogElement>("settings-dialog");
const settingsForm = $<HTMLFormElement>("settings-form");
const updateToast = $("update-toast");
const btnUpdate = $<HTMLButtonElement>("btn-update");

// ---------- Persistence helpers ----------

const persistStopwatches = () => saveStopwatches(storage, stopwatches);
const persistSettings = () => saveSettings(storage, settings);

// ---------- Theme (DSP-003..DSP-005) ----------

function applyTheme(): void {
  const root = document.documentElement.style;
  root.setProperty("--digit-color", settings.digitColor);
  root.setProperty("--bg-color", settings.bgColor);
  root.setProperty("--digit-font", FONT_STACKS[settings.font]);
  root.setProperty("--size-factor", String(settings.sizePct / 100));
  root.setProperty("--digit-spacing", `${settings.letterSpacing / 100}em`);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", settings.bgColor);
}

// ---------- 12/24 h resolution (FMT-001, FMT-002) ----------

function resolveHour12(): boolean {
  if (settings.hourMode === "12h") return true;
  if (settings.hourMode === "24h") return false;
  return defaultHour12(navigator.language || "en-US");
}

// ---------- Commands ----------

function commandStartPause(): void {
  if (locked) return; // LCK-001
  beeper.unlock();
  if (countdown) {
    cancelCountdown(); // DLY-005
    return;
  }
  const first = stopwatches[0];
  if (!first) return;
  const now = Date.now();
  if (!first.running && elapsed(first, now) === 0 && settings.delaySeconds > 0) {
    startCountdown(now); // DLY-002
    return;
  }
  stopwatches[0] = toggle(first, now);
  persistStopwatches();
}

function commandLap(): void {
  if (locked) return;
  const first = stopwatches[0];
  if (!first) return;
  stopwatches[0] = lap(first, Date.now()); // LAP-001 (no-op unless running)
  persistStopwatches();
}

function commandReset(): void {
  if (locked) return;
  if (countdown) {
    cancelCountdown(); // DLY-005
    return;
  }
  stopwatches[0] = reset(); // STW-005
  persistStopwatches();
}

function startCountdown(now: number): void {
  countdown = { startEpoch: now, delaySeconds: settings.delaySeconds };
  lastAnnouncedSecond = -1;
  countdownOverlay.hidden = false;
}

function cancelCountdown(): void {
  countdown = null;
  countdownOverlay.hidden = true;
}

function switchView(next?: View): void {
  view = next ?? (view === "stopwatch" ? "clock" : "stopwatch");
  saveView(storage, view); // NAV-003
  syncViewChrome();
}

function toggleLock(): void {
  locked = true; // unlock only through the long-press gesture (LCK-003)
  syncLockChrome();
}

function unlock(): void {
  locked = false;
  syncLockChrome();
}

// ---------- Chrome sync (non-per-frame DOM state) ----------

function syncViewChrome(): void {
  const stopwatchActive = view === "stopwatch";
  viewStopwatch.hidden = !stopwatchActive;
  viewClock.hidden = stopwatchActive;
  btnView.textContent = stopwatchActive ? "Clock" : "Stopwatch";
  controls.hidden = !stopwatchActive || settings.multiEnabled;
}

function syncLockChrome(): void {
  lockIndicator.hidden = !locked; // LCK-002
  document.body.classList.toggle("locked", locked);
  btnLock.textContent = locked ? "🔒" : "🔓";
  btnLock.setAttribute("aria-label", locked ? "Locked — hold to unlock" : "Lock the screen controls");
}

function syncSoundChrome(): void {
  btnSound.textContent = settings.soundEnabled ? "🔊" : "🔇";
  btnSound.setAttribute("aria-pressed", String(settings.soundEnabled));
}

// ---------- Multiple stopwatches (MUL-001..MUL-003) ----------

function rebuildMultiCards(): void {
  multiContainer.hidden = !settings.multiEnabled;
  singleStopwatch.style.display = settings.multiEnabled ? "none" : "";
  if (!settings.multiEnabled) {
    stopwatches = [stopwatches[0] ?? createStopwatch()]; // MUL-003: single behavior
    persistStopwatches();
    syncViewChrome();
    return;
  }
  multiContainer.replaceChildren(
    ...stopwatches.map((_, i) => buildMultiCard(i)),
    buildAddButton(),
  );
  syncViewChrome();
}

function buildMultiCard(index: number): HTMLElement {
  const card = document.createElement("div");
  card.className = "multi-card";

  const digits = document.createElement("div");
  digits.className = "digits";
  digits.dataset.multiIndex = String(index);
  digits.setAttribute("role", "timer");

  const row = document.createElement("div");
  row.className = "multi-controls";

  const mkButton = (label: string, onClick: () => void): HTMLButtonElement => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => {
      if (locked) return; // LCK-001
      beeper.unlock();
      onClick();
      persistStopwatches();
      rebuildLabels();
    });
    return b;
  };

  const startBtn = mkButton("Start", () => {
    const s = stopwatches[index];
    if (s) stopwatches[index] = toggle(s, Date.now()); // MUL-002
  });
  startBtn.dataset.multiStart = String(index);

  row.append(
    startBtn,
    mkButton("Reset", () => {
      if (stopwatches[index]) stopwatches[index] = reset(); // MUL-002
    }),
    mkButton("Remove", () => {
      if (stopwatches.length > 1) {
        stopwatches.splice(index, 1);
        rebuildMultiCards();
      }
    }),
  );

  const rebuildLabels = () => {
    startBtn.textContent = stopwatches[index]?.running ? "Pause" : "Start";
  };
  rebuildLabels();

  card.append(digits, row);
  return card;
}

function buildAddButton(): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.id = "btn-add-stopwatch";
  b.textContent = "+ Add";
  b.setAttribute("aria-label", "Add a stopwatch");
  b.addEventListener("click", () => {
    if (locked) return;
    stopwatches.push(createStopwatch()); // MUL-001
    persistStopwatches();
    rebuildMultiCards();
  });
  return b;
}

// ---------- Laps rendering (LAP-002) ----------

let renderedLapCount = -1;

function renderLaps(): void {
  const first = stopwatches[0];
  const laps = first?.laps ?? [];
  if (laps.length === renderedLapCount) return;
  renderedLapCount = laps.length;
  const fmt = { hours: settings.stopwatchHours, fractionDigits: settings.fractionDigits };
  lapsList.replaceChildren(
    ...lapRows(laps)
      .reverse()
      .map((row) => {
        const li = document.createElement("li");
        const label = document.createElement("span");
        label.textContent = `#${row.index}`;
        const split = document.createElement("span");
        split.className = "lap-split";
        split.textContent = `+${formatElapsed(row.split, fmt)}`;
        const total = document.createElement("span");
        total.textContent = formatElapsed(row.total, fmt);
        li.append(label, split, total);
        return li;
      }),
  );
}

// ---------- Render loop ----------

function elapsedFormat() {
  return { hours: settings.stopwatchHours, fractionDigits: settings.fractionDigits } as const;
}

function anyRunning(): boolean {
  return stopwatches.some((s) => s.running);
}

function setText(el: HTMLElement, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

// Stacked layout (DSP-009): one digit group per line; auto = portrait only.
function stackedActive(): boolean {
  if (settings.layout === "stacked") return true;
  if (settings.layout === "inline") return false;
  return display.clientHeight > display.clientWidth;
}

const widestLine = (lines: string[]): string =>
  lines.reduce((a, b) => (b.length > a.length ? b : a));

function render(): void {
  const now = Date.now();
  const sizeFactor = settings.sizePct / 100;
  const spacingEm = settings.letterSpacing / 100;
  const font = FONT_STACKS[settings.font];

  // Delayed start countdown (DLY-002..DLY-004)
  if (countdown) {
    const status = countdownStatus(countdown.startEpoch, countdown.delaySeconds, now);
    setText(countdownDigits, String(Math.max(status.remainingSeconds, 0)));
    fitDigits(countdownDigits, countdownOverlay, "00", sizeFactor, spacingEm, font, 0.7);
    if (status.remainingSeconds !== lastAnnouncedSecond) {
      lastAnnouncedSecond = status.remainingSeconds;
      const audible = settings.soundEnabled && beeper.countdownCue(status.remainingSeconds);
      if (!audible) {
        // Visual fallback when sound is off or unavailable (AUD-003).
        countdownOverlay.classList.remove("flash");
        void countdownOverlay.offsetWidth; // restart the animation
        countdownOverlay.classList.add("flash");
      }
    }
    if (status.done) {
      const scheduledStart = countdown.startEpoch + countdown.delaySeconds * 1000;
      cancelCountdown();
      const first = stopwatches[0];
      if (first) {
        stopwatches[0] = start(first, scheduledStart); // DLY-004, exact start epoch
        persistStopwatches();
      }
    }
  }

  if (view === "stopwatch") {
    if (settings.multiEnabled) {
      for (const digitsEl of multiContainer.querySelectorAll<HTMLElement>("[data-multi-index]")) {
        const sw = stopwatches[Number(digitsEl.dataset.multiIndex)];
        if (sw) setText(digitsEl, formatElapsed(elapsed(sw, now), elapsedFormat()));
      }
    } else {
      const first = stopwatches[0];
      if (first) {
        const text = formatElapsed(elapsed(first, now), elapsedFormat());
        const lapShare = first.laps.length > 0 ? 0.62 : 0.9;
        if (stackedActive()) {
          const { lines, fraction } = stackTime(text);
          setText(swDigits, lines.join("\n"));
          swDigits.classList.add("stacked");
          swFraction.hidden = fraction === null;
          if (fraction !== null) setText(swFraction, fraction);
          const template = widthTemplate(widestLine(lines));
          fitDigits(swDigits, viewStopwatch, template, sizeFactor, spacingEm, font, lapShare / lines.length);
        } else {
          setText(swDigits, text);
          swDigits.classList.remove("stacked");
          swFraction.hidden = true;
          fitDigits(swDigits, viewStopwatch, widthTemplate(text), sizeFactor, spacingEm, font, lapShare);
        }
      }
      renderLaps();
      btnStartPause.textContent = first?.running ? "Pause" : countdown ? "Cancel" : "Start";
    }
  } else if (settings.clockFace === "analog") {
    // Analog clock face (CLK-005), themed from settings (CLK-004).
    clockDigital.hidden = true;
    clockAnalog.hidden = false;
    const dpr = window.devicePixelRatio || 1;
    const side = Math.floor(
      Math.min(viewClock.clientWidth, viewClock.clientHeight) * 0.96 * (settings.sizePct / 100),
    );
    if (side > 0 && clockAnalog.width !== Math.floor(side * dpr)) {
      clockAnalog.width = Math.floor(side * dpr);
      clockAnalog.height = Math.floor(side * dpr);
      clockAnalog.style.width = `${side}px`;
      clockAnalog.style.height = `${side}px`;
    }
    drawAnalogClock(clockAnalog, new Date(now), {
      digitColor: settings.digitColor,
      fontFamily: font,
      secondHand: settings.secondHand,
    });
  } else {
    // Clock view (CLK-001, CLK-002): rAF far exceeds the 1 Hz minimum.
    clockDigital.hidden = false;
    clockAnalog.hidden = true;
    const hour12 = resolveHour12();
    const clock = formatClock(new Date(now), {
      hour12,
      showSeconds: settings.clockShowSeconds,
      locale: navigator.language || "en-US",
    });
    meridiemEl.hidden = clock.meridiem === null; // FMT-003/FMT-004
    if (clock.meridiem !== null) setText(meridiemEl, clock.meridiem);
    if (stackedActive()) {
      const { lines } = stackTime(clock.time);
      setText(clockDigits, lines.join("\n"));
      clockDigits.classList.add("stacked");
      const template = widthTemplate(widestLine(lines));
      fitDigits(clockDigits, viewClock, template, sizeFactor, spacingEm, font, 0.9 / lines.length);
    } else {
      setText(clockDigits, clock.time);
      clockDigits.classList.remove("stacked");
      fitDigits(clockDigits, viewClock, widthTemplate(clock.time), sizeFactor, spacingEm, font, 0.9);
    }
  }

  // Wake lock (WAK-001, WAK-002): while counting or in clock view.
  void wakeLock.update(settings.keepAwake && (anyRunning() || view === "clock" || countdown !== null));

  requestAnimationFrame(render);
}

// ---------- Pointer gestures: swipe to switch view (NAV-001), tap command (CMD-002) ----------

interface PointerTrack {
  x: number;
  y: number;
  t: number;
}

let track: PointerTrack | null = null;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;

display.addEventListener("pointerdown", (e) => {
  track = { x: e.clientX, y: e.clientY, t: performance.now() };
  if (locked) {
    // Deliberate unlock gesture: hold for one second (LCK-003).
    longPressTimer = setTimeout(unlock, 1000);
  }
});

display.addEventListener("pointerup", (e) => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  if (!track) return;
  const dx = e.clientX - track.x;
  const dy = e.clientY - track.y;
  const dt = performance.now() - track.t;
  track = null;

  if (locked) return; // LCK-001: no tap/swipe commands while locked

  if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) {
    switchView(); // NAV-001: vertical swipe toggles stopwatch/clock
    return;
  }

  const isTap = Math.hypot(dx, dy) < 12 && dt < 500;
  if (!isTap) return;
  if ((e.target as HTMLElement).closest("button")) return; // buttons handle themselves
  if (view !== "stopwatch" || settings.multiEnabled) return;
  // Tap acts as the configured secondary command (CMD-002), if enabled (CMD-003).
  if (settings.tapCommand === "lap") commandLap();
  else if (settings.tapCommand === "startpause") commandStartPause();
});

display.addEventListener("pointercancel", () => {
  track = null;
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
});

// ---------- Buttons ----------

btnStartPause.addEventListener("click", commandStartPause);
btnLap.addEventListener("click", commandLap);
btnReset.addEventListener("click", commandReset);
btnView.addEventListener("click", () => {
  if (!locked) switchView(); // NAV-004: non-gesture alternative
});
btnSound.addEventListener("click", () => {
  if (locked) return;
  settings = { ...settings, soundEnabled: !settings.soundEnabled }; // AUD-002
  persistSettings();
  syncSoundChrome();
});
btnSettings.addEventListener("click", () => {
  if (locked) return;
  populateSettingsForm();
  settingsDialog.showModal();
});
btnHelp.addEventListener("click", () => {
  if (locked) return;
  helpDialog.showModal(); // HLP-001
});
btnLock.addEventListener("click", () => {
  if (!locked) toggleLock();
});
// Holding the lock button also unlocks (same deliberate gesture, LCK-003).
btnLock.addEventListener("pointerdown", () => {
  if (locked) longPressTimer = setTimeout(unlock, 1000);
});
btnLock.addEventListener("pointerup", () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
});

// ---------- Keyboard (NFR-004) ----------

window.addEventListener("keydown", (e) => {
  if (settingsDialog.open || helpDialog.open) return;
  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;
  switch (e.code) {
    case "Space":
      e.preventDefault();
      commandStartPause();
      break;
    case "KeyL":
      commandLap();
      break;
    case "KeyR":
      commandReset();
      break;
    case "KeyV":
    case "ArrowUp":
    case "ArrowDown":
      if (!locked) switchView();
      break;
  }
});

// ---------- Settings dialog ----------

function field(name: keyof Settings): HTMLInputElement | HTMLSelectElement {
  const el = settingsForm.elements.namedItem(name);
  if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLSelectElement)) {
    throw new Error(`Missing settings field ${name}`);
  }
  return el;
}

function populateSettingsForm(): void {
  (field("digitColor") as HTMLInputElement).value = normalizeHex(settings.digitColor);
  (field("bgColor") as HTMLInputElement).value = normalizeHex(settings.bgColor);
  field("font").value = settings.font;
  field("sizePct").value = String(settings.sizePct);
  field("letterSpacing").value = String(settings.letterSpacing);
  field("layout").value = settings.layout;
  field("stopwatchHours").value = settings.stopwatchHours;
  field("fractionDigits").value = String(settings.fractionDigits);
  field("delaySeconds").value = String(settings.delaySeconds);
  field("hourMode").value = settings.hourMode;
  field("tapCommand").value = settings.tapCommand;
  field("clockFace").value = settings.clockFace;
  field("secondHand").value = settings.secondHand;
  (field("clockShowSeconds") as HTMLInputElement).checked = settings.clockShowSeconds;
  (field("soundEnabled") as HTMLInputElement).checked = settings.soundEnabled;
  (field("multiEnabled") as HTMLInputElement).checked = settings.multiEnabled;
  (field("keepAwake") as HTMLInputElement).checked = settings.keepAwake;
}

/** <input type=color> only accepts #rrggbb; expand #rgb. */
function normalizeHex(hex: string): string {
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return hex.toLowerCase();
}

function readSettingsForm(): void {
  const previousMulti = settings.multiEnabled;
  settings = {
    digitColor: (field("digitColor") as HTMLInputElement).value,
    bgColor: (field("bgColor") as HTMLInputElement).value,
    font: field("font").value as Settings["font"],
    sizePct: Number(field("sizePct").value),
    letterSpacing: Number(field("letterSpacing").value),
    layout: field("layout").value as Settings["layout"],
    stopwatchHours: field("stopwatchHours").value as Settings["stopwatchHours"],
    fractionDigits: Number(field("fractionDigits").value) as Settings["fractionDigits"],
    clockShowSeconds: (field("clockShowSeconds") as HTMLInputElement).checked,
    clockFace: field("clockFace").value as Settings["clockFace"],
    secondHand: field("secondHand").value as Settings["secondHand"],
    hourMode: field("hourMode").value as Settings["hourMode"],
    delaySeconds: Math.min(3600, Math.max(0, Math.floor(Number(field("delaySeconds").value) || 0))),
    tapCommand: field("tapCommand").value as Settings["tapCommand"],
    soundEnabled: (field("soundEnabled") as HTMLInputElement).checked,
    multiEnabled: (field("multiEnabled") as HTMLInputElement).checked,
    keepAwake: (field("keepAwake") as HTMLInputElement).checked,
  };
  persistSettings(); // FMT-005, DSP-007, PST-001
  applyTheme();
  syncSoundChrome();
  renderedLapCount = -1; // re-render laps with the new format
  if (previousMulti !== settings.multiEnabled) rebuildMultiCards();
}

settingsForm.addEventListener("input", readSettingsForm);
settingsForm.addEventListener("change", readSettingsForm);
$("btn-swap-colors").addEventListener("click", () => {
  settings = swapColors(settings); // DSP-010
  persistSettings();
  applyTheme();
  populateSettingsForm();
});
$("btn-defaults").addEventListener("click", () => {
  settings = { ...DEFAULT_SETTINGS };
  persistSettings();
  applyTheme();
  syncSoundChrome();
  populateSettingsForm();
  rebuildMultiCards();
});

// ---------- Service worker & update toast (PWA-003, PWA-005) ----------

registerServiceWorker((apply) => {
  updateToast.hidden = false;
  btnUpdate.addEventListener("click", () => {
    updateToast.hidden = true;
    apply();
  });
});

// ---------- Boot ----------

applyTheme();
syncViewChrome();
syncLockChrome();
syncSoundChrome();
rebuildMultiCards();
requestAnimationFrame(render);
