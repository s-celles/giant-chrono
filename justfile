# GiantChrono task runner — https://just.systems
# Recipes wrap the Bun scripts defined in package.json (BLD-001).

# List available recipes
default:
    @just --list

# Install dependencies
install:
    bun install

# Dev server with hot reload (BLD-002)
dev:
    bun run dev

# Run the unit test suite
test:
    bun test

# TypeScript strict type-checking
typecheck:
    bun run typecheck

# Production build into dist/ (BLD-003)
build:
    bun run build

# Serve the production build locally
preview:
    bun run preview

# Remove build outputs
clean:
    rm -rf dist

# Everything CI runs: tests, typecheck, build
ci: test typecheck build
