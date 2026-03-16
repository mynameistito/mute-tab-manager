// Chrome API mock for Bun tests
// Installed as a preload script so global.chrome is set before any source module loads.

// ── DOM globals via happy-dom ─────────────────────────────────────────────────
// Set up DOM globals so source files (content-youtube, offscreen) can use them.
import { Window as HappyWindow } from "happy-dom";

const happyWindow = new HappyWindow({ url: "https://localhost/" });

// happy-dom v20 Window doesn't expose native JS globals that its own SelectorParser
// accesses via this.window.SyntaxError / TypeError etc. Patch them in.
(happyWindow as unknown as Record<string, unknown>).SyntaxError = SyntaxError;
(happyWindow as unknown as Record<string, unknown>).TypeError = TypeError;
(happyWindow as unknown as Record<string, unknown>).RangeError = RangeError;
(happyWindow as unknown as Record<string, unknown>).Error = Error;
(happyWindow as unknown as Record<string, unknown>).DOMException = DOMException;

// Assign all DOM globals needed by source modules and tests
const g = globalThis as Record<string, unknown>;
g.window = happyWindow;
g.document = happyWindow.document;
g.MutationObserver = happyWindow.MutationObserver;
g.HTMLElement = happyWindow.HTMLElement;
g.HTMLVideoElement = happyWindow.HTMLVideoElement;
g.EventTarget = happyWindow.EventTarget;
g.Event = happyWindow.Event;

interface MockEvent<TCallback extends (...args: any[]) => any> {
  _listeners: TCallback[];
  addListener(cb: TCallback): void;
  clearListeners(): void;
  fire(...args: Parameters<TCallback>): Promise<void>;
}

function createMockEvent<
  TCallback extends (...args: any[]) => any,
>(): MockEvent<TCallback> {
  const listeners: TCallback[] = [];
  return {
    _listeners: listeners,
    addListener(cb: TCallback) {
      listeners.push(cb);
    },
    async fire(...args: Parameters<TCallback>) {
      for (const cb of listeners) {
        await (cb as unknown as (...a: unknown[]) => unknown)(...args);
      }
    },
    clearListeners() {
      listeners.length = 0;
    },
  };
}

// In-memory session storage
let sessionStore: Record<string, unknown> = {};

export function resetChromeMock() {
  sessionStore = {};
  // Reset call tracking
  mockCalls.action.setBadgeText.length = 0;
  mockCalls.action.setBadgeBackgroundColor.length = 0;
  mockCalls.action.setIcon.length = 0;
  mockCalls.tabs.update.length = 0;
  mockCalls.tabs.sendMessage.length = 0;
  mockCalls.tabs.get.length = 0;
  mockCalls.tabs.query.length = 0;
  mockCalls.runtime.sendMessage.length = 0;
  mockCalls.contextMenus.create.length = 0;
  mockCalls.offscreen.createDocument.length = 0;
  mockCalls.runtime.getContexts.length = 0;

  // Reset configurable mock behaviors
  mockConfig.tabs.getResult = { id: 1, mutedInfo: { muted: false } };
  mockConfig.tabs.queryResult = [];
  mockConfig.action.setIconRejectTimes = 0;
  mockConfig.tabs.sendMessageShouldReject = false;
  mockConfig.runtime.getContextsResult = [];
}

// Configurable mock behaviors
export const mockConfig = {
  tabs: {
    getResult: {
      id: 1,
      mutedInfo: { muted: false },
    } as Partial<chrome.tabs.Tab>,
    queryResult: [] as Partial<chrome.tabs.Tab>[],
    sendMessageShouldReject: false,
  },
  action: {
    // Number of remaining setIcon calls that should reject (counts down to 0)
    setIconRejectTimes: 0,
  },
  runtime: {
    getContextsResult: [] as Partial<chrome.runtime.ExtensionContext>[],
  },
};

// Call tracking
export const mockCalls = {
  action: {
    setBadgeText: [] as chrome.action.BadgeTextDetails[],
    setBadgeBackgroundColor: [] as chrome.action.BadgeColorDetails[],
    setIcon: [] as chrome.action.TabIconDetails[],
  },
  tabs: {
    update: [] as [number, chrome.tabs.UpdateProperties][],
    sendMessage: [] as [number, unknown][],
    get: [] as number[],
    query: [] as chrome.tabs.QueryInfo[],
  },
  runtime: {
    sendMessage: [] as unknown[],
    getContexts: [] as chrome.runtime.ContextFilter[],
  },
  contextMenus: {
    create: [] as chrome.contextMenus.CreateProperties[],
  },
  offscreen: {
    createDocument: [] as chrome.offscreen.CreateParameters[],
  },
};

// Mock events (module-level so listeners persist across resetChromeMock calls)
export const mockEvents = {
  runtime: {
    onInstalled:
      createMockEvent<(details: chrome.runtime.InstalledDetails) => void>(),
    onMessage:
      createMockEvent<
        (
          message: unknown,
          sender: chrome.runtime.MessageSender,
          sendResponse: (r?: unknown) => void
        ) => void
      >(),
  },
  action: {
    onClicked: createMockEvent<(tab: chrome.tabs.Tab) => void>(),
  },
  commands: {
    onCommand: createMockEvent<(command: string) => void>(),
  },
  contextMenus: {
    onClicked:
      createMockEvent<
        (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void
      >(),
  },
  tabs: {
    onActivated:
      createMockEvent<
        (activeInfo: { tabId: number; windowId: number }) => void
      >(),
    onUpdated:
      createMockEvent<
        (
          tabId: number,
          changeInfo: { status?: string; url?: string },
          tab: chrome.tabs.Tab
        ) => void
      >(),
    onRemoved:
      createMockEvent<
        (
          tabId: number,
          removeInfo: { windowId: number; isWindowClosing: boolean }
        ) => void
      >(),
  },
};

const chromeMock = {
  runtime: {
    onInstalled: mockEvents.runtime.onInstalled,
    onMessage: mockEvents.runtime.onMessage,
    getContexts: (filter: chrome.runtime.ContextFilter) => {
      mockCalls.runtime.getContexts.push(filter);
      return Promise.resolve(mockConfig.runtime.getContextsResult);
    },
    sendMessage: (message: unknown) => {
      mockCalls.runtime.sendMessage.push(message);
      return Promise.resolve();
    },
    ContextType: {
      OFFSCREEN_DOCUMENT: "OFFSCREEN_DOCUMENT",
    },
  },
  action: {
    onClicked: mockEvents.action.onClicked,
    setBadgeText: (details: chrome.action.BadgeTextDetails) => {
      mockCalls.action.setBadgeText.push(details);
    },
    setBadgeBackgroundColor: (details: chrome.action.BadgeColorDetails) => {
      mockCalls.action.setBadgeBackgroundColor.push(details);
    },
    setIcon: (details: chrome.action.TabIconDetails) => {
      mockCalls.action.setIcon.push(details);
      if (mockConfig.action.setIconRejectTimes > 0) {
        mockConfig.action.setIconRejectTimes--;
        return Promise.reject(new Error("setIcon failed"));
      }
      return Promise.resolve();
    },
  },
  commands: {
    onCommand: mockEvents.commands.onCommand,
  },
  contextMenus: {
    onClicked: mockEvents.contextMenus.onClicked,
    create: (properties: chrome.contextMenus.CreateProperties) => {
      mockCalls.contextMenus.create.push(properties);
    },
  },
  tabs: {
    onActivated: mockEvents.tabs.onActivated,
    onUpdated: mockEvents.tabs.onUpdated,
    onRemoved: mockEvents.tabs.onRemoved,
    get: (tabId: number) => {
      mockCalls.tabs.get.push(tabId);
      return Promise.resolve(mockConfig.tabs.getResult as chrome.tabs.Tab);
    },
    update: (tabId: number, props: chrome.tabs.UpdateProperties) => {
      mockCalls.tabs.update.push([tabId, props]);
      return Promise.resolve(mockConfig.tabs.getResult as chrome.tabs.Tab);
    },
    query: (queryInfo: chrome.tabs.QueryInfo) => {
      mockCalls.tabs.query.push(queryInfo);
      return Promise.resolve(mockConfig.tabs.queryResult as chrome.tabs.Tab[]);
    },
    sendMessage: (tabId: number, message: unknown) => {
      mockCalls.tabs.sendMessage.push([tabId, message]);
      if (mockConfig.tabs.sendMessageShouldReject) {
        return Promise.reject(new Error("sendMessage failed"));
      }
      return Promise.resolve();
    },
  },
  storage: {
    session: {
      get: (key: string) => {
        return Promise.resolve({ [key]: sessionStore[key] });
      },
      set: (items: Record<string, unknown>) => {
        Object.assign(sessionStore, items);
        return Promise.resolve();
      },
    },
  },
  offscreen: {
    createDocument: (params: chrome.offscreen.CreateParameters) => {
      mockCalls.offscreen.createDocument.push(params);
      return Promise.resolve();
    },
    Reason: {
      MATCH_MEDIA: "MATCH_MEDIA",
    },
  },
};

(globalThis as unknown as { chrome: typeof chromeMock }).chrome = chromeMock;
