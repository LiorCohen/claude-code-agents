---
id: 151
title: "Add a VS Code extension for SDD that reflects project status, workflow status, and other SDD state in the IDE"
status: planning
priority: high
created: 2026-02-17
---

# Add a VS Code extension for SDD that reflects project status, workflow status, and other SDD state in the IDE

## Description

Build a read-only VS Code extension that watches SDD project state on disk (`.sdd/workflows/`, `.sdd/sdd-settings.yaml`, `changes/`) and surfaces it in the IDE through four features:

1. **Activity Bar + Sidebar Tree View** — dedicated SDD icon in the activity bar with a tree view showing all active workflows and their items. Each item displays a leading codicon for overall status (`$(check)` complete, `$(sync~spin)` in progress, `$(circle-outline)` pending, `$(bell-dot)` needs attention) and a 4-phase status description using colored dots (spec/plan/impl/review). On hover, inline action icons appear: `$(file-text)` opens SPEC.md, `$(notebook)` opens PLAN.md (hidden when plan is pending), `$(target)` sets the item as the status bar focus. Clicking the item label opens the lifecycle stepper webview. No context menus — all actions are inline icons.

2. **Lifecycle Stepper Webview** — a React-based webview panel showing a horizontal 4-phase stepper for a selected workflow item. Displays current step, dependency status, and links to open artifacts in the editor. For epics, shows an aggregate view with progress bars per phase across children.

3. **Status Bar Item** — always-visible indicator at the bottom of VS Code with a leading codicon for each state. Shows aggregate workflow summary until the user clicks to select a specific item as their focus. States (with codicons): `$(circle-slash)` no project, `$(inbox)` no workflows, `$(list-tree)` aggregate, `$(target)` focused item, `$(bell-dot)` approval needed, `$(pass-filled)` phase gate reached, `$(check-all)` workflow complete. Priority: approval needed > phase gate > complete > focused > aggregate. Click opens quick pick to select a focus item.

4. **Approval Gate Notifications** — `FileSystemWatcher` detects `workflow.yaml` changes, diffs previous vs. current state, and fires VS Code information notifications when status transitions require user attention (spec ready for review, all specs approved, implementation complete, changes requested, workflow complete).

The extension is strictly read-only — it never writes to `.sdd/` or any project files. It has no bidirectional communication with Claude Code. State is consumed entirely by watching the filesystem.

## Motivation

SDD workflow state currently lives in YAML files on disk, only visible through CLI commands (`/sdd`, `/sdd-run`). Developers working in VS Code have no ambient awareness of where they are in the change lifecycle, whether approval gates have been reached, or what the overall progress looks like across multiple workflow items. This creates unnecessary context-switching between the editor and the terminal.

A VS Code extension provides:
- **Ambient awareness** — see workflow state at a glance without running commands
- **Reduced friction** — approval gate notifications tell you what to do next instead of requiring you to check
- **Better orientation** — the stepper visualization makes the 4-phase lifecycle intuitive, especially for new SDD users
- **Multi-workflow visibility** — tree view shows all active workflows simultaneously, which CLI commands don't do well

## Scope

### In scope

- VS Code extension in `vscode-extension/` directory within this repo
- Activity bar icon and sidebar tree view (TreeDataProvider)
- React-based webview panel for lifecycle stepper visualization
- Status bar item with aggregate/focused workflow state
- Approval gate notification system based on file watching
- FileSystemWatcher on `.sdd/workflows/` for real-time state updates
- YAML parsing of `workflow.yaml` files into typed state
- Sideloaded installation (no marketplace publishing)
- Always-active extension with "No SDD project" indication when `.sdd/` doesn't exist
- User-selectable focus item for status bar (show all until user picks one)
- Unit tests for core non-visual logic: YAML parsing, state diffing/notification detection, tree data generation

### Out of scope

- Writing to any project files (read-only only)
- Bidirectional communication with Claude Code or terminal injection
- VS Code marketplace publishing
- E2E / integration tests requiring a running VS Code instance (ship first, add later)
- Full test coverage — only core logic (parser, state differ, tree data) needs unit tests
- Component health tree from `sdd-settings.yaml` (future)
- File decorations for files in current change scope (future)
- Task backlog view from `.tasks/` directory (future)
- Change timeline/history from `changes/YYYY/MM/DD/` (future)
- Spec index explorer (future)

## Constraints

- **Read-only** — the extension must never write to `.sdd/`, `changes/`, or any other project files
- **No external runtime dependencies** — must not require a running server, database, or background process
- **Filesystem as sole data source** — all state comes from watching files, no in-memory assumptions
- **React for webviews** — use React for the stepper webview panel, bundled with the extension
- **TypeScript** — extension and webview code in TypeScript
- **Workspace-scoped** — operates within the open VS Code workspace; multi-root workspaces show the first workspace with `.sdd/`
- **Graceful degradation** — when `.sdd/` doesn't exist, show "No SDD project" in the tree and status bar instead of erroring
- **Type definitions mirror the YAML schema** — the extension defines its own types in `types.ts` based on the full YAML schema (`workflow-yaml-schema.md`), not the incomplete `plugin/system/src/types/workflow.ts`. The YAML has additional fields (`children` on epics, `context_sections`, `substep`) that the plugin types omit. Copy the status const arrays from the plugin types, but define the full item/workflow shape from the schema
- **Theme-aware** — all UI elements (tree view icons, webview stepper, status bar) must use VS Code's theme colors and CSS variables (`--vscode-*`). The webview must adapt to light, dark, and high-contrast themes automatically. Never hardcode colors
- **Extension lives in `vscode-extension/`** at the repo root — separate `package.json`, separate build, no coupling to the plugin build system
- **Minimum VS Code version** — target latest stable (1.96+)
- **Focus persistence** — user's selected focus item is stored in `workspaceState` and survives VS Code restarts
- **Debouncing** — file watcher events are debounced (300ms) to avoid excessive re-parsing and notification spam
- **Single webview panel** — one stepper panel that updates when the user selects a different item, not one panel per item
- **Artifact resolution** — "View Spec" and "View Plan" resolve paths from the item's `location` field: `{location}/SPEC.md` and `{location}/PLAN.md`
- **Epic nesting in tree** — epics render as collapsible parent nodes with children nested underneath; epic node shows aggregate progress across its children. In the YAML, epics have `type: epic` with a `children` array containing their child items. The extension parses this hierarchy directly from the YAML
- **Workflow display name** — `WorkflowState` has no `title` field. Tree nodes for workflows display as `{id}` (the short hash). `WorkflowItem` has a `title` field which is used for item display names
- **Manual refresh command** — register `sdd.refreshWorkflows` command as a fallback if the file watcher misses a change

## Changes

| File/Directory | Change |
|------|--------|
| `vscode-extension/package.json` | New — extension manifest with activationEvents, contributes (viewsContainers, views, commands), dependencies (React, YAML parser, vscode types), devDependencies (`@vscode/vsce`), scripts (`build`, `package`, `test`) |
| `vscode-extension/tsconfig.json` | New — TypeScript config for extension + webview |
| `vscode-extension/src/extension.ts` | New — activation point, registers all providers (tree, webview, status bar, file watchers) |
| `vscode-extension/src/workflow-watcher.ts` | New — FileSystemWatcher on `.sdd/workflows/`, emits parsed state on change, tracks previous state for diffing |
| `vscode-extension/src/workflow-parser.ts` | New — parses `workflow.yaml` YAML into typed `WorkflowState`, handles missing/malformed files gracefully |
| `vscode-extension/src/types.ts` | New — `WorkflowState`, `WorkflowItem`, `WorkflowProgress` and status types (mirrored from plugin types) |
| `vscode-extension/src/views/workflow-tree.ts` | New — `TreeDataProvider` for sidebar, renders workflows and items with status icons |
| `vscode-extension/src/views/status-bar.ts` | New — status bar item manager, aggregate/focused modes, click handler |
| `vscode-extension/src/views/lifecycle-webview.ts` | New — webview panel provider, hosts React app, message passing for item selection |
| `vscode-extension/src/notifications/approval-gates.ts` | New — compares previous/current workflow state, fires VS Code notifications on approval-relevant transitions |
| `vscode-extension/webview/` | New — React app for the stepper webview (stepper component, styling, vscode webview API bridge) |
| `vscode-extension/media/icons/` | New — SVG icons for phases and statuses |
| `vscode-extension/.vscodeignore` | New — exclude source files from packaged extension |
| `vscode-extension/webpack.config.js` | New — bundles extension + React webview separately |
| `vscode-extension/src/test/workflow-parser.test.ts` | New — unit tests for YAML parsing, malformed input handling, graceful degradation |
| `vscode-extension/src/test/approval-gates.test.ts` | New — unit tests for state diffing and notification trigger detection |
| `vscode-extension/src/test/workflow-tree.test.ts` | New — unit tests for tree data generation (flat items, epic nesting, empty states) |
| `vscode-extension/vitest.config.ts` | New — Vitest configuration for unit tests |

## Acceptance Criteria

- [ ] Extension activates in VS Code when sideloaded — **verify:** `cd vscode-extension && npx vsce package` produces `.vsix`; `code --install-extension sdd-workflows-0.1.0.vsix` installs without error; extension appears in Extensions sidebar
- [ ] Activity bar shows an SDD icon that opens a sidebar panel — **verify:** open VS Code in a directory with `.sdd/workflows/`, SDD icon visible in activity bar, clicking it reveals the sidebar tree view
- [ ] Tree view lists all active workflows from `.sdd/workflows/*/workflow.yaml` — **verify:** create two `workflow.yaml` files in `.sdd/workflows/abc123/` and `.sdd/workflows/xyz789/`, both appear as top-level nodes in the tree
- [ ] Each workflow item shows 4-phase status indicators (spec/plan/impl/review) — **verify:** workflow item with `spec_status: approved, plan_status: in_progress, impl_status: pending, review_status: pending` shows checkmark, spinner, empty, empty indicators
- [ ] Clicking a workflow item opens the lifecycle stepper webview — **verify:** click any item in the tree, a webview panel opens showing the 4-phase stepper with the correct current phase highlighted
- [ ] Stepper webview shows dependency information for items with `depends_on` — **verify:** item with `depends_on: [01-api-contracts]` shows the dependency and its current status in the webview
- [ ] Status bar shows aggregate workflow summary — **verify:** with 2 workflows active, status bar shows `$(list-tree) SDD: N/M phase` format (e.g., `4/8 specced, 2/8 planned`) aggregated across all workflows, not picking one arbitrarily
- [ ] Status bar allows user to select a focus item — **verify:** click status bar item, quick pick appears listing all workflow items, selecting one changes the status bar to show that item's details
- [ ] Approval gate notifications fire on relevant state transitions — **verify:** modify a `workflow.yaml` to change `spec_status` from `in_progress` to `ready_for_review`, a VS Code notification appears saying "Spec for [title] is ready for review"
- [ ] Extension shows "No SDD project" when `.sdd/` doesn't exist — **verify:** open VS Code in a directory without `.sdd/`, tree view shows "No SDD project detected" message, status bar shows `SDD: No project`
- [ ] Extension shows "No active workflows" when `.sdd/` exists but `workflows/` is empty — **verify:** create `.sdd/` directory with no `workflows/` subdirectory, tree shows "No active workflows", status bar shows `SDD: No active workflows`
- [ ] Epics render as collapsible parent nodes with children nested underneath — **verify:** workflow with an epic containing 3 children shows the epic as a collapsible node, expanding it reveals the 3 child items with their own status indicators
- [ ] Focused status bar item persists across VS Code restarts — **verify:** select a focus item, restart VS Code, status bar still shows the focused item (or gracefully clears if that workflow no longer exists)
- [ ] Tree view updates in real-time when `workflow.yaml` changes — **verify:** modify a `workflow.yaml` file externally (e.g., via Claude Code), tree view reflects the change within 2 seconds without manual refresh
- [ ] Extension handles malformed/missing `workflow.yaml` gracefully — **verify:** create a `workflow.yaml` with invalid YAML content, extension logs a warning but doesn't crash; tree shows the workflow as "Error loading workflow"
- [ ] Manual refresh command works — **verify:** run `SDD: Refresh Workflows` from the command palette (or `sdd.refreshWorkflows` via keybinding), tree view re-reads all `workflow.yaml` files and reflects current state
- [ ] Inline "View Spec" action opens SPEC.md — **verify:** hover over a tree item with a `location` field, click the `$(file-text)` icon, `{location}/SPEC.md` opens in the editor
- [ ] Inline "View Plan" action opens PLAN.md and is hidden when plan is pending — **verify:** item with `plan_status: approved` shows `$(notebook)` icon on hover that opens `{location}/PLAN.md`; item with `plan_status: pending` does not show the icon
- [ ] Inline "Set Focus" action sets status bar focus — **verify:** hover over a tree item, click the `$(target)` icon, status bar switches from aggregate to showing that item's details
- [ ] `vsce package` produces a valid .vsix — **verify:** `cd vscode-extension && npx vsce package` succeeds without error and produces `sdd-workflows-0.1.0.vsix`
- [ ] `package.json` declares expected VS Code contributions — **verify:** `node -e "const p=require('./vscode-extension/package.json'); const c=p.contributes; console.log(Object.keys(c))"` outputs `viewsContainers`, `views`, `commands` (at minimum)
- [ ] Unit tests pass for core logic — **verify:** `cd vscode-extension && npx vitest run` passes with tests covering workflow-parser (valid/invalid YAML, missing files), approval-gates (state transition detection), and workflow-tree (flat items, epic nesting, empty states)
