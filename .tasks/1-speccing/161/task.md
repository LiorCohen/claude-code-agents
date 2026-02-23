---
id: 161
title: Create persistent threads skill for conversation thread management
status: speccing
created: 2026-02-23 12:00 UTC
depends_on: []
blocks: []
---

# Create persistent threads skill for conversation thread management

## Description

Create a "threads" skill at `.claude/skills/threads/` that manages conversation threads — persistent, timestamped topic containers that track the full lifecycle of a discussion. Threads store verbatim transcripts of user and Claude messages, open questions, pending decisions, related tasks, and notes.

Threads can be created explicitly by the user (`/threads open "topic"`) or proactively by Claude when it identifies a new topic emerging in conversation. Each thread is a markdown file stored in `.threads/` at the repo root (gitignored). Claude organically maintains thread metadata (open questions, decisions, notes) as the conversation flows — no explicit sub-commands for internal thread management.

Only the user can close a thread. Claude never closes threads autonomously. Threads can be marked as stale or abandoned.

Threads can spawn new tasks via the existing `/tasks add` workflow.

## Motivation

During long or multi-session conversations, topics get lost, questions go unanswered, and decisions are forgotten. There's no persistent record of what was discussed, what's still open, and what was resolved. The threads skill provides a structured, persistent layer that ensures no topic falls through the cracks — every opened discussion must eventually be closed by the user.

Without this, users must manually track conversation topics across sessions, and Claude has no mechanism to remind users about unfinished discussions or unresolved questions.

## Scope

### In scope

- Thread CRUD: open, close, list, view
- Verbatim transcript capture (user messages + Claude responses) per thread
- Organic management of open questions, pending decisions, and notes within threads
- Proactive thread creation by Claude when new topics are detected
- Thread status lifecycle: open, stale, abandoned, closed
- Persistent storage in `.threads/` (gitignored, one markdown file per thread)
- YAML frontmatter + markdown body format
- Timestamped operations (created, updated, closed)
- Auto-incrementing thread IDs
- Surfacing unclosed threads as reminders
- Spawning tasks from threads (via existing `/tasks add`)

### Out of scope

- Git-tracked threads (threads are local/gitignored)
- Thread merging or consolidation
- Thread search/query across content
- Integration with the SDD plugin (this is a root `.claude/skills/` skill only)
- Automated thread closing by Claude
- Sub-commands for internal thread management (questions, decisions managed organically)

## Constraints

- Threads live in `.threads/` at repo root, gitignored — never committed
- Only the user can close a thread — Claude must never close threads autonomously
- Transcripts are verbatim — no summarization or lossy compression
- Thread IDs are auto-incrementing integers, never reused
- Must follow the skills-standards for `.claude/skills/` authoring
- Thread files use YAML frontmatter + markdown body (consistent with task pattern)
- The skill must be invocable as `/threads` with sub-commands
- Claude proactively creates threads when detecting new topics, but should confirm with the user or at minimum announce the thread creation

## Changes

| File | Change |
|------|--------|
| `.claude/skills/threads/skill.md` | New skill — thread management commands, lifecycle rules, format definitions |
| `.gitignore` | Add `.threads/` entry |
| `CLAUDE.md` | Register `/threads` skill in the Skills section |

## Acceptance Criteria

- [ ] Skill file exists at `.claude/skills/threads/skill.md` — **verify:** `ls .claude/skills/threads/skill.md`
- [ ] `.threads/` is gitignored — **verify:** `grep -q '.threads/' .gitignore && echo "OK"`
- [ ] `/threads` skill is registered in `CLAUDE.md` — **verify:** `grep -q 'threads' CLAUDE.md`
- [ ] Skill defines commands: `open`, `close`, `list`, view by ID — **verify:** `grep -E '(open|close|list|threads <id>)' .claude/skills/threads/skill.md`
- [ ] Skill specifies thread file format with YAML frontmatter (id, title, status, created, updated, closed) — **verify:** `grep -q 'frontmatter' .claude/skills/threads/skill.md`
- [ ] Skill requires verbatim transcript capture — **verify:** `grep -qi 'verbatim' .claude/skills/threads/skill.md`
- [ ] Skill defines thread statuses: open, stale, abandoned, closed — **verify:** `grep -E '(open|stale|abandoned|closed)' .claude/skills/threads/skill.md | wc -l` returns >= 4
- [ ] Skill explicitly forbids Claude from closing threads — **verify:** `grep -qi 'never.*close\|cannot.*close\|only.*user.*close' .claude/skills/threads/skill.md`
- [ ] Skill supports proactive thread creation by Claude — **verify:** `grep -qi 'proactive\|detect.*topic\|identify.*topic' .claude/skills/threads/skill.md`
- [ ] Skill documents organic management of open questions, pending decisions, notes — **verify:** `grep -qi 'open questions\|pending decisions' .claude/skills/threads/skill.md`
