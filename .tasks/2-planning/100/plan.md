---
title: Ensure all sdd-change outputs use markdown with clickable links
created: 2026-02-08
---

# Plan: Ensure all sdd-change outputs use markdown with clickable links

## Problem Summary

The `sdd-change` command currently outputs plain-text file paths and command references in its user-facing output. This forces users to manually navigate to files and manually type commands instead of clicking links. According to the VSCode extension context in CLAUDE.md, file references should use markdown link syntax `[filename.ts](path/to/filename.ts)` to enable clickable navigation in the VSCode terminal.

Additionally, command references (e.g., "Run: /sdd-change status") should ideally be clickable links that populate the prompt when clicked, enabling interactive workflows. This requires research into Claude Code's capabilities.

This affects user experience across all `sdd-change` actions: `new`, `status`, `continue`, `list`, `approve`, `implement`, `verify`, etc.

## Files to Modify

| File | Changes |
|------|---------|
| plugin/commands/sdd-change.md | Update all Output sections to use markdown link syntax for file/task references |
| .claude/skills/commands-standards/SKILL.md | Add explicit guidance on markdown links in output formatting section |

## Changes

### 1. sdd-change Command Output Formatting

Update every Output example in `sdd-change.md` to replace plain-text paths with markdown links:

**Before:**
```
Spec: changes/2026/02/05/a1b2c3/01-registration/SPEC.md
```

**After:**
```
Spec: [SPEC.md](changes/2026/02/05/a1b2c3/01-registration/SPEC.md)
```

**Affected sections:**
- Action: new → Step 9 output (spec location)
- Action: new → Step 12 output (workflow item locations)
- Action: status → Output (file paths in item listing)
- Action: continue → Output examples (file paths)
- Action: list → Output (location column)
- Action: approve spec → Output (SPEC.md and PLAN.md paths)
- Action: approve plan → Output
- Action: implement → Output (spec/plan paths, phase file references)
- Action: verify → Output (spec path, test file references)
- Action: review → Output (SPEC.md reference)
- Action: regress → Output (archived paths)
- Action: request-changes → Output

**Task/change ID references:**
- Replace `a1b2-1` with `[a1b2-1](changes/.../01-registration/)` where the change directory is known
- Replace task references like `#19` with `[#19](.tasks/.../19/task.md)` patterns (following tasks skill convention)

**Command references (research required):**
- Investigate if Claude Code supports prompt-populating links
- If supported, replace command references like `/sdd-change status` with clickable links that populate the prompt
- If not supported, use documentation links like `[/sdd-change](plugin/commands/sdd-change.md)` to command specs
- Document findings and update standards accordingly

### 2. Commands Standards Documentation

Add markdown link formatting to the Output Formatting section in `commands-standards/SKILL.md`:

**Add new convention row:**

| Element | Format |
|---------|--------|
| File references | `[filename.ext](relative/path/to/file.ext)` for clickable links |
| Line-specific refs | `[filename.ts:42](path/to/filename.ts#L42)` for specific lines |
| Directory refs | `[dirname/](path/to/dirname/)` for folders |
| Command refs | Prompt-populating links (if supported) or `[/command](plugin/commands/command.md)` |

**Add new rule:**
- **Use markdown links for all file/directory references** — Every file path shown in output must use markdown link syntax relative to the repo root. This enables click-to-navigate in VSCode terminals. Plain-text paths are only acceptable when the path itself is the subject (e.g., showing what would be created in a dry-run).

## Dependencies

The command reference implementation depends on research findings:
1. First, research whether Claude Code supports prompt-populating links
2. Then, update command specs based on what's supported

## Tests

### Research & Investigation

- [ ] `research_prompt_populating_links` — Determine if Claude Code / VS Code extension supports prompt-populating links
- [ ] `document_link_syntax` — If supported, document the syntax and any limitations
- [ ] `identify_alternatives` — If not supported, identify alternative approaches
- [ ] `update_plan_with_findings` — Update this plan based on research results

### Documentation Validation

- [ ] `validate_all_file_refs_are_markdown_links` — Scan all Output sections in `sdd-change.md` and verify no plain-text file paths remain (except in code blocks showing file trees)
- [ ] `validate_change_id_refs_are_links` — Verify all change ID references (a1b2-N format) in output examples use markdown links
- [ ] `validate_task_refs_are_links` — Verify all task references (#N format) in output examples use markdown links where applicable
- [ ] `validate_command_refs_use_correct_format` — Verify command references use the appropriate link format based on research findings
- [ ] `validate_standards_updated` — Confirm `commands-standards/SKILL.md` includes the new markdown link conventions

### Manual Verification

- [ ] `manual_review_status_output` — Read the `Action: status` output example and confirm all file paths are clickable links
- [ ] `manual_review_list_output` — Read the `Action: list` output example and confirm the location column uses links
- [ ] `manual_review_approve_outputs` — Read approve spec/plan outputs and confirm SPEC.md/PLAN.md references are links
- [ ] `manual_consistency_check` — Scan all actions to ensure link formatting is consistent (same pattern for same type of reference)

### Edge Cases

- [ ] `verify_archived_paths_are_links` — Check that archived spec paths in `Action: regress` output use links
- [ ] `verify_dry_run_exemption` — Confirm file tree displays (like in external spec import) can still use plain text since they're showing structure, not actionable paths
- [ ] `verify_multiline_table_links` — Ensure markdown links render correctly inside table cells (LOCATION column in list output)

## Verification

After updating the documentation:

- [ ] Research on prompt-populating links is complete with documented findings
- [ ] All file path references in user-facing output examples use markdown link syntax
- [ ] All change ID references in output examples are clickable links to their directories
- [ ] All task references follow the `[#N](path)` pattern where applicable
- [ ] All command references use the appropriate link format (prompt-populating if supported, otherwise documentation links)
- [ ] The commands-standards skill explicitly requires markdown links in output formatting
- [ ] No plain-text file paths remain in Output sections (except structural displays like file trees)
- [ ] Link syntax is consistent across all actions (same pattern for SPEC.md, PLAN.md, context.md, etc.)
