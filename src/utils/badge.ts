import {
  BADGE_COLOR_MUTED,
  BADGE_COLOR_UNMUTED,
  BADGE_MUTED,
  BADGE_UNMUTED,
  ICON_BASE,
  ICON_SIZES,
} from "./constants.ts";
import { getIsDarkMode } from "./storage.ts";

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
