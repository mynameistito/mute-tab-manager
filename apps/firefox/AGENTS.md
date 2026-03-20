# FIREFOX EXTENSION

Firefox MV3 extension with native DOM API support in service workers (Firefox 128+).

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Dark mode detection | `src/service-worker.ts:168-183` |
| Manifest config | `public/manifest.json` |
| Build output | `scripts/build.ts` |
| Tests | `__tests__/service-worker.test.ts` |

## KEY SYMBOLS

| Symbol | Location | Role |
|--------|----------|------|
| `initDarkModeDetection` | `service-worker.ts:168` | Native matchMedia dark mode listener |
| `MutedTabsMap` | `service-worker.ts:17` | Tab ID → muted state map |
| `browser_specific_settings` | `manifest.json:39-47` | Firefox-specific manifest block |

## FIREFOX-SPECIFIC PATTERNS

### Native matchMedia Support
Firefox 128+ supports `matchMedia()` directly in MV3 service workers. No offscreen document needed:
```typescript
const mq = matchMedia("(prefers-color-scheme: dark)");
chrome.storage.session.set({ isDarkMode: mq.matches });
mq.addEventListener("change", (e) => { ... });
```

### Manifest Differences from Chrome
| Field | Firefox | Chrome |
|-------|---------|--------|
| Background | `background.scripts: ["service-worker.js"]` | `background.service_worker: "service-worker.js"` |
| Required | `browser_specific_settings.gecko.id: "mute-tab@mynameistito"` | N/A |
| Min version | `strict_min_version: "140.0"` | N/A |

### API Compatibility
- Use `chrome.*` API (not `browser.*`) for cross-browser compatibility
- Both APIs work in Firefox; `chrome.*` is preferred for shared code

## BUILD NOTES

- Entry points: `src/service-worker.ts`, `packages/shared/src/content-youtube.ts`
- Output: `dist/service-worker.js`, `dist/content-youtube.js`
- Copies `public/` → `dist/` after build (manifest, icons)
- No offscreen.ts needed (unlike Chrome)