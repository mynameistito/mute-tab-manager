import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { mockEvents, resetChromeMock } from "./helpers/chrome-mock.ts";

// Import the module once — it registers MutationObserver and event listeners at module level.
beforeAll(async () => {
  await import("../src/content-youtube.ts");
});

beforeEach(async () => {
  resetChromeMock();
  document.body.innerHTML = "";
  // Reset isMuted module state to false
  await mockEvents.runtime.onMessage.fire(
    { type: "SET_MUTED", muted: false },
    {} as chrome.runtime.MessageSender,
    () => {
      /* noop */
    }
  );
});

// ── SET_MUTED message ─────────────────────────────────────────────────────────

describe("SET_MUTED message", () => {
  test("mutes all video elements when muted=true", async () => {
    const video = document.createElement("video");
    document.body.appendChild(video);

    await mockEvents.runtime.onMessage.fire(
      { type: "SET_MUTED", muted: true },
      {} as chrome.runtime.MessageSender,
      () => {
        /* noop */
      }
    );

    expect(video.muted).toBe(true);
  });

  test("unmutes all video elements when muted=false", async () => {
    const video = document.createElement("video");
    video.muted = true;
    document.body.appendChild(video);

    await mockEvents.runtime.onMessage.fire(
      { type: "SET_MUTED", muted: false },
      {} as chrome.runtime.MessageSender,
      () => {
        /* noop */
      }
    );

    expect(video.muted).toBe(false);
  });

  test("no error when no videos present", async () => {
    await expect(
      mockEvents.runtime.onMessage.fire(
        { type: "SET_MUTED", muted: true },
        {} as chrome.runtime.MessageSender,
        () => {
          /* noop */
        }
      )
    ).resolves.toBeUndefined();
  });

  test("unknown message type is no-op", async () => {
    const video = document.createElement("video");
    video.muted = false;
    document.body.appendChild(video);

    await mockEvents.runtime.onMessage.fire(
      { type: "UNKNOWN" },
      {} as chrome.runtime.MessageSender,
      () => {
        /* noop */
      }
    );

    expect(video.muted).toBe(false);
  });
});

// ── MutationObserver ──────────────────────────────────────────────────────────

describe("MutationObserver", () => {
  test("auto-mutes appended <video> while muted", async () => {
    await mockEvents.runtime.onMessage.fire(
      { type: "SET_MUTED", muted: true },
      {} as chrome.runtime.MessageSender,
      () => {
        /* noop */
      }
    );

    const video = document.createElement("video");
    document.body.appendChild(video);

    // Allow microtasks + MutationObserver to flush
    await new Promise((r) => setTimeout(r, 0));

    expect(video.muted).toBe(true);
  });

  test("auto-mutes <div> containing <video> while muted", async () => {
    await mockEvents.runtime.onMessage.fire(
      { type: "SET_MUTED", muted: true },
      {} as chrome.runtime.MessageSender,
      () => {
        /* noop */
      }
    );

    const div = document.createElement("div");
    const video = document.createElement("video");
    div.appendChild(video);
    document.body.appendChild(div);

    await new Promise((r) => setTimeout(r, 0));

    expect(video.muted).toBe(true);
  });

  test("does NOT auto-mute appended <video> while not muted", async () => {
    const video = document.createElement("video");
    document.body.appendChild(video);

    await new Promise((r) => setTimeout(r, 0));

    expect(video.muted).toBe(false);
  });
});

// ── yt-navigate-finish event ──────────────────────────────────────────────────

describe("yt-navigate-finish event", () => {
  test("mutes existing videos while muted", async () => {
    const video = document.createElement("video");
    document.body.appendChild(video);

    await mockEvents.runtime.onMessage.fire(
      { type: "SET_MUTED", muted: true },
      {} as chrome.runtime.MessageSender,
      () => {
        /* noop */
      }
    );

    // Reset muted to verify re-apply on navigation
    video.muted = false;
    document.dispatchEvent(new Event("yt-navigate-finish"));

    expect(video.muted).toBe(true);
  });

  test("does not mute videos while not muted", () => {
    const video = document.createElement("video");
    document.body.appendChild(video);

    document.dispatchEvent(new Event("yt-navigate-finish"));

    expect(video.muted).toBe(false);
  });
});
