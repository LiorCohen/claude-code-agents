---
id: 151
title: "Add a VS Code extension for SDD that reflects project status, workflow status, and other SDD state in the IDE"
status: speccing
priority: high
created: 2026-02-17
---

# Add a VS Code extension for SDD that reflects project status, workflow status, and other SDD state in the IDE

## Context

SDD project state (task status, workflow phase, active changes, component health) currently lives in files on disk and is only visible through CLI commands like `/tasks` and `/sdd`. A VS Code extension could surface this information directly in the IDE — status bar, sidebar panels, tree views — giving developers ambient awareness of project state without switching context.

## v1 Scope (Decided)

**Read-only extension** — watches `.sdd/workflows/` and `.sdd/sdd-settings.yaml`, never writes. No bidirectional communication with Claude Code.

### Features (all P0, ship together)

#### 1. Activity Bar + Sidebar Tree View
Dedicated SDD icon in the activity bar. Tree view shows all active workflows:

```
SDD WORKFLOWS
├── ▶ a1b2c3 (User Management)
│   ├── 🟢 a1b2-1: API Contracts        ← spec ✓  plan ✓  impl ●  review ○
│   ├── 🔵 a1b2-2: Backend Service      ← spec ✓  plan ●  impl ○  review ○
│   └── ⚪ a1b2-3: E2E Tests            ← spec ○  plan ○  impl ○  review ○
└── ▶ x7y8z9 (Notifications)
```

- Click item → opens stepper webview
- Click phase indicator → opens artifact (SPEC.md, PLAN.md)
- Context menu → "View Spec", "View Plan"

#### 2. Lifecycle Stepper Webview
Rich 4-phase visualization per workflow item:

```
┌─────────────────────────────────────────────────────────────┐
│  a1b2-2: Backend Service  (feature)                         │
│  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐             │
│  │ SPEC │───▶│ PLAN │───▶│ IMPL │───▶│REVIEW│             │
│  │  ✅  │    │  🔵  │    │  ○   │    │  ○   │             │
│  └──────┘    └──────┘    └──────┘    └──────┘             │
│  Current step: plan_creation                                │
│  Dependencies: a1b2-1 (API Contracts) ✅                    │
│  [View Spec]  [View Plan]                                   │
└─────────────────────────────────────────────────────────────┘
```

- Shows dependency graph for items with `depends_on`
- Epic aggregate view with progress bars per phase
- Links to open artifacts in editor

#### 3. Status Bar Item
Always-visible at bottom of VSCode:

- No workflow: `SDD: No active workflow`
- Active: `SDD: a1b2-2 Backend Service — Plan (2/4 planned)`
- Approval needed: `SDD: ⚠ Spec ready for review`
- Phase gate: `SDD: ✓ All specs approved — ready to plan`

Click → opens stepper webview for current item.

#### 4. Approval Gate Notifications
FileSystemWatcher detects `workflow.yaml` changes and diffs state:

| Transition | Notification |
|-----------|-------------|
| `spec_status` → `ready_for_review` | "Spec for **X** is ready for review" |
| All specs → `approved` | "All specs approved — ready to start planning" |
| All plans → `approved` | "All plans approved — ready to implement" |
| `impl_status` → `complete` | "Implementation of **X** complete — ready for review" |
| `review_status` → `changes_requested` | "Changes requested on **X**" |
| All reviews → `approved` | "Workflow complete! All changes approved." |

### Data Sources

- `.sdd/workflows/*/workflow.yaml` — workflow state (four-field status model)
- `.sdd/sdd-settings.yaml` — component settings (future: component health tree)
- `changes/` directory — artifact locations for linking

### Architecture

```
vscode-extension/
├── src/
│   ├── extension.ts              # Activation, register providers
│   ├── workflow-watcher.ts       # FileSystemWatcher on .sdd/workflows/
│   ├── workflow-parser.ts        # Parse workflow.yaml → typed state
│   ├── views/
│   │   ├── workflow-tree.ts      # TreeDataProvider for sidebar
│   │   ├── lifecycle-webview.ts  # Webview stepper panel
│   │   └── status-bar.ts        # Status bar item
│   └── notifications/
│       └── approval-gates.ts     # Watch for review-ready transitions
├── media/
│   ├── icons/                    # Phase & status icons
│   └── lifecycle.css             # Stepper styling
└── package.json                  # Contributes: views, viewsContainers
```

### Future Ideas (not v1)

- Component health tree from `sdd-settings.yaml`
- Terminal injection to send `/sdd-run` commands to Claude Code
- File decorations for files in current change scope
- Task backlog view from `.tasks/` directory
- Change timeline/history from `changes/YYYY/MM/DD/`
- Spec index explorer
