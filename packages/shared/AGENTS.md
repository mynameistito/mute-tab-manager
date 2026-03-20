# SHARED PACKAGE -Types, Constants, Content Script

**No build step** — TypeScript imported directly via relative paths from chrome/firefox apps.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Storage keys, commands, badge constants | `src/constants.ts` |
| Message type definitions | `src/types/messages.ts` |
| YouTube content script | `src/content-youtube.ts` |
| Chrome API mock for tests | `__tests__/helpers/chrome-mock.ts` |
| Test preload config | `bunfig.toml` |

## KEY SYMBOLS

| Symbol | Location | Role |
|--------|----------|------|
| `STORAGE_KEY_MUTED_TABS` | `src/constants.ts:1` | Storage key for muted tabs map |
| `STORAGE_KEY_DARK_MODE` | `src/constants.ts:2` | Storage key for dark mode flag |
| `SetMutedMessage` | `src/types/messages.ts:1` | Content script message type |
| `DarkModeResponseMessage` | `src/types/messages.ts:5` | Service worker message type |
| `applyMuteToAllVideos` | `src/content-youtube.ts:5` | Mute/unmute all video elements |
| `mockCalls` | `__tests__/helpers/chrome-mock.ts:100` | Track Chrome API calls in tests |
| `mockConfig` | `__tests__/helpers/chrome-mock.ts:82` | Configure mock behavior in tests |
| `mockEvents` | `__tests__/helpers/chrome-mock.ts:126` | Fire/simulate Chrome events in tests |
| `resetChromeMock` | `__tests__/helpers/chrome-mock.ts:58` | Reset mock state between tests |

## CONVENTIONS

### Exports
- Use subpath exports (`./constants`, `./types/messages`, `./content-youtube`)
- No barrel files — import directly via subpath

### Constants
- All constants use `as const` for literal types
- Naming: `STORAGE_KEY_*`, `COMMAND_*`, `CONTEXT_MENU_*`, `BADGE_*`, `ICON_*`

### Types
- Message types use `readonly` properties
- `InboundServiceWorkerMessage` / `InboundContentMessage` distinguish message direction

### Testing
- `chrome-mock.ts` preloaded via `bunfig.toml` — `global.chrome` available in all tests
- Use `resetChromeMock()` in `beforeEach()` to clear call tracking and storage
- Configure mock behavior via `mockConfig.*`, track calls via `mockCalls.*`

## ANTI-PATTERNS

| Don't | Do Instead |
|-------|------------|
| Add barrel file (index.ts) | Import via subpath exports |
| Use `any` in message types | Use `unknown` + type guards |
| Forget `resetChromeMock()` in tests | Reset in `beforeEach()` |
| Mutate `mockConfig` without resetting | Call `resetChromeMock()` after |
| Skip `as const` on constants | Always use `as const` for type safety |