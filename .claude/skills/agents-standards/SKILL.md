---
name: agents-standards
description: Standards for authoring SDD plugin agents — frontmatter, self-containment, skill references, and no-user-interaction rules.
user-invocable: false
---

# Agents Standards

Standards for every agent in `plugin/agents/`. Apply when creating or reviewing plugin agents.

---

## Scope

This standard applies to agents shipped with the SDD plugin — all `.md` files found in `plugin/agents/`. It does not apply to the repo's own `.claude/` configuration.

---

## Frontmatter

Every agent file must start with YAML frontmatter containing exactly these fields:

```yaml
---
name: my-agent               # REQUIRED — kebab-case, must match filename (without .md)
description: >               # REQUIRED — what this agent does + its expertise area
  Implements backend services using Node.js and TypeScript
  with strict CMDO architecture.
tools: Read, Write, Grep, Glob, Bash  # REQUIRED — comma-separated list of available tools
model: sonnet                # REQUIRED — "sonnet" for implementation, "opus" for review/advisory
color: "#10B981"             # REQUIRED — hex color for UI representation
skills:                      # REQUIRED — skills to preload into agent context
  - typescript-standards
  - backend-standards
---
```

| Field | Type | Rule |
|-------|------|------|
| `name` | `string` | kebab-case, matches the filename without `.md` extension |
| `description` | `string` | 1-2 sentences. What the agent does + its domain expertise. Never reference when or by whom the agent is invoked — the agent doesn't know its callers. |
| `tools` | `string` | Comma-separated list of tools this agent can use. Read-only agents (reviewer, db-advisor) must NOT include `Write`. |
| `model` | `string` | `sonnet` for implementation agents, `opus` for review/advisory agents. Choose based on the cognitive complexity required. |
| `color` | `string` | Hex color code for UI. Must be unique across agents. |
| `skills` | `list` | Skills to preload into agent context. Full skill content is injected at startup. **Agents do not inherit skills from the parent conversation — they must be listed explicitly.** |

---

## Self-Containment

An agent must be fully understandable on its own. An LLM reading a single agent file should know exactly what role this agent plays, what it owns, and what constraints it operates under — without reading other agents.

### Rules

1. **Define your role clearly** — The first line after frontmatter must be a "You are..." statement that establishes the agent's expertise and scope. This is the agent's identity.
2. **Own your working directory** — If the agent operates in a specific directory, state it explicitly. Never assume the reader knows the project layout.
3. **Delegate clearly to other agents** — When referencing another agent, state what you expect it to do (the contract), not how it works internally. Example: "Invoke `db-advisor` for database schema review" is sufficient.
4. **Don't duplicate other agents** — Never copy responsibilities, checklists, or rules from another agent. If review of database changes is `db-advisor`'s job, delegate to it — don't reproduce its checklist.
5. **No cross-agent file references** — Never reference or read files inside another agent's definition. Each agent is a self-contained unit.
6. **No environment assumptions** — Do not assume a specific directory structure, tool version, or runtime context unless the agent explicitly documents it as a precondition. If the project may vary (multi-instance), tell the agent where to check (e.g., `.sdd/sdd-settings.yaml`).
7. **Define your own terms** — If the agent introduces domain-specific vocabulary (e.g., "CMDO architecture"), define it on first use or delegate to a skill that defines it.
8. **Complete examples** — Every example must be understandable without external context.
9. **Plugin boundary** — Plugin agents (`plugin/agents/`) have no runtime access to anything outside `plugin/`. Never reference `.claude/`, `.tasks/`, or root-level files from within a plugin agent.

---

## CLI Delegation

Agents should not invoke the system CLI directly. Instead, agents delegate to commands or skills that handle CLI invocation. This keeps CLI coupling out of agents and in the orchestration layers. **For the canonical CLI invocation pattern, see the `system-cli-standards` skill.**

---

## No User Interaction

Agents run as subprocesses (subagents) invoked by commands or other agents. They have **no direct access to the user**. This is a hard constraint of the execution environment, not a style preference.

### Rules

1. **Never prompt the user** — An agent cannot ask the user for clarification, confirmation, or input. Statements like "Ask the user which..." or "Confirm with the user before..." are invalid because the agent has no communication channel to the user.
2. **Never wait for user decisions** — An agent must be able to complete its work with the inputs it receives. If a decision point exists, the agent must either (a) make the decision using documented rules in its definition or referenced skills, or (b) document the decision it made in its output so the caller can review.
3. **Never reference user preferences at runtime** — Phrases like "based on user preference" or "if the user wants..." are invalid. All configuration must come from files (specs, plans, settings) or the invoking command's parameters.
4. **Output is for the caller, not the user** — The agent's output goes back to the command or agent that invoked it. Write output as structured results (checklists, reports, code), not conversational prose aimed at a human.
5. **Errors are output, not questions** — When an agent encounters an ambiguity or missing information, it must document the issue in its output (e.g., flag it in a review report) rather than asking for help.
6. **Transitive: referenced skills must also be interaction-free** — Skills loaded by an agent become part of the agent's context. If a skill assumes user interaction (e.g., "present options to the user", "let the user respond", "multi-turn conversation"), the agent inherits that assumption and will attempt to interact with a user it cannot reach. During audit, scan all skills referenced by each agent for user interaction patterns — not just the agent file itself.

### BAD

```markdown
## Workflow
1. Read the spec
2. Ask the user which components to implement
3. Confirm the approach with the user before proceeding
```

The agent cannot ask or confirm anything with the user. It has no user channel.

### GOOD

```markdown
## Workflow
1. Read the spec and plan
2. Identify components from the plan's phase details
3. Implement components as specified
4. Document any ambiguities in the output for caller review
```

The agent derives decisions from its inputs and flags issues in its output.

---

## Skill References

Agents reference skills as instructional context — the skills define patterns and standards the agent must follow. This is a "load and apply" relationship, not input/output composition.

### Format

```markdown
## Skills

**CRITICAL: You MUST read and follow ALL patterns defined in these skills. They are mandatory, not optional reference material. ALL code you write or scaffold MUST adhere to these standards.**

- `typescript-standards` — Strict typing, immutability, arrow functions
- `backend-standards` — CMDO architecture, layer separation, telemetry
```

The bold CRITICAL line is mandatory. Without it, agents treat skills as optional reference material and ignore them in practice. The "ALL code you write or scaffold" clause ensures generated/scaffolded files also adhere to the standards.

### Rules

1. **Mandatory language required** — The Skills section MUST include the CRITICAL preamble shown above. The phrase "for reference" or "for standards and patterns" alone is too passive — agents will not follow the skills.
2. **Reinforce in Rules section** — For each skill, add a corresponding "Follow all `skill-name` skill requirements" line in the agent's Rules section. Double reinforcement ensures compliance.
3. **Brief summary per skill** — After the skill name, include a short phrase describing what the agent uses it for. The reader should understand the role of each skill without loading it.
4. **Don't duplicate skill content** — Never copy rules, patterns, or checklists from a skill into the agent. The agent loads the skill at runtime.
5. **Only reference skills that exist** — Every skill name in the agent must correspond to an actual `SKILL.md` somewhere under `plugin/skills/` (scan recursively — skills may be nested, e.g. `plugin/skills/components/backend/backend-standards/`). Referencing nonexistent skills creates silent failures — the agent will have no standards to follow.

---

## Staleness

An agent becomes stale when the skills, tools, or architecture it references have changed without the agent being updated. Stale agents produce incorrect or inconsistent output because they follow outdated patterns.

### What can go stale

| Source of truth | What drifts in the agent |
|-----------------|--------------------------|
| Skill renamed or removed | Agent references a nonexistent skill |
| Skill's scope changed | Agent's summary of the skill is inaccurate |
| Directory structure changed | Agent's working directory or file paths are wrong |
| Tool list changed | Agent's `tools` frontmatter doesn't match available capabilities |
| New skill created for agent's domain | Agent doesn't reference the skill and misses its standards |
| Agent responsibilities shifted | Agent's role overlaps or conflicts with another agent |

### How to detect

During audit (see Audit Procedure below), check each agent against:

1. **Skill existence** — Does every referenced skill have a `SKILL.md` somewhere under `plugin/skills/` (recursive scan)?
2. **Skill summary accuracy** — Does the one-line summary in the agent match what the skill actually does?
3. **Working directory validity** — Does the documented working directory pattern match the current project structure conventions?
4. **Tool consistency** — Does the `tools` list match the agent's actual needs? (Read-only agents should not have `Write`; agents that run commands need `Bash`.)
5. **Inter-agent consistency** — Do responsibility boundaries between agents conflict or leave gaps?

---

## Drift Risk Scoring

Some agents are structurally more likely to drift than others. During audit or review, score each agent to prioritize monitoring effort. Higher scores mean more drift surfaces — not that the agent is broken today, but that it is more likely to break tomorrow.

### Risk factors

| Risk Factor | Points | Rationale |
|-------------|--------|-----------|
| Each formal skill reference (in `## Skills`) | +1 | More dependencies = more surfaces that can change |
| Each inline skill reference (not in `## Skills`) | +2 | Informal references are harder to audit and easier to miss during updates |
| Each hardcoded file path | +1 | Paths change during refactors; the agent won't know |
| Each reference to another agent's internals | +3 | Cross-agent knowledge is the most fragile coupling — the other agent doesn't know it's being depended on |
| Each duplicated concept from a skill | +3 | Duplicated content drifts silently; the skill evolves but the copy doesn't |
| Each environment assumption without documented precondition | +1 | Implicit assumptions break silently in new environments |
| References own callers or invocation context | +2 | Callers change independently; the agent doesn't control who invokes it |

### Risk tiers

| Score | Tier | Action |
|-------|------|--------|
| 0–2 | **Low** | Standard audit cadence |
| 3–5 | **Moderate** | Review when any referenced skill or directory changes |
| 6+ | **High** | Prioritize in every audit; consider simplifying the agent to reduce coupling |

### In the audit report

Include a drift risk summary table:

```markdown
## Drift Risk Scores

| Agent | Score | Tier | Top Factors |
|-------|-------|------|-------------|
| backend-dev | 4 | Moderate | 3 skill refs (+3), 1 inline ref (+2) |
| devops | 6 | High | 1 inline ref (+2), 2 hardcoded paths (+2), no skills section (+2) |
```

---

## Agent Structure

After the frontmatter, organize the agent body as follows:

```
You are [role statement].          <- First line: identity and expertise

## Skills                          <- (if applicable) Skills this agent loads
## Working Directory               <- Where this agent operates
## <Core Sections>                 <- H2 sections: responsibilities, patterns, workflows
## Rules                           <- Non-negotiable constraints (last section)
```

### Writing rules

- **Role statement first** — The "You are..." line immediately after frontmatter sets the agent's identity.
- **Headings** — H2 for major sections, H3 for subsections. No deeper.
- **Code blocks** — Always specify language (`typescript`, `bash`, `yaml`, `markdown`).
- **Tables** — Use for comparisons, quick-reference, and categorizations.
- **Good/Bad examples** — When showing anti-patterns, label clearly with `BAD` / `GOOD` headings.
- **Rules section last** — The `## Rules` section is always the final section, containing non-negotiable constraints as a bulleted list.
- **No conversational language** — Write in directive form ("Follow X", "Use Y"), not conversational form ("You should consider X" or "You might want to Y").

---

## Checklist

Use when creating or reviewing a plugin agent:

- [ ] Frontmatter has exactly `name`, `description`, `tools`, `model`, and `color`
- [ ] `name` is kebab-case and matches the filename (without `.md`)
- [ ] `description` is 1-2 sentences: what the agent does + expertise. No references to callers or invocation context.
- [ ] `tools` matches the agent's actual needs (read-only agents exclude `Write`)
- [ ] `model` is appropriate: `sonnet` for implementation, `opus` for review/advisory
- [ ] `color` is a valid hex code, unique across agents
- [ ] First line after frontmatter is a "You are..." role statement
- [ ] Skills section lists only skills that exist in `plugin/skills/`
- [ ] Each skill reference includes a brief summary of what the agent uses it for
- [ ] No duplicated content from referenced skills
- [ ] No cross-agent file references
- [ ] No user interaction patterns (no asking, confirming, or waiting for user input)
- [ ] Referenced skills are also free of user interaction patterns (transitive check)
- [ ] Output is structured for the caller, not conversational for a human
- [ ] Working directory is explicitly documented (with multi-instance fallback if applicable)
- [ ] No undocumented environment assumptions
- [ ] Domain terms introduced by this agent are defined on first use
- [ ] All examples are self-contained
- [ ] Code blocks specify language
- [ ] `## Rules` is the last section

---

## Audit Procedure

Run this audit against all plugin agents to produce a fresh violations report. Find every `.md` file in `plugin/agents/`, then check each agent against the categories below.

### What to check per agent

For each agent file, check every item in the **Checklist** section above. Additionally:

1. **Skill existence** — For every skill referenced in the agent's `## Skills` section, verify that a matching `SKILL.md` exists under `plugin/skills/` by globbing recursively (`plugin/skills/**/SKILL.md`) and matching on the skill's `name` frontmatter field. Skills may be nested in subdirectories (e.g. `plugin/skills/components/backend/backend-standards/SKILL.md`).
2. **User interaction scan (direct)** — Search agent content for phrases indicating user interaction: "ask the user", "confirm with", "user preference", "prompt the user", "wait for", "the user should", "check with the user". Flag any matches.
3. **User interaction scan (transitive)** — For every skill referenced by the agent, read the skill's `SKILL.md` and search for the same user interaction phrases. A skill that assumes multi-turn conversation, presents options to a user, or waits for user responses is incompatible with agent context. Flag the skill name, the quoted phrase, and which agent loads it.
4. **Inter-agent overlap** — Check that no two agents claim ownership of the same directory, responsibility, or domain without explicit delegation.
5. **Staleness indicators** — Check all items in the Staleness section above.

### Report format

Produce the report with these sections:

```markdown
# Agents Standards Audit — YYYY-MM-DD_HH-MM

## Summary

| Category | Passing | Failing | Total |
|----------|---------|---------|-------|
| Frontmatter | X | Y | Z |
| Self-containment | ... | ... | ... |
| User interaction | ... | ... | ... |
| Skill references | ... | ... | ... |
| Staleness | ... | ... | ... |
| Inter-agent consistency | ... | ... | ... |

## Staleness Report
<!-- Per-agent skill reference validation -->

## User Interaction Violations (Direct)
<!-- Quoted phrases in agent files that imply user interaction -->

## User Interaction Violations (Transitive)
<!-- Quoted phrases in referenced skills that imply user interaction.
     Format: Agent → Skill → quoted phrase -->

## Per-Agent Violations
<!-- One subsection per failing agent, with quoted violations -->

## Recommended Fix Priority
<!-- Ordered by impact and effort -->
```

### Report output location

**Never write audit reports inside `plugin/agents/`.** The plugin folder is for shipped agent files only — no reports, scratch files, or artifacts.

After presenting the report, **ask the user** whether to create a task to track the fixes or whether the report is temporary (e.g., for quick review or one-off investigation). If the user wants a task:

Create a task via `/tasks add "Fix agents standards violations from audit report"`. The task's purpose is to **fix the violations** — the audit report is supporting evidence, not the deliverable. Save the report with a timestamped filename inside the task folder:

```
.tasks/0-inbox/<N>/
├── task.md                                    # Task to fix violations, with key findings summary
└── agents-audit-YYYY-MM-DD_HH-MM.md           # Full audit report (e.g., agents-audit-2026-02-07_14-30.md)
```

If the user declines, present the report inline without creating any files or tasks.

### How to run

Ask: "Audit all plugin agents against the agents-standards skill and produce a violations report."

Run the audit directly (do not delegate to subagents):

1. Glob for all `plugin/agents/*.md` files
2. Read each file completely
3. Check every item from the Checklist above, plus the additional audit-specific checks
4. For skill existence checks, glob `plugin/skills/**/SKILL.md` (recursive) and match each referenced skill name against the `name` frontmatter field of found skills
5. Present the report to the user
6. Ask the user whether to create a task (via `/tasks add "Fix agents standards violations from audit report"`) or keep the report temporary

## Input / Output

This skill defines no input parameters or structured output.
