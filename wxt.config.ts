import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "wxt";

const here = dirname(fileURLToPath(import.meta.url));
const keyJsonPath = resolve(here, "extension-key.json");

interface ExtensionKeyJson {
  readonly extensionId: string;
  readonly manifestKey: string;
}

function loadExtensionKey(): ExtensionKeyJson {
  try {
    const data = JSON.parse(readFileSync(keyJsonPath, "utf8"));
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
      `Failed to load extension key from ${keyJsonPath}: ${err.message}`
    );
  }
}

export default defineConfig({
  srcDir: "src",
  outDir: ".output",
  manifestVersion: 3,
  manifest: ({ browser }) => {
    const extensionKey = loadExtensionKey();

    const base = {
      name: "Mute Tab Manager",
      description: "Mute/unmute tabs with proper YouTube support.",
      permissions: ["activeTab", "tabs", "contextMenus", "storage"],
      host_permissions: ["*://*.youtube.com/*"],
      action: {
        default_icon: {
          16: "icons/icon-16.png",
          48: "icons/icon-48.png",
          128: "icons/icon-128.png",
        },
        default_title: "Toggle Mute",
      },
      commands: {
        "toggle-mute": {
          suggested_key: { default: "Alt+Shift+M" },
          description: "Toggle mute for the active tab",
        },
      },
      icons: {
        16: "icons/icon-16.png",
        48: "icons/icon-48.png",
        128: "icons/icon-128.png",
      },
    };

    if (browser === "firefox") {
      return {
        ...base,
        browser_specific_settings: {
          gecko: {
            id: "mute-tab@mynameistito",
            strict_min_version: "140.0",
            data_collection_permissions: { required: ["none"] },
          },
        },
      };
    }

    // Chrome / Chromium
    return {
      ...base,
      permissions: [...base.permissions, "offscreen"],
      key: extensionKey.manifestKey,
    };
  },
});
