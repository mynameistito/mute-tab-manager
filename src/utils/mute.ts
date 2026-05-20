import { updateBadgeAndIcon } from "./badge.ts";
import { STORAGE_KEY_MUTED_TABS } from "./constants.ts";
import { getMutedTabs, setTabMuted, withStorageLock } from "./storage.ts";

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

  const results = await Promise.allSettled(
    validTabs.map((tab) => chrome.tabs.update(tab.id, { muted: true }))
  );

  const succeededTabIds = results
    .filter(
      (result): result is PromiseFulfilledResult<chrome.tabs.Tab> =>
        result.status === "fulfilled" && result.value != null
    )
    .map((_, i) => validTabs[i]?.id)
    .filter((id): id is number => id !== undefined);

  await Promise.allSettled(
    succeededTabIds.map(async (tabId) => {
      await sendMuteToContentScript(tabId, true);
      await updateBadgeAndIcon(tabId, true);
    })
  );

  await withStorageLock(async () => {
    const mutedTabs = await getMutedTabs();
    for (const tabId of succeededTabIds) {
      mutedTabs[tabId] = true;
    }
    await chrome.storage.session.set({ [STORAGE_KEY_MUTED_TABS]: mutedTabs });
  });
}
