// VS Code API requires classes for StatusBarItem management and Disposable pattern.

import * as vscode from 'vscode';
import type { WorkflowWatcher } from '../workflow-watcher';
import type { ParsedLeafItem, ParsedWorkflow } from '../types';

const FOCUS_KEY = 'sdd.focusedItem';

type FocusState = {
  readonly workflowId: string;
  readonly itemId: string;
};

const getLeafItems = (
  workflows: ReadonlyArray<ParsedWorkflow>,
): ReadonlyArray<ParsedLeafItem> =>
  workflows.flatMap((w) =>
    w.items.filter((i): i is ParsedLeafItem => i.type !== 'epic'),
  );

const findFocusedItem = (
  workflows: ReadonlyArray<ParsedWorkflow>,
  focus: FocusState | undefined,
): ParsedLeafItem | undefined => {
  if (!focus) return undefined;
  const workflow = workflows.find((w) => w.id === focus.workflowId);
  if (!workflow) return undefined;
  return workflow.items.find(
    (i): i is ParsedLeafItem => i.type !== 'epic' && i.id === focus.itemId,
  );
};

const getCurrentPhaseLabel = (item: ParsedLeafItem): string => {
  if (item.reviewStatus === 'approved') return 'Complete';
  if (item.reviewStatus === 'changes_requested') return 'Changes requested';
  if (item.reviewStatus === 'ready_for_review') return 'In review';
  if (item.implStatus === 'complete') return 'Impl complete';
  if (item.implStatus === 'in_progress') return 'Implementing';
  if (item.planStatus === 'approved') return 'Planned';
  if (item.planStatus === 'in_progress') return 'Planning';
  if (item.specStatus === 'approved') return 'Spec approved';
  if (item.specStatus === 'ready_for_review' || item.specStatus === 'needs_rereview')
    return 'Spec review';
  if (item.specStatus === 'in_progress') return 'Speccing';
  return 'Pending';
};

export class StatusBarManager implements vscode.Disposable {
  private readonly _item: vscode.StatusBarItem;
  private readonly _watcher: WorkflowWatcher;
  private readonly _workspaceState: vscode.Memento;
  private readonly _disposables: ReadonlyArray<vscode.Disposable>;
  private _focus: FocusState | undefined;

  constructor(watcher: WorkflowWatcher, workspaceState: vscode.Memento) {
    this._watcher = watcher;
    this._workspaceState = workspaceState;

    this._item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this._item.command = 'sdd.selectFocusItem';
    this._item.show();

    this._focus = this._workspaceState.get<FocusState>(FOCUS_KEY);

    const sub = watcher.onDidChangeWorkflows(() => this._update());
    this._disposables = [sub];
    this._update();
  }

  setFocus(item: ParsedLeafItem): FocusState {
    this._focus = { workflowId: item.workflowId, itemId: item.id };
    void this._workspaceState.update(FOCUS_KEY, this._focus);
    this._update();
    return this._focus;
  }

  clearFocus(): FocusState | undefined {
    this._focus = undefined;
    void this._workspaceState.update(FOCUS_KEY, undefined);
    this._update();
    return this._focus;
  }

  async showQuickPick(): Promise<ParsedLeafItem | undefined> {
    const leaves = getLeafItems(this._watcher.workflows);
    if (leaves.length === 0) return undefined;

    const items: ReadonlyArray<vscode.QuickPickItem> = [
      { label: '$(list-tree) Show aggregate', description: 'Clear focus' },
      ...leaves.map((leaf) => ({
        label: `$(target) ${leaf.changeId}: ${leaf.title}`,
        description: getCurrentPhaseLabel(leaf),
        detail: `Workflow: ${leaf.workflowId}`,
      })),
    ];

    const picked = await vscode.window.showQuickPick([...items], {
      placeHolder: 'Select a workflow item to focus on',
    });

    if (!picked) return undefined;

    if (picked.label.startsWith('$(list-tree)')) {
      this.clearFocus();
      return undefined;
    }

    const index = items.indexOf(picked) - 1;
    if (index >= 0 && index < leaves.length) {
      this.setFocus(leaves[index]);
      return leaves[index];
    }
    return undefined;
  }

  private _update(): void {
    const workflows = this._watcher.workflows;

    if (!this._watcher.hasWorkspaceFolder) {
      this._item.text = '$(circle-slash) SDD: No project';
      this._item.tooltip = 'No workspace folder open';
      return;
    }

    if (!this._watcher.hasSddDir) {
      this._item.text = '$(circle-slash) SDD: No project';
      this._item.tooltip = 'No .sdd/ directory found';
      return;
    }

    if (workflows.length === 0) {
      this._item.text = '$(inbox) SDD: No active workflows';
      this._item.tooltip = 'No workflow.yaml files found';
      return;
    }

    const allLeaves = getLeafItems(workflows);

    const needsAttention = allLeaves.filter(
      (i) =>
        i.specStatus === 'ready_for_review' ||
        i.specStatus === 'needs_rereview' ||
        i.reviewStatus === 'changes_requested',
    );
    if (needsAttention.length > 0) {
      const specReview = needsAttention.filter(
        (i) => i.specStatus === 'ready_for_review' || i.specStatus === 'needs_rereview',
      );
      this._item.text =
        specReview.length > 0
          ? `$(bell-dot) SDD: ${specReview.length} spec${specReview.length > 1 ? 's' : ''} ready for review`
          : `$(bell-dot) SDD: ${needsAttention.length} item${needsAttention.length > 1 ? 's need' : ' needs'} attention`;
      this._item.tooltip = needsAttention.map((i) => `${i.changeId}: ${i.title}`).join('\n');
      return;
    }

    const allSpecsApproved =
      allLeaves.length > 0 &&
      allLeaves.every((i) => i.specStatus === 'approved') &&
      allLeaves.some((i) => i.planStatus === 'pending');
    if (allSpecsApproved) {
      this._item.text = '$(pass-filled) SDD: All specs approved — ready to plan';
      this._item.tooltip = 'All specifications are approved';
      return;
    }

    const allComplete =
      allLeaves.length > 0 && allLeaves.every((i) => i.reviewStatus === 'approved');
    if (allComplete) {
      this._item.text = '$(check-all) SDD: Workflow complete!';
      this._item.tooltip = 'All items reviewed and approved';
      return;
    }

    const focusedItem = findFocusedItem(workflows, this._focus);
    if (focusedItem) {
      const phase = getCurrentPhaseLabel(focusedItem);
      this._item.text = `$(target) SDD: ${focusedItem.changeId} ${focusedItem.title} — ${phase}`;
      this._item.tooltip = `Focused on ${focusedItem.title}\nWorkflow: ${focusedItem.workflowId}`;
      return;
    }

    if (this._focus) {
      this.clearFocus();
      return;
    }

    const specced = allLeaves.filter((i) => i.specStatus === 'approved').length;
    const planned = allLeaves.filter((i) => i.planStatus === 'approved').length;
    const implemented = allLeaves.filter((i) => i.implStatus === 'complete').length;
    const reviewed = allLeaves.filter((i) => i.reviewStatus === 'approved').length;
    const total = allLeaves.length;

    this._item.text = `$(list-tree) SDD: ${specced}/${total} specced, ${planned}/${total} planned`;
    this._item.tooltip = `Spec: ${specced}/${total}\nPlan: ${planned}/${total}\nImpl: ${implemented}/${total}\nReview: ${reviewed}/${total}`;
  }

  dispose(): void {
    this._item.dispose();
    for (const d of this._disposables) d.dispose();
  }
}
