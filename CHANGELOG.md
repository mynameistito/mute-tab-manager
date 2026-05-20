# mute-tab-manager

## 0.5.0

### Minor Changes

- e6e0cf9: updating adding the correct changeset.

### Patch Changes

- f8eabaf: WXT-based single-codebase rewrite. One TypeScript source tree builds Chrome MV3
  and Firefox MV3 extensions via WXT. Adds persistent Chrome extension ID via
  generated RSA private key. Ultracite + Changesets + GitHub Actions CI/release +
  Lefthook + Bun test suite using happy-dom and a Chrome API mock.

## 0.4.2

### Minor Changes

- Initial WXT-based single-codebase rewrite. One TypeScript source tree
  builds Chrome MV3 and Firefox MV3 extensions via WXT. Adds persistent
  Chrome extension ID via a generated RSA private key (`key.pem`) and
  the derived `manifestKey` embedded in the Chrome manifest. Ships with
  Ultracite (Biome), Changesets, GitHub Actions CI + release, Lefthook
  pre-commit hooks, and a Bun-powered test suite using happy-dom and a
  Chrome API mock.
