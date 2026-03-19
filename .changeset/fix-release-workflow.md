---
"mute-tab": patch
"@mute-tab/chrome": patch
"@mute-tab/firefox": patch
"@mute-tab/shared": patch
---

Fix release workflow to read version from workspace packages, validate version sync across packages, and guard against undefined version producing phantom tags. Root package is now included in the changeset fixed group to stay in sync with workspace versions.
