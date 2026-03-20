---
"@mute-tab-manager/chrome": minor
"@mute-tab-manager/firefox": minor
"@mute-tab-manager/shared": minor
---

Rename project and all packages from `mute-tab` / `@mute-tab/*` to `mute-tab-manager` / `@mute-tab-manager/*`.

### Package renames

| Before | After |
|---|---|
| `mute-tab` (root) | `mute-tab-manager` |
| `@mute-tab/chrome` | `@mute-tab-manager/chrome` |
| `@mute-tab/firefox` | `@mute-tab-manager/firefox` |
| `@mute-tab/shared` | `@mute-tab-manager/shared` |

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
