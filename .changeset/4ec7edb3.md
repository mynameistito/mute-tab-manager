---
"mute-tab-manager": patch
---

Fix the Chrome signing key workflow so releases use WXT's expected secret name and local key generation is safer by default.

- Rename the GitHub Actions signing key secret from `EXTENSION_KEY_PEM` to `WXT_CHROME_KEY` and update the release workflow validation/error messaging to match.
- Change `bun run generate-key` to create a fresh local `key.pem` with `openssl`, refuse to overwrite an existing key unless `--force`/`-f` is passed, and print the derived Chromium extension ID plus the matching `gh secret set WXT_CHROME_KEY` command.
- Stop regenerating and committing `extension-key.json`; the derived public key metadata is no longer kept in the repo, and the previously committed key metadata has been removed.
- Update README signing-key docs and command references to document `WXT_CHROME_KEY`, the safer default generation behavior, and the explicit force flag for extension ID rotation.
- Update Extension ID
