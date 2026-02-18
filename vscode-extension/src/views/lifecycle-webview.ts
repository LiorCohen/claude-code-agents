// VS Code API requires classes for WebviewPanel management and Disposable pattern.

import * as vscode from 'vscode';
import type { WorkflowWatcher } from '../workflow-watcher';
import type {
  ParsedItem,
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from '../types';

const getNonce = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
};

export class LifecycleStepperPanel implements vscode.Disposable {
  private _panel: vscode.WebviewPanel | undefined;
  private readonly _extensionUri: vscode.Uri;
  private readonly _watcher: WorkflowWatcher;
  private _disposables: ReadonlyArray<vscode.Disposable>;
  private _currentItem: ParsedItem | undefined;

  constructor(extensionUri: vscode.Uri, watcher: WorkflowWatcher) {
    this._extensionUri = extensionUri;
    this._watcher = watcher;

    const sub = watcher.onDidChangeWorkflows(() => {
      if (this._currentItem && this._panel) {
        const updated = this._findItem(this._currentItem.id);
        if (updated) {
          this._currentItem = updated.item;
          this._postUpdate(updated.item, updated.allItems);
        }
      }
    });
    this._disposables = [sub];
  }

  showItem(item: ParsedItem): ExtensionToWebviewMessage | undefined {
    this._currentItem = item;

    if (!this._panel) {
      this._panel = vscode.window.createWebviewPanel(
        'sddLifecycleStepper',
        'SDD: Lifecycle Stepper',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist')],
        },
      );

      this._panel.webview.html = this._getHtml(this._panel.webview);

      const msgSub = this._panel.webview.onDidReceiveMessage(
        (msg: WebviewToExtensionMessage) => {
          if (msg.type === 'openFile') {
            const uri = this._resolveFilePath(msg.filePath);
            if (uri) void vscode.window.showTextDocument(uri);
          } else if (msg.type === 'selectItem') {
            const found = this._findItem(msg.itemId);
            if (found) this.showItem(found.item);
          }
        },
      );

      const disposeSub = this._panel.onDidDispose(() => {
        this._panel = undefined;
        this._currentItem = undefined;
      });

      this._disposables = [...this._disposables, msgSub, disposeSub];
    } else {
      this._panel.reveal(vscode.ViewColumn.One);
    }

    const allItems = this._getAllItemsForWorkflow(item.workflowId);
    return this._postUpdate(item, allItems);
  }

  private _postUpdate(
    item: ParsedItem,
    allItems: ReadonlyArray<ParsedItem>,
  ): ExtensionToWebviewMessage | undefined {
    if (!this._panel) return undefined;
    const message: ExtensionToWebviewMessage = {
      type: 'showItem',
      item,
      allItems: [...allItems],
      workflowId: item.workflowId,
    };
    void this._panel.webview.postMessage(message);
    return message;
  }

  private _findItem(
    itemId: string,
  ): { readonly item: ParsedItem; readonly allItems: ReadonlyArray<ParsedItem> } | undefined {
    for (const workflow of this._watcher.workflows) {
      const item = workflow.items.find((i) => i.id === itemId);
      if (item) return { item, allItems: workflow.items };
    }
    return undefined;
  }

  private _getAllItemsForWorkflow(workflowId: string): ReadonlyArray<ParsedItem> {
    const workflow = this._watcher.workflows.find((w) => w.id === workflowId);
    return workflow?.items ?? [];
  }

  private _resolveFilePath(filePath: string): vscode.Uri | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return undefined;
    return vscode.Uri.joinPath(folders[0].uri, filePath);
  }

  private _getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css'),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource};">
  <link rel="stylesheet" href="${styleUri}">
  <title>SDD Lifecycle Stepper</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  dispose(): void {
    this._panel?.dispose();
    for (const d of this._disposables) d.dispose();
  }
}
