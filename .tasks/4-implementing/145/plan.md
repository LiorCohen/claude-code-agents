---
title: Add speccing phase to task lifecycle with structural validation gate
created: 2026-02-15 18:00 UTC
---

# Plan: Add speccing phase to task lifecycle

## Problem Summary

The task lifecycle currently goes inbox → planning, but planning conflates WHAT (the spec) with HOW (the execution plan). This causes task descriptions and plans to drift apart. A new speccing phase separates the two: task.md becomes the complete spec (WHAT), plan.md becomes purely execution (HOW). This also introduces branch isolation rules and a structural validation gate enforced by the critic.

## Files to Modify

| File | Changes |
|------|---------|
| `.tasks/` (filesystem) | Rename `1-inbox/` → `0-inbox/`, create `1-speccing/`, ensure `.gitkeep` in all dirs |
| `.tasks/INDEX.md` | Update ~40 `1-inbox/` links → `0-inbox/`, add Speccing section |
| `.claude/skills/tasks/SKILL.md` (296 lines) | Directory structure, add `/tasks spec` command, update `/tasks plan` with gates, add branch isolation, update all `1-inbox` refs |
| `.claude/skills/tasks/schemas.md` (342 lines) | Add `speccing` to status enum, add specced task template (5 sections), update INDEX.md example, update `1-inbox` refs |
| `.claude/skills/tasks/workflows.md` (394 lines) | Add spec workflow, update plan workflow with gates, add back-transition, update skip-forward text, add branch isolation, update `1-inbox` refs, update audit checks |
| `.claude/skills/tasks/reference.md` (66 lines) | Update lifecycle diagram, add speccing step, add branch isolation best practice |
| `.claude/skills/critic/SKILL.md` (227 lines) | Update phase inference (0-inbox, 1-speccing skip), add speccing exit gate to status-to-phase mapping, update `.critic/` file mapping |
| `.claude/skills/critic/resources/phases.md` (104 lines) | Add Phase 1 (speccing exit gate) checks |
| `.claude/skills/critic/resources/escalation.md` (50 lines) | Add speccing-phase escalation entry (H13: incomplete spec sections) |
| `.claude/skills/critic/resources/feedback-loop.md` (46 lines) | Add `speccing.md` to the topic file list (line 18) |
| `.claude/skills/commit/SKILL.md` | Update lifecycle listing (line 157) to include `speccing` |
| `.claude/skills/agents-standards/SKILL.md` | Line 314: `1-inbox` → `0-inbox` |
| `.claude/skills/skills-standards/SKILL.md` | Line 476: `1-inbox` → `0-inbox` |
| `.claude/skills/commands-standards/SKILL.md` | Line 495: `1-inbox` → `0-inbox` |
| `.claude/skills/system-cli-standards/skill.md` | Line 207: `1-inbox` → `0-inbox` |
| `.critic/speccing.md` (new) | Learned rules file for speccing phase |

## Changes

### 1. Filesystem migration

Rename `.tasks/1-inbox/` to `.tasks/0-inbox/`. Create `.tasks/1-speccing/` with `.gitkeep`. Verify all phase directories (0-8) have `.gitkeep` files. Update all ~40 `1-inbox/` links in INDEX.md to `0-inbox/`. Add a "Speccing" section between Inbox and Planning in INDEX.md display order. This is a mechanical change with no behavioral impact.

**IMPORTANT:** Only modify active task paths and INDEX.md. Do NOT modify any files inside `6-complete/`, `7-rejected/`, or `8-consolidated/` — those are historical artifacts with `1-inbox/` references that must be preserved as-is.

### 2. Tasks skill — schema and structural updates (SKILL.md + schemas.md)

In SKILL.md:
- Update directory structure tree: `0-inbox/` replaces `1-inbox/`, add `1-speccing/`
- Add `📝 Speccing` to status column values (for tasks in `1-speccing/`)
- Update `📥 Inbox` comment to reference `0-inbox/`
- Add `/tasks spec <id>` command section
- Modify `/tasks plan <id>` to include speccing validation gate and critic check
- Add branch isolation rule to Quick Reference and User Approval Rule sections
- Update all `1-inbox` path references to `0-inbox`

In schemas.md:
- Add `speccing` to the status enum
- Add "Specced Task Template" with 5 required sections (Description, Motivation, Scope, Constraints, Acceptance Criteria) — kept separate from the existing minimal inbox template
- Update INDEX.md example to show `0-inbox/` paths and new Speccing section
- Update all `1-inbox` path references to `0-inbox`

### 3. Tasks skill — behavioral workflows (workflows.md + reference.md)

In workflows.md (currently 394 lines — **line budget: keep ≤ 490 to leave margin**):
- Add "Start Speccing" workflow section for `/tasks spec <id>`:
  - Phase 1 (transition): move folder to `1-speccing/`, update status to `speccing`, update INDEX.md, commit
  - Phase 2 (solicitation): interactively ask guiding questions, maintain open questions list, fill in 5 sections
  - Also handles back-transition from `2-planning/` (for substantial rework): move folder back to `1-speccing/`, update status, commit, then resume solicitation
- Update "Start Planning" workflow:
  - Add precondition: task must be in `speccing` status (refuse otherwise with message)
  - Add structural validation gate: verify all 5 sections have meaningful content before transition
  - Add critic invocation as speccing exit gate before transition
  - Add rule: if planning reveals spec gaps, update task.md directly (never plan.md) and commit as a planning-phase spec update
- Update "Add New Task" workflow: `0-inbox` replaces `1-inbox`
- Update skip-forward text: add challenge behavior ("This task hasn't been specced/planned — are you sure?")
- Add branch isolation rule to workflows
- Update Automatic Status Updates table to include speccing
- Update Audit checks: add `0-inbox/` and `1-speccing/` to recognized directories, add speccing status to status-directory mapping
- Update all `1-inbox` path references to `0-inbox`

**Line budget mitigation:** Keep the speccing workflow concise — follow the existing pattern of other workflow sections (transition steps + behavioral description, no verbose prose). If approaching 490 lines, tighten the existing "Audit Backlog" section which is the longest at ~70 lines. As a last resort, extract audit checks into a separate `audit.md` resource file.

In reference.md:
- Update lifecycle diagram to include `0-inbox/ → [/tasks spec] → 1-speccing/ → [/tasks plan] → 2-planning/`
- Add branch isolation to best practices list

### 4. Critic skill updates

In critic SKILL.md:
- Update phase inference algorithm step 3: scan `0-inbox/` instead of `1-inbox/`
- Add `1-speccing/` handling: tasks in speccing skip critic during solicitation (like inbox), except when `/tasks plan` is invoked
- Add `speccing` to status-to-phase mapping: `1-speccing` → Phase 1 (speccing exit gate)
- Update `.critic/` file mapping table: add `1 (speccing exit)` → `speccing.md`
- Update resource files reference: phases.md now covers "all 9 lifecycle phases" (or reword to avoid numeric reference)

In phases.md:
- Add Phase 1: Speccing Exit Gate section with checks:
  - (R) Are all 5 required sections present and non-empty?
  - (R) Does each section have meaningful content (not trivial one-liners or placeholders)?
  - (R) Is the scope clear enough that planning can focus purely on execution?
  - (R) Are acceptance criteria testable and specific?
  - (C) Were guiding questions asked? Were open questions resolved?
  - Escalation: empty/trivial sections = hard block, vague acceptance criteria = soft warning

In escalation.md:
- Add H13: Incomplete spec sections — task has empty or trivially filled required sections (speccing gate)

In feedback-loop.md:
- Add `speccing.md` to the topic file enumeration on line 18 (currently lists `planning.md`, `implementation.md`, `review.md`, `completion.md`)

### 5. Other skills — path updates

Single-line `1-inbox` → `0-inbox` replacements in:
- `.claude/skills/agents-standards/SKILL.md` (line 314)
- `.claude/skills/skills-standards/SKILL.md` (line 476)
- `.claude/skills/commands-standards/SKILL.md` (line 495)
- `.claude/skills/system-cli-standards/skill.md` (line 207)

In `.claude/skills/commit/SKILL.md` (line 157):
- Update lifecycle listing from `inbox → planning → ...` to `inbox → speccing → planning → ...`

### 6. Learned rules file

Create `.critic/speccing.md` with initial seed rules:
- Spec must be complete before planning — all 5 sections with meaningful content
- Task.md is the source of truth for WHAT; plan.md is purely HOW
- If planning reveals spec gaps, update task.md directly — never add missing spec content to plan.md
- Back-transition to speccing is for substantial rework; minor spec fixes can be done in-place during planning

## Dependencies

Execution must follow this order:
1. **Phase 1 (filesystem)** must complete first — all subsequent phases reference `0-inbox/` and `1-speccing/`
2. **Phases 2-6** can execute in any order after Phase 1, but each phase should be a separate commit

## Tests

### Structural Tests (manual verification)
- [ ] `ls .tasks/0-inbox/` shows all inbox tasks migrated
- [ ] `ls .tasks/1-inbox/` fails (directory doesn't exist)
- [ ] `ls .tasks/1-speccing/.gitkeep` succeeds
- [ ] All phase directories (0-8) have `.gitkeep` files
- [ ] `grep -c '1-inbox' .tasks/INDEX.md` returns 0
- [ ] `grep -c '0-inbox' .tasks/INDEX.md` returns ~40

### Content Tests (manual verification)
- [ ] SKILL.md directory tree shows `0-inbox/` and `1-speccing/`
- [ ] SKILL.md has `/tasks spec <id>` command section
- [ ] SKILL.md `/tasks plan` section includes speccing precondition check
- [ ] schemas.md status enum includes `speccing`
- [ ] schemas.md has specced task template with 5 sections
- [ ] workflows.md has "Start Speccing" section
- [ ] workflows.md "Start Planning" has validation gate and critic invocation
- [ ] workflows.md skip-forward text includes challenge behavior
- [ ] reference.md lifecycle diagram includes speccing
- [ ] critic SKILL.md scans `0-inbox/` not `1-inbox/`
- [ ] critic SKILL.md maps `1-speccing/` to Phase 1
- [ ] critic phases.md has Phase 1: Speccing Exit Gate
- [ ] critic escalation.md has H13 entry
- [ ] `.critic/speccing.md` exists with seed rules
- [ ] critic feedback-loop.md lists `speccing.md` in the topic file enumeration
- [ ] All 5 other skills have `0-inbox` instead of `1-inbox`
- [ ] commit skill lifecycle includes `speccing`

### Line Count Tests
- [ ] `.claude/skills/tasks/SKILL.md` ≤ 500 lines
- [ ] `.claude/skills/tasks/schemas.md` ≤ 500 lines
- [ ] `.claude/skills/tasks/workflows.md` ≤ 500 lines
- [ ] `.claude/skills/critic/SKILL.md` ≤ 500 lines
- [ ] `.claude/skills/critic/resources/phases.md` ≤ 500 lines

## Verification

- [ ] `0-inbox/` exists, `1-inbox/` does not
- [ ] `1-speccing/` exists with `.gitkeep`
- [ ] All phase directories (0-8) have `.gitkeep` files
- [ ] INDEX.md has no `1-inbox` references
- [ ] INDEX.md has Speccing section between Inbox and Planning
- [ ] No skill files under `.claude/skills/` reference `1-inbox`
- [ ] No completed/archived task files were modified
- [ ] All modified skill files are ≤ 500 lines
- [ ] `git status` is clean after all commits
