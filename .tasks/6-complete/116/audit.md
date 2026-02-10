# System CLI Standards Audit Report

**Date:** 2026-02-09 (revised)
**Standard:** `system-cli-standards` skill
**Scope:** All prompt files in `plugin/skills/`, `plugin/agents/`, `plugin/commands/`, and `plugin/skills/*/templates/`
**Out of scope:** `plugin/system/README.md` (CLI's own documentation, not a prompt file)

---

## Summary

**47 violations** across 5 categories in **13 files**.

| Category | Count | Severity |
|----------|-------|----------|
| Wrong PATH claims | 8 | HIGH |
| Bare `npx sdd-system` invocations | 3 | CRITICAL |
| Bare `sdd-system` invocations in prompt files | 24 | HIGH |
| Broken template npm scripts | 9 | CRITICAL |
| Temp file instead of stdin | 3 | MEDIUM |

---

## Category 1: Wrong PATH Claims (8 occurrences in 8 files)

Skills falsely claim `sdd-system CLI available in PATH`. The system package is `private: true` with no `bin` field — this claim is incorrect.

| # | File | Line |
|---|------|------|
| 1 | `plugin/skills/spec-writing/SKILL.md` | 16 |
| 2 | `plugin/skills/spec-index/SKILL.md` | 46 |
| 3 | `plugin/skills/components/helm/helm-standards/SKILL.md` | 21 |
| 4 | `plugin/skills/components/config/config-scaffolding/SKILL.md` | 17 |
| 5 | `plugin/skills/components/database/database-standards/SKILL.md` | 25 |
| 6 | `plugin/skills/components/contract/contract-scaffolding/SKILL.md` | 17 |
| 7 | `plugin/skills/components/database/database-scaffolding/SKILL.md` | 65 |
| 8 | `plugin/skills/components/helm/helm-scaffolding/SKILL.md` | 22 |

**Fix:** Replace with `SDD plugin active (\`CLAUDE_PLUGIN_ROOT\` environment variable set)`.

---

## Category 2: Bare `npx sdd-system` Invocations (3 occurrences in 2 files)

Will fail at runtime because `npx` cannot resolve a private package with no bin field.

| # | File | Line | Text |
|---|------|------|------|
| 1 | `plugin/skills/spec-writing/SKILL.md` | 125 | `npx sdd-system spec validate <path>` |
| 2 | `plugin/skills/spec-index/SKILL.md` | 162 | `npx sdd-system spec validate --all --changes-dir changes/` |
| 3 | `plugin/skills/spec-index/SKILL.md` | 166 | `npx sdd-system spec index --changes-dir changes/` |

**Fix:** Replace with `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action> [args]`.

---

## Category 3: Bare `sdd-system` Invocations in Prompt Files (24 occurrences in 9 files)

Skills and commands reference `sdd-system` as a bare command — no such binary exists.

### `plugin/skills/spec-index/SKILL.md` (8 occurrences)

| # | Line | Text |
|---|------|------|
| 1 | 12 | `The spec commands are available via the sdd-system CLI:` |
| 2 | 19 | `sdd-system spec index --changes-dir changes/` |
| 3 | 27 | `sdd-system spec snapshot --specs-dir specs/` |
| 4 | 36 | `sdd-system spec validate changes/2026/01/21/my-change/SPEC.md` |
| 5 | 39 | `sdd-system spec validate --all --specs-dir specs/` |
| 6 | 127 | `Run \`sdd-system spec index\` to update INDEX.md` |
| 7 | 128 | `Run \`sdd-system spec snapshot\` to update SNAPSHOT.md` |
| 8 | 133 | `Run \`sdd-system spec validate --all\` to ensure all specs are valid` |

### `plugin/commands/sdd-init.md` (2 occurrences)

| # | Line | Text |
|---|------|------|
| 9 | 191 | `Run \`sdd-system env check-tools --json\`` |
| 10 | 252 | `Run \`sdd-system settings reconcile\`` |

### `plugin/commands/sdd-config.md` (6 occurrences)

| # | Line | Text |
|---|------|------|
| 11 | 245 | `This command invokes \`sdd-system\` CLI subcommands:` |
| 12 | 249 | `sdd-system config generate --env <env> [--component <name>] [--output <path>]` |
| 13 | 252 | `sdd-system config validate [--env <env>]` |
| 14 | 255 | `sdd-system config diff <env1> <env2>` |
| 15 | 258 | `sdd-system config add-env <env-name>` |
| 16 | 261 | `The \`sdd-system\` CLI handles the actual merge logic` |

### `plugin/skills/components/helm/helm-standards/SKILL.md` (1 occurrence)

| # | Line | Text |
|---|------|------|
| 17 | 259 | `sdd-system config generate --env production --component main-server` |

### `plugin/skills/components/helm/helm-scaffolding/SKILL.md` (1 occurrence)

| # | Line | Text |
|---|------|------|
| 18 | 191 | `sdd-system config generate --env production --component main-server` |

### `plugin/skills/components/config/config-scaffolding/SKILL.md` (1 occurrence)

| # | Line | Text |
|---|------|------|
| 19 | 151 | `\`sdd-system\` CLI (via \`/sdd-config\`) generates merged configs` |

### `plugin/skills/components/contract/contract-scaffolding/SKILL.md` (2 occurrences)

| # | Line | Text |
|---|------|------|
| 20 | 55 | `sdd-system contract generate-types <component-name>` |
| 21 | 56 | `sdd-system contract validate <component-name>` |

### `plugin/skills/components/database/database-scaffolding/SKILL.md` (4 occurrences)

| # | Line | Text |
|---|------|------|
| 22 | 57 | `sdd-system database setup <component-name>` |
| 23 | 58 | `sdd-system database migrate <component-name>` |
| 24 | 59 | `sdd-system database seed <component-name>` |
| 25 | 60 | `sdd-system database reset <component-name>` |

### `plugin/skills/scaffolding/SKILL.md` (1 occurrence)

| # | Line | Text |
|---|------|------|
| 26 | 43 | `call \`sdd-system scaffolding project\` with a config JSON` |

**Note:** Some files also have incidental text references like "npm scripts (call sdd-system CLI)" at lines `plugin/skills/components/contract/contract-scaffolding/SKILL.md:25`, `plugin/skills/components/database/database-scaffolding/SKILL.md:17,41`, and `plugin/skills/components/database/database-standards/SKILL.md:31`. These are descriptive text (not invocation instructions) but should still be updated for consistency.

**Fix:** Replace all bare `sdd-system` with `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` in code blocks. For prose references, use "the system CLI (via `system-run.sh`)" or similar.

---

## Category 4: Broken Template npm Scripts (9 occurrences in 2 files)

Scaffolded templates emit bare `sdd-system` in npm scripts — these will fail when users run them.

### `plugin/skills/components/contract/contract-scaffolding/templates/package.json`

| # | Line | Script | Value |
|---|------|--------|-------|
| 1 | 13 | `generate:types` | `sdd-system contract generate-types {{COMPONENT_NAME}}` |
| 2 | 14 | `validate` | `sdd-system contract validate {{COMPONENT_NAME}}` |

### `plugin/skills/components/database/database-scaffolding/templates/package.json`

| # | Line | Script | Value |
|---|------|--------|-------|
| 3 | 5 | `setup` | `sdd-system database setup {{COMPONENT_NAME}}` |
| 4 | 6 | `teardown` | `sdd-system database teardown {{COMPONENT_NAME}}` |
| 5 | 7 | `migrate` | `sdd-system database migrate {{COMPONENT_NAME}}` |
| 6 | 8 | `seed` | `sdd-system database seed {{COMPONENT_NAME}}` |
| 7 | 9 | `reset` | `sdd-system database reset {{COMPONENT_NAME}}` |
| 8 | 10 | `port-forward` | `sdd-system database port-forward {{COMPONENT_NAME}}` |
| 9 | 11 | `psql` | `sdd-system database psql {{COMPONENT_NAME}}` |

**Fix:** Use `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` in template npm scripts.

---

## Category 5: Temp File Instead of stdin (3 lines in 1 file)

`plugin/skills/domain-population/SKILL.md` (lines 30, 45, 48) creates `/tmp/sdd-domain-config.json`, passes the file path to the CLI, then removes it. Should pipe content via stdin using the `-` convention.

**Fix:** Replace 3-step pattern with single stdin pipe:
```bash
cat << 'EOF' | "${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding domain --config -
{ ... }
EOF
```

---

## Files with Correct Patterns (reference)

| File | Status |
|------|--------|
| `plugin/commands/sdd-run.md` | Correct — uses `node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js"` |
| `.claude/skills/commands-standards/SKILL.md` | Correct — documents canonical pattern |
| `.claude/skills/system-cli-standards/skill.md` | Correct — defines the standard |

## Out of Scope

| File | Reason |
|------|--------|
| `plugin/system/README.md` | CLI's own documentation — documents how the CLI works internally, not a prompt file |
