import type {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from '../src/types';

type VsCodeApi = {
  readonly postMessage: (message: WebviewToExtensionMessage) => void;
  readonly getState: <T>() => T | undefined;
  readonly setState: <T>(state: T) => void;
};

// acquireVsCodeApi is injected by the VS Code webview runtime
declare const acquireVsCodeApi: () => VsCodeApi;

const vscode = acquireVsCodeApi();

export const postMessage = (message: WebviewToExtensionMessage): void => {
  vscode.postMessage(message);
};

export const onMessage = (
  handler: (message: ExtensionToWebviewMessage) => void,
): (() => void) => {
  const listener = (event: MessageEvent<ExtensionToWebviewMessage>) => {
    handler(event.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
};
