# SDD Plugin Changelog

From a 36-file scaffolding tool to a full spec-driven development platform — in five weeks. The humans were helpful, but I did all the work (Claude 😎).

---

## v6 — One Command to Rule Them All
*Feb 5 – present*

Three separate commands (`/sdd-new-change`, `/sdd-implement-change`, `/sdd-verify-change`) collapsed into a single **`/sdd-change`** with subcommands. But the real shift was deeper: all workflow state now lives in `.sdd/workflows/`, meaning **any new session can pick up exactly where you left off** — no conversation history needed.

- **Two-stage approval gates** — spec review, then plan review, before a single line of implementation runs
- **9-step spec solicitation** — guided requirements gathering that captures context, user stories, edge cases, and test strategy
- **35 skills audited** — every skill brought into compliance with colocated JSON schemas
- **Structured logging** — pino-based system logs to `.sdd/system-logs/` with session tracking
- **Standards wired into agents** — skills are now preloaded into agent context at startup, not just referenced by name

---

## v5 — Settings Drive Everything
*Jan 28 – Feb 5*

The question shifted from "what files should I create?" to **"what does your project need?"** Component settings in `sdd-settings.yaml` now determine what gets scaffolded, how Helm charts are generated, and how config layers are structured — automatically.

- **Unified CLI** — `sdd-system` consolidated all TypeScript into one entry point with namespaced commands (`scaffolding`, `spec`, `database`, `config`, `env`)
- **Local k8s environments** — `sdd-run env create`, `deploy`, `forward` — spin up Kind/Minikube clusters with observability baked in
- **Minimal init** — only config scaffolded at project creation; everything else on demand via `/sdd-change`
- **Path aliases** — `@/` imports replaced deep relative paths across 57 files
- **105 settings tests** — types, defaults, validation, sync, and schema coverage

---

## v4 — The Plugin Learns to Listen
*Jan 24 – Jan 28*

Before v4, the plugin asked you to pick components from a menu. Now it **asks what you're building** — extracts users, workflows, entities, and constraints — then recommends components with specific justification.

- **Product discovery phase** — adaptive questioning that never asks more than 4-5 questions
- **Multi-instance components** — `server:api`, `server:worker`, `webapp:admin` — all component types support named instances
- **Contracts as workspace packages** — generated types published via npm workspaces, consumed with `import type`
- **Chunked spec processing** — external specs of any size handled via outline extraction + per-section analysis
- **Epics** — a fourth change type for large, multi-phase work spanning multiple PRs

---

## v3 — Architecture Gets a Name
*Jan 21 – Jan 24*

Backend architecture solidified into **CMDO** (Controller-Model-DAL-Operator) — a clean split between infrastructure I/O and domain logic. The frontend settled on **MVVM** with TanStack Router, Query, Table, and Form. And "features" became "changes" — typed as `feature`, `bugfix`, or `refactor`.

- **All Python eliminated** — every script migrated to TypeScript
- **PostgreSQL first-class** — deployment, schema management, seeds, permissions, performance tuning
- **Three testing skills** — unit, integration, and e2e each got dedicated patterns and guidance
- **Colocated templates** — scaffolding skills now carry their own templates instead of referencing a shared directory

---

## v2 — From Minutes to Seconds
*Jan 19 – Jan 21*

Project scaffolding dropped from ~5 minutes of file-by-file creation to **~5 seconds** via a Python script generating 30 directories and 54 files. External specs could now be **decomposed into multiple features** with dependency ordering — merge, split, or rename before accepting.

---

## v1 — The Foundation
*Jan 7 – Jan 18*

The initial release shipped with **10 agents**, **4 skills**, and **5 commands** — a complete contract-first, spec-driven workflow. Strict TypeScript (immutable, no classes, no default exports), a 5-layer backend architecture, OpenTelemetry observability, and Kubernetes-native deployment. Domain documentation was mandatory *before* any code could be written.

---

## Version Files

| File | Version Range | Description |
|------|---------------|-------------|
| [v6.md](v6.md) | 6.0.0 – current | Unified sdd-change command, zero session context |
| [v5.md](v5.md) | 5.0.0 – 5.13.0 | Settings-driven scaffolding, unified CLI |
| [v4.md](v4.md) | 4.0.0 – 4.9.0 | Product discovery, multi-instance components |
| [v3.md](v3.md) | 3.0.0 – 3.10.0 | CMDO architecture, change abstraction |
| [v2.md](v2.md) | 2.0.0 – 2.3.0 | Scaffolding speed, external spec decomposition |
| [v1.md](v1.md) | 1.0.0 – 1.10.29 | Initial release |

## Adding New Entries

When committing changes, update the appropriate version file (e.g., `changelog/v5.md` for version 5.x.x).

When a **new major version** is created, add a new summary paragraph to the top of this README and a row to the version table. The summary should capture the theme and most important capabilities of that major version for someone evaluating the plugin.

See the [commit skill](../.claude/skills/commit/SKILL.md) for detailed guidance.
