# Mute Tab

A Chrome extension that properly mutes tabs — including YouTube, which ignores Chrome's native tab mute.

## Why This Exists

Chrome's built-in tab mute (`chrome.tabs.update({ muted: true })`) silences a tab's audio output, but it does not update YouTube's player UI or the underlying `HTMLVideoElement.muted` state. This extension supplements the native mute by also directly setting `video.muted` via a content script, keeping YouTube's player in sync and surviving SPA navigations and page reloads.

## Features

- **Mute any tab** — click the toolbar icon or press `Alt+Shift+M`
- **YouTube support** — directly mutes `<video>` elements, surviving SPA navigation and page reloads
- **Mute All Tabs** — right-click the toolbar icon → "Mute All Tabs"
- **Visual badge** — "M" badge appears on the icon when a tab is muted
- **Dark mode aware** — icon adapts to system light/dark preference
- **Persistent state** — muted tabs stay muted across navigation within the same session

## Installation

### From Source

```bash
bun install
bun run build
```

Then load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Keyboard Shortcut

`Alt+Shift+M` toggles mute on the active tab. You can customise this at `chrome://extensions/shortcuts`.

## Development

```bash
bun install          # install dependencies
bun run build        # production build → dist/
bun run build:watch  # rebuild on file changes
bun run check        # lint + format check
bun run fix          # auto-fix lint + format issues
```

## How It Works

| Component | File | Purpose |
|---|---|---|
| Service worker | `src/service-worker.ts` | Handles toolbar clicks, keyboard shortcuts, context menus, badge/icon updates, and tab lifecycle |
| Content script | `src/content-youtube.ts` | Runs on YouTube pages; directly sets `HTMLVideoElement.muted`, watches for new `<video>` elements via `MutationObserver` |
| Offscreen document | `src/offscreen.ts` | Detects system dark/light mode via `matchMedia` and reports back to the service worker |

Built with [Bun](https://bun.sh) and TypeScript. Linted and formatted with [Ultracite](https://github.com/haydenbleasel/ultracite) (Biome).

## Permissions

| Permission | Reason |
|---|---|
| `tabs` | Query and mute all open tabs |
| `activeTab` | Access the currently active tab |
| `contextMenus` | Add right-click menu items to the toolbar icon |
| `offscreen` | Create an offscreen document for dark mode detection |
| `storage` | Persist muted state across tab navigations |
| `*://*.youtube.com/*` | Inject content script to mute YouTube video elements |

## License

MIT — see [LICENSE](LICENSE).
