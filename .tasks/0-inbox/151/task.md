---
id: 151
title: "Add a VS Code extension for SDD that reflects project status, workflow status, and other SDD state in the IDE"
status: inbox
priority: high
created: 2026-02-17
---

# Add a VS Code extension for SDD that reflects project status, workflow status, and other SDD state in the IDE

## Context

SDD project state (task status, workflow phase, active changes, component health) currently lives in files on disk and is only visible through CLI commands like `/tasks` and `/sdd`. A VS Code extension could surface this information directly in the IDE — status bar, sidebar panels, tree views — giving developers ambient awareness of project state without switching context.

## Ideas

- Status bar showing current task, workflow phase, active branch
- Sidebar panel with task backlog overview (inbox, implementing, reviewing counts)
- Tree view for `.tasks/` directory with status icons
- Workflow state indicators (speccing, planning, implementing, etc.)
- Component health/drift status from `.sdd/` state
- Quick actions (view task, open plan, check workflow status)
- File decorations for files modified in the current task's scope
