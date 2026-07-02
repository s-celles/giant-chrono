# GiantChrono

A fully local, offline-first **Progressive Web App** showing a stopwatch and a clock with **giant digits**, readable from a distance (poolside, climbing gym, stadium). No ads, no accounts, no data collection.

GiantChrono reimplements the feature set of [Giant Stopwatch](https://github.com/arpruss/simplestopwatch) by Alexander Pruss / Omega Centauri as a web app, and adds **12 h / 24 h** clock format support.

## Features

- **Giant stopwatch** — start/pause/resume/reset, laps with cumulative and split times, digits auto-sized to fill the screen
- **Delayed start** — configurable countdown with audio "3… 2… 1…" cues (generated locally with the Web Audio API)
- **Giant clock** — local time, optional seconds, **12 h / 24 h** format (automatic from your locale by default)
- **Themes** — digit color, background color, font, relative size, letter spacing, stopwatch precision
- **Gestures & commands** — vertical swipe (or button) to switch stopwatch/clock, tap-on-display as a configurable command, keyboard shortcuts (Space, L, R, arrows)
- **Lock mode** — ignore accidental touches (splash-proof); hold for one second to unlock
- **Multiple stopwatches** — optional independent stopwatches
- **Screen wake lock** — keeps the display on while timing (where supported)
- **Persistence** — settings and stopwatch state survive reloads; a running stopwatch stays exact because elapsed time derives from timestamps, not tick counting
- **Offline PWA** — installable, works with no network at all, updates in place

## Quick start

Requires [Bun](https://bun.sh) ≥ 1.2.

```sh
bun install
bun run dev        # dev server with hot reload
bun test           # unit tests (timing logic, formats, persistence)
bun run build      # production build into dist/
bun run preview    # serve dist/ locally
```

The production `dist/` folder is a plain static artifact deployable on any file host, at a domain root or a subdirectory (asset URLs are scope-relative).

## Documentation

See [docs/](docs/README.md) for the feature guide, architecture notes, and development workflow.

## Privacy

All data stays on your device (`localStorage`). The app performs no network requests for tracking, analytics, or advertising — the only network use is fetching its own static files.

## License

[MIT](LICENSE) — © Sébastien Celles.

This project was developed with AI assistance.
