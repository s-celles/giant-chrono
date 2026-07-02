# Development

## Toolchain (BLD)

[Bun](https://bun.sh) is the package manager, script runner, test runner, dev server, and bundler (BLD-001). Node.js is not required.

| Command | Purpose |
|---|---|
| `bun install` | Install dev dependencies |
| `bun run dev` | Dev server with hot reload on <http://localhost:3000> (BLD-002) |
| `bun test` | Unit tests (`tests/`, bun:test) |
| `bun run typecheck` | TypeScript strict type-checking |
| `bun run build` | Production build into `dist/` (BLD-003) |
| `bun run preview` | Serve `dist/` on <http://localhost:4173> |

A [justfile](https://just.systems) mirrors these commands: `just dev`, `just test`, `just typecheck`, `just build`, `just preview`, `just clean`, and `just ci` (tests + typecheck + build).

The dev server runs without a service worker (registration is production-only); use `build` + `preview` to test PWA behavior (install, offline, updates).

## Tests (BLD-006)

The pure core is developed test-first. Suites cover the stopwatch engine (start/pause/resume/reset/laps, timestamp exactness, reload restoration), elapsed and clock formatting (including 12/24 h and locale defaults), the countdown, settings validation, and persistence corruption recovery.

```sh
bun test
```

## Production build (BLD-003, BLD-004)

`scripts/build.ts`:

1. bundles `index.html` (JS + CSS, minified, hashed filenames) with `Bun.build`;
2. generates the PWA icons and copies the manifest;
3. injects manifest/icon links with relative paths;
4. computes a version hash over all output files;
5. builds `sw.js` with the precache list and version injected;
6. fails the build if the artifact exceeds the 300 kB gzip budget (NFR-007).

The same sources always produce the same artifact. `dist/` is plain static files — deploy it to any file host.

## Continuous deployment

`.github/workflows/deploy.yml` runs tests and the typecheck on every push and pull request; on pushes to `main` it builds and deploys `dist/` to GitHub Pages.

## Conventions (BLD-005)

- Code identifiers and comments in English; conventional commit messages (`feat:`, `fix:`, …); [SemVer](https://semver.org); [Keep a Changelog](https://keepachangelog.com).
- Comments reference spec requirement IDs (e.g. `STW-006`) where they implement one.
