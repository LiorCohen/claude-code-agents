// VS Code API requires classes for Disposable pattern and EventEmitter.
// Classes here are mandated by the extension host API, not a style choice.

import * as vscode from 'vscode';
import { parseWorkflowYaml } from './workflow-parser';
import type { ParsedWorkflow } from './types';

export class WorkflowWatcher implements vscode.Disposable {
  private readonly _onDidChange =
    new vscode.EventEmitter<ReadonlyArray<ParsedWorkflow>>();
  readonly onDidChangeWorkflows = this._onDidChange.event;

  private _workflows: ReadonlyArray<ParsedWorkflow> = [];
  private _previousWorkflows: ReadonlyArray<ParsedWorkflow> = [];
  private _erroredDirs: ReadonlyArray<string> = [];
  private _watcher: vscode.FileSystemWatcher | undefined;
  private _sddWatcher: vscode.FileSystemWatcher | undefined;
  private _debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private _disposables: ReadonlyArray<vscode.Disposable> = [];

  private readonly _workspaceFolder: vscode.WorkspaceFolder | undefined;
  private _hasSddDir = false;

  constructor(workspaceFolder: vscode.WorkspaceFolder | undefined) {
    this._workspaceFolder = workspaceFolder;
  }

  get workflows(): ReadonlyArray<ParsedWorkflow> {
    return this._workflows;
  }

  get previousWorkflows(): ReadonlyArray<ParsedWorkflow> {
    return this._previousWorkflows;
  }

  get erroredDirs(): ReadonlyArray<string> {
    return this._erroredDirs;
  }

  get hasSddDir(): boolean {
    return this._hasSddDir;
  }

  get hasWorkspaceFolder(): boolean {
    return this._workspaceFolder !== undefined;
  }

  async start(): Promise<void> {
    if (!this._workspaceFolder) return;

    const sddUri = vscode.Uri.joinPath(this._workspaceFolder.uri, '.sdd');

    try {
      await vscode.workspace.fs.stat(sddUri);
      this._hasSddDir = true;
    } catch {
      this._hasSddDir = false;
    }

    const sddPattern = new vscode.RelativePattern(this._workspaceFolder, '.sdd');
    this._sddWatcher = vscode.workspace.createFileSystemWatcher(
      sddPattern, false, true, false,
    );
    const createSub = this._sddWatcher.onDidCreate(async () => {
      this._hasSddDir = true;
      await this._setupWorkflowWatcher();
      await this.refresh();
    });
    const deleteSub = this._sddWatcher.onDidDelete(() => {
      this._hasSddDir = false;
      this._previousWorkflows = this._workflows;
      this._workflows = [];
      this._onDidChange.fire(this._workflows);
    });
    this._disposables = [...this._disposables, this._sddWatcher, createSub, deleteSub];

    if (this._hasSddDir) {
      await this._setupWorkflowWatcher();
      await this.refresh();
    }
  }

  async refresh(): Promise<void> {
    if (!this._workspaceFolder || !this._hasSddDir) {
      this._previousWorkflows = this._workflows;
      this._workflows = [];
      this._erroredDirs = [];
      this._onDidChange.fire(this._workflows);
      return;
    }

    const workflowsUri = vscode.Uri.joinPath(
      this._workspaceFolder.uri, '.sdd', 'workflows',
    );

    const entries = await (async () => {
      try {
        return await vscode.workspace.fs.readDirectory(workflowsUri);
      } catch {
        return [] as [string, vscode.FileType][];
      }
    })();

    type RefreshResult =
      | { readonly ok: true; readonly data: ParsedWorkflow }
      | { readonly ok: false; readonly dir: string };

    const results = await Promise.all(
      entries
        .filter(([, type]) => type === vscode.FileType.Directory)
        .map(async ([name]): Promise<RefreshResult> => {
          const yamlUri = vscode.Uri.joinPath(workflowsUri, name, 'workflow.yaml');
          try {
            const content = await vscode.workspace.fs.readFile(yamlUri);
            const text = new TextDecoder().decode(content);
            const result = parseWorkflowYaml(text);
            return result.ok
              ? { ok: true, data: result.data }
              : { ok: false, dir: name };
          } catch {
            return { ok: false, dir: name };
          }
        }),
    );

    this._previousWorkflows = this._workflows;
    this._workflows = results
      .filter((r): r is { readonly ok: true; readonly data: ParsedWorkflow } => r.ok)
      .map((r) => r.data);
    this._erroredDirs = results
      .filter((r): r is { readonly ok: false; readonly dir: string } => !r.ok)
      .map((r) => r.dir);
    this._onDidChange.fire(this._workflows);
  }

  private async _setupWorkflowWatcher(): Promise<void> {
    if (!this._workspaceFolder || this._watcher) return;

    const pattern = new vscode.RelativePattern(
      this._workspaceFolder, '.sdd/workflows/*/workflow.yaml',
    );
    this._watcher = vscode.workspace.createFileSystemWatcher(pattern);

    const debouncedRefresh = () => {
      if (this._debounceTimer) clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => void this.refresh(), 300);
    };

    const changeSub = this._watcher.onDidChange(debouncedRefresh);
    const createSub = this._watcher.onDidCreate(debouncedRefresh);
    const deleteSub = this._watcher.onDidDelete(debouncedRefresh);
    this._disposables = [...this._disposables, this._watcher, changeSub, createSub, deleteSub];
  }

  dispose(): void {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    for (const d of this._disposables) d.dispose();
    this._onDidChange.dispose();
  }
}
