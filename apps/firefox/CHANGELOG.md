# @mute-tab-manager/firefox

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
