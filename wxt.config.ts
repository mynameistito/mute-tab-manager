import { createPublicKey } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "wxt";


/**
 * Load the raw private-key PEM string used to derive a stable Chrome extension ID.
 *
 * - In dev / local builds we read `key.pem` from the repo root.
 * - In CI we accept `WXT_CHROME_KEY` as the raw private-key PEM (from a secret).
 * - Only relevant for Chromium targets — Firefox uses `browser_specific_settings`.
**/
const loadPemSource = (): string | undefined => {
  const fromEnv = process.env.WXT_CHROME_KEY;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  const keyPath = path.resolve("key.pem");
  if (existsSync(keyPath)) {
    return readFileSync(keyPath, "utf-8");
  }
};

const loadManifestKey = (): string | undefined => {
  const pem = loadPemSource();
  if (!pem) {
    return;
  }

  const spkiPem = createPublicKey(pem).export({
    format: "pem",
    type: "spki",
  }) as string;

  return spkiPem
    .replaceAll("-----BEGIN PUBLIC KEY-----", "")
    .replaceAll("-----END PUBLIC KEY-----", "")
    .replaceAll(/\s+/gu, "");
};

export default defineConfig({
  manifest: ({ browser }) => {
    const base = {
      action: {
        default_icon: {
          128: "icons/icon-128.png",
          16: "icons/icon-16.png",
          48: "icons/icon-48.png",
        },
        default_title: "Toggle Mute",
      },
      commands: {
        "toggle-mute": {
          description: "Toggle mute for the active tab",
          suggested_key: { default: "Alt+Shift+M" },
        },
      },
      description:
        "Mute and unmute tabs across Chrome and Firefox with YouTube support.",
      host_permissions: ["*://*.youtube.com/*"],
      icons: {
        128: "icons/icon-128.png",
        16: "icons/icon-16.png",
        48: "icons/icon-48.png",
      },
      name: "Mute Tab Manager",
      permissions: ["activeTab", "tabs", "contextMenus", "storage"],
    };

    if (browser === "firefox") {
      return {
        ...base,
        browser_specific_settings: {
          gecko: {
            data_collection_permissions: { required: ["none"] },
            id: "mute-tab-manager@mynameistito.com",
            strict_min_version: "140.0",
          },
        },
      };
    }

    const key = loadManifestKey();
    return {
      ...base,
      ...(key ? { key } : {}),
      permissions: [...base.permissions, "offscreen"],
    };
  },
  manifestVersion: 3,
  outDir: ".output",
  srcDir: "src",
});
