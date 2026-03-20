# @mute-tab-manager/firefox

## 0.3.3

### Patch Changes

- d7ec418: Fix Firefox manifest warnings: remove unsupported `service_worker` key (use `scripts` only), bump `strict_min_version` to 140.0 to match when `data_collection_permissions` was introduced on desktop Firefox.
  - @mute-tab-manager/shared@0.3.3

## 0.3.2

### Patch Changes

- 0bbeeaf: Fix Firefox manifest validation errors: add `background.scripts` fallback alongside `service_worker`, and add `data_collection_permissions` to `browser_specific_settings.gecko`.
  - @mute-tab-manager/shared@0.3.2

## 0.3.1

### Patch Changes

- b014bc8: Fix release workflow to read version from workspace packages, validate version sync across packages, and guard against undefined version producing phantom tags.
- Updated dependencies [b014bc8]
  - @mute-tab-manager/shared@0.3.1

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

### Patch Changes

- Updated dependencies [1140ee1]
  - @mute-tab-manager/shared@0.3.0
