# Commands Standards Audit — 2026-02-07

## Summary

| Category | Passing | Failing | Total |
|----------|---------|---------|-------|
| Frontmatter | 5 | 0 | 5 |
| Self-containment | 4 | 1 | 5 |
| User interaction | 2 | 3 | 5 |
| INVOKE directives | 1 | 2 | 3 |
| CLI integration | 2 | 1 | 3 |
| Output formatting | 2 | 3 | 5 |
| State persistence | 2 | 0 | 2 |
| Structure | 3 | 2 | 5 |

## Drift Risk Scores

| Command | Score | Tier | Top Factors |
|---------|-------|------|-------------|
| `sdd-config` | 4 | Moderate | 4 CLI refs (+4) |
| `sdd-run` | 6 | Moderate | 1 CLI path (+1), ~10 CLI namespace refs (+5, collapsed) |
| `sdd-change` | 14 | **High** | 10 INVOKEs (+10), 2 vague INVOKEs (+4), 12-step flow (+1) |
| `sdd-init` | 4 | Moderate | 1 INVOKE (+1), 1 CLI ref (+1), 1 cross-command ref (+3) |
| `sdd-settings` | 2 | Low | 1 hardcoded path (+1), 1 skill delegation (+1) |

## Staleness Report

### sdd-config
| Reference | Type | Exists? | Notes |
|-----------|------|---------|-------|
| `config-scaffolding` | Skill | **Yes** | Referenced in Related section |
| `config-standards` | Skill | **Yes** | Referenced in Related section |
| `helm-standards` | Skill | **Yes** | Referenced in Related section |
| `sdd-system config generate` | CLI | Assumed valid | Cannot verify CLI internals |
| `sdd-system config validate` | CLI | Assumed valid | — |
| `sdd-system config diff` | CLI | Assumed valid | — |
| `sdd-system config add-env` | CLI | Assumed valid | — |

### sdd-run
| Reference | Type | Exists? | Notes |
|-----------|------|---------|-------|
| CLI namespaces (database, contract, env, permissions, scaffolding, spec, version, hook) | CLI | Assumed valid | Cannot verify CLI internals |

### sdd-change
| Reference | Type | Exists? | Notes |
|-----------|------|---------|-------|
| `workflow-state` | Skill | **Yes** | Methods: create_workflow, create_item, ready_for_review, update_status, complete_item, advance |
| `component-discovery` | Skill | **Yes** | — |
| `spec-solicitation` | Skill | **Yes** | — |
| `spec-decomposition` | Skill | **Yes** | — |
| `external-spec-integration` | Skill | **Yes** | — |
| `planning` | Skill | **Yes** | — |
| `api-designer` | Agent | **Yes** | Referenced in implement action example |

### sdd-init
| Reference | Type | Exists? | Notes |
|-----------|------|---------|-------|
| `project-scaffolding` | Skill | **Yes** | — |
| `project-settings` | Skill | **Yes** | Referenced for templates |
| `/sdd-run permissions configure` | Command | **Yes** | Cross-command invocation |

### sdd-settings
| Reference | Type | Exists? | Notes |
|-----------|------|---------|-------|
| `project-settings` | Skill | **Yes** | Delegated for schema/validation |

**All skill/agent references resolve. No stale references found.**

## Output Consistency Report

| Element | sdd-config | sdd-run | sdd-change | sdd-init | sdd-settings |
|---------|-----------|---------|------------|----------|-------------|
| `═══` box headers | Missing | Missing | **Yes** | **Yes** | Missing |
| `✓`/`✗`/`⚠` indicators | Missing | Missing | **Yes** | **Yes** | Missing |
| `NEXT STEPS:` section | Missing | Missing | **Yes** | **Yes** | Missing |
| Aligned status tables | Missing | Missing | **Yes** | N/A | Missing |

**3 of 5 commands lack standard output formatting conventions.**

## Per-Command Violations

### sdd-config

1. **Missing NEXT STEPS in output** — No operation shows a `NEXT STEPS:` section. After `generate`, `validate`, `diff`, or `add-env`, the user gets no guidance on what to do next.

2. **Missing output examples** — Operations document behavior but don't show the exact terminal output the user sees. The standard requires fenced code blocks showing literal output.

3. **Missing `═══` box headers** — No completion/milestone outputs use the standard box format.

4. **Missing `✓`/`✗`/`⚠` indicators** — Validation output doesn't show what format success/failure looks like.

5. **Missing error handling for CLI calls** — Operations like `validate` can fail, but the command doesn't document what the user sees on failure or how to fix it.

6. **Uses `### Operations` with `###` subsections** — Standard says multi-action commands should use `## Actions` summary table + `## Action: <name>` sections. Currently uses `## Operations` with `### generate`, `### validate`, etc.

7. **No actions summary table** — Standard requires a summary table before action detail sections. The command lists operations as bullets under `## Usage` but not as a proper table.

### sdd-run

1. **Missing NEXT STEPS in all outputs** — No operation ends with a NEXT STEPS section.

2. **Missing output examples for most operations** — Most operations show only the usage syntax, not what the user actually sees in the terminal.

3. **Missing `═══` box headers** — No standard formatting.

4. **Missing `✓`/`✗`/`⚠` indicators** — No status indicators in any output.

5. **Missing error handling documentation** — What happens when `database setup` fails? When `env create` fails? No error outputs documented.

6. **No actions summary table** — Uses `## Database Operations`, `## Contract Validation`, `## Environment Commands`, etc. instead of the standard `## Actions` table + `## Action: <name>` pattern.

7. **Missing arguments tables for most operations** — The `env deploy` has inline options, but most operations lack a proper `| Argument | Required | Description |` table.

8. **CLI execution path exposed** — Line 197: `node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js"`. This is allowed (max once, in `## Execution`), but the section doesn't document error handling for when the CLI binary isn't found.

9. **H1 uses non-standard format** — H1 is `# /sdd-run` (correct), but the title pattern is inconsistent with subsection organization.

### sdd-change

1. **Vague INVOKE: `approve spec` step 4** — `INVOKE planning skill with: spec_path, change_id` — missing expected output documentation. What does the planning skill return? The command says "Save PLAN.md via workflow-state" but doesn't show the INVOKE for that save.

2. **Vague INVOKE: `implement` step 4** — "Invoke specified agent" — which agent? The command shows `api-designer` in the example output but the flow says "invoke specified agent" without documenting which agent is selected or how. This is a significant gap.

3. **`implement` flow exceeds 8 steps** — 6 main steps with sub-steps, effectively 10+ steps. Risk factor applies.

4. **`new` external spec flow is 12 steps** — Exceeds the 8-step threshold. Risk factor applies.

5. **Missing INVOKE output documentation** — Several INVOKEs specify inputs but don't explicitly state the return value shape:
   - Step 4 in `new` (component-discovery): no documented output
   - Step 5 in `new --spec` (external-spec-integration): says "Output: classified_transformation" but no shape
   - Step 8 in `new --spec` (spec-decomposition): lists what the skill does but not what it returns

6. **Phase tracking inconsistency** — The `init` command has "Phase 0-4" but references "Phase 5" in the DO NOT section (line 58: "Declare 'initialization complete' until Phase 5 is finished"). Phase 5 doesn't exist.

### sdd-init

1. **Phase numbering error** — Line 58 says "Declare 'initialization complete' until Phase 5 is finished" but phases only go 0-4. This is a documentation bug.

2. **Cross-command reference** — Line 229: "Run `/sdd-run permissions configure`". This is a cross-command invocation. While it's a user-facing command reference (not a file read), the standard says "No cross-command file references." This is borderline — it's invoking another command, not reading its file. Flagged as minor.

3. **INVOKE for project-scaffolding lacks expected output** — The INVOKE at Phase 2 specifies inputs but doesn't document what the skill returns or signals on completion.

4. **Missing flow steps for Phase 3** — Git init + commit section shows the commands but not as numbered flow steps. What happens if git is already initialized? (Noted in the `git init` command but not as a flow branch.)

### sdd-settings

1. **H1 format violation** — Line 7: `# /sdd-settings Command` — should be `# /sdd-settings` (no "Command" suffix).

2. **Missing NEXT STEPS in all outputs** — No operation ends with a NEXT STEPS section.

3. **Missing `═══` box headers** — No standard formatting.

4. **Missing `✓`/`✗`/`⚠` indicators** — Only the working tree check example (lines 66-76) uses the pattern, but the actual operation results don't.

5. **No actions summary table** — Uses `## Operations` with `### View All Settings`, `### View Component Settings`, `### Modify Settings`. Should use the standard actions table pattern.

6. **Missing error output examples** — What does the user see when they reference a non-existent component or invalid setting value?

7. **Missing output examples for view operations** — `View All Settings` and `View Component Settings` don't show what the terminal output looks like.

## Cross-Command Overlap

| Concern | Commands | Status |
|---------|----------|--------|
| Config generation | `sdd-config generate` vs `sdd-run env config` | **Potential overlap** — `sdd-run env config` generates local config, `sdd-config generate` is the general-purpose tool. The relationship isn't documented in either command. |
| Permissions | `sdd-init` Phase 1.5 vs `sdd-run permissions configure` | **Documented** — `sdd-init` delegates to `sdd-run permissions configure`. |
| Settings schema | `sdd-settings` vs `project-settings` skill | **Clean delegation** — command delegates schema to skill. |

## Recommended Fix Priority

### P1 — High Impact, Low Effort
1. **Fix `sdd-init` Phase 5 reference** → Change to "Phase 4" (typo fix, 1 line)
2. **Fix `sdd-settings` H1** → Remove "Command" suffix (1 line)
3. **Add NEXT STEPS to `sdd-config` operations** — Each operation needs a 2-3 line section

### P2 — High Impact, Moderate Effort
4. **Add output examples to `sdd-config`** — Show exact terminal output for each operation (generate success, validate pass/fail, diff output, add-env success)
5. **Add output examples to `sdd-run`** — At minimum for database setup, env create, env status
6. **Document INVOKE return values in `sdd-change`** — Especially `planning` and agent invocations in `implement`
7. **Clarify agent selection in `sdd-change implement`** — Document which agent is invoked for which phase, not just "invoke specified agent"

### P3 — Moderate Impact, Moderate Effort
8. **Standardize section structure across all commands** — Convert `## Operations` to `## Actions` + `## Action: <name>` pattern in `sdd-config`, `sdd-run`, `sdd-settings`
9. **Add `═══` box headers and `✓`/`✗`/`⚠` indicators** to `sdd-config`, `sdd-run`, `sdd-settings`
10. **Add error handling documentation** — At minimum for `sdd-config validate` failure and `sdd-run` operations
11. **Document config generation overlap** between `sdd-config generate` and `sdd-run env config`

### P4 — Low Impact
12. **Add NEXT STEPS to `sdd-settings`** — After each modify/view operation
13. **Add arguments tables to `sdd-run`** — Formal tables for each operation's args
