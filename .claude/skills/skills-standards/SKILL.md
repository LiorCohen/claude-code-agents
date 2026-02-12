---
name: skills-standards
description: Standards for authoring SDD plugin skills — frontmatter, self-containment, and input/output schemas.
---

# Skills Standards

Standards for every skill in `plugin/skills/`. Apply when creating or reviewing plugin skills.

---

## Scope

This standard applies to skills shipped with the SDD plugin — all `SKILL.md` files found recursively under `plugin/skills/`. It does not apply to the repo's own `.claude/skills/`.

---

## Frontmatter

Every `SKILL.md` must start with YAML frontmatter. The following fields are supported:

```yaml
---
name: my-skill              # OPTIONAL — kebab-case, uses directory name if omitted
description: >              # RECOMMENDED — what it does + what it needs/produces
  Discover required technical components through targeted questions
  based on classified requirements. Accepts classified requirements
  and produces a component list with types, names, and rationale.
user-invocable: false        # OPTIONAL — true if user can invoke via /command (default: true)
model: opus                  # OPTIONAL — model to use when skill is active
disable-model-invocation: true  # OPTIONAL — prevent Claude from auto-loading (default: false)
---
```

### Required Fields

Only `description` is recommended. All other fields are optional.

### Supported Fields

| Field | Type | Default | Rule |
|-------|------|---------|------|
| `name` | `string` | Directory name | kebab-case, matches parent directory name if specified |
| `description` | `string` | First paragraph | 1-3 sentences. First sentence: what the skill does. Remaining sentences (optional): what it accepts/produces, key constraints, or disambiguation from similar skills. Never reference where or when the skill is used — the skill doesn't know its callers. The model uses this to decide whether to load the skill, so include enough signal for accurate selection. |
| `user-invocable` | `boolean` | `true` | `true` if the user invokes it via `/skill-name`; `false` for internal skills invoked by the plugin workflow or other skills |
| `model` | `string` | Inherits session model | Model to use when this skill is active. Options: `opus`, `sonnet`, `haiku`, `inherit` |
| `disable-model-invocation` | `boolean` | `false` | Set to `true` to prevent Claude from automatically loading this skill. Use for workflows you want to trigger manually. |
| `argument-hint` | `string` | None | Hint shown during autocomplete to indicate expected arguments (e.g., `[issue-number]`, `[filename] [format]`) |
| `allowed-tools` | `string` | None | Comma-separated list of tools Claude can use without permission when this skill is active |
| `context` | `string` | None | Set to `fork` to run in a forked subagent context |
| `agent` | `string` | `general-purpose` | Which subagent type to use when `context: fork` is set |
| `hooks` | `object` | None | Hooks scoped to this skill's lifecycle |

**For SDD plugin skills, only use frontmatter fields that are necessary for the skill's functionality.** Keep frontmatter minimal and prefer documentation in the skill body.

---

## Self-Containment

The less a skill assumes about its environment, the more portable, reusable, and maintainable it is. A skill that depends on implicit knowledge from other skills is fragile — renaming, restructuring, or removing a dependency silently breaks it. A self-contained skill can be moved, composed differently, or understood in isolation.

Each skill must be fully understandable on its own. An LLM reading a single skill should never need to read another skill to understand what this skill requires it to do.

### Rules

1. **Delegate clearly** — When referencing another skill, state what you expect it to do (the contract), not how it works internally. The reader should understand the *role* of the delegated skill without reading it.
2. **Don't duplicate** — Never copy definitions, patterns, or rules from another skill into yours. Duplication creates drift and bloats skills with out-of-context information. If a concept is owned by another skill, delegate to it.
3. **No cross-skill file references** — Never reference or read files inside another skill's directory. A skill's internal files (templates, schemas, references) are private to that skill. If two skills need the same template or data, either consolidate them into one skill or extract the shared content into each skill's own directory. Cross-skill file references create hidden coupling that breaks when skills are moved, renamed, or restructured.
4. **No environment assumptions** — Do not assume a specific directory structure, tool version, or runtime context unless the skill explicitly documents it. If the skill requires a file to exist or a tool to be available, state that as a precondition.
5. **Define your own terms** — If the skill introduces domain-specific vocabulary, define it on first use. Don't define terms that belong to other skills — delegate instead.
6. **Complete examples** — Every example must be understandable without external context. Include the data shapes, field names, and structure needed to make the example self-contained.
7. **Plugin boundary** — Plugin skills (`plugin/skills/`) have no runtime access to anything outside `plugin/`. Never reference `.claude/`, `.tasks/`, or root-level files from within a plugin skill.

### Cross-references

A skill references another skill by describing what it expects from it — the delegation contract. This is the only form of cross-reference needed.

### BAD

```markdown
## Backend Generation
Follow the `backend-scaffolding` skill for CMDO structure.
```

The reader doesn't know what `backend-scaffolding` will produce or what role it plays in this skill's workflow.

### ALSO BAD

```markdown
## Backend Generation
Generate backend components using the CMDO pattern (Config, Model, DAL, Operator)
with a Controller entry point. Each layer is a separate file under `src/`:
- `config.ts` — typed environment configuration
- `model.ts` — domain types (readonly, no classes)
...
```

Now the skill duplicates the entire CMDO definition from `backend-scaffolding`. When that pattern changes, this copy drifts silently.

### GOOD

```markdown
## Backend Generation
Delegate to the `backend-scaffolding` skill to generate the server component
directory structure and source files. It expects a component name and server
settings from `sdd-settings.yaml`, and produces a ready-to-build `src/` tree.
```

The reader knows what to pass in, what comes out, and where the responsibility lives — without needing to read `backend-scaffolding` or duplicating its internals.

---

## Input / Output Schema

Every skill that accepts parameters or produces structured output must define them as colocated JSON Schema files. This keeps schemas machine-readable, validatable, and composable — the output schema of one skill can be validated against the input schema of the next.

### File layout

```text
plugin/skills/my-skill/
├── SKILL.md
└── schemas/
    ├── input.schema.json       # What this skill accepts
    └── output.schema.json      # What this skill produces
```

Schema files live in a `schemas/` subdirectory within the skill's directory. The `SKILL.md` references them but does not duplicate their contents.

### Schema file format

Use JSON Schema Draft 2020-12. Example `input.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "my-skill input",
  "description": "Parameters for the skill.",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Identifier for the item to process"
    },
    "mode": {
      "type": "string",
      "enum": ["full", "partial", "dry-run"],
      "description": "Processing mode"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional labels to attach"
    }
  },
  "required": ["name", "mode"]
}
```

Example `output.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "my-skill output",
  "description": "Result of processing.",
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "description": "Processed items with their outcomes",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Generated identifier"
          },
          "status": {
            "type": "string",
            "enum": ["created", "skipped", "failed"],
            "description": "Outcome for this item"
          }
        },
        "required": ["id", "status"]
      }
    }
  },
  "required": ["items"]
}
```

### Referencing schemas in SKILL.md

The `## Input` and `## Output` sections in `SKILL.md` should reference the schema files and provide a brief human-readable summary — not duplicate the full schema:

```markdown
## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts an item name, processing mode, and optional tags.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns a list of processed items, each with an id and a status (created, skipped, or failed).
```

### Schema rules

- Use JSON Schema Draft 2020-12 (`$schema` field required)
- Include `title` and `description` at the root level
- Every property must have a `description`
- Use `enum` for fixed option sets
- Use `required` to mark mandatory fields
- Nest `items` for array properties
- Keep schemas minimal — only document what the skill actually consumes or produces

### When schemas are not needed

Skills that define standards or guidelines (rather than accepting parameters or producing structured output) need no schema files. Note this in `SKILL.md`:

```markdown
## Input / Output

This skill defines no input parameters or structured output.
```

---

## Layer Separation

Skills and the `sdd-system` CLI operate at different layers. Skills are prompt-layer artifacts — markdown documents consumed by commands and agents in the LLM context. The CLI is a system-layer tool that performs deterministic operations (file creation, validation, type generation, config merging).

**The CLI must never be aware of skills.** The invocation direction is one-way:

```text
Commands/Agents → Skills (prompt layer)
Commands/Agents → CLI (system layer)
Skills → CLI (skills may call CLI as a tool)
CLI ↛ Skills (NEVER — CLI must not route through or invoke skill definitions)
```

A skill may document calling the CLI (e.g., "run `sdd-system spec validate`"). A skill must never document being invoked by the CLI (e.g., "runs via `sdd-system scaffolding project`"). If the CLI has a subcommand that implements what a skill describes, the skill should be refactored so that the command or skill orchestrates CLI primitives — not the other way around.

**For the canonical CLI invocation pattern, output contracts, and authority boundaries, see the `system-cli-standards` skill.**

---

## Skill Structure

After the frontmatter, organize the skill body as follows:

```
# Skill Title                  <- H1, matches `name` in title-case
One-line summary paragraph.    <- What this skill does, when to apply it
---
## When to Use                 <- (recommended) Scenarios that trigger this skill
## Quick Reference             <- (recommended) The 80% — key rules at a glance
## Input                       <- (if applicable) JSON Schema
## Output                      <- (if applicable) JSON Schema
## <Core Sections>             <- H2 sections with the skill's rules/workflow
## Resource Files              <- (if applicable) Links to resources/ deep dives
## Examples                    <- (recommended) Concrete usage examples
```

### When to Use

A short bullet list of concrete scenarios where this skill applies. This helps both humans and auto-activation hooks decide whether to load the skill:

```markdown
## When to Use

- Creating or modifying a backend service component
- Reviewing scaffolded output for structural compliance
- Debugging missing layers in a CMDO structure
```

Keep it to 3–6 bullets. Describe the situation, not the skill's mechanics.

### Quick Reference

The high-hit-rate rules and patterns — the subset a reader needs 80% of the time. Place it before the detailed core sections so Claude sees the most important guidance first without reading the full skill:

```markdown
## Quick Reference

| Rule | Details |
|------|---------|
| File naming | `kebab-case.ts`, one export per file |
| Imports | Absolute `@/` paths only, no relative `../` |
| Error handling | Return `Result<T>`, never throw |
```

Tables work well here. Keep it scannable — no explanations or rationale (those belong in the core sections).

### Writing rules

- **Headings** — H1 for the title, H2 for major sections, H3 for subsections. No deeper.
- **Code blocks** — Always specify language (`json`, `typescript`, `bash`, `yaml`, `markdown`).
- **Tables** — Use for comparisons, quick-reference, and field definitions.
- **Good/Bad examples** — When showing anti-patterns, label clearly with `BAD` / `GOOD` headings.
- **Rationale** — Explain *why* a rule exists, not just *what* it says. Rules without rationale get ignored.

---

## Drift Risk Scoring

Some skills are structurally more likely to drift than others. During audit or review, score each skill to prioritize monitoring effort. Higher scores mean more drift surfaces — not that the skill is broken today, but that it is more likely to break tomorrow.

### Risk factors

| Risk Factor | Points | Rationale |
|-------------|--------|-----------|
| Each cross-skill delegation | +1 | More delegations = more surfaces that can change |
| Each vague delegation (no contract specified) | +2 | Vague references drift silently — the delegated skill evolves but the caller's assumption doesn't |
| Each hardcoded file path | +1 | Paths change during refactors; the skill won't know |
| Each duplicated definition from another skill | +3 | Highest risk — duplicated content drifts silently while the source of truth evolves |
| Each CLI command reference | +1 | CLI interfaces change across versions; the skill may reference stale subcommands or flags |
| Each environment assumption without documented precondition | +1 | Implicit assumptions break silently in new environments |
| Each cross-skill file reference | +3 | Hidden coupling that breaks on restructure — the referenced skill doesn't know it has external readers |

### Risk tiers

| Score | Tier | Action |
|-------|------|--------|
| 0–2 | **Low** | Standard audit cadence |
| 3–5 | **Moderate** | Review when any delegated skill or referenced CLI command changes |
| 6+ | **High** | Prioritize in every audit; consider splitting the skill or inlining the dependency |

### In the audit report

Include a drift risk summary table:

```markdown
## Drift Risk Scores

| Skill | Score | Tier | Top Factors |
|-------|-------|------|-------------|
| scaffolding | 5 | Moderate | 3 delegations (+3), 2 CLI refs (+2) |
| change-creation | 7 | High | 4 delegations (+4), 1 vague ref (+2), 1 hardcoded path (+1) |
```

---

## Size Limit

A skill file (`SKILL.md`) must not exceed **500 lines**. Resource files under `resources/` must also stay under **500 lines** each.

When a skill approaches the limit, use **progressive disclosure** before splitting into separate skills:

```text
my-skill/
├── SKILL.md              # <500 lines — overview, rules, quick reference
├── schemas/              # (if applicable) JSON Schema files
└── resources/            # On-demand deep dives
    ├── topic-a.md        # <500 lines each
    ├── topic-b.md
    └── topic-c.md
```

`SKILL.md` contains the high-level rules and a **Resource Files** section that links to deeper content:

```markdown
## Resource Files

For detailed guidance, read these on-demand:
- [topic-a.md](resources/topic-a.md) — Detailed patterns for X
- [topic-b.md](resources/topic-b.md) — Complete examples for Y
```

Claude loads only the main `SKILL.md` initially. Resource files are read on-demand when the current task requires deeper guidance. This keeps token usage proportional to task complexity.

**When to use resources/ vs. splitting into separate skills:**

| Use `resources/` | Split into separate skills |
|-------------------|---------------------------|
| Content is subordinate to the main skill | Content stands alone as an independent concern |
| Readers always enter through the main skill | Different callers invoke the content independently |
| Shared vocabulary and context | Distinct vocabulary and scope |

During audit, flag any `SKILL.md` or resource file that exceeds 500 lines as a violation.

---

## Checklist

Use when creating or reviewing a plugin skill:

- [ ] `SKILL.md` is 500 lines or fewer; resource files under `resources/` are each under 500 lines
- [ ] `## When to Use` section lists 3–6 concrete activation scenarios (recommended)
- [ ] `## Quick Reference` section provides scannable high-hit-rate rules (recommended for skills with many rules)
- [ ] Frontmatter includes `description` (recommended) and only uses supported optional fields
- [ ] `name` (if specified) is kebab-case and matches the directory name
- [ ] `description` is 1-3 sentences: what the skill does + what it accepts/produces. No references to callers or workflow position.
- [ ] `user-invocable` is explicitly `true` or `false` if specified (defaults to `true` if omitted)
- [ ] `model` (if specified) uses valid values: `opus`, `sonnet`, `haiku`, or `inherit`
- [ ] Only necessary frontmatter fields are included — keep it minimal
- [ ] Cross-references describe the delegation contract (what goes in, what comes out, where responsibility lives)
- [ ] No duplicated definitions — concepts owned by other skills are delegated, not copied
- [ ] No cross-skill file references — never read or link to files inside another skill's directory
- [ ] No CLI-to-skill invocation — the skill is never invoked by the `sdd-system` CLI (skills may call the CLI, not the reverse)
- [ ] No undocumented environment assumptions (directory structure, CLI tools, runtime)
- [ ] Domain terms introduced by this skill are defined on first use
- [ ] All examples are self-contained
- [ ] `schemas/input.schema.json` / `schemas/output.schema.json` in skill subdirectory (or `## Input / Output` notes "no input/output")
- [ ] JSON Schemas use Draft 2020-12 and include `description` on each property
- [ ] Code blocks specify language

## Input / Output

This skill defines no input parameters or structured output.

---

## Audit Procedure

Run this audit against all plugin skills to produce a fresh violations report. Recursively find every `SKILL.md` under `plugin/skills/`, then check each skill against the categories below.

### What to check per skill

For each `SKILL.md`, check every item in the **Checklist** section above. Additionally:

1. **Dependency graph** — Build a directed graph of skill-to-skill delegation references across all skills. Flag any circular references (A delegates to B, B delegates to A) or longer cycles.
2. **Self-containment quotes** — When flagging vague cross-references, quote the problematic text directly so the violation is actionable.

### Report format

Produce the report with these sections:

```markdown
# Skills Standards Audit — YYYY-MM-DD_HH-MM

## Summary

| Category | Passing | Failing | Total |
|----------|---------|---------|-------|
| Frontmatter | X | Y | Z |
| Self-containment | ... | ... | ... |
| Size limit | ... | ... | ... |
| Dependency graph | ... | ... | ... |
| Term definitions | ... | ... | ... |
| Input/Output schemas | ... | ... | ... |
| Code blocks | ... | ... | ... |
| Environment preconditions | ... | ... | ... |

## Dependency Graph
<!-- Directed graph of skill-to-skill delegations. Flag cycles. -->
<!--
  scaffolding -> backend-scaffolding
  scaffolding -> frontend-scaffolding
  ...
  Cycles: none | A -> B -> A
-->

## Systemic Violations
<!-- Issues affecting 5+ skills — address as bulk fixes -->

## Per-Skill Violations
<!-- One subsection per failing skill, with quoted violations -->

## Recommended Fix Priority
<!-- Ordered by impact and effort -->
```

### Report output location

**Never write audit reports inside `plugin/skills/`.** The plugin folder is for shipped skill files only — no reports, scratch files, or artifacts.

After presenting the report, **ask the user** whether to create a task to track the fixes or whether the report is temporary (e.g., for quick review or one-off investigation). If the user wants a task:

Create a task via `/tasks add "Fix skills standards violations from audit report"`. The task's purpose is to **fix the violations** — the audit report is supporting evidence, not the deliverable. Save the report with a timestamped filename inside the task folder:

```
.tasks/1-inbox/<N>/
├── task.md                                    # Task to fix violations, with key findings summary
└── skills-audit-YYYY-MM-DD_HH-MM.md           # Full audit report (e.g., skills-audit-2026-02-07_14-30.md)
```

If the user declines, present the report inline without creating any files or tasks.

### How to run

Ask: "Audit all plugin skills against the skills-standards skill and produce a violations report."

Run the audit directly (do not delegate to subagents):

1. Glob for all `plugin/skills/**/SKILL.md` files
2. Read each file completely
3. Check every item from the Checklist above, plus the additional audit-specific checks
4. Present the report to the user
5. Ask the user whether to create a task (via `/tasks add "Fix skills standards violations from audit report"`) or keep the report temporary
