---
"@mute-tab-manager/chrome": patch
"@mute-tab-manager/firefox": patch
"@mute-tab-manager/shared": patch
---

Update devDependencies and fix CI test reliability

- Bump `@biomejs/biome` to 2.4.8, `@types/bun` to 1.3.11, `@typescript/native-preview` to 7.0.0-dev.20260324.1, `happy-dom` to 20.8.8, `turbo` to 2.8.20, and `ultracite` to 7.3.2
- Hoist shared devDependencies (`@types/bun`, `happy-dom`, `ultracite`) from `packages/shared` and `apps/firefox` to the workspace root to deduplicate
- Fix flaky `MutationObserver` tests on CI by improving the `chrome-mock` helpers with `snapshotListeners`, `restoreListeners`, and `listenerDelta` utilities
- Fix `MutationObserver` `instanceof` check failing on CI
- Fix cross-package `bun test` isolation by switching service-worker tests to dynamic imports with listener snapshot/restore
