# @mute-tab-manager/chrome

## 0.4.2

### Patch Changes

- 9acdd36: Update devDependencies and fix CI test reliability

  - Bump `@biomejs/biome` to 2.4.8, `@types/bun` to 1.3.11, `@typescript/native-preview` to 7.0.0-dev.20260324.1, `happy-dom` to 20.8.8, `turbo` to 2.8.20, and `ultracite` to 7.3.2
  - Hoist shared devDependencies (`@types/bun`, `happy-dom`, `ultracite`) from `packages/shared` and `apps/firefox` to the workspace root to deduplicate
  - Fix flaky `MutationObserver` tests on CI by improving the `chrome-mock` helpers with `snapshotListeners`, `restoreListeners`, and `listenerDelta` utilities
  - Fix `MutationObserver` `instanceof` check failing on CI
  - Fix cross-package `bun test` isolation by switching service-worker tests to dynamic imports with listener snapshot/restore

- Updated dependencies [9acdd36]
  - @mute-tab-manager/shared@0.4.2

## 0.4.1

### Patch Changes

- @mute-tab-manager/shared@0.4.1

## 0.4.0

### Minor Changes

- c7af3e5: Rename project and all packages from `mute-tab` / `@mute-tab/*` to `mute-tab-manager` / `@mute-tab-manager/*`.

  ### Package renames

  | Before              | After                       |
  | ------------------- | --------------------------- |
  | `mute-tab` (root)   | `mute-tab-manager`          |
  | `@mute-tab/chrome`  | `@mute-tab-manager/chrome`  |
  | `@mute-tab/firefox` | `@mute-tab-manager/firefox` |
  | `@mute-tab/shared`  | `@mute-tab-manager/shared`  |

  ### Extension display name

  Both `apps/chrome/public/manifest.json` and `apps/firefox/public/manifest.json` now show `"name": "Mute Tab Manager"` instead of `"Mute Tab"`.

  ### Firefox gecko add-on ID

  `apps/firefox/public/manifest.json` gecko ID updated from `mute-tab@mynameistito` to `mute-tab-manager@mynameistito`.

  ### Release ZIP filenames

  `scripts/release.ts` now produces:

  - `mute-tab-manager-chrome-v{version}.zip`
  - `mute-tab-manager-firefox-v{version}.zip`

  ### TypeScript path aliases

  Both `apps/chrome/tsconfig.json` and `apps/firefox/tsconfig.json` path alias keys updated from `@mute-tab/shared/*` to `@mute-tab-manager/shared/*`.

  ### Social preview

  `assets/social-preview.html` updated to reflect the new name ("Mute Tab Manager") and to surface Firefox support — eyebrow now reads "Chrome & Firefox Extension", a "Chrome & Firefox" feature chip was added, and the real Firefox SVG logo appears in the footer alongside the Chrome logo.

### Patch Changes

- Updated dependencies [c7af3e5]
  - @mute-tab-manager/shared@0.4.0

## 0.3.3

### Patch Changes

- @mute-tab-manager/shared@0.3.3

## 0.3.2

### Patch Changes

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
