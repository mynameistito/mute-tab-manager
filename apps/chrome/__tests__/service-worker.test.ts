import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  BADGE_COLOR_MUTED,
  BADGE_COLOR_UNMUTED,
  BADGE_MUTED,
  BADGE_UNMUTED,
  CONTEXT_MENU_MUTE_ALL,
  CONTEXT_MENU_TOGGLE_ID,
} from "@mute-tab-manager/shared/constants";
import {
  listenerDelta,
  mockCalls,
  mockConfig,
  mockEvents,
  resetChromeMock,
  restoreListeners,
  snapshotListeners,
} from "../../../packages/shared/__tests__/helpers/chrome-mock.ts";

// Use dynamic import so we can snapshot listeners before/after to isolate
// only this module's listeners (avoids cross-package pollution with bun test).
type ServiceWorker = typeof import("../src/service-worker.ts");
let mod: ServiceWorker;
let myListeners: ReturnType<typeof snapshotListeners>;

beforeAll(async () => {
  const before = snapshotListeners();
  mod = await import("../src/service-worker.ts");
  myListeners = listenerDelta(before, snapshotListeners());
});

beforeEach(() => {
  resetChromeMock();
  restoreListeners(myListeners);
});

// ── getMutedTabs ─────────────────────────────────────────────────────────────

describe("getMutedTabs", () => {
  test("returns {} when storage is empty", async () => {
    const result = await mod.getMutedTabs();
    expect(result).toEqual({});
  });

  test("returns stored data", async () => {
    await chrome.storage.session.set({ mutedTabs: { 1: true, 2: false } });
    const result = await mod.getMutedTabs();
    expect(result).toEqual({ 1: true, 2: false });
  });

  test("returns {} when stored value is null", async () => {
    await chrome.storage.session.set({ mutedTabs: null });
    const result = await mod.getMutedTabs();
    expect(result).toEqual({});
  });

  test("returns {} when stored value is a non-object primitive", async () => {
    await chrome.storage.session.set({ mutedTabs: 42 });
    const result = await mod.getMutedTabs();
    expect(result).toEqual({});
  });
});

// ── setTabMuted ──────────────────────────────────────────────────────────────

describe("setTabMuted", () => {
  test("writes true for a tab", async () => {
    await mod.setTabMuted(5, true);
    const result = await mod.getMutedTabs();
    expect(result[5]).toBe(true);
  });

  test("writes false for a tab", async () => {
    await mod.setTabMuted(5, false);
    const result = await mod.getMutedTabs();
    expect(result[5]).toBe(false);
  });

  test("preserves other entries", async () => {
    await mod.setTabMuted(1, true);
    await mod.setTabMuted(2, false);
    const result = await mod.getMutedTabs();
    expect(result[1]).toBe(true);
    expect(result[2]).toBe(false);
  });

  test("overwrites same key", async () => {
    await mod.setTabMuted(1, true);
    await mod.setTabMuted(1, false);
    const result = await mod.getMutedTabs();
    expect(result[1]).toBe(false);
  });
});

// ── removeTabFromStorage ─────────────────────────────────────────────────────

describe("removeTabFromStorage", () => {
  test("removes target tab", async () => {
    await mod.setTabMuted(1, true);
    await mod.removeTabFromStorage(1);
    const result = await mod.getMutedTabs();
    expect(result[1]).toBeUndefined();
  });

  test("no-op for missing key", async () => {
    await mod.removeTabFromStorage(99);
    const result = await mod.getMutedTabs();
    expect(result).toEqual({});
  });

  test("preserves other entries", async () => {
    await mod.setTabMuted(1, true);
    await mod.setTabMuted(2, true);
    await mod.removeTabFromStorage(1);
    const result = await mod.getMutedTabs();
    expect(result[1]).toBeUndefined();
    expect(result[2]).toBe(true);
  });
});

// ── isTabMuted ───────────────────────────────────────────────────────────────

describe("isTabMuted", () => {
  test("returns true for muted tab", async () => {
    await mod.setTabMuted(1, true);
    expect(await mod.isTabMuted(1)).toBe(true);
  });

  test("returns false for unmuted tab", async () => {
    await mod.setTabMuted(1, false);
    expect(await mod.isTabMuted(1)).toBe(false);
  });

  test("returns false for missing tab", async () => {
    expect(await mod.isTabMuted(99)).toBe(false);
  });
});

// ── getIsDarkMode ─────────────────────────────────────────────────────────────

describe("getIsDarkMode", () => {
  test("returns true when set to true", async () => {
    await chrome.storage.session.set({ isDarkMode: true });
    expect(await mod.getIsDarkMode()).toBe(true);
  });

  test("returns false when set to false", async () => {
    await chrome.storage.session.set({ isDarkMode: false });
    expect(await mod.getIsDarkMode()).toBe(false);
  });

  test("returns false when not set", async () => {
    expect(await mod.getIsDarkMode()).toBe(false);
  });
});

// ── updateBadgeAndIcon ────────────────────────────────────────────────────────

describe("updateBadgeAndIcon", () => {
  test("sets badge text to 'M' when muted", async () => {
    await mod.updateBadgeAndIcon(1, true);
    expect(mockCalls.action.setBadgeText).toContainEqual({
      tabId: 1,
      text: BADGE_MUTED,
    });
  });

  test("sets badge text to '' when unmuted", async () => {
    await mod.updateBadgeAndIcon(1, false);
    expect(mockCalls.action.setBadgeText).toContainEqual({
      tabId: 1,
      text: BADGE_UNMUTED,
    });
  });

  test("sets red color when muted", async () => {
    await mod.updateBadgeAndIcon(1, true);
    expect(mockCalls.action.setBadgeBackgroundColor).toContainEqual({
      tabId: 1,
      color: BADGE_COLOR_MUTED,
    });
  });

  test("sets green color when unmuted", async () => {
    await mod.updateBadgeAndIcon(1, false);
    expect(mockCalls.action.setBadgeBackgroundColor).toContainEqual({
      tabId: 1,
      color: BADGE_COLOR_UNMUTED,
    });
  });

  test("uses muted-light icon paths in light mode when muted", async () => {
    await mod.updateBadgeAndIcon(1, true);
    expect(mockCalls.action.setIcon.length).toBeGreaterThan(0);
    const call = mockCalls.action.setIcon[0] as chrome.action.TabIconDetails;
    expect((call.path as Record<string, string>)["16"]).toContain(
      "muted-light"
    );
  });

  test("uses unmuted-dark icon paths in dark mode when unmuted", async () => {
    await chrome.storage.session.set({ isDarkMode: true });
    await mod.updateBadgeAndIcon(1, false);
    expect(mockCalls.action.setIcon.length).toBeGreaterThan(0);
    const call = mockCalls.action.setIcon[0] as chrome.action.TabIconDetails;
    expect((call.path as Record<string, string>)["16"]).toContain(
      "unmuted-dark"
    );
  });

  test("falls back to base icons when setIcon rejects on first call", async () => {
    mockConfig.action.setIconRejectTimes = 1;
    await mod.updateBadgeAndIcon(1, true);
    // Two calls: first is the themed attempt (rejected), second is the fallback
    expect(mockCalls.action.setIcon.length).toBe(2);
    const themedCall = mockCalls.action
      .setIcon[0] as chrome.action.TabIconDetails;
    expect((themedCall.path as Record<string, string>)["16"]).toContain(
      "muted"
    );
    const fallbackCall = mockCalls.action
      .setIcon[1] as chrome.action.TabIconDetails;
    expect((fallbackCall.path as Record<string, string>)["16"]).toBe(
      "icons/icon-16.png"
    );
  });
});

// ── sendMuteToContentScript ───────────────────────────────────────────────────

describe("sendMuteToContentScript", () => {
  test("calls tabs.sendMessage with correct args", async () => {
    await mod.sendMuteToContentScript(3, true);
    expect(mockCalls.tabs.sendMessage).toContainEqual([
      3,
      { type: "SET_MUTED", muted: true },
    ]);
  });

  test("silently ignores rejection", async () => {
    mockConfig.tabs.sendMessageShouldReject = true;
    // ensure no error thrown when sendMessage rejects
    expect(await mod.sendMuteToContentScript(3, true)).toBeUndefined();
  });
});

// ── toggleMuteTab ─────────────────────────────────────────────────────────────

describe("toggleMuteTab", () => {
  test("toggles from unmuted to muted", async () => {
    mockConfig.tabs.getResult = { id: 1, mutedInfo: { muted: false } };
    await mod.toggleMuteTab(1);
    expect(mockCalls.tabs.update).toContainEqual([1, { muted: true }]);
    expect(await mod.isTabMuted(1)).toBe(true);
  });

  test("toggles from muted to unmuted", async () => {
    mockConfig.tabs.getResult = { id: 1, mutedInfo: { muted: true } };
    await mod.toggleMuteTab(1);
    expect(mockCalls.tabs.update).toContainEqual([1, { muted: false }]);
    expect(await mod.isTabMuted(1)).toBe(false);
  });

  test("defaults to false when mutedInfo is undefined", async () => {
    mockConfig.tabs.getResult = { id: 1 };
    await mod.toggleMuteTab(1);
    expect(mockCalls.tabs.update).toContainEqual([1, { muted: true }]);
  });

  test("calls sendMuteToContentScript and updateBadgeAndIcon", async () => {
    mockConfig.tabs.getResult = { id: 1, mutedInfo: { muted: false } };
    await mod.toggleMuteTab(1);
    expect(mockCalls.tabs.sendMessage.length).toBeGreaterThan(0);
    expect(mockCalls.action.setBadgeText.length).toBeGreaterThan(0);
  });
});

// ── toggleMuteActiveTab ───────────────────────────────────────────────────────

describe("toggleMuteActiveTab", () => {
  test("calls toggleMuteTab with active tab id", async () => {
    mockConfig.tabs.queryResult = [{ id: 5, mutedInfo: { muted: false } }];
    mockConfig.tabs.getResult = { id: 5, mutedInfo: { muted: false } };
    await mod.toggleMuteActiveTab();
    expect(mockCalls.tabs.update).toContainEqual([5, { muted: true }]);
  });

  test("no-op when query returns empty array", async () => {
    mockConfig.tabs.queryResult = [];
    await mod.toggleMuteActiveTab();
    expect(mockCalls.tabs.update.length).toBe(0);
  });

  test("no-op when tab has no id", async () => {
    mockConfig.tabs.queryResult = [{ title: "No id tab", id: undefined }];
    await mod.toggleMuteActiveTab();
    expect(mockCalls.tabs.update.length).toBe(0);
  });
});

// ── muteAllTabs ───────────────────────────────────────────────────────────────

describe("muteAllTabs", () => {
  test("mutes all tabs with ids", async () => {
    mockConfig.tabs.queryResult = [
      { id: 1, mutedInfo: { muted: false } },
      { id: 2, mutedInfo: { muted: false } },
    ];
    await mod.muteAllTabs();
    expect(mockCalls.tabs.update).toContainEqual([1, { muted: true }]);
    expect(mockCalls.tabs.update).toContainEqual([2, { muted: true }]);
  });

  test("writes batch storage update", async () => {
    mockConfig.tabs.queryResult = [
      { id: 1, mutedInfo: { muted: false } },
      { id: 2, mutedInfo: { muted: false } },
    ];
    await mod.muteAllTabs();
    const result = await mod.getMutedTabs();
    expect(result[1]).toBe(true);
    expect(result[2]).toBe(true);
  });

  test("skips tabs without id", async () => {
    mockConfig.tabs.queryResult = [
      { title: "no id" },
      { id: 3, mutedInfo: { muted: false } },
    ];
    await mod.muteAllTabs();
    expect(mockCalls.tabs.update.length).toBe(1);
    expect(
      (mockCalls.tabs.update[0] as [number, chrome.tabs.UpdateProperties])[0]
    ).toBe(3);
  });
});

// ── ensureOffscreenDocument ───────────────────────────────────────────────────

describe("ensureOffscreenDocument", () => {
  test("creates document when none exist", async () => {
    mockConfig.runtime.getContextsResult = [];
    await mod.ensureOffscreenDocument();
    expect(mockCalls.offscreen.createDocument.length).toBe(1);
  });

  test("skips creation when document already exists", async () => {
    mockConfig.runtime.getContextsResult = [
      { contextType: "OFFSCREEN_DOCUMENT" as chrome.runtime.ContextType },
    ];
    await mod.ensureOffscreenDocument();
    expect(mockCalls.offscreen.createDocument.length).toBe(0);
  });
});

// ── Event listeners ───────────────────────────────────────────────────────────

describe("runtime.onInstalled listener", () => {
  test("creates both context menus and ensures offscreen document", async () => {
    mockConfig.runtime.getContextsResult = [];
    await mockEvents.runtime.onInstalled.fire({
      reason: "install" as chrome.runtime.OnInstalledReason,
    });
    expect(mockCalls.contextMenus.create.length).toBe(2);
    expect(mockCalls.offscreen.createDocument.length).toBe(1);
  });

  test("creates Toggle Mute and Mute All Tabs menus", async () => {
    await mockEvents.runtime.onInstalled.fire({
      reason: "install" as chrome.runtime.OnInstalledReason,
    });
    const ids = mockCalls.contextMenus.create.map((c) => c.id);
    expect(ids).toContain(CONTEXT_MENU_TOGGLE_ID);
    expect(ids).toContain(CONTEXT_MENU_MUTE_ALL);
  });
});

describe("action.onClicked listener", () => {
  test("calls toggleMuteActiveTab", async () => {
    mockConfig.tabs.queryResult = [{ id: 7, mutedInfo: { muted: false } }];
    mockConfig.tabs.getResult = { id: 7, mutedInfo: { muted: false } };
    await mockEvents.action.onClicked.fire({} as chrome.tabs.Tab);
    expect(mockCalls.tabs.update).toContainEqual([7, { muted: true }]);
  });
});

describe("commands.onCommand listener", () => {
  test("toggle-mute command calls toggleMuteActiveTab", async () => {
    mockConfig.tabs.queryResult = [{ id: 8, mutedInfo: { muted: false } }];
    mockConfig.tabs.getResult = { id: 8, mutedInfo: { muted: false } };
    await mockEvents.commands.onCommand.fire("toggle-mute");
    expect(mockCalls.tabs.update.length).toBeGreaterThan(0);
  });

  test("unknown command is no-op", async () => {
    await mockEvents.commands.onCommand.fire("unknown-command");
    expect(mockCalls.tabs.update.length).toBe(0);
  });
});

describe("contextMenus.onClicked listener", () => {
  test("mute-tab calls toggleMuteActiveTab", async () => {
    mockConfig.tabs.queryResult = [{ id: 9, mutedInfo: { muted: false } }];
    mockConfig.tabs.getResult = { id: 9, mutedInfo: { muted: false } };
    await mockEvents.contextMenus.onClicked.fire({
      menuItemId: CONTEXT_MENU_TOGGLE_ID,
    } as chrome.contextMenus.OnClickData);
    expect(mockCalls.tabs.update.length).toBeGreaterThan(0);
  });

  test("mute-all-tabs calls muteAllTabs", async () => {
    mockConfig.tabs.queryResult = [
      { id: 1, mutedInfo: { muted: false } },
      { id: 2, mutedInfo: { muted: false } },
    ];
    await mockEvents.contextMenus.onClicked.fire({
      menuItemId: CONTEXT_MENU_MUTE_ALL,
    } as chrome.contextMenus.OnClickData);
    expect(mockCalls.tabs.update.length).toBe(2);
  });

  test("unknown menuItemId is no-op", async () => {
    await mockEvents.contextMenus.onClicked.fire({
      menuItemId: "unknown",
    } as chrome.contextMenus.OnClickData);
    expect(mockCalls.tabs.update.length).toBe(0);
  });
});

describe("tabs.onActivated listener", () => {
  test("reads mute state and updates badge", async () => {
    await mod.setTabMuted(10, true);
    await mockEvents.tabs.onActivated.fire({ tabId: 10, windowId: 1 });
    expect(mockCalls.action.setBadgeText).toContainEqual({
      tabId: 10,
      text: BADGE_MUTED,
    });
  });
});

describe("tabs.onUpdated listener", () => {
  test("no-op when tab is not muted", async () => {
    await mod.setTabMuted(11, false);
    await mockEvents.tabs.onUpdated.fire(
      11,
      { status: "complete" },
      {} as chrome.tabs.Tab
    );
    expect(mockCalls.tabs.sendMessage.length).toBe(0);
  });

  test("sends mute to content script on status=complete when muted", async () => {
    await mod.setTabMuted(12, true);
    await mockEvents.tabs.onUpdated.fire(
      12,
      { status: "complete" },
      {} as chrome.tabs.Tab
    );
    expect(mockCalls.tabs.sendMessage).toContainEqual([
      12,
      { type: "SET_MUTED", muted: true },
    ]);
  });

  test("sends mute to content script on url change when muted", async () => {
    await mod.setTabMuted(13, true);
    await mockEvents.tabs.onUpdated.fire(
      13,
      { url: "https://example.com" },
      {} as chrome.tabs.Tab
    );
    expect(mockCalls.tabs.sendMessage).toContainEqual([
      13,
      { type: "SET_MUTED", muted: true },
    ]);
  });
});

describe("tabs.onRemoved listener", () => {
  test("removes tab from storage", async () => {
    await mod.setTabMuted(14, true);
    await mockEvents.tabs.onRemoved.fire(14, {
      windowId: 1,
      isWindowClosing: false,
    });
    const result = await mod.getMutedTabs();
    expect(result[14]).toBeUndefined();
  });
});

describe("runtime.onMessage listener", () => {
  test("DARK_MODE_RESPONSE true sets isDarkMode to true", async () => {
    await mockEvents.runtime.onMessage.fire(
      { type: "DARK_MODE_RESPONSE", isDark: true },
      {} as chrome.runtime.MessageSender,
      () => {
        /* noop */
      }
    );
    expect(await mod.getIsDarkMode()).toBe(true);
  });

  test("DARK_MODE_RESPONSE false sets isDarkMode to false", async () => {
    await chrome.storage.session.set({ isDarkMode: true });
    await mockEvents.runtime.onMessage.fire(
      { type: "DARK_MODE_RESPONSE", isDark: false },
      {} as chrome.runtime.MessageSender,
      () => {
        /* noop */
      }
    );
    expect(await mod.getIsDarkMode()).toBe(false);
  });

  test("unknown message type is ignored", async () => {
    await mockEvents.runtime.onMessage.fire(
      { type: "UNKNOWN" },
      {} as chrome.runtime.MessageSender,
      () => {
        /* noop */
      }
    );
    // No storage change, no error
    expect(await mod.getIsDarkMode()).toBe(false);
  });
});
