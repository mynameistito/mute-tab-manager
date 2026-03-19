const mq = window.matchMedia("(prefers-color-scheme: dark)");
const send = (isDark: boolean) =>
  chrome.runtime.sendMessage({ type: "DARK_MODE_RESPONSE", isDark });

send(mq.matches);
mq.addEventListener("change", (e) => send(e.matches));
