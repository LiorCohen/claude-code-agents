# Spec-Driven Development (SDD)

*Structure for AI-assisted development*

AI coding assistants are powerful but chaotic. You prompt, you get code, but then what? No documentation of decisions, no way to verify the code matches what you needed, and a codebase that's impossible to explain to teammates.

SDD brings structure to AI-assisted development. Every change starts with a spec, gets broken into a plan, and ends with verified implementation. Specialized agents handle each concern instead of one AI doing everything poorly.

## Installation

```bash
claude plugin marketplace add https://github.com/LiorCohen/sdd
claude plugin install sdd
```

## Quick Start

```
/sdd-init --name my-app          # Initialize a new project
/sdd-new-change --type feature --name user-auth   # Create a spec and plan
/sdd-implement-change changes/.../user-auth # Execute the plan
/sdd-verify-change changes/.../user-auth    # Verify it matches the spec
```

**[Get started with the tutorial →](./docs/getting-started.md)**

---

## How It Works

### Specs Are the Source of Truth

Every change lives in a markdown specification before it lives in code:

```
changes/2026/01/15/user-auth/
├── SPEC.md    # What you're building (acceptance criteria)
└── PLAN.md    # How to build it (phased implementation)
```

Specs include frontmatter metadata, acceptance criteria in Given/When/Then format, and references to domain concepts.

### Four Change Types

| Type | Purpose | Structure |
|------|---------|-----------|
| **feature** | New functionality | 6 phases |
| **bugfix** | Fix existing behavior | 4 phases |
| **refactor** | Restructure without changing behavior | 4 phases |
| **epic** | Multiple features grouped under one goal | Child changes in `changes/` subdirectory |

### Specialized Agents

Instead of one general-purpose AI, SDD uses 10 specialized agents:

| Agent | Model | Purpose |
|-------|-------|---------|
| spec-writer | opus | Create and maintain specifications |
| planner | opus | Break specs into implementation phases |
| api-designer | sonnet | Design OpenAPI contracts |
| backend-dev | sonnet | Node.js backend (CMDO architecture) |
| frontend-dev | sonnet | React components (MVVM architecture) |
| db-advisor | opus | Database performance review |
| devops | sonnet | Kubernetes, Helm, Testkube |
| ci-dev | sonnet | CI/CD pipelines |
| tester | sonnet | Test automation |
| reviewer | opus | Code review and spec compliance |

### Commands

| Command | Purpose |
|---------|---------|
| `/sdd-init --name [name] [--spec path]` | Initialize new project |
| `/sdd-new-change --type [type] --name [name]` | Create change spec and plan |
| `/sdd-implement-change [change-dir]` | Execute implementation plan |
| `/sdd-verify-change [change-dir]` | Verify implementation matches spec |

---

## Reducing Permission Prompts

SDD commands create many files. To reduce permission prompts, add this to your `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Write(changes/**)",
      "Write(specs/**)",
      "Write(components/**)",
      "Write(config/**)",
      "Edit(changes/**)",
      "Edit(specs/**)",
      "Edit(components/**)",
      "Bash(git *)",
      "Bash(npm *)"
    ],
    "deny": [
      "Write(.env*)",
      "Edit(.env*)"
    ]
  }
}
```

See **[Permissions Setup](./plugin/hooks/PERMISSIONS.md)** for full configuration options.

---

## Documentation

- **[Getting Started](./docs/getting-started.md)** - First project tutorial
- **[Workflows](./docs/workflows.md)** - Feature, bugfix, and refactor workflows
- **[Commands](./docs/commands.md)** - Full command reference
- **[Agents](./docs/agents.md)** - What each agent does
- **[Components](./docs/components.md)** - Component types reference
- **[Permissions Setup](./plugin/hooks/PERMISSIONS.md)** - Reduce permission prompts

---

## Project Structure

When you run `/sdd-init`, you get:

```
your-project/
├── changes/                  # Change specifications (YYYY/MM/DD/<name>/)
├── specs/
│   ├── INDEX.md              # Registry of all specifications
│   ├── SNAPSHOT.md           # Current product state
│   ├── domain/
│   │   ├── glossary.md       # Domain terminology
│   │   └── definitions/      # Domain definitions
│   └── architecture/         # Architecture decisions
├── components/
│   ├── contract/             # OpenAPI specs (workspace package)
│   ├── server/               # Node.js backend
│   ├── webapp/               # React frontend
│   ├── database/             # PostgreSQL migrations
│   ├── helm/                 # Kubernetes charts
│   └── testing/              # Testkube definitions
├── config/                   # YAML configuration
└── .github/workflows/        # CI/CD pipelines
```

---

## Architectural Patterns

- **CMDO Backend** - Controller Model DAL Operator with strict layer separation
- **MVVM Frontend** - Model-View-ViewModel with TanStack ecosystem
- **Contract-First API** - OpenAPI specs generate TypeScript types
- **Immutability Enforced** - `readonly` everywhere, no mutations
- **OpenTelemetry** - Structured logging, metrics, and tracing

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code)
- [Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins)

## License

MIT
