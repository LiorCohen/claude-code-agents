// VS Code API requires classes for TreeItem and TreeDataProvider.
// Classes here are mandated by the extension host API, not a style choice.

import * as vscode from 'vscode';
import type { WorkflowWatcher } from '../workflow-watcher';
import type {
  ParsedWorkflow,
  ParsedItem,
  ParsedLeafItem,
  ParsedEpicItem,
  OverallItemStatus,
} from '../types';

type StatusDot = 'passed' | 'active' | 'pending' | 'attention';

type WorkflowTreeItem = WorkflowNode | ItemNode | ErrorNode;

class WorkflowNode extends vscode.TreeItem {
  readonly kind = 'workflow' as const;
  constructor(readonly workflow: ParsedWorkflow) {
    super(workflow.id, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'workflow';
    this.iconPath = new vscode.ThemeIcon('list-tree');
  }
}

class ItemNode extends vscode.TreeItem {
  readonly kind = 'item' as const;
  constructor(
    readonly item: ParsedItem,
    readonly allItems: ReadonlyArray<ParsedItem>,
  ) {
    const isEpic = item.type === 'epic';
    super(
      getItemLabel(item),
      isEpic
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
    );

    this.description = getStatusDescription(item, allItems);
    this.iconPath = new vscode.ThemeIcon(getOverallIcon(item, allItems));
    this.contextValue = buildContextValue(item);

    if (!isEpic) {
      this.command = {
        command: 'sdd.showStepper',
        title: 'Show Lifecycle Stepper',
        arguments: [item],
      };
    }
  }
}

class ErrorNode extends vscode.TreeItem {
  readonly kind = 'error' as const;
  constructor(workflowDir: string) {
    super('Error loading workflow', vscode.TreeItemCollapsibleState.None);
    this.description = workflowDir;
    this.iconPath = new vscode.ThemeIcon('warning');
    this.contextValue = 'error';
  }
}

const getItemLabel = (item: ParsedItem): string => {
  if (item.type === 'epic') return item.title;
  const leaf = item as ParsedLeafItem;
  return `${leaf.changeId}: ${leaf.title}`;
};

const getChildLeaves = (
  epic: ParsedEpicItem,
  allItems: ReadonlyArray<ParsedItem>,
): ReadonlyArray<ParsedLeafItem> =>
  allItems.filter(
    (i): i is ParsedLeafItem =>
      i.type !== 'epic' && i.parentId === epic.id,
  );

const getOverallStatus = (
  item: ParsedItem,
  allItems: ReadonlyArray<ParsedItem>,
): OverallItemStatus => {
  if (item.type === 'epic') {
    const children = getChildLeaves(item as ParsedEpicItem, allItems);
    if (children.length === 0) return 'pending';
    if (children.every((c) => c.reviewStatus === 'approved')) return 'complete';
    if (
      children.some(
        (c) =>
          c.specStatus === 'ready_for_review' ||
          c.specStatus === 'needs_rereview' ||
          c.reviewStatus === 'changes_requested',
      )
    )
      return 'needs_attention';
    if (
      children.some(
        (c) =>
          c.specStatus === 'in_progress' ||
          c.planStatus === 'in_progress' ||
          c.implStatus === 'in_progress',
      )
    )
      return 'in_progress';
    return 'pending';
  }

  const leaf = item as ParsedLeafItem;
  if (leaf.reviewStatus === 'approved') return 'complete';
  if (
    leaf.specStatus === 'ready_for_review' ||
    leaf.specStatus === 'needs_rereview' ||
    leaf.reviewStatus === 'changes_requested'
  )
    return 'needs_attention';
  if (
    leaf.specStatus === 'in_progress' ||
    leaf.planStatus === 'in_progress' ||
    leaf.implStatus === 'in_progress'
  )
    return 'in_progress';
  return 'pending';
};

const getOverallIcon = (
  item: ParsedItem,
  allItems: ReadonlyArray<ParsedItem>,
): string => {
  const iconMap: Record<OverallItemStatus, string> = {
    complete: 'check',
    in_progress: 'sync~spin',
    needs_attention: 'bell-dot',
    pending: 'circle-outline',
  };
  return iconMap[getOverallStatus(item, allItems)];
};

const getLeafStatusDots = (
  leaf: ParsedLeafItem,
): readonly [StatusDot, StatusDot, StatusDot, StatusDot] => {
  const specDot: StatusDot =
    leaf.specStatus === 'approved'
      ? 'passed'
      : leaf.specStatus === 'in_progress'
        ? 'active'
        : leaf.specStatus === 'ready_for_review' ||
            leaf.specStatus === 'needs_rereview'
          ? 'attention'
          : 'pending';

  const planDot: StatusDot =
    leaf.planStatus === 'approved'
      ? 'passed'
      : leaf.planStatus === 'in_progress'
        ? 'active'
        : 'pending';

  const implDot: StatusDot =
    leaf.implStatus === 'complete'
      ? 'passed'
      : leaf.implStatus === 'in_progress'
        ? 'active'
        : 'pending';

  const reviewDot: StatusDot =
    leaf.reviewStatus === 'approved'
      ? 'passed'
      : leaf.reviewStatus === 'changes_requested'
        ? 'attention'
        : leaf.reviewStatus === 'ready_for_review'
          ? 'active'
          : 'pending';

  return [specDot, planDot, implDot, reviewDot] as const;
};

const dotToSymbol = (dot: StatusDot): string => {
  const symbolMap: Record<StatusDot, string> = {
    passed: '●',
    active: '◉',
    attention: '◈',
    pending: '○',
  };
  return symbolMap[dot];
};

const getStatusDescription = (
  item: ParsedItem,
  allItems: ReadonlyArray<ParsedItem>,
): string => {
  if (item.type === 'epic') {
    const children = getChildLeaves(item as ParsedEpicItem, allItems);
    if (children.length === 0) return 'No items';
    const complete = children.filter((c) => c.reviewStatus === 'approved').length;
    return `${complete}/${children.length} complete`;
  }
  const leaf = item as ParsedLeafItem;
  return getLeafStatusDots(leaf).map(dotToSymbol).join(' ');
};

const buildContextValue = (item: ParsedItem): string => {
  if (item.type === 'epic') return '';
  const leaf = item as ParsedLeafItem;
  return [
    'isLeaf',
    ...(leaf.location ? ['hasLocation'] : []),
    ...(leaf.planStatus !== 'pending' ? ['hasPlan'] : []),
  ].join(',');
};

export class WorkflowTreeProvider
  implements vscode.TreeDataProvider<WorkflowTreeItem>
{
  private readonly _onDidChangeTreeData =
    new vscode.EventEmitter<WorkflowTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private readonly _watcher: WorkflowWatcher;
  private readonly _disposables: ReadonlyArray<vscode.Disposable>;

  constructor(watcher: WorkflowWatcher) {
    this._watcher = watcher;
    const sub = watcher.onDidChangeWorkflows(() => {
      this._updateContext();
      this._onDidChangeTreeData.fire(undefined);
    });
    this._disposables = [sub];
    this._updateContext();
  }

  private _updateContext(): void {
    const hasWorkspace = this._watcher.hasWorkspaceFolder;
    const hasSdd = this._watcher.hasSddDir;
    const hasWorkflows = this._watcher.workflows.length > 0;

    void vscode.commands.executeCommand('setContext', 'sdd.noProject', !hasWorkspace || !hasSdd);
    void vscode.commands.executeCommand('setContext', 'sdd.noWorkflows', hasWorkspace && hasSdd && !hasWorkflows);
  }

  getTreeItem(element: WorkflowTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: WorkflowTreeItem): WorkflowTreeItem[] {
    if (!element) {
      return [
        ...this._watcher.workflows.map((w) => new WorkflowNode(w)),
        ...this._watcher.erroredDirs.map((dir) => new ErrorNode(dir)),
      ];
    }
    if (element instanceof WorkflowNode) {
      return element.workflow.items
        .filter((i) => i.parentId === undefined)
        .map((i) => new ItemNode(i, element.workflow.items));
    }
    if (element instanceof ItemNode && element.item.type === 'epic') {
      const epic = element.item as ParsedEpicItem;
      return element.allItems
        .filter((i) => i.type !== 'epic' && i.parentId === epic.id)
        .map((i) => new ItemNode(i, element.allItems));
    }
    return [];
  }

  dispose(): void {
    for (const d of this._disposables) d.dispose();
    this._onDidChangeTreeData.dispose();
  }
}

export {
  getOverallStatus,
  getStatusDescription,
  getLeafStatusDots,
  dotToSymbol,
  buildContextValue,
  WorkflowNode,
  ItemNode,
  ErrorNode,
};
export type { WorkflowTreeItem };
