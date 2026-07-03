# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Stacked digit layout: each hours/minutes/seconds group on its own line with the stopwatch fraction shown small in the bottom-right corner — applied automatically in portrait orientation, or forced via the new **Layout** setting (automatic / single line / stacked) for both the stopwatch and the clock (DSP-009)
- In-app help dialog (**?** button): offline usage guide covering commands, gestures, and keyboard shortcuts, with links to the source code and full documentation (HLP-001, HLP-002)
- **⇄ Swap colors** button in Settings to invert digit and background colors in one tap, applied and persisted immediately (DSP-010)

## [0.1.0] - 2026-07-02

### Added

- Giant stopwatch with start/pause/resume/reset and laps (cumulative + split times), rendered with screen-filling auto-sized digits
- Timestamp-based timing engine: elapsed time stays exact through background throttling and page reloads
- Delayed start with visual countdown and locally generated audio cues ("3… 2… 1…"), cancellable, with a visual fallback when audio is unavailable
- Giant clock view with optional seconds and 12 h / 24 h format (locale-based automatic default, AM/PM indicator in 12 h mode)
- Display theme settings: digit color, background color, font (local system stacks), relative size, letter spacing, stopwatch hours/precision format
- View switching by vertical swipe with an accessible button alternative; last active view restored on startup
- Tap-on-display as a configurable command (lap, start/pause, or disabled)
- Keyboard shortcuts: Space (start/pause), L (lap), R (reset), V/arrows (switch view)
- Lock mode ignoring accidental commands, with a visible indicator and a one-second hold-to-unlock gesture
- Optional multiple independent stopwatches
- Screen wake lock while timing or showing the clock (graceful degradation when unsupported)
- Local persistence of settings, stopwatch state, and active view, with defensive recovery from corrupted data
- PWA: web manifest, generated icons, and a network-first service worker precaching all assets for full offline operation, with an in-app update prompt
- Bun toolchain: dev server with hot reload, `bun test` suite for the timing core, reproducible static production build with bundle-size budget check
- GitHub Actions workflow: tests, typecheck, build, and deployment to GitHub Pages
- justfile with recipes wrapping the Bun scripts (`just dev`, `just test`, `just ci`, …)

[Unreleased]: https://github.com/s-celles/giant-chrono/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/s-celles/giant-chrono/releases/tag/v0.1.0
