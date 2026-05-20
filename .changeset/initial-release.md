---
"mute-tab-manager": minor
---

Initial WXT-based single-codebase rewrite. One TypeScript source tree builds
Chrome MV3 and Firefox MV3 extensions via WXT. Persistent Chrome extension ID
via generated RSA private key. Ultracite + Changesets + GitHub Actions CI/release
+ Lefthook + Bun test suite using happy-dom and a Chrome API mock.
