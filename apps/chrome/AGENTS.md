# CHROME EXTENSION

Chrome MV3 extension for tab muting. Uses offscreen document for dark mode detection since Chrome service workers lack DOM access.

## WHERE TO LOOK

| Task | File |
|------|------|
| Mute toggle logic, storage, events | `src/service-worker.ts` |
| Dark mode detection (matchMedia) | `src/offscreen.ts` |
| Manifest V3 configuration | `public/manifest.json` |
| Bun.build bundler | `scripts/build.ts` |

## KEY SYMBOLS

| Symbol | Location | Role |
|--------|----------|------|
| `withStorageLock` | `service-worker.ts:28` | Mutex for concurrent storage ops |
| `ensureOffscreenDocument` | `service-worker.ts:170` | Creates offscreen doc for dark mode |
| `getIsDarkMode` | `service-worker.ts:64` | Reads dark mode from session storage |
| `toggleMuteTab` | `service-worker.ts:126` | Core mute toggle logic |
| `sendMuteToContentScript` | `service-worker.ts:113` | Messages YouTube content script |

## CHROME-SPECIFIC PATTERNS

**Offscreen Document Pattern:** Chrome service workers cannot access DOM APIs like `matchMedia`. The extension creates an offscreen document (`offscreen.html`) that runs `window.matchMedia("(prefers-color-scheme: dark)")` and sends results back via `chrome.runtime.sendMessage`. Firefox doesn't need this—its service workers support `matchMedia` natively.

**Manifest Differences:**
- Chrome: `background.service_worker` (single string)
- Firefox: `background.scripts` (array)
- Chrome requires `offscreen` permission

**Storage:** Uses `chrome.storage.session` (cleared on browser close). The `withStorageLock` mutex prevents race conditions when multiple events modify muted tabs map concurrently.

**Badge/Icon Theming:** Icons have dark/light variants (`icon-16-muted-dark.png`, etc.). Dark mode state comes from offscreen document via `DARK_MODE_RESPONSE` messages.

## BUILD NOTES

- Entry points: `service-worker.ts`, `offscreen.ts`, and shared `content-youtube.ts`
- Bun builds all three to `dist/` as ESM with minification
- Build script copies `public/` → `dist/` (manifest, icons, offscreen.html)
- No bundler config files—`Bun.build()` called directly in `scripts/build.ts`