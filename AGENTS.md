# MUTE TAB MANAGER - Project Knowledge Base

**Stack:** TypeScript · Bun · Turborepo · Manifest V3 (Chrome & Firefox)

## OVERVIEW

Browser extension monorepo for managing muted tabs. Supports both Chrome and Firefox via Manifest V3. Uses Bun's native bundler, Turborepo for orchestration, and Ultracite/Biome for code quality.

## STRUCTURE

```
mute-tab-manager/
├── apps/
│   ├── chrome/     # Chrome MV3 extension (offscreen document for dark mode)
│   └── firefox/    # Firefox MV3 extension (native matchMedia support)
├── packages/
│   └── shared/      # Types, constants, content script (no build step)
└── scripts/        # Build utilities, release automation
```

**Key insight:** `packages/shared` has no build output—apps import TypeScript directly via relative paths.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Mute/unmute logic | `apps/chrome/src/service-worker.ts`, `apps/firefox/src/service-worker.ts` |
| Content script (YouTube) | `packages/shared/src/content-youtube.ts` |
| Chrome/Firefox differences | `apps/chrome/src/offscreen.ts` vs `apps/firefox/src/service-worker.ts` |
| Type definitions | `packages/shared/src/types/messages.ts` |
| Constants | `packages/shared/src/constants.ts` |
| Build scripts | `apps/chrome/scripts/build.ts`, `apps/firefox/scripts/build.ts` |
| Chrome API mock (tests) | `packages/shared/__tests__/helpers/chrome-mock.ts` |

## CODE MAP

| Symbol | Location | Role |
|--------|----------|------|
| `withStorageLock` | `service-worker.ts:23` | Mutex for concurrent storage ops |
| `ensureOffscreenDocument` | `chrome/service-worker.ts` | Chrome-only dark mode helper |
| `initDarkModeDetection` | `firefox/service-worker.ts` | Firefox native matchMedia |
| `STORAGE_KEY_MUTED_TABS` | `constants.ts` | Storage key for muted tabs map |
| `SetMutedMessage` | `types/messages.ts` | Type-def for content script messaging |

## CONVENTIONS

### TypeScript
- `noUncheckedIndexedAccess: true` — array access requires bounds check
- `verbatimModuleSyntax: true` — preserves import/export syntax
- Type checker: `tsgo` (native TypeScript preview)

### Build
- Bundle target: `browser`, format: `esm`, minify: `true`
- No bundler config files—`Bun.build()` called directly in scripts
- Turbo pipeline: `build → typecheck → test` (sequential dependencies)

### Extension Manifest
- Chrome: `background.service_worker`
- Firefox: `background.scripts` array
- Firefox requires `browser_specific_settings.gecko.id`
- Firefox min version: `140.0` (for full MV3 support)

### Storage
- Uses `chrome.storage.session` (cleared on browser close)
- Storage lock pattern prevents race conditions

## ANTI-PATTERNS

| Don't | Do Instead |
|-------|------------|
| Use `browser.*` API | Use `chrome.*` (works in both) |
| Use `chrome.storage.local` for session state | Use `chrome.storage.session` |
| Forget null checks on `tab.id` | Use type guards: `tab.id != null` |
| Use barrel files (index re-exports) | Import via subpath exports |
| Run async ops without storage lock | Use `withStorageLock(fn)` |

## COMMANDS

```bash
bun run build          # Build all apps
bun run typecheck      # Type check all packages
bun run test           # Run tests
bun run test:coverage  # Run tests with coverage
bun run check          # Lint/format check
bun run fix            # Auto-fix lint/format issues
```

## NOTES

- **Version sync:** All 3 packages version-locked via changesets
- **Console.log:** Allowed in `scripts/` (build tools), forbidden in app code
- **Chrome mock:** Preloaded via `bunfig.toml` for all tests
- **Offscreen:** Chrome-only; Firefox has native service worker `matchMedia`

---

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Diagnose setup**: `bun x ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.