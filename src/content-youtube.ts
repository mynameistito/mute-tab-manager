import type { InboundContentMessage } from "./types/messages.ts";

let isMuted = false;

function applyMuteToAllVideos(muted: boolean): void {
  for (const video of Array.from(document.querySelectorAll("video"))) {
    video.muted = muted;
  }
}

// Watch for dynamically added <video> elements; only fire when a video node
// is actually added, and only when muted, to avoid unnecessary DOM scans.
const observer = new MutationObserver((mutations) => {
  if (!isMuted) {
    return;
  }
  for (const mutation of mutations) {
    for (const node of Array.from(mutation.addedNodes)) {
      if (
        node instanceof HTMLVideoElement ||
        (node instanceof HTMLElement && node.querySelector("video") !== null)
      ) {
        applyMuteToAllVideos(true);
        return;
      }
    }
  }
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      observer.observe(document.body, { childList: true, subtree: true });
    },
    { once: true }
  );
}

// Handle YouTube SPA navigation
document.addEventListener("yt-navigate-finish", () => {
  applyMuteToAllVideos(isMuted);
});

// Handle messages from service worker
chrome.runtime.onMessage.addListener((message: InboundContentMessage) => {
  if (message.type === "SET_MUTED") {
    isMuted = message.muted;
    applyMuteToAllVideos(isMuted);
  }
});
