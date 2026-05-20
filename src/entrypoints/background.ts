import { updateBadgeAndIcon } from "../utils/badge.ts";
import {
  COMMAND_TOGGLE_MUTE,
  CONTEXT_MENU_MUTE_ALL,
  CONTEXT_MENU_TOGGLE_ID,
  STORAGE_KEY_DARK_MODE,
} from "../utils/constants.ts";
import type { InboundServiceWorkerMessage } from "../utils/messages.ts";
import {
  muteAllTabs,
  sendMuteToContentScript,
  toggleMuteActiveTab,
} from "../utils/mute.ts";
import { isTabMuted, removeTabFromStorage } from "../utils/storage.ts";

const OFFSCREEN_URL = "offscreen.html" as const;

// ── Dark mode detection ────────────────────────────────────────────────────

/**
 * Firefox MV3 supports matchMedia() natively inside the service worker.
 */
function initFirefoxDarkModeDetection(): void {
  if (typeof matchMedia === "undefined") {
    return;
  }
  const mq = matchMedia("(prefers-color-scheme: dark)");
  chrome.storage.session.set({ [STORAGE_KEY_DARK_MODE]: mq.matches });
  mq.addEventListener("change", (e) => {
    chrome.storage.session.set({ [STORAGE_KEY_DARK_MODE]: e.matches });
  });
}

/**
 * Chrome service workers cannot access matchMedia. We host an offscreen
 * document that runs matchMedia and reports the result back.
 */
async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: [chrome.offscreen.Reason.MATCH_MEDIA],
      justification: "Detect system dark mode preference",
    });
  } else {
    await chrome.runtime.sendMessage({ type: "GET_DARK_MODE" });
  }
}

// ── Background entrypoint ──────────────────────────────────────────────────

export default defineBackground({
  type: "module",
  async main() {
    const isFirefox = import.meta.env.BROWSER === "firefox";

    // Re-initialise on every service-worker startup so theme state is correct
    // after browser restarts (session storage is cleared on restart).
    if (isFirefox) {
      initFirefoxDarkModeDetection();
    } else {
      await ensureOffscreenDocument();
    }

    chrome.runtime.onInstalled.addListener(async () => {
      chrome.contextMenus.create({
        id: CONTEXT_MENU_TOGGLE_ID,
        title: "Toggle Mute",
        contexts: ["action"],
      });
      chrome.contextMenus.create({
        id: CONTEXT_MENU_MUTE_ALL,
        title: "Mute All Tabs",
        contexts: ["action"],
      });

      if (isFirefox) {
        initFirefoxDarkModeDetection();
      } else {
        await ensureOffscreenDocument();
      }
    });

    chrome.action.onClicked.addListener(async () => {
      await toggleMuteActiveTab();
    });

    chrome.commands.onCommand.addListener(async (command) => {
      if (command === COMMAND_TOGGLE_MUTE) {
        await toggleMuteActiveTab();
      }
    });

    chrome.contextMenus.onClicked.addListener(async (info) => {
      if (info.menuItemId === CONTEXT_MENU_TOGGLE_ID) {
        await toggleMuteActiveTab();
      } else if (info.menuItemId === CONTEXT_MENU_MUTE_ALL) {
        await muteAllTabs();
      }
    });

    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const muted = await isTabMuted(activeInfo.tabId);
      await updateBadgeAndIcon(activeInfo.tabId, muted);
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      const muted = await isTabMuted(tabId);
      if (!muted) {
        return;
      }

      // Re-inject mute state after page load (handles YouTube reloads)
      if (changeInfo.status === "complete") {
        await sendMuteToContentScript(tabId, true);
        await updateBadgeAndIcon(tabId, true);
      }

      // Re-inject mute state after SPA navigation (handles YouTube pushState)
      if (changeInfo.url != null) {
        await sendMuteToContentScript(tabId, true);
      }
    });

    chrome.tabs.onRemoved.addListener(async (tabId) => {
      await removeTabFromStorage(tabId);
    });

    // Handle messages from offscreen document
    chrome.runtime.onMessage.addListener(
      async (message: InboundServiceWorkerMessage) => {
        if (message.type === "DARK_MODE_RESPONSE") {
          await chrome.storage.session.set({
            [STORAGE_KEY_DARK_MODE]: message.isDark,
          });
        }
      }
    );
  },
});
