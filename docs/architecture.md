# Architecture

## Overview

GiantChrono is a framework-free TypeScript PWA bundled with Bun. The code separates a **pure, unit-tested core** from the **DOM layer**:

```
index.html            App shell (semantic HTML, ARIA labels)
src/
  core/               Pure logic — no DOM, fully unit-tested
    stopwatch.ts      Timestamp-based stopwatch engine
    format.ts         Elapsed/clock formatting, 12/24 h via Intl
    countdown.ts      Delayed-start countdown status
    settings.ts       Settings model + defensive validation
    persistence.ts    localStorage load/save with corruption recovery
  main.ts             Application wiring: state, views, commands, render loop
  fit.ts              Giant-digit auto-fit (canvas text measurement)
  audio.ts            Web Audio beeps (countdown cues)
  wakelock.ts         Screen Wake Lock with reacquisition
  sw-register.ts      Service worker registration + update prompt
  sw.ts               Service worker (precache + network-first)
  styles.css          Theme via CSS custom properties
scripts/
  build.ts            Production build (bundle, icons, manifest, SW injection)
  generate-icons.ts   Deterministic PNG icon generation (no binary assets in git)
  preview.ts          Static server for dist/
tests/                bun:test suites for src/core
```

## Timing model (CTR-005)

The stopwatch never accumulates ticks. Its state is:

```ts
{ running, startEpoch, accumulated, laps }
```

Elapsed time is always `accumulated + (now − startEpoch)` while running. Consequences:

- Background tab throttling cannot cause drift (STW-006, NFR-001) — the display may pause, the value cannot.
- The state serializes to JSON; after a reload, the same formula restores the exact elapsed time (STW-007).
- The engine is purely functional (`start/pause/reset/lap/elapsed` take `now` as an argument), which makes it trivially testable.

The delayed start works the same way: the countdown is a pure function of `(startEpoch, delaySeconds, now)`, and when it completes the stopwatch is started at the *scheduled* epoch, not at the frame timestamp, so the delay is exact.

## Rendering

A single `requestAnimationFrame` loop formats the active value and writes it to the DOM only when the text changed. Digit size is computed by `fit.ts`: the text template (digits normalized to `0`) is measured with a canvas 2D context at a reference size, then scaled to the container; results are cached per element until geometry, template length, or theme change (DSP-001, DSP-002). `font-variant-numeric: tabular-nums` keeps the width stable while counting.

## Settings and persistence

`settings.ts` validates every field independently (type, range, enum, hex-color regex) and falls back to defaults per field — a corrupted or hostile `localStorage` payload can never crash the app or produce an unreadable theme (DSP-008, PST-003). `persistence.ts` wraps `localStorage` behind an injectable `Storage` interface so tests run against an in-memory implementation.

## PWA design

- **Install**: `manifest.webmanifest` with generated PNG icons (any + maskable).
- **Offline**: at install the service worker precaches every built asset (list injected at build time), so the app is fully functional offline from the first visit (PWA-004).
- **Runtime strategy**: network-first with cache fallback — fresh content whenever online, cached content offline.
- **Updates**: the cache name embeds a content hash of the build. A new deploy installs into a new cache; the page shows an "Update available" prompt, and on confirmation the waiting worker takes over and the page reloads (PWA-005). `localStorage` is untouched.
- **Base-path independence**: precache entries are relative and resolved against the service worker registration scope, so the same artifact works at a domain root or a subdirectory (e.g. GitHub Pages project sites).

## Icon generation

`scripts/generate-icons.ts` draws the stopwatch glyph with signed-distance functions and encodes PNGs from scratch (zlib + CRC32), producing byte-identical output for identical sources (BLD-004). No binary assets are committed.
