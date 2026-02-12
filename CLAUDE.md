# CLAUDE.md

<!-- This file documents rules that Claude gets wrong. If Claude keeps making a mistake, add a rule here. Don't write a manual — only add what's needed to correct observed behavior. -->

## Task Management Rules (MANDATORY)

**You MUST use the `tasks` skill (`/tasks`) for all non-trivial work:**

1. **Before ANY implementation work:**
   - Use `/tasks add <description>` to create a task first
   - Do NOT start coding until a task exists

2. **Before planning:**
   - Use `/tasks plan <id>` to move task to planning status
   - Create a plan.md in the task folder

3. **Before implementing:**
   - Use `/tasks implement <id>` to move task to implementing status
   - This creates a feature branch automatically

4. **After completing work:**
   - Use `/tasks complete <id>` or `/tasks review <id>`

**NEVER:**
- Jump straight into code changes without a task
- Make implementation changes on main branch
- Skip the planning phase for non-trivial work
- Advance a task to the next status without explicit user approval (e.g., don't auto-plan after adding, don't auto-implement after planning)

**Exceptions (no task needed):**
- Typo fixes
- Task management operations themselves
- Answering questions / research only

## Output Rules

- **NEVER truncate or summarize** tool/script output. Output it verbatim and in full.
- Do NOT add your own summary, grouping, or "N more tasks" after script output.

## Git Rules

- **NEVER push to remote** without explicit user approval
- **ALWAYS use the `commit` skill** for commits (see Skills below)

## Build Rules

- **Always use root `package.json` scripts** — never `cd` into workspaces or run tools directly:
  - `npm test` — run tests
  - `npm run build:plugin` — build plugin system (`tsc + tsc-alias`)
  - `npm run typecheck:plugin` — type-check without emitting
- **NEVER run `npx tsc` directly** for `plugin/system/`. The build requires `tsc-alias` to resolve `@/` path aliases. Running `tsc` alone produces broken `dist/` files.

## Tools

- **TypeScript LSP** - Configured in `.claude/cclsp.json`
- **Context7** - Enabled for up-to-date library documentation

## Skills

- **commit** - Use for all commits (handles version bump + changelog)
- **tasks** - Manage tasks and plans using `.tasks/` directory
- **critic** - Self-review at every task lifecycle phase (`/critic`)
- **manifest-validation** - Validate plugin/marketplace manifests before commits
- **plugin-testing-standards** - Follow when writing or modifying tests
- **typescript-standards** - Follow when writing TypeScript code
- **skills-standards** - Follow when creating or reviewing skills
- **agents-standards** - Follow when creating or reviewing agents
- **commands-standards** - Follow when creating or reviewing commands
- **system-cli-standards** - Follow when invoking or referencing the system CLI from prompt files

## Temporary Files

- **Use `.temp/` at the repo root** for any temporary files that skills or agents need the user to read (e.g., dry-run outputs, previews, reports)
- `.temp/` is gitignored — never commit its contents
- Do NOT write temporary files to `/tmp`, `prompts/`, or other locations

## Plugin Boundary Rule

Files inside `plugin/` have **no runtime access** to anything outside `plugin/`. Never suggest a reference from within `plugin/` to `.claude/`, `.tasks/`, or any root-level file. The plugin is a self-contained unit — its skills, commands, agents, and templates can only reference things inside the plugin directory.

## Repository Structure

```
sdd/
├── .claude/
│   ├── cclsp.json                    # TypeScript LSP config
│   ├── settings.json                 # Context7 enabled
│   └── skills/
│       ├── commit/                   # Commit workflow with version/changelog
│       ├── critic/                   # Self-review at every task lifecycle phase
│       ├── tasks/                    # Task management skill
│       ├── manifest-validation/      # Validate plugin manifests
│       ├── plugin-testing-standards/ # Testing methodology for plugins
│       ├── typescript-standards/     # TypeScript coding standards
│       ├── skills-standards/        # Standards for authoring skills
│       ├── agents-standards/       # Standards for authoring agents
│       ├── commands-standards/     # Standards for authoring commands
│       └── system-cli-standards/  # Standards for CLI invocation from prompts
├── .claude-plugin/
│   └── marketplace.json              # Marketplace manifest
├── .critic/                              # Learned critic feedback (topic-organized, user-approved)
├── .temp/                               # Temp files for skills/agents (gitignored)
├── .tasks/                              # Task data
│   ├── INDEX.md                         # Task index (links to issues/)
│   ├── issues/                          # Individual task files by status
│   └── plans/                           # Implementation plans
├── plugin/                              # SDD plugin
├── tests/                               # Plugin tests
├── README.md
├── CLAUDE.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```
