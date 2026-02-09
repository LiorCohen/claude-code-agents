# System CLI Standards Audit Report

**Date:** 2026-02-09
**Standard:** `system-cli-standards` skill
**Scope:** All prompt files in `plugin/skills/`, `plugin/agents/`, `plugin/commands/`, and `plugin/skills/*/templates/`

---

## Summary

**22 violations** across 5 categories.

| Category | Count | Severity |
|----------|-------|----------|
| Wrong PATH claims | 8 | HIGH |
| Bare `npx sdd-system` invocations | 3 | CRITICAL |
| Broken template npm scripts | 9 | CRITICAL |
| Temp file instead of stdin | 1 | MEDIUM |
| Bare `sdd-system` in skill examples | 1 | HIGH |

---

## Category 1: Wrong PATH Claims (8 files)

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

**Fix:** Replace the PATH claim with the correct prerequisite — `CLAUDE_PLUGIN_ROOT` environment variable is set (automatic in plugin sessions).

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

## Category 3: Broken Template npm Scripts (9 occurrences in 2 files)

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

**Fix:** Use `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh"` in template npm scripts. Since `CLAUDE_PLUGIN_ROOT` is only available during plugin sessions, the scripts must use the `system-run.sh` wrapper with that variable.

---

## Category 4: Temp File Instead of stdin (1 file)

`plugin/skills/domain-population/SKILL.md` (lines 30–48) creates `/tmp/sdd-domain-config.json`, passes the file path to the CLI, then removes it. Should pipe content via stdin using the `-` convention.

**Current pattern:**
```bash
cat > /tmp/sdd-domain-config.json << 'EOF'
{ ... }
EOF
sdd-system scaffolding domain --config /tmp/sdd-domain-config.json
rm /tmp/sdd-domain-config.json
```

**Fix:** Pipe via stdin:
```bash
cat << 'EOF' | "${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding domain --config -
{ ... }
EOF
```

---

## Category 5: Bare `sdd-system` in Skill Examples (2 files)

Skill examples show bare `sdd-system` invocations instead of the canonical `system-run.sh` wrapper.

| # | File | Line | Text |
|---|------|------|------|
| 1 | `plugin/skills/domain-population/SKILL.md` | 45 | `sdd-system scaffolding domain` |
| 2 | `plugin/skills/scaffolding/SKILL.md` | 43 | `sdd-system scaffolding project` |

**Fix:** Replace with `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding <action>`.

---

## Files with Correct Patterns (reference)

| File | Status |
|------|--------|
| `plugin/commands/sdd-run.md` | Correct — uses `node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js"` |
| `.claude/skills/commands-standards/SKILL.md` | Correct — documents canonical pattern |
| `.claude/skills/system-cli-standards/skill.md` | Correct — defines the standard |
