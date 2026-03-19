# @mute-tab/shared

## 0.3.1

### Patch Changes

- b014bc8: Fix release workflow to read version from workspace packages, validate version sync across packages, and guard against undefined version producing phantom tags.

## 0.3.0

### Minor Changes

- 1140ee1: Restructure as a Turborepo monorepo with Firefox support.

  - Add `apps/firefox` — a full Firefox MV3 extension using `matchMedia()` in the service worker (Firefox 128+, no offscreen API needed)
  - Add `packages/shared` — shared constants, types, and content-script code consumed by both browser packages
  - Move Chrome extension sources into `apps/chrome`
  - Add Turborepo (`turbo.json`) for parallel, dependency-aware builds and task caching
  - Migrate type-checking from `typescript` to `@typescript/native-preview` (`tsgo`)
  - Add unified versioning via Changesets `fixed` groups
  - Update CI to run lint, typecheck, build, and tests across all packages via Turbo
  - Rewrite `scripts/release.ts` to produce separate Chrome and Firefox zips in a single GitHub release
