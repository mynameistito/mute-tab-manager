// Chrome-only: detect system dark mode in a page context (service workers
// lack DOM access) and report results to the background script.

const mq = window.matchMedia("(prefers-color-scheme: dark)");

const send = (isDark: boolean): Promise<void> =>
  chrome.runtime.sendMessage({ type: "DARK_MODE_RESPONSE", isDark });

const reportDarkMode = (): void => {
  send(mq.matches).catch(() => {
    /* ignore - background may have restarted */
  });
};

reportDarkMode();
mq.addEventListener("change", (e) => {
  send(e.matches).catch(() => {
    /* ignore - background may have restarted */
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "GET_DARK_MODE") {
    reportDarkMode();
  }
});
