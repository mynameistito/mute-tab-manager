# Mute Tab Manager

> Silence any tab instantly — with real YouTube support.

A WXT-powered browser extension that mutes/unmutes tabs across Chrome and
Firefox from a single TypeScript codebase. Supplements Chrome's built-in tab
mute (which silences audio output but doesn't sync YouTube's player UI) by
directly setting `HTMLVideoElement.muted` via a content script.

## Features

- **Mute any tab** — click the toolbar icon or press `Alt+Shift+M`
- **YouTube support** — mutes `<video>` elements directly, surviving SPA
  navigation and reloads
- **Mute all tabs** — right-click the toolbar icon → *Mute All Tabs*
- **Visual badge** — "M" appears on the icon when a tab is muted
- **Dark-mode aware** — icon adapts to system theme (offscreen document on
  Chrome, native `matchMedia` on Firefox)
- **Persistent state** — muted tabs stay muted across navigations in the
  same session
- **One codebase, two browsers** — WXT builds Chrome + Firefox from the
  same source

## Tech stack

| Concern | Tool |
|---|---|
| Extension framework | [WXT](https://wxt.dev) |
| Package manager | [Bun](https://bun.sh) |
| Build/script runtime | [Node](https://nodejs.org) (via `--experimental-strip-types`) |
| Language | TypeScript (strict) |
| Lint + format | [Ultracite](https://github.com/haydenbleasel/ultracite) (Biome) |
| Versioning | [Changesets](https://github.com/changesets/changesets) |
| Hooks | [Lefthook](https://lefthook.dev) |
| Tests | `bun test` + [happy-dom](https://github.com/capricorn86/happy-dom) |

## Quick start

```bash
bun install                    # installs deps and runs `wxt prepare`
bun run generate-key           # generates key.pem + extension-key.json (first run)
bun run dev                    # Chrome dev mode with HMR
bun run dev:firefox            # Firefox dev mode
bun run build                  # production builds for Chrome + Firefox → .output/
bun run zip                    # zipped artefacts ready for store submission
```

### Loading the built extension

**Chrome** (`.output/chrome-mv3/`):
1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select `.output/chrome-mv3/`

**Firefox** (`.output/firefox-mv3/`):
1. `about:debugging` → **This Firefox**
2. **Load Temporary Add-on…** → select `.output/firefox-mv3/manifest.json`

## Persistent Chrome extension ID

`scripts/generate-key.ts` creates a 2048-bit RSA private key (`key.pem`)
and writes the derived SPKI public key + deterministic extension ID into
`extension-key.json`. `wxt.config.ts` reads that file and injects the
public key into the Chrome manifest's `key` field so the extension always
loads under the same ID — regardless of machine or unpack location.

- `key.pem` is **gitignored** (private). Keep it safe; reuse it via the
  `EXTENSION_KEY_PEM` GitHub Actions secret in `release.yml`.
- `extension-key.json` **is committed** — it only contains the public key
  and the derived ID, both safe to share.

Lost the key? Run `bun run generate-key` again. The extension ID will
change, so anyone with the old ID installed will see it as a different
extension.

## Project layout

```
mute-tab-manager/
├── src/
│   ├── entrypoints/
│   │   ├── background.ts          # service-worker / cross-browser bg
│   │   ├── youtube.content.ts     # YouTube <video>.muted enforcer
│   │   └── offscreen/             # Chrome-only matchMedia bridge
│   │       ├── index.html
│   │       └── main.ts
│   └── utils/                     # constants, messages, storage, mute, badge
├── public/icons/              # 16/48/128 PNG + source SVG
├── __tests__/                 # Bun + happy-dom tests
├── scripts/                   # generate-key, generate-icons, release
├── .github/workflows/         # ci.yml + release.yml
├── .changeset/                # changeset config
├── wxt.config.ts              # per-browser manifest builder
├── biome.jsonc                # Ultracite preset
├── lefthook.yml               # pre-commit hooks
└── bunfig.toml                # bun test preload + coverage
```

## Commands

| Command | Purpose |
|---|---|
| `bun run dev` | WXT dev with HMR (Chrome) |
| `bun run dev:firefox` | WXT dev (Firefox) |
| `bun run build` | Production build (both browsers) |
| `bun run zip` | Build + zip both browsers |
| `bun run typecheck` | TypeScript check |
| `bun run check` | Ultracite lint + format check |
| `bun run fix` | Ultracite auto-fix |
| `bun run test` | Run Bun test suite |
| `bun run test:coverage` | Coverage (lcov + text) |
| `bun run generate-key` | (Re-)derive Chrome `key` + extension ID |
| `bun run generate-icons` | Re-rasterise SVG → PNG icons |
| `bun run changeset` | Add a changeset |
| `bun run release` | Build + publish GitHub release |

## Permissions

| Permission | Chrome | Firefox | Reason |
|---|:---:|:---:|---|
| `tabs` | ✓ | ✓ | Query and mute open tabs |
| `activeTab` | ✓ | ✓ | Access the active tab |
| `contextMenus` | ✓ | ✓ | Right-click toolbar menu |
| `offscreen` | ✓ | — | Dark-mode detection (Chrome) |
| `storage` | ✓ | ✓ | Persist muted state |
| `*://*.youtube.com/*` | ✓ | ✓ | Content script |

## License

MIT — see [LICENSE](LICENSE).
