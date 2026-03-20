import {
  BADGE_COLOR_MUTED,
  BADGE_COLOR_UNMUTED,
  BADGE_MUTED,
  BADGE_UNMUTED,
  COMMAND_TOGGLE_MUTE,
  CONTEXT_MENU_MUTE_ALL,
  CONTEXT_MENU_TOGGLE_ID,
  ICON_BASE,
  ICON_SIZES,
  STORAGE_KEY_DARK_MODE,
  STORAGE_KEY_MUTED_TABS,
} from "@mute-tab-manager/shared/constants";

// ── Types ──────────────────────────────────────────────────────────────────

export type MutedTabsMap = Record<number, boolean>;

// ── Storage helpers ────────────────────────────────────────────────────────

// Serialize all read-modify-write operations on STORAGE_KEY_MUTED_TABS to
// prevent concurrent calls from dropping each other's updates.
let storageLock: Promise<void> = Promise.resolve();

function withStorageLock(fn: () => Promise<void>): Promise<void> {
  const next = storageLock.then(fn);
  storageLock = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export async function getMutedTabs(): Promise<MutedTabsMap> {
  const result = await chrome.storage.session.get(STORAGE_KEY_MUTED_TABS);
  const raw = result[STORAGE_KEY_MUTED_TABS];
  return typeof raw === "object" && raw !== null ? (raw as MutedTabsMap) : {};
}

export function setTabMuted(tabId: number, muted: boolean): Promise<void> {
  return withStorageLock(async () => {
    const mutedTabs = await getMutedTabs();
    mutedTabs[tabId] = muted;
    await chrome.storage.session.set({ [STORAGE_KEY_MUTED_TABS]: mutedTabs });
  });
}

export function removeTabFromStorage(tabId: number): Promise<void> {
  return withStorageLock(async () => {
    const mutedTabs = await getMutedTabs();
    delete mutedTabs[tabId];
    await chrome.storage.session.set({ [STORAGE_KEY_MUTED_TABS]: mutedTabs });
  });
}

export async function isTabMuted(tabId: number): Promise<boolean> {
  const mutedTabs = await getMutedTabs();
  return mutedTabs[tabId] === true;
}

export async function getIsDarkMode(): Promise<boolean> {
  const result = await chrome.storage.session.get(STORAGE_KEY_DARK_MODE);
  return result[STORAGE_KEY_DARK_MODE] === true;
}

// ── Badge & icon ───────────────────────────────────────────────────────────

function makeIconPaths(variant: string, theme: string): Record<string, string> {
  return Object.fromEntries(
    ICON_SIZES.map((size) => [
      size,
      `${ICON_BASE}-${size}-${variant}-${theme}.png`,
    ])
  );
}

function makeFallbackIconPaths(): Record<string, string> {
  return Object.fromEntries(
    ICON_SIZES.map((size) => [size, `${ICON_BASE}-${size}.png`])
  );
}

export async function updateBadgeAndIcon(
  tabId: number,
  muted: boolean
): Promise<void> {
  const isDark = await getIsDarkMode();
  const variant = muted ? "muted" : "unmuted";
  const theme = isDark ? "dark" : "light";

  await chrome.action.setBadgeText({
    tabId,
    text: muted ? BADGE_MUTED : BADGE_UNMUTED,
  });
  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color: muted ? BADGE_COLOR_MUTED : BADGE_COLOR_UNMUTED,
  });

  // Use muted/unmuted icons if they exist; fall back to base icons
  try {
    await chrome.action.setIcon({ tabId, path: makeIconPaths(variant, theme) });
  } catch {
    await chrome.action.setIcon({ tabId, path: makeFallbackIconPaths() });
  }
}

// ── Content script messaging ───────────────────────────────────────────────

export async function sendMuteToContentScript(
  tabId: number,
  muted: boolean
): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "SET_MUTED", muted });
  } catch {
    // Content script not available on this tab (non-YouTube); silently ignore
  }
}

// ── Core toggle logic ──────────────────────────────────────────────────────

export async function toggleMuteTab(tabId: number): Promise<void> {
  const tab = await chrome.tabs.get(tabId);
  const currentlyMuted = tab.mutedInfo?.muted ?? false;
  const newMuted = !currentlyMuted;

  await chrome.tabs.update(tabId, { muted: newMuted });
  await sendMuteToContentScript(tabId, newMuted);
  await setTabMuted(tabId, newMuted);
  await updateBadgeAndIcon(tabId, newMuted);
}

export async function toggleMuteActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id != null) {
    await toggleMuteTab(tab.id);
  }
}

export async function muteAllTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const validTabs = tabs.filter(
    (tab): tab is chrome.tabs.Tab & { id: number } => tab.id != null
  );

  // Write all state in a single atomic storage update inside the lock
  await withStorageLock(async () => {
    const mutedTabs = await getMutedTabs();
    for (const tab of validTabs) {
      mutedTabs[tab.id] = true;
    }
    await chrome.storage.session.set({ [STORAGE_KEY_MUTED_TABS]: mutedTabs });
  });

  await Promise.all(
    validTabs.map(async (tab) => {
      await chrome.tabs.update(tab.id, { muted: true });
      await sendMuteToContentScript(tab.id, true);
      await updateBadgeAndIcon(tab.id, true);
    })
  );
}

// ── Dark mode detection ────────────────────────────────────────────────────

// Firefox 128+ supports matchMedia in MV3 service workers natively.
export function initDarkModeDetection(): void {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  chrome.storage.session.set({ [STORAGE_KEY_DARK_MODE]: mq.matches });
  mq.addEventListener("change", (e) => {
    chrome.storage.session.set({ [STORAGE_KEY_DARK_MODE]: e.matches });
  });
}

// ── Event listeners ────────────────────────────────────────────────────────

// Re-initialize on every service-worker startup so theme state is correct
// after browser restarts (session storage is cleared on restart).
// Guard against environments (e.g. tests) where matchMedia is not defined.
if (typeof matchMedia !== "undefined") {
  initDarkModeDetection();
}

chrome.runtime.onInstalled.addListener(() => {
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
  initDarkModeDetection();
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

  const shouldReinject =
    changeInfo.status === "complete" || changeInfo.url != null;
  if (shouldReinject) {
    await sendMuteToContentScript(tabId, true);
  }
  if (changeInfo.status === "complete") {
    await updateBadgeAndIcon(tabId, true);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await removeTabFromStorage(tabId);
});
