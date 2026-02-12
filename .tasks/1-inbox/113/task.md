---
id: 113
title: Investigate and remove domain dead code across plugin
status: inbox
priority: medium
created: 2026-02-09
depends_on: []
blocks: []
---

# Task 113: Investigate and remove domain dead code across plugin

## Description

During the #99 audit, we discovered that `domain-population` skill is completely orphaned — no command, agent, or skill references it. It exists only inside its own directory. Additionally, several other domain-related artifacts appear to be dead code.

This needs investigation: was domain-population intentionally kept for future use, or was it simply never cleaned up when domain functionality was removed from the init workflow?

## Suspicious Findings

### domain-population skill (completely orphaned)
- Located at `plugin/skills/domain-population/`
- `user-invocable: false` — cannot be called directly by users
- Zero references from any command, agent, or other skill
- Changelog confirms it was "removed from speccing phase" — but the skill itself was never deleted
- Has its own input/output schemas and a full SKILL.md

### `{{PRIMARY_DOMAIN}}` template variable (dead code)
- Defined in `plugin/system/src/commands/scaffolding/project.ts` line 66 as a substitution rule
- Zero template files actually contain `{{PRIMARY_DOMAIN}}`
- The substitution rule runs but never matches anything

### `primary_domain` input parameter chain (unused)
- `plugin/skills/scaffolding/SKILL.md` accepts `primary_domain` as optional input
- `plugin/skills/project-scaffolding/SKILL.md` accepts it and documents it as a template variable
- `plugin/skills/project-scaffolding/schemas/input.schema.json` defines it
- But it flows into the dead `{{PRIMARY_DOMAIN}}` template variable above

### `sdd-system scaffolding domain` command (orphaned)
- `plugin/system/src/commands/scaffolding/domain.ts` implements domain population CLI
- Requires `primary_domain` as a required field
- Only callable via explicit `sdd-system scaffolding domain` — never invoked automatically by any workflow

## Investigation Questions

- [ ] Was domain-population intentionally preserved for manual/future use?
- [ ] Is `sdd-system scaffolding domain` still useful as a standalone CLI command?
- [ ] Are there any user-facing docs that reference domain population as a feature?
- [ ] Can all of this be safely removed?

## Acceptance Criteria

- [ ] Determine whether each item is intentionally kept or dead code
- [ ] Remove confirmed dead code
- [ ] Update any documentation that references removed functionality
- [ ] Verify no tests break after removal
