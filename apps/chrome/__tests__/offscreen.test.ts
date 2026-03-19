import { beforeEach, describe, expect, test } from "bun:test";
import {
  mockCalls,
  resetChromeMock,
} from "../../../packages/shared/__tests__/helpers/chrome-mock.ts";

// Monotonic counter ensures each import() gets a unique URL regardless of clock resolution
let importCounter = 0;
const nextImport = () => `../src/offscreen.ts?v=${++importCounter}`;

// Minimal MediaQueryList mock that stores the change listener and lets tests fire it directly.
function createMockMQ(initialMatches: boolean) {
  let matches = initialMatches;
  let changeCallback: ((e: { matches: boolean }) => void) | null = null;

  return {
    get matches() {
      return matches;
    },
    addEventListener(_type: string, cb: (e: { matches: boolean }) => void) {
      changeCallback = cb;
    },
    // Helper: fire a change event directly
    fireChange(newMatches: boolean) {
      matches = newMatches;
      changeCallback?.({ matches: newMatches });
    },
  };
}

beforeEach(() => {
  resetChromeMock();
});

describe("offscreen module", () => {
  test("sends isDark: true when initial matches is true", async () => {
    const mq = createMockMQ(true);
    (globalThis as Record<string, unknown>).window = {
      matchMedia: () => mq,
    };

    await import(nextImport());

    expect(mockCalls.runtime.sendMessage).toContainEqual({
      type: "DARK_MODE_RESPONSE",
      isDark: true,
    });
  });

  test("sends isDark: false when initial matches is false", async () => {
    const mq = createMockMQ(false);
    (globalThis as Record<string, unknown>).window = {
      matchMedia: () => mq,
    };

    await import(nextImport());

    expect(mockCalls.runtime.sendMessage).toContainEqual({
      type: "DARK_MODE_RESPONSE",
      isDark: false,
    });
  });

  test("sends isDark: true on change event false → true", async () => {
    const mq = createMockMQ(false);
    (globalThis as Record<string, unknown>).window = {
      matchMedia: () => mq,
    };

    await import(nextImport());
    resetChromeMock();
    mq.fireChange(true);

    expect(mockCalls.runtime.sendMessage).toContainEqual({
      type: "DARK_MODE_RESPONSE",
      isDark: true,
    });
  });

  test("sends isDark: false on change event true → false", async () => {
    const mq = createMockMQ(true);
    (globalThis as Record<string, unknown>).window = {
      matchMedia: () => mq,
    };

    await import(nextImport());
    resetChromeMock();
    mq.fireChange(false);

    expect(mockCalls.runtime.sendMessage).toContainEqual({
      type: "DARK_MODE_RESPONSE",
      isDark: false,
    });
  });
});
