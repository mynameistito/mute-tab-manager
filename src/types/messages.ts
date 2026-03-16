export interface SetMutedMessage {
  readonly muted: boolean;
  readonly type: "SET_MUTED";
}
export interface DarkModeResponseMessage {
  readonly isDark: boolean;
  readonly type: "DARK_MODE_RESPONSE";
}
export type InboundServiceWorkerMessage = DarkModeResponseMessage;
export type InboundContentMessage = SetMutedMessage;
