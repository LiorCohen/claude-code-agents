---
title: Implement hook system — skill auto-activation and objective Stop checks
created: 2026-02-12 19:00 UTC
---

# Plan: Implement hook system — skill auto-activation and objective Stop checks

## Problem Summary

The project has two hook gaps:

1. **No skill auto-activation.** Development skills like `typescript-standards`, `plugin-testing-standards`, and `system-cli-standards` are only used when manually invoked. When working on TypeScript files, tests, or CLI code, Claude doesn't know these skills exist unless the user remembers to invoke them.

2. **Stop hook is prompt-based, not objective.** The current Stop hook (`.claude/settings.json`) asks Claude to self-assess ("are there uncommitted changes?") but Claude can't actually verify anything. It needs to be replaced with a command-based hook that runs real checks and reports objective findings.

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/hooks/skill-activate.mjs` | **New** — UserPromptSubmit command hook: reads skill-rules JSON, matches prompt, outputs systemMessage |
| `.claude/hooks/stop-check.sh` | **New** — Stop command hook: runs git status, branch detection, typecheck, outputs structured JSON via printf |
| `.claude/skill-rules.json` | **New** — Trigger definitions mapping keywords/patterns/file-paths to skills |
| `.claude/settings.json` | Replace prompt-based Stop hook with command-based; add UserPromptSubmit hook |

## Changes

### 1. Skill auto-activation hook (UserPromptSubmit)

A command-type hook registered in `.claude/settings.json` under `UserPromptSubmit`. When the user submits a prompt, Claude Code passes the prompt via stdin as JSON (includes `user_prompt` field). The hook script:

- Reads stdin JSON and extracts `user_prompt`
- Loads `.claude/skill-rules.json` (relative to `cwd` from stdin)
- Matches the prompt against three trigger types per rule:
  - **keywords** — case-insensitive substring match (e.g., "typecheck", "test")
  - **patterns** — regex match against the full prompt (e.g., `/\b(refactor|restructure)\b/i`)
  - **file_paths** — file path extraction via regex (tokens containing `/` and ending with known extensions like `.ts`, `.tsx`, `.md`, `.sh`, `.json`), then glob matching against rule patterns. If no file paths are found in the prompt, file_path triggers are skipped for that rule.
- If any rules match, returns `{ "systemMessage": "Relevant skills for this task:\n- /typescript-standards — ...\n- ..." }`
- If no rules match, returns `{}` (no-op)

The hook is a Node.js ES module (`.mjs`). It uses only built-in Node.js APIs — `JSON.parse` for the config file (no external YAML dependency needed), `fs.readFileSync` for file I/O, and `RegExp` for pattern matching.

**Architectural note:** This is a project-level hook in `.claude/hooks/`, not a plugin hook. It does not use `hook-runner.sh` or the plugin's TypeScript build system. Project-level hooks are standalone scripts that run independently of the plugin.

### 2. Skill rules configuration

`.claude/skill-rules.json` defines trigger rules for all current skills that benefit from auto-activation. Not every skill needs rules — only skills that apply to specific types of work (standards, testing, etc.). Skills like `commit` and `tasks` are user-invoked and don't need triggers.

Structure:

```json
{
  "rules": [
    {
      "skill": "typescript-standards",
      "description": "TypeScript coding standards for strict, immutable, type-safe code",
      "triggers": {
        "keywords": ["typescript", "ts file", "type error", "typecheck", "strict mode"],
        "patterns": ["\\.(ts|tsx)\\b"],
        "file_paths": ["**/*.ts", "**/*.tsx"]
      }
    },
    {
      "skill": "plugin-testing-standards",
      "description": "Testing methodology for plugins",
      "triggers": {
        "keywords": ["test", "spec", "vitest", "jest", "coverage"],
        "patterns": ["\\btest|spec|describe\\(|it\\(\\b"],
        "file_paths": ["tests/**", "**/*.test.*", "**/*.spec.*"]
      }
    }
  ]
}
```

Skills to include rules for:
- `typescript-standards` — TypeScript file work
- `plugin-testing-standards` — test-related work
- `system-cli-standards` — CLI/command file work
- `skills-standards` — skill authoring
- `agents-standards` — agent authoring
- `commands-standards` — command authoring

### 3. Objective Stop hook

A bash script that replaces the current prompt-based Stop hook. Runs actual verification commands and reports findings as structured JSON that Claude can act on.

Checks performed:
1. **Uncommitted changes** — runs `git status --porcelain` and reports any dirty files
2. **Feature branch detection** — checks if current branch matches `feature/task-*` pattern
3. **Typecheck** — if on a feature branch and `git diff --name-only` shows files under `plugin/system/`, runs `npm run typecheck:plugin` and captures output. Skipped entirely on main or when no plugin/system files are dirty
4. **Summary** — assembles findings into structured JSON output

Output format follows Claude Code's Stop hook contract:
- If issues found: `{ "decision": "block", "reason": "...", "systemMessage": "..." }`
- If clean: `{ "decision": "approve", "systemMessage": "Pre-stop checks passed: no uncommitted changes, typecheck clean" }`

JSON output is assembled via `printf`/heredoc — no `jq` dependency. File paths and error messages in the output are sanitized (double quotes and backslashes escaped) to ensure valid JSON.

The `systemMessage` contains a structured report:
```
## Pre-stop verification

### Uncommitted changes
- plugin/system/src/foo.ts (modified)
- .tasks/INDEX.md (modified)

### Branch context
On feature branch: feature/task-126-hooks

### Typecheck
PASS — no type errors
```

### 4. Settings registration

Update `.claude/settings.json` to:
- Remove the existing prompt-based Stop hook
- Add a command-based Stop hook pointing to `.claude/hooks/stop-check.sh`
- Add a `UserPromptSubmit` command hook pointing to `.claude/hooks/skill-activate.mjs`

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/stop-check.sh"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/skill-activate.mjs"
          }
        ]
      }
    ]
  }
}
```

## Dependencies

1. `skill-rules.json` must exist before the UserPromptSubmit hook can work
2. No external dependencies — skill-activate uses only Node.js built-ins, stop-check uses only bash + git + npm
3. Both hook scripts must be executable (`chmod +x`)

Sequencing: Create skill-rules.json and hook scripts first, then update settings.json last.

## Tests

### Unit Tests

- `test_skill_activate_matches_typescript_keywords` — prompt containing "typescript" returns typescript-standards suggestion
- `test_skill_activate_matches_file_path_patterns` — prompt mentioning `.ts` files returns typescript-standards
- `test_skill_activate_matches_regex_patterns` — prompt with "describe(" returns testing-standards
- `test_skill_activate_no_match_returns_empty` — prompt with no matching triggers returns no systemMessage
- `test_skill_activate_multiple_matches_returns_all` — prompt matching multiple skills returns all of them
- `test_skill_activate_handles_empty_prompt` — empty or missing user_prompt returns no-op
- `test_skill_activate_handles_missing_config` — missing skill-rules.json fails gracefully (no-op)
- `test_skill_activate_handles_malformed_json` — invalid JSON fails gracefully (no-op)

- `test_stop_check_detects_uncommitted_changes` — dirty working tree produces block decision with file list
- `test_stop_check_clean_working_tree_approves` — clean tree with no issues produces approve decision
- `test_stop_check_detects_feature_branch` — on `feature/task-*` branch, reports branch context
- `test_stop_check_detects_main_branch` — on main, skips task-specific checks
- `test_stop_check_runs_typecheck_on_feature_branch` — on feature branch with plugin changes, runs typecheck
- `test_stop_check_skips_typecheck_on_main` — on main, skips typecheck
- `test_stop_check_reports_typecheck_failure` — typecheck errors are included in block reason
- `test_stop_check_outputs_valid_json` — all output paths produce valid JSON

**Testing approach:** Tests use vitest with `child_process.execFile` to invoke the hook scripts with mocked stdin input. The stop hook tests use a temporary git repo to simulate branch/dirty states.

### Integration Tests

- `test_hook_registration_valid` — settings.json hook entries point to existing scripts
- `test_skill_rules_json_valid` — skill-rules.json parses without errors and references existing skills
- `test_stop_hook_end_to_end` — script executes and produces valid JSON output
- `test_skill_activate_end_to_end` — script reads stdin and produces valid JSON output

## Verification

- [ ] `.claude/hooks/skill-activate.mjs` exists and is executable
- [ ] `.claude/hooks/stop-check.sh` exists and is executable
- [ ] `.claude/skill-rules.json` exists with rules for all applicable skills
- [ ] `.claude/settings.json` has command-based Stop and UserPromptSubmit hooks
- [ ] Old prompt-based Stop hook is removed
- [ ] `npm run typecheck:plugin` passes (no type regressions)
- [ ] Skill auto-activation hook matches prompts correctly in manual testing
- [ ] Stop hook reports uncommitted changes when present
- [ ] Stop hook detects feature branch context
- [ ] Stop hook runs typecheck on feature branches
