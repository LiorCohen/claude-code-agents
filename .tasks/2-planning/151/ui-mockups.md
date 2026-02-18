# SDD VS Code Extension — UI Mockups

## 1. Activity Bar + Sidebar Tree View

### State: Active workflows with epics

Tree items show inline action icons on hover. Each leaf item has up to
3 inline icons on the right side. The item's description (right of the
label) shows the 4-phase status using codicons.

```
 _______________________________________________
|  [SDD]  |                                     |
|  icon   |  SDD WORKFLOWS                  [R] |
|         |                                     |
|         |  v a1b2c3 — User Management         |
|         |  |                                  |
|         |  |  v 01 User Management (epic)     |
|         |  |  |  ✓ ✓ ● ○                      |
|         |  |  |                               |
|         |  |  |  $(check) a1b2-1: API Co...   |
|         |  |  |    ✓ ✓ ✓ ✓                    |
|         |  |  |                               |
|         |  |  |  $(sync~spin) a1b2-2: Ba...   |
|         |  |  |    ✓ ✓ ● ○     [S] [P] [T]   |
|         |  |  |                  ^   ^   ^     |
|         |  |  |                  |   |   |     |
|         |  |  |          View Spec   |  Focus  |
|         |  |  |              View Plan         |
|         |  |  |                               |
|         |  |  |  $(sync~spin) a1b2-3: Fr...   |
|         |  |  |    ✓ ● ○ ○                    |
|         |  |  |                               |
|         |  |  $(circle-outline) a1b2-4: E2E.. |
|         |  |    ✓ ○ ○ ○                       |
|         |  |                                  |
|         |  > x7y8z9 — Notifications           |
|         |    (collapsed)                      |
|         |                                     |
|_________|_____________________________________|

Inline icons (visible on hover):
  [S] = $(file-text)    Open SPEC.md
  [P] = $(notebook)     Open PLAN.md  (hidden if plan_status is pending)
  [T] = $(target)       Set as status bar focus item

Item leading icon (always visible):
  $(check)              All phases complete
  $(sync~spin)          Has an in_progress phase
  $(circle-outline)     All phases pending
  $(bell-dot)           Needs user attention (ready_for_review)

Description (4 status dots, always visible):
  ✓ = approved/complete (theme: green / testing.iconPassed)
  ● = in progress (theme: blue / debugIcon.startForeground)
  ○ = pending (theme: gray / disabledForeground)
  ! = needs attention (theme: yellow / list.warningForeground)

[R] = $(refresh) button in view title bar
```

### State: No SDD project

```
 _______________________________________________
|  [SDD]  |                                     |
|  icon   |  SDD WORKFLOWS                      |
|  (gray) |                                     |
|         |    No SDD project detected           |
|         |                                     |
|         |    Initialize a project with         |
|         |    /sdd-run init to get started.     |
|         |                                     |
|_________|_____________________________________|
```

### State: SDD project, no active workflows

```
 _______________________________________________
|  [SDD]  |                                     |
|  icon   |  SDD WORKFLOWS                  [R] |
|         |                                     |
|         |    No active workflows               |
|         |                                     |
|         |    Start a new change with           |
|         |    /sdd to begin.                    |
|         |                                     |
|_________|_____________________________________|
```

---

## 2. Lifecycle Stepper Webview

### State: Feature item in implementation phase

```
 ________________________________________________________________
|                                                                |
|  a1b2-2: Backend Service                          feature      |
|  Workflow: a1b2c3 — User Management                            |
|                                                                |
|  ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐     |
|  │  SPEC  │────>│  PLAN  │────>│  IMPL  │────>│ REVIEW │     |
|  │   ✓    │     │   ✓    │     │   ●    │     │   ○    │     |
|  │approved│     │approved│     │  active │     │pending │     |
|  └────────┘     └────────┘     └────────┘     └────────┘     |
|   ________       ________       ________       ________        |
|  |  done  |     |  done  |     |phase 3 |     |        |      |
|  |________|     |________|     |  of 5  |     |________|      |
|                                                                |
|  Current step: implementing                                    |
|                                                                |
|  ── Dependencies ──────────────────────────────────────        |
|                                                                |
|  ✓ a1b2-1: API Contracts (complete)                            |
|                                                                |
|  ── Blocking ──────────────────────────────────────────        |
|                                                                |
|  ○ a1b2-4: E2E Tests (waiting for plan approval)              |
|                                                                |
|  ── Artifacts ─────────────────────────────────────────        |
|                                                                |
|  [View Spec]  [View Plan]                                      |
|                                                                |
|________________________________________________________________|
```

### State: Epic with aggregate progress

```
 ________________________________________________________________
|                                                                |
|  01 User Management                                epic        |
|  Workflow: a1b2c3 — User Management                            |
|                                                                |
|  ── Phase Progress ────────────────────────────────────        |
|                                                                |
|  SPEC   [████████████████████] 3/3 complete                    |
|  PLAN   [████████████░░░░░░░░] 2/3 complete                   |
|  IMPL   [████░░░░░░░░░░░░░░░] 1/3 complete                    |
|  REVIEW [░░░░░░░░░░░░░░░░░░░] 0/3 complete                    |
|                                                                |
|  ── Children ──────────────────────────────────────────        |
|                                                                |
|  ✓ a1b2-1: API Contracts     S:✓  P:✓  I:✓  R:✓              |
|  ● a1b2-2: Backend Service   S:✓  P:✓  I:●  R:○              |
|  ● a1b2-3: Frontend Views    S:✓  P:●  I:○  R:○              |
|                                                                |
|  Click any child to view its details.                          |
|                                                                |
|________________________________________________________________|
```

### State: Item with spec ready for review (approval needed)

```
 ________________________________________________________________
|                                                                |
|  a1b2-3: Frontend Views                           feature      |
|  Workflow: a1b2c3 — User Management                            |
|                                                                |
|  ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐     |
|  │  SPEC  │────>│  PLAN  │────>│  IMPL  │────>│ REVIEW │     |
|  │   !    │     │   ○    │     │   ○    │     │   ○    │     |
|  │ review │     │pending │     │pending │     │pending │     |
|  └────────┘     └────────┘     └────────┘     └────────┘     |
|                                                                |
|     ⚠ Spec is ready for your review                            |
|                                                                |
|  Current step: spec_review                                     |
|                                                                |
|  ── Artifacts ─────────────────────────────────────────        |
|                                                                |
|  [View Spec]                                                   |
|                                                                |
|________________________________________________________________|
```

---

## 3. Status Bar

VS Code codicons provide the visual language. Each status bar state has a
leading icon that makes it scannable at a glance.

**Icon mapping:**

| State | Codicon | Meaning |
|-------|---------|---------|
| No project | `$(circle-slash)` | SDD not initialized |
| No workflows | `$(inbox)` | Project exists, nothing active |
| Aggregate | `$(list-tree)` | Multiple workflows, overview mode |
| Focused item | `$(target)` | Locked onto a specific item |
| Approval needed | `$(bell-dot)` | Action required from user |
| Phase gate | `$(pass-filled)` | Milestone reached |
| Workflow complete | `$(check-all)` | All changes approved |

### State: Aggregate (no focus item selected)

```
...  |  $(list-tree) SDD: 4/8 specced, 2/8 planned, 1/8 implemented  |  ...
```

### State: Focused on specific item

```
...  |  $(target) SDD: a1b2-2 Backend Service — Implementing (3/5)  |  ...
```

### State: Approval needed (most urgent surfaces)

```
...  |  $(bell-dot) SDD: 2 specs ready for review  |  ...
```

### State: Phase gate reached

```
...  |  $(pass-filled) SDD: All specs approved — ready to plan  |  ...
```

### State: No SDD project

```
...  |  $(circle-slash) SDD: No project  |  ...
```

### State: No active workflows

```
...  |  $(inbox) SDD: No active workflows  |  ...
```

### State: Workflow complete

```
...  |  $(check-all) SDD: Workflow complete!  |  ...
```

**Priority when multiple states apply:**
approval needed > phase gate > workflow complete > focused > aggregate

### Quick Pick (on click — aggregate mode)

```
  +----------------------------------------------------+
  | $(target) Select an item to focus on                |
  |----------------------------------------------------|
  | $(check) a1b2-1: API Contracts       S:✓ P:✓ I:✓ R:✓ |
  | $(sync~spin) a1b2-2: Backend Svc     S:✓ P:✓ I:● R:○ |
  | $(sync~spin) a1b2-3: Frontend Views  S:✓ P:● I:○ R:○ |
  | $(circle-outline) a1b2-4: E2E Tests  S:✓ P:○ I:○ R:○ |
  |----------------------------------------------------|
  | $(clear-all) Clear focus (show aggregate)           |
  +----------------------------------------------------+
```

---

## 4. Approval Gate Notifications

### Spec ready for review

```
 ┌──────────────────────────────────────────────┐
 │  ℹ  Spec for "Frontend Views" is ready       │
 │     for review.                               │
 │                                               │
 │              [View Spec]  [Dismiss]           │
 └──────────────────────────────────────────────┘
```

### Phase gate: All specs approved

```
 ┌──────────────────────────────────────────────┐
 │  ℹ  All specs approved in workflow a1b2c3    │
 │     Ready to start planning.                  │
 │                                               │
 │                             [Dismiss]         │
 └──────────────────────────────────────────────┘
```

### Implementation complete

```
 ┌──────────────────────────────────────────────┐
 │  ℹ  Implementation of "Backend Service"      │
 │     is complete — ready for review.           │
 │                                               │
 │                             [Dismiss]         │
 └──────────────────────────────────────────────┘
```

### Changes requested

```
 ┌──────────────────────────────────────────────┐
 │  ⚠  Changes requested on "Backend Service"   │
 │     Regression to implementation phase.       │
 │                                               │
 │                             [Dismiss]         │
 └──────────────────────────────────────────────┘
```

### Workflow complete

```
 ┌──────────────────────────────────────────────┐
 │  ✅  Workflow "User Management" is complete!  │
 │     All 4 changes reviewed and approved.      │
 │                                               │
 │                             [Dismiss]         │
 └──────────────────────────────────────────────┘
```

---

## 5. Full IDE Layout (Zoomed Out)

```
 ____________________________________________________________________________
|  File  Edit  View  ...                                                     |
|____________________________________________________________________________|
|      |                                     |                               |
| [Ex] |  SDD WORKFLOWS               [R]   |  ┌──── lifecycle-stepper ───┐ |
| [Se] |                                     |  │                          │ |
| [Gi] |  v a1b2c3 — User Management         |  │  a1b2-2: Backend Svc    │ |
|      |  |                                  |  │                          │ |
|[SDD] |  |  v 01 User Mgmt     ✓✓●○        |  │  [SPEC]>[PLAN]>[IMPL]>  │ |
|  *   |  |  |                               |  │   ✓      ✓      ●      │ |
|      |  |  |  ✓ API Contracts  ✓✓✓✓        |  │                          │ |
| [Ru] |  |  |                               |  │  Dependencies:           │ |
| [Ex] |  |  |  ● Backend Svc ✓✓●○ [S][P][T] |  │  ✓ a1b2-1: API Contr.   │ |
|      |  |  |              (hover icons) ^   |  │                          │ |
|      |  |  |  ● Frontend V.  ✓●○○          |  │  [View Spec] [View Plan] │ |
|      |  |  |                               |  │                          │ |
|      |  |  ○ E2E Tests       ✓○○○          |  └──────────────────────────┘ |
|      |  |                                  |                               |
|      |  > x7y8z9 — Notifications           |  ┌──── editor ─────────────┐ |
|      |                                     |  │                          │ |
|      |                                     |  │  (current file)          │ |
|      |                                     |  │                          │ |
|      |                                     |  │                          │ |
|      |                                     |  │                          │ |
|______|_____________________________________|  └──────────────────────────┘ |
|                                                                            |
|  TERMINAL  |  PROBLEMS  |  OUTPUT  |  DEBUG                               |
|  $ claude                                                                  |
|  > /sdd I want to continue implementing the backend service               |
|                                                                            |
|____________________________________________________________________________|
|  $(target) SDD: a1b2-2 Backend Service — Implementing (3/5)  Ln 42  UTF-8 |
|____________________________________________________________________________|

  * = [SDD] activity bar icon (highlighted)
  [S] = $(file-text) open spec  |  [P] = $(notebook) open plan  |  [T] = $(target) focus
  Hover over a1b2-2 row shows [S][P][T] inline icons on the right
```
