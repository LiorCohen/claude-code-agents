---
name: commands-standards
description: Standards for authoring SDD plugin commands — frontmatter, user interaction, skill/agent invocation, CLI integration, and output formatting.
---

# Commands Standards

Standards for every command in `plugin/commands/`. Apply when creating or reviewing plugin commands.

---

## Scope

This standard applies to commands shipped with the SDD plugin — all `.md` files found in `plugin/commands/`. It does not apply to the repo's own `.claude/skills/`.

---

## Frontmatter

Every command file must start with YAML frontmatter containing exactly these fields:

```yaml
---
name: sdd-my-command          # REQUIRED — kebab-case, prefixed with "sdd-"
description: >                # REQUIRED — what this command does, shown in help
  Manage project configuration - generate merged configs,
  validate, diff environments.
---
```

| Field | Type | Rule |
|-------|------|------|
| `name` | `string` | kebab-case, prefixed with `sdd-`, matches the filename without `.md` extension |
| `description` | `string` | 1-2 sentences. What the command does from the user's perspective. Written for the help listing — concise and action-oriented. |

**No other frontmatter fields.** Additional metadata belongs in the command body.

---

## Role of Commands

Commands are the user-facing entry points of the plugin. Users invoke them via `/command-name` in Claude Code. A command's job is to **orchestrate** — not to implement logic directly. Commands:

1. Parse arguments and validate inputs
2. Interact with the user (prompts, confirmations, option selection)
3. Delegate work to skills (via `INVOKE`) and the CLI (via `sdd-system`)
4. Display formatted output and next steps

Commands sit at the top of the invocation hierarchy:

```text
User → Command (user-facing, orchestrates)
Command → Skill (prompt-layer work: solicitation, decomposition, planning)
Command → Agent (specialized implementation: backend-dev, api-designer)
Command → CLI (system-layer work: scaffolding, validation, file operations)
```

A command must never contain implementation logic that belongs in a skill, agent, or the CLI. If a command's action section grows beyond orchestration (argument parsing, INVOKE directives, state transitions, output formatting), the logic should be extracted into a skill.

---

## Self-Containment

A command must be fully understandable on its own. An LLM reading a single command file should know exactly what the command does, what arguments it accepts, what it invokes, and what the user sees — without reading other commands.

### Rules

1. **Delegate clearly** — When invoking a skill or agent, state what you pass in and what you expect back. The reader should understand the delegation contract without reading the skill.
2. **Don't duplicate** — Never copy skill definitions, agent workflows, or CLI implementation details into the command. If a skill defines the spec solicitation flow, the command says "INVOKE spec-solicitation" with its inputs — it doesn't reproduce the solicitation steps.
3. **No cross-command file references** — Never reference or read files inside another command's definition. Each command is self-contained.
4. **No environment assumptions** — Do not assume a specific directory structure, tool version, or runtime context unless the command explicitly documents it as a precondition. If the command requires files to exist (e.g., `.sdd/sdd-settings.yaml`), state that as a precondition.
5. **Define your own terms** — If the command introduces domain-specific vocabulary, define it on first use. Don't define terms that belong to skills — delegate instead.
6. **Complete examples** — Every example must be understandable without external context. Include the arguments, expected output, and any state changes.

---

## User Interaction

Commands are the **only** layer that interacts directly with the user. Unlike agents (which have no user channel) and skills (which are instructional context), commands define the conversation flow.

### Rules

1. **Explicit interaction points** — Every point where the command pauses for user input must be documented with the exact prompt text and available options. Implicit "ask the user" is not sufficient — show what the user sees.
2. **Options format** — When presenting options, use a numbered list or lettered choices. Always include a cancel/exit option where appropriate.
3. **Confirmation before destructive actions** — Any action that modifies existing files, resets state, or archives artifacts must show a preview and request explicit confirmation.
4. **Progressive disclosure** — Show summaries first, details on request. Don't dump walls of output. Use structured formatting (tables, indented lists, boxed headers) to make output scannable.
5. **Next steps always** — Every terminal output must end with a `NEXT STEPS` section telling the user what to do next. The user should never be left wondering "what now?".
6. **Error messages are actionable** — When validation fails or a precondition is unmet, show what's wrong, why it's wrong, and how to fix it. Never display a raw error without context.

### BAD

```markdown
## Flow
1. Check if branch is main
2. Ask user about the branch
3. Continue
```

The reader doesn't know what the user sees, what the options are, or what happens for each choice.

### GOOD

```markdown
## Flow
1. Run `git branch --show-current`
2. If on `main`/`master`:
   ```
   You're on the main branch. Feature work should happen on a feature branch.

   Suggested branch: feature/user-auth

   [1] Create branch and switch (recommended)
   [2] Continue on main
   [3] Cancel
   ```
3. If user selects [1]: create and checkout the branch
4. Otherwise proceed on current branch
```

The reader knows exactly what the user sees and what each option does.

---

## Skill and Agent Invocation

Commands delegate work to skills and agents using the `INVOKE` directive. This is the standard format for documenting delegation in command files.

### INVOKE format

```yaml
INVOKE <skill-or-agent-name> with:
  param1: <value or description>
  param2: <value or description>
```

For skills with methods (e.g., workflow-state):

```yaml
INVOKE <skill-name>.<method> with:
  param1: <value>
```

### Rules

1. **Every INVOKE must specify inputs** — List every parameter the skill or agent receives. Use `<angle brackets>` for dynamic values and plain text for literals.
2. **Document expected output** — After the INVOKE, state what the command expects back (e.g., "Returns `workflow_id` for tracking."). The reader should know the shape of the result without reading the skill.
3. **Only invoke skills and agents that exist** — Every skill name in the command must correspond to an actual `SKILL.md` somewhere under `plugin/skills/` (scan recursively). Every agent name must correspond to an `.md` file in `plugin/agents/`. Referencing nonexistent skills or agents creates silent failures.
4. **Invocations are sequential within a flow** — Document invocations in the order they execute. If an invocation depends on a previous result, show the data flow explicitly (e.g., `workflow_id: <from step 3>`).
5. **No inline skill logic** — If you find yourself writing the steps a skill performs inside the command, you're duplicating. Replace with an INVOKE and a one-line summary of what the skill returns.

---

## CLI Integration

Commands may call the `sdd-system` CLI for deterministic, system-layer operations (file creation, validation, version bumping). This is a different delegation path than INVOKE — CLI calls are shell executions, not prompt-layer context loading. **For the canonical invocation pattern, output contracts, and authority boundaries, see the `system-cli-standards` skill.**

### Format

```markdown
## Implementation

This command invokes `sdd-system` CLI subcommands:

```bash
sdd-system <namespace> <action> [args] [options]
```
```

Or inline within a flow step:

```markdown
4. Run `sdd-system config validate --env <env>`
5. If validation fails, display errors and exit
```

### Rules

1. **Use `sdd-system` by name** — Always reference the CLI as `sdd-system`, not by its file path. The execution wrapper (`node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js"`) should appear at most once in the command, in an `## Execution` section.
2. **CLI for deterministic work only** — The CLI handles file operations, validation, and code generation. If the operation requires judgment, context, or conversation, use a skill or agent instead.
3. **Document error handling** — When a CLI command can fail (validation errors, missing files), document what the command shows the user and whether execution continues or stops.
4. **No CLI implementation details** — The command documents what CLI subcommand to call and what it returns. It does not document how the CLI implements the operation internally.

---

## Argument Handling

Commands must be designed with clear argument requirements and provide helpful guidance when invoked incorrectly.

### Rules

1. **Never run without arguments unless designed for it** — Commands should not execute their primary workflow when called without arguments, unless the command's only intended use is without arguments (e.g., `/sdd-init` which initializes a new project). Multi-action commands like `/sdd-config` or `/sdd-change` must require at least an action argument.
2. **Show focused usage guide for insufficient arguments** — When a command is invoked with missing or insufficient required arguments, display a focused usage guide showing:
   - Command syntax with all actions and arguments
   - Brief description of each action
   - Example invocations that demonstrate the missing arguments
   - `NEXT STEPS` section pointing to how to proceed

   The usage guide should be tailored to what's missing. For example:
   - Zero arguments → show full command usage
   - Missing action (e.g., `/sdd-config` without operation) → show all available actions
   - Missing required flags (e.g., `/sdd-config generate` without `--env`) → show that action's usage with required flags highlighted
3. **Fail fast on missing arguments** — Don't prompt for missing arguments interactively when the argument structure is invalid. Show the usage guide and exit. Interactive prompts should only happen during valid workflow execution (e.g., asking which option to select), not to recover from invalid invocation.
4. **Consistent help patterns** — Commands with a `--help` or `-h` flag should show the same usage guide as when invoked without arguments. The usage guide is the canonical reference.

### Example: Multi-action command invoked without arguments

```
$ /sdd-config

⚠ Missing required action argument.

USAGE:
  /sdd-config <action> [options]

ACTIONS:
  generate    Generate merged configuration for an environment
  validate    Validate configuration against schema
  diff        Compare configurations between environments

EXAMPLES:
  /sdd-config generate --env production
  /sdd-config validate
  /sdd-config diff --from dev --to staging

NEXT STEPS:
  Run /sdd-config <action> to get started, or /sdd-config <action> --help for details.
```

### Example: Zero-argument command (sdd-init)

```
$ /sdd-init

# This command is designed to run without arguments, so it proceeds directly
# to its initialization workflow. It does not show a usage guide.
```

---

## Actions and Subcommands

Commands with multiple operations use an actions pattern. Each action is a distinct workflow the user can invoke.

### Structure

```markdown
## Usage

```
/sdd-command <action> [args] [options]
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `new` | Create a new item | `/sdd-command new --name foo` |
| `status` | Show current state | `/sdd-command status` |

## Action: new

### Usage
...

### Arguments
| Argument | Required | Description |
...

### Flow
1. ...
2. ...

### Output
...
```

### Rules

1. **Actions table first** — Before any action detail sections, provide a summary table of all actions with one-line descriptions and examples.
2. **One section per action** — Each action gets its own `## Action: <name>` section (or `### <name>` for simpler commands). Never mix multiple actions in one section.
3. **Consistent subsection order** — Within each action: Usage, Arguments (if any), Flow, Output. Optional: Prerequisites, Examples.
4. **Simple commands skip actions** — Commands with a single operation (e.g., `/sdd-init`) don't need the actions pattern. Use `## Workflow` or `## Flow` directly.

---

## Output Formatting

Commands produce user-facing terminal output. Consistent formatting makes the plugin feel cohesive and professional.

### Conventions

| Element | Format |
|---------|--------|
| Section headers | `═══════` box with centered title |
| Success indicator | `✓` (check mark) |
| Failure indicator | `✗` (cross mark) |
| Warning indicator | `⚠` (warning sign) |
| Indented details | Two-space indent under parent |
| Status tables | Aligned columns with `─────` separator |
| Next steps | `NEXT STEPS:` header with numbered items |
| File references | `[filename.ext](relative/path/to/file.ext)` for clickable links |
| Line-specific refs | `[filename.ts:42](path/to/filename.ts#L42)` for specific lines |
| Directory refs | `[dirname/](path/to/dirname/)` for folders |
| Change ID refs | `[a1b2-1](changes/.../01-registration/)` linking to change directory |
| Task refs | `[#19](.tasks/.../19/task.md)` following tasks skill convention |

### Rules

1. **Show the exact output** — Document the literal terminal output the user sees in fenced code blocks (no language tag for terminal output). The implementer should be able to copy-paste the format.
2. **Structured, not conversational** — Output uses tables, aligned columns, and headers — not paragraphs of prose. Users scan terminal output; they don't read it.
3. **Status indicators are consistent** — Use `✓`/`✗`/`⚠` across all commands. Don't invent custom indicators.
4. **Box headers for major milestones** — Use the `═══════` box format for completion messages and major state transitions. Don't use it for intermediate steps.
5. **Use markdown links for all file/directory references** — Every file path shown in output must use markdown link syntax relative to the repo root. This enables click-to-navigate in VSCode terminals. Plain-text paths are only acceptable when the path itself is the subject (e.g., showing what would be created in a dry-run or displaying file tree structure).

---

## State Persistence

Commands that span multiple sessions must persist their state to disk so work survives session boundaries.

### Rules

1. **Zero session context** — A new session must be able to resume the command's workflow by reading persisted state alone. The command must never rely on conversation history.
2. **Document state location** — State file paths (e.g., `.sdd/workflows/`) must be explicitly documented in the command. The reader should know where to look.
3. **Document state transitions** — Each action that changes state must show the before/after status values. Use a table or inline notation (e.g., `spec_review → plan_review`).
4. **Checkpoint commits** — Commands that modify project files across multiple steps should create checkpoint commits on feature branches. Document when checkpoints happen.

---

## Command Structure

After the frontmatter, organize the command body as follows:

```
# /command-name                    <- H1, with leading slash
One-line summary paragraph.        <- What this command does

## Usage                           <- Syntax with code block
## Actions                         <- (if multi-action) Summary table
## Action: <name>                  <- (if multi-action) Per-action detail
  ### Usage
  ### Arguments
  ### Flow
  ### Output
## <Supporting Sections>           <- Merge algorithm, workflow, etc.
## Important Notes                 <- (recommended) Key constraints, edge cases
## Related                         <- (recommended) Related commands and skills
```

### Writing rules

- **H1 with slash** — The H1 title includes the leading slash (e.g., `# /sdd-config`), matching how the user invokes it.
- **Headings** — H1 for the title, H2 for major sections, H3 for subsections within actions. No deeper.
- **Code blocks** — Use language tags for code (`bash`, `yaml`, `typescript`). Use no language tag for terminal output (the formatted text the user sees).
- **Tables** — Use for arguments, actions summaries, settings, and comparisons.
- **Flow steps** — Numbered lists for sequential workflows. Each step is one action (validate, invoke, display).
- **INVOKE blocks** — Use `yaml` language tag for INVOKE directives within flow steps.
- **Rationale** — Explain *why* a design choice exists, not just *what* it is. Especially for non-obvious constraints (e.g., why checkpoints use `--no-verify`).

---

## Drift Risk Scoring

Some commands are structurally more likely to drift than others. During audit or review, score each command to prioritize monitoring effort. Higher scores mean more drift surfaces — not that the command is broken today, but that it is more likely to break tomorrow.

### Risk factors

| Risk Factor | Points | Rationale |
|-------------|--------|-----------|
| Each INVOKE directive (skill/agent) | +1 | More invocations = more surfaces that can change |
| Each vague INVOKE (no inputs/outputs specified) | +2 | Vague invocations drift silently — the skill evolves but the command's assumption doesn't |
| Each CLI command reference | +1 | CLI interfaces change across versions; the command may reference stale subcommands or flags |
| Each hardcoded file path | +1 | Paths change during refactors; the command won't know |
| Each duplicated concept from a skill or agent | +3 | Duplicated content drifts silently; the source of truth evolves but the copy doesn't |
| Each cross-command file reference | +3 | Hidden coupling that breaks on restructure |
| Each environment assumption without documented precondition | +1 | Implicit assumptions break silently in new environments |
| Each action with more than 8 flow steps | +1 | Long flows are harder to maintain and more likely to accumulate drift |

### Risk tiers

| Score | Tier | Action |
|-------|------|--------|
| 0–3 | **Low** | Standard audit cadence |
| 4–6 | **Moderate** | Review when any invoked skill, agent, or CLI command changes |
| 7+ | **High** | Prioritize in every audit; consider splitting into subcommands or extracting logic into skills |

### In the audit report

Include a drift risk summary table:

```markdown
## Drift Risk Scores

| Command | Score | Tier | Top Factors |
|---------|-------|------|-------------|
| sdd-config | 3 | Low | 4 CLI refs (+4) |
| sdd-change | 12 | High | 8 INVOKEs (+8), 3 vague refs (+6), 12-step flow (+1) |
```

---

## Checklist

Use when creating or reviewing a plugin command:

- [ ] Frontmatter has exactly `name` and `description`
- [ ] `name` is kebab-case, prefixed with `sdd-`, and matches the filename (without `.md`)
- [ ] `description` is 1-2 sentences: what the command does from the user's perspective
- [ ] H1 title includes the leading slash (e.g., `# /sdd-config`)
- [ ] `## Usage` section with syntax code block
- [ ] Command requires arguments unless designed to run without them (like `sdd-init`)
- [ ] When called without required arguments, shows comprehensive usage guide (not an error message)
- [ ] Multi-action commands have a summary table before action detail sections
- [ ] Each action has: Usage, Arguments (if any), Flow, Output
- [ ] Every INVOKE specifies inputs and documents expected output
- [ ] Invoked skills exist in `plugin/skills/` (recursive scan by `name` frontmatter)
- [ ] Invoked agents exist in `plugin/agents/` (match filename without `.md`)
- [ ] No duplicated skill/agent logic — commands orchestrate, they don't implement
- [ ] No cross-command file references
- [ ] Every user interaction point shows the exact prompt and options
- [ ] Destructive actions show a preview and request confirmation
- [ ] Every terminal output ends with a NEXT STEPS section
- [ ] Error messages are actionable (what's wrong, why, how to fix)
- [ ] Output uses consistent formatting (`✓`/`✗`/`⚠`, `═══` boxes, aligned tables)
- [ ] State-persisting commands document state location and transitions
- [ ] No undocumented environment assumptions
- [ ] Domain terms introduced by this command are defined on first use
- [ ] All examples are self-contained
- [ ] Code blocks specify language (or no tag for terminal output)
- [ ] CLI calls use `sdd-system` by name, not by file path

---

## Audit Procedure

Run this audit against all plugin commands to produce a fresh violations report. Find every `.md` file in `plugin/commands/`, then check each command against the categories below.

### What to check per command

For each command file, check every item in the **Checklist** section above. Additionally:

1. **Skill/agent existence** — For every INVOKE directive, verify the referenced skill has a `SKILL.md` somewhere under `plugin/skills/` (glob recursively, match on the `name` frontmatter field). For agent references, verify a matching `.md` file exists in `plugin/agents/`.
2. **INVOKE completeness** — Every INVOKE must list its input parameters. Flag any INVOKE that says only "invoke skill-name" without specifying what data is passed.
3. **Output consistency** — Compare formatting patterns across all commands. Flag any command that uses different status indicators, header styles, or next-steps formatting than the conventions documented above.
4. **Cross-command overlap** — Check that no two commands claim the same action or duplicate the same workflow. If overlap exists, one should delegate to the other.
5. **Staleness indicators** — For each invoked skill or CLI subcommand, check whether it still exists and whether the command's description of it matches its current behavior.

### Report format

Produce the report with these sections:

```markdown
# Commands Standards Audit — YYYY-MM-DD_HH-MM

## Summary

| Category | Passing | Failing | Total |
|----------|---------|---------|-------|
| Frontmatter | X | Y | Z |
| Self-containment | ... | ... | ... |
| User interaction | ... | ... | ... |
| INVOKE directives | ... | ... | ... |
| CLI integration | ... | ... | ... |
| Output formatting | ... | ... | ... |
| State persistence | ... | ... | ... |

## Drift Risk Scores

| Command | Score | Tier | Top Factors |
|---------|-------|------|-------------|

## Staleness Report
<!-- Per-command skill/agent/CLI reference validation -->

## Output Consistency Report
<!-- Cross-command formatting comparison -->

## Per-Command Violations
<!-- One subsection per failing command, with quoted violations -->

## Recommended Fix Priority
<!-- Ordered by impact and effort -->
```

### Report output location

**Never write audit reports inside `plugin/commands/`.** The plugin folder is for shipped command files only — no reports, scratch files, or artifacts.

After presenting the report, **ask the user** whether to create a task to track the fixes or whether the report is temporary (e.g., for quick review or one-off investigation). If the user wants a task:

Create a task via `/tasks add "Fix commands standards violations from audit report"`. The task's purpose is to **fix the violations** — the audit report is supporting evidence, not the deliverable. Save the report with a timestamped filename inside the task folder:

```
.tasks/1-inbox/<N>/
├── task.md                                      # Task to fix violations, with key findings summary
└── commands-audit-YYYY-MM-DD_HH-MM.md           # Full audit report (e.g., commands-audit-2026-02-07_14-30.md)
```

If the user declines, present the report inline without creating any files or tasks.

### How to run

Ask: "Audit all plugin commands against the commands-standards skill and produce a violations report."

Run the audit directly (do not delegate to subagents):

1. Glob for all `plugin/commands/*.md` files
2. Read each file completely
3. Check every item from the Checklist above, plus the additional audit-specific checks
4. For skill existence checks, glob `plugin/skills/**/SKILL.md` (recursive) and match each referenced skill name against the `name` frontmatter field of found skills
5. For agent existence checks, glob `plugin/agents/*.md` and match agent names against filenames
6. Present the report to the user
7. Ask the user whether to create a task (via `/tasks add "Fix commands standards violations from audit report"`) or keep the report temporary

## Input / Output

This skill defines no input parameters or structured output.
