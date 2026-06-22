import { readFileSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "wxt";

const here = import.meta.dirname;
const keyJsonPath = path.resolve(here, "extension-key.json");

interface ExtensionKeyJson {
  readonly extensionId: string;
  readonly generatedAt: string;
  readonly manifestKey: string;
}

const loadExtensionKey = (): ExtensionKeyJson => {
  try {
    const data = JSON.parse(readFileSync(keyJsonPath, "utf-8"));
    if (
      typeof data !== "object" ||
      data === null ||
      typeof (data as Record<string, unknown>).extensionId !== "string" ||
      typeof (data as Record<string, unknown>).manifestKey !== "string"
    ) {
      throw new Error(
        "Invalid extension-key.json: missing required fields (extensionId, manifestKey)"
      );
    }
    return data as ExtensionKeyJson;
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `Failed to load extension key from ${keyJsonPath}: ${err.message}`,
      { cause: error }
    );
  }
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
      description: "Mute/unmute tabs with proper YouTube support.",
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
            id: "mute-tab@mynameistito",
            strict_min_version: "140.0",
          },
        },
      };
    }

    // Chrome / Chromium
    const extensionKey = loadExtensionKey();
    return {
      ...base,
      key: extensionKey.manifestKey,
      permissions: [...base.permissions, "offscreen"],
    };
  },
  manifestVersion: 3,
  outDir: ".output",
  srcDir: "src",
});
