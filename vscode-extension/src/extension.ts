import * as vscode from 'vscode';
import { WorkflowWatcher } from './workflow-watcher';
import { WorkflowTreeProvider, ItemNode } from './views/workflow-tree';
import { StatusBarManager } from './views/status-bar';
import { LifecycleStepperPanel } from './views/lifecycle-webview';
import { detectTransitions } from './notifications/approval-gates';
import type { ParsedLeafItem, ParsedItem } from './types';

const findSddWorkspaceFolder = (): vscode.WorkspaceFolder | undefined => {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return undefined;
  return folders[0];
};

const getNotificationMessage = (
  notification: { readonly type: string; readonly workflowId: string; readonly itemTitle?: string },
): string => {
  switch (notification.type) {
    case 'spec_ready_for_review':
      return `Spec for "${notification.itemTitle}" is ready for review`;
    case 'all_specs_approved':
      return `All specs approved in workflow ${notification.workflowId} — ready to plan`;
    case 'implementation_complete':
      return `Implementation of "${notification.itemTitle}" is complete — ready for review`;
    case 'changes_requested':
      return `Changes requested on "${notification.itemTitle}"`;
    case 'workflow_complete':
      return `Workflow ${notification.workflowId} complete!`;
    default:
      return '';
  }
};

export const activate = (context: vscode.ExtensionContext): void => {
  const workspaceFolder = findSddWorkspaceFolder();

  const watcher = new WorkflowWatcher(workspaceFolder);
  const treeProvider = new WorkflowTreeProvider(watcher);
  const statusBar = new StatusBarManager(watcher, context.workspaceState);
  const stepperPanel = new LifecycleStepperPanel(context.extensionUri, watcher);

  // Approval gate notifications
  const notificationSub = watcher.onDidChangeWorkflows(() => {
    const notifications = detectTransitions(
      watcher.previousWorkflows,
      watcher.workflows,
    );
    for (const notification of notifications) {
      const message = getNotificationMessage(notification);
      const actions =
        notification.type === 'spec_ready_for_review' && notification.itemLocation
          ? ['View Spec']
          : [];

      void vscode.window
        .showInformationMessage(message, ...actions)
        .then((action) => {
          if (action === 'View Spec' && notification.itemLocation && workspaceFolder) {
            const uri = vscode.Uri.joinPath(
              workspaceFolder.uri,
              notification.itemLocation,
              'SPEC.md',
            );
            void vscode.window.showTextDocument(uri);
          }
        });
    }
  });

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('sddWorkflows', treeProvider),
    vscode.commands.registerCommand('sdd.refreshWorkflows', () => void watcher.refresh()),
    // Inline tree view commands receive ItemNode from VS Code's context menu
    vscode.commands.registerCommand('sdd.openSpec', (node: ItemNode) => {
      const leaf = node.item as ParsedLeafItem;
      if (!workspaceFolder || !leaf.location) return;
      const uri = vscode.Uri.joinPath(workspaceFolder.uri, leaf.location, 'SPEC.md');
      void vscode.window.showTextDocument(uri);
    }),
    vscode.commands.registerCommand('sdd.openPlan', (node: ItemNode) => {
      const leaf = node.item as ParsedLeafItem;
      if (!workspaceFolder || !leaf.location) return;
      const uri = vscode.Uri.joinPath(workspaceFolder.uri, leaf.location, 'PLAN.md');
      void vscode.window.showTextDocument(uri);
    }),
    vscode.commands.registerCommand('sdd.setFocus', (node: ItemNode) => {
      statusBar.setFocus(node.item as ParsedLeafItem);
    }),
    // showStepper is fired via TreeItem.command.arguments, receives ParsedItem directly
    vscode.commands.registerCommand('sdd.showStepper', (item: unknown) => {
      const parsed = item instanceof ItemNode ? item.item : item;
      stepperPanel.showItem(parsed as ParsedItem);
    }),
    vscode.commands.registerCommand('sdd.selectFocusItem', () => {
      void statusBar.showQuickPick();
    }),
    notificationSub,
    watcher,
    treeProvider,
    statusBar,
    stepperPanel,
  );

  void watcher.start();
};

export const deactivate = (): void => {
  // Cleanup handled by context.subscriptions
};
