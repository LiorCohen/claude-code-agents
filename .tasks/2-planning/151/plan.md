---
title: VS Code extension for SDD workflow visualization
created: 2026-02-18 08:10 UTC
---

# Plan: VS Code Extension for SDD Workflow Visualization

## Problem Summary

SDD workflow state lives in `.sdd/workflows/*/workflow.yaml` files on disk, only accessible through CLI commands. Developers have no ambient awareness of lifecycle progress, approval gates, or multi-workflow status within VS Code. This extension reads those YAML files and surfaces the state through a tree view, status bar, stepper webview, and approval notifications — strictly read-only.

## Files to Modify

All files are new — the `vscode-extension/` directory does not exist yet.

| File | Changes |
|------|---------|
| `vscode-extension/package.json` | Extension manifest: `engines.vscode: "^1.96.0"`, activationEvents (`onStartupFinished`), contributes (viewsContainers, views, viewsWelcome, commands, menus), dependencies (`yaml`, `react`, `react-dom`), devDependencies (`@types/vscode`, `@vscode/vsce`, `typescript`, `webpack`, `ts-loader`, `vitest`), scripts |
| `vscode-extension/tsconfig.json` | TypeScript config: `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`, `strict: true`, `jsx: react-jsx` for webview |
| `vscode-extension/tsconfig.extension.json` | Separate config for extension host code (no JSX, `outDir: dist/extension`) |
| `vscode-extension/tsconfig.webview.json` | Separate config for React webview code (`jsx: react-jsx`, `outDir: dist/webview`) |
| `vscode-extension/webpack.config.js` | Two entry points: `extension` (Node target, externals: vscode) and `webview` (web target, bundles React) |
| `vscode-extension/vitest.config.ts` | Vitest config for unit tests, `environment: node`, alias `@/` → `src/` |
| `vscode-extension/.vscodeignore` | Exclude `src/`, `webview/`, `node_modules/`, `*.ts`, tests, config files from packaged `.vsix` |
| `vscode-extension/src/types.ts` | Full type definitions matching the YAML schema: `WorkflowYaml`, `WorkflowItemYaml` (with `children`), `EpicItemYaml`, status consts, `ParsedWorkflow` (flattened for tree/status bar use) |
| `vscode-extension/src/extension.ts` | Activation: find workspace folder with `.sdd/`, create `WorkflowWatcher`, `WorkflowTreeProvider`, `StatusBarManager`, `ApprovalGateNotifier`, `LifecycleStepperPanel`; register commands; wire up event flow |
| `vscode-extension/src/workflow-watcher.ts` | `FileSystemWatcher` on `.sdd/workflows/**/workflow.yaml`; debounce (300ms); on change, re-parse all workflows; emit `onDidChangeWorkflows` event; track previous state for diffing |
| `vscode-extension/src/workflow-parser.ts` | Parse YAML string → `ParsedWorkflow`; flatten epic/children hierarchy into a flat item list with `parentId` references; handle malformed YAML gracefully (return error result, never throw) |
| `vscode-extension/src/views/workflow-tree.ts` | `TreeDataProvider<WorkflowTreeItem>` with three node levels: workflow → epic/item → child item; inline actions (view spec, view plan, set focus) via `package.json` menus; status description using codicon-style dots; refresh on watcher events |
| `vscode-extension/src/views/status-bar.ts` | `StatusBarItem` manager; aggregate mode (counts across all workflows) and focused mode (single item detail); priority-based icon selection (approval > phase gate > complete > focused > aggregate); quick pick on click; persist focus in `workspaceState` |
| `vscode-extension/src/views/lifecycle-webview.ts` | Manages a single `WebviewPanel` in the editor area; creates panel on first item click, reuses it for subsequent selections; posts item data via `postMessage`; handles `openFile` messages from webview to open artifacts in editor |
| `vscode-extension/src/notifications/approval-gates.ts` | Compares previous vs current workflow state; detects 5 transition types: spec ready for review, all specs approved, implementation complete, changes requested, workflow complete; fires `vscode.window.showInformationMessage` with action buttons |
| `vscode-extension/webview/index.tsx` | React entry point; listens for `postMessage` from extension; renders `StepperPanel` |
| `vscode-extension/webview/StepperPanel.tsx` | Feature item view: 4-phase horizontal stepper with status icons, dependencies, blocking items, artifact links. Epic view: progress bars per phase, children list. Approval banner when attention needed |
| `vscode-extension/webview/stepper.css` | Theme-aware styling using `--vscode-*` CSS variables; light/dark/high-contrast support; no hardcoded colors |
| `vscode-extension/webview/vscode-api.ts` | Typed wrapper around `acquireVsCodeApi()` for type-safe message passing between webview and extension |
| `vscode-extension/media/icons/sdd-icon.svg` | Activity bar icon (simple, monochrome, theme-aware) |
| `vscode-extension/src/test/workflow-parser.test.ts` | Unit tests for parser |
| `vscode-extension/src/test/approval-gates.test.ts` | Unit tests for notification detection |
| `vscode-extension/src/test/workflow-tree.test.ts` | Unit tests for tree data generation |

## Changes

### 1. Project Setup and Build System

Set up the `vscode-extension/` directory as a standalone project with its own `package.json`, TypeScript configs, and webpack build. Two build targets: extension host code (Node.js, CommonJS for VS Code) and webview code (browser, bundled React). Vitest for unit tests. `@vscode/vsce` for packaging.

The extension activates via `onStartupFinished` (preferred over the deprecated `*` event) since it needs to watch for `.sdd/` presence. When `.sdd/` doesn't exist, it shows "No SDD project" — low cost, no file watching until `.sdd/` appears.

### 2. Type Definitions (`types.ts`)

Define types that match the **actual YAML schema** (from `workflow-yaml-schema.md`), not the plugin's incomplete TypeScript types. Key differences from plugin types:
- `WorkflowItemYaml` includes optional `children: WorkflowItemYaml[]` for epics
- `context_sections` and `substep` fields included
- Epics have `type: 'epic'` and no `change_id`; they also lack the four status fields (`spec_status`, etc.) — aggregate status for epic tree nodes is computed from children
- Epics may have `depends_on` (for inter-epic ordering); parsed but not displayed in the stepper webview for v0.1

Also define a `ParsedWorkflow` type — the flattened, display-ready representation used by the tree view and status bar. This separates raw YAML parsing from display logic:
- Flat list of items with `parentId` for tree hierarchy
- Pre-computed overall status icon per item
- Pre-computed status dot descriptions

### 3. Workflow Watcher (`workflow-watcher.ts`)

`FileSystemWatcher` on the glob pattern `.sdd/workflows/*/workflow.yaml`. On file change/create/delete:
1. Debounce 300ms (aggregate rapid changes from a single Claude operation)
2. Read all `workflow.yaml` files in `.sdd/workflows/*/`
3. Parse each through `workflow-parser`
4. Store current state and previous state (for notification diffing)
5. Fire `onDidChangeWorkflows` event

Also watches for `.sdd/` directory creation/deletion to handle the "No SDD project" → "active project" transition. A `vscode.workspace.fs.stat` check on activation determines initial state.

### 4. Workflow Parser (`workflow-parser.ts`)

Pure function: `parseWorkflowYaml(content: string): ParseResult<ParsedWorkflow>`.

- Uses the `yaml` npm package (same as plugin system)
- Returns `{ ok: true, data: ParsedWorkflow }` or `{ ok: false, error: string }`
- Flattens the epic → children hierarchy into a flat item list with `parentId` references
- Validates required fields, returns error for malformed input
- Never throws — all errors are returned as values

Also exports `parseAllWorkflows(workflowDir: string): Promise<ParsedWorkflow[]>` which reads and parses all workflow YAML files in the given directory.

### 5. Tree View (`workflow-tree.ts`)

`TreeDataProvider<WorkflowTreeItem>` with three levels:

1. **Workflow node** — collapsible, shows workflow ID as label (e.g., `a1b2c3`). If workflow has errors, shows "Error loading workflow" with warning icon.
2. **Epic/top-level item node** — collapsible for epics (shows aggregate status), leaf for non-epic items. Shows `change_id: title` as label, 4-phase dots as description.
3. **Child item node** — leaf nodes under epics. Same display as top-level items.

Leading icons map to overall item status:
- `$(check)` — all phases complete (`review_status: approved`)
- `$(sync~spin)` — any phase `in_progress`
- `$(bell-dot)` — any status is `ready_for_review` or `needs_rereview`
- `$(circle-outline)` — all pending

Inline actions via `contributes.menus["view/item/context"]` with `"group": "inline"`:
- `sdd.openSpec` — `$(file-text)` icon, visible when item has `location`
- `sdd.openPlan` — `$(notebook)` icon, visible when item has `location` AND `plan_status !== 'pending'`
- `sdd.setFocus` — `$(target)` icon, visible on leaf items

Each leaf item's `TreeItem.command` is set to `sdd.showStepper` so clicking the item label opens the stepper webview. Workflow and epic nodes have no command — clicking them expands/collapses.

`package.json` uses `when` clauses on `viewItem` context values to control inline icon visibility. The refresh button appears in the view title bar via `contributes.menus["view/title"]` pointing to `sdd.refreshWorkflows`.

### 6. Status Bar (`status-bar.ts`)

Single `StatusBarItem` with priority-based display:

1. Check `.sdd/` existence → `$(circle-slash) SDD: No project`
2. Check workflows exist → `$(inbox) SDD: No active workflows`
3. Check for approval-needed items → `$(bell-dot) SDD: N specs ready for review`
4. Check for phase gates reached → `$(pass-filled) SDD: All specs approved — ready to plan`
5. Check for workflow complete → `$(check-all) SDD: Workflow complete!`
6. Check for focused item → `$(target) SDD: {change_id} {title} — {step} ({progress})`
7. Default aggregate → `$(list-tree) SDD: N/M specced, N/M planned, ...`

On click: show quick pick with all items + "Clear focus" option. Selection saved to `context.workspaceState` for persistence across restarts. On activation, restore saved focus and validate it still exists.

### 7. Lifecycle Stepper Webview (`lifecycle-webview.ts` + `webview/`)

Uses `vscode.window.createWebviewPanel()` to open a panel in the **editor area** (not the sidebar). A single panel is created on first item click and reused for subsequent selections (per spec constraint: "one stepper panel that updates when the user selects a different item"). If the user closes the panel, a new one is created on the next click. The extension sends item data via `postMessage` when:
- User clicks an item in the tree
- User selects an item from the quick pick
- Focused item's state changes (watcher update)

The React webview renders two views:
- **Feature/bugfix/refactor view**: 4-phase horizontal stepper with status icons, current step label, dependency list (from `depends_on`), blocking items (computed by reverse-scanning all items in the workflow for those whose `depends_on` references the current item), and artifact links (View Spec / View Plan buttons)
- **Epic view**: progress bars per phase (computed from children statuses), children list with inline statuses, click-to-navigate to child detail

The webview sends messages back to the extension for:
- `openFile` — opens `{location}/SPEC.md` or `{location}/PLAN.md` in the editor
- `selectItem` — navigates to a child item's detail view

Theme-aware CSS: all colors use `--vscode-*` variables. Stepper boxes use `--vscode-editor-background` for fill, `--vscode-focusBorder` for active phase, status dot colors from `--vscode-testing-iconPassed` (green), `--vscode-debugIcon-startForeground` (blue), `--vscode-disabledForeground` (gray), `--vscode-list-warningForeground` (yellow).

### 8. Approval Gate Notifications (`approval-gates.ts`)

Pure function: `detectTransitions(previous: ParsedWorkflow[], current: ParsedWorkflow[]): Notification[]`.

Compares previous and current state to detect 5 transition types:

| Transition | Detection | Message |
|------------|-----------|---------|
| Spec ready for review | `spec_status`: not `ready_for_review` → `ready_for_review` | `Spec for "{title}" is ready for review` with [View Spec] button |
| All specs approved | Any `spec_status` was not `approved` → all now `approved` (per workflow) | `All specs approved in workflow {id} — ready to plan` |
| Implementation complete | `impl_status`: not `complete` → `complete` | `Implementation of "{title}" is complete — ready for review` |
| Changes requested | `review_status`: not `changes_requested` → `changes_requested` | `Changes requested on "{title}"` |
| Workflow complete | Workflow existed → all `review_status: approved` | `Workflow complete!` |

When a workflow appears for the first time (no previous state), no transitions are fired — existing status values are treated as the baseline, not as transitions. Similarly, when a workflow disappears (completed and deleted from disk), no transitions are fired.

Notifications use `vscode.window.showInformationMessage`. Action buttons trigger commands (e.g., [View Spec] opens the spec file).

### 9. Extension Entry Point (`extension.ts`)

Activation wires everything together. First, resolve the workspace folder:

- If `vscode.workspace.workspaceFolders` is `undefined` (no folder open) → set state to "no project", skip watcher setup
- For multi-root workspaces: iterate `workspaceFolders`, find first where `.sdd/` exists (via `vscode.workspace.fs.stat`). If none found → "no project"
- For single folder: use it directly, let the watcher determine `.sdd/` presence

```
activate(context):
  sddFolder = findWorkspaceFolderWithSdd(workspaceFolders)  // undefined if none
  watcher = new WorkflowWatcher(sddFolder)  // handles undefined → "no project" state
  parser = workflow-parser module
  treeProvider = new WorkflowTreeProvider(watcher)
  statusBar = new StatusBarManager(watcher, context.workspaceState)
  notifier = new ApprovalGateNotifier(watcher)
  stepperPanel = new LifecycleStepperPanel(context.extensionUri, watcher)

  registerTreeDataProvider('sddWorkflows', treeProvider)
  registerCommand('sdd.refreshWorkflows', () => watcher.refresh())
  registerCommand('sdd.openSpec', (item) => openFile(item.location + '/SPEC.md'))
  registerCommand('sdd.openPlan', (item) => openFile(item.location + '/PLAN.md'))
  registerCommand('sdd.setFocus', (item) => statusBar.setFocus(item))
  registerCommand('sdd.showStepper', (item) => stepperPanel.showItem(item))

  watcher.start()
```

Disposal: all watchers, providers, and subscriptions pushed to `context.subscriptions` for cleanup.

## Dependencies

Build order (sequential where noted):

1. **types.ts** — no dependencies, define first
2. **workflow-parser.ts** — depends on types.ts only. Pure functions, testable in isolation.
3. **approval-gates.ts** — depends on types.ts only. Pure diff logic, testable in isolation.
4. **workflow-watcher.ts** — depends on types.ts + workflow-parser. Requires VS Code API (`FileSystemWatcher`).
5. **views/workflow-tree.ts** — depends on types.ts + workflow-watcher. Requires VS Code API (`TreeDataProvider`).
6. **views/status-bar.ts** — depends on types.ts + workflow-watcher. Requires VS Code API (`StatusBarItem`).
7. **notifications integration** — wires approval-gates.ts into watcher events. Requires VS Code API.
8. **webview/** — React app, built separately by webpack. Depends only on types.ts (shared message types).
9. **views/lifecycle-webview.ts** — depends on types.ts + workflow-watcher + webview bundle. Uses `createWebviewPanel()` (editor area).
10. **extension.ts** — wires everything together. Last.

Steps 2+3 can be built and tested in parallel (both pure logic). Steps 5+6+7 can proceed in parallel after step 4.

## Tests

### Unit Tests

**workflow-parser.test.ts:**
- [ ] `parse_valid_workflow_returns_parsed_data` — standard workflow.yaml with items
- [ ] `parse_workflow_with_epic_flattens_children` — epic with 3 children produces flat list with parentId refs
- [ ] `parse_workflow_preserves_all_status_fields` — all 4 status fields mapped correctly for each item
- [ ] `parse_invalid_yaml_returns_error` — malformed YAML content returns `{ ok: false }`
- [ ] `parse_empty_file_returns_error` — empty string returns error, not crash
- [ ] `parse_missing_required_fields_returns_error` — YAML missing `id` or `items` returns error
- [ ] `parse_workflow_with_no_items_returns_empty_list` — valid workflow with `items: []`
- [ ] `parse_epic_without_children_treated_as_leaf` — epic with no children array
- [ ] `parse_preserves_location_and_depends_on` — location paths and dependency arrays intact
- [ ] `parse_all_status_values_accepted` — each valid status const (`pending`, `in_progress`, `approved`, etc.) parses correctly

**approval-gates.test.ts:**
- [ ] `detect_spec_ready_for_review_transition` — item goes from `spec_status: in_progress` to `ready_for_review`
- [ ] `detect_all_specs_approved_gate` — last unapproved spec becomes approved
- [ ] `detect_implementation_complete_transition` — item goes from `impl_status: in_progress` to `complete`
- [ ] `detect_changes_requested_transition` — item goes from `review_status: ready_for_review` to `changes_requested`
- [ ] `detect_workflow_complete` — all items reach `review_status: approved`
- [ ] `no_transitions_when_state_unchanged` — identical previous and current returns empty array
- [ ] `multiple_transitions_in_single_update` — two items change simultaneously, both detected
- [ ] `new_workflow_appearing_does_not_fire_false_transitions` — first time seeing a workflow doesn't fire "ready for review" if items started that way
- [ ] `workflow_disappearing_does_not_fire_transitions` — completed workflow removed from disk

**workflow-tree.test.ts:**
- [ ] `builds_tree_with_workflow_root_nodes` — 2 workflows produce 2 root nodes
- [ ] `builds_epic_as_collapsible_parent` — epic item rendered with `TreeItemCollapsibleState.Collapsed`
- [ ] `builds_children_under_epic` — children of epic appear as child nodes
- [ ] `non_epic_items_are_leaf_nodes` — feature items have `TreeItemCollapsibleState.None`
- [ ] `status_dots_description_correct` — item with mixed statuses shows correct dot pattern
- [ ] `leading_icon_check_for_complete_item` — all-approved item shows `$(check)`
- [ ] `leading_icon_spin_for_in_progress` — item with `in_progress` shows `$(sync~spin)`
- [ ] `leading_icon_bell_for_attention` — `ready_for_review` item shows `$(bell-dot)`
- [ ] `empty_workflows_shows_welcome_message` — no workflows returns welcome view message
- [ ] `error_workflow_shows_error_node` — malformed YAML produces error node in tree

### Integration Tests

Not in scope — deferred per spec (E2E/integration tests requiring VS Code instance are out of scope).

### E2E Tests (if applicable)

Not in scope — deferred per spec.

## Verification

- [ ] `cd vscode-extension && npx vitest run` — all unit tests pass
- [ ] `cd vscode-extension && npx vsce package` — produces `sdd-workflows-0.1.0.vsix` without error
- [ ] `node -e "const p=require('./vscode-extension/package.json'); console.log(Object.keys(p.contributes))"` — outputs viewsContainers, views, commands, menus
- [ ] `code --install-extension vscode-extension/sdd-workflows-0.1.0.vsix` — installs without error
- [ ] Extension shows "No SDD project" in a directory without `.sdd/`
- [ ] Extension shows tree view with workflows when `.sdd/workflows/` has valid YAML files
- [ ] Status bar shows aggregate counts and responds to quick pick focus selection
- [ ] Modifying a `workflow.yaml` file triggers tree refresh and approval notifications
