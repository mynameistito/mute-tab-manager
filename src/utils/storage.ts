import { STORAGE_KEY_DARK_MODE, STORAGE_KEY_MUTED_TABS } from "./constants.ts";

export type MutedTabsMap = Record<number, boolean>;

// Serialize all read-modify-write operations on STORAGE_KEY_MUTED_TABS to
// prevent concurrent calls from dropping each other's updates.
let storageLock: Promise<void> = Promise.resolve();

export function withStorageLock(fn: () => Promise<void>): Promise<void> {
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
