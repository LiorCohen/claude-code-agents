---
name: techpacks
description: Single gateway for all core↔tech-pack interactions. Reads manifests, resolves paths, loads skills/agents, routes commands.
version: 1.0.0
---

# Techpacks Gateway

Single entry point for all core↔tech-pack interactions. No other core file reads `techpack.yaml` directly, resolves tech pack paths, or loads tech pack skills on its own.

## Operations

Eight typed operations — see [resources/operations.md](resources/operations.md) for detailed implementations.

| Operation | Purpose | Returns |
|-----------|---------|---------|
| `readManifest(namespace)` | Parse and return validated `techpack.yaml` | Typed manifest object |
| `resolvePath(namespace, path)` | Resolve a relative path from manifest to absolute path | Absolute file path |
| `loadSkill(namespace, skillPath)` | Load a tech pack skill into context | Skill content |
| `loadAgent(namespace, agentRef)` | Read agent file, parse frontmatter, resolve skills, spawn as Task subagent | Task subagent with composed prompt |
| `routeCommand(namespace, command, args)` | Invoke the command router skill with structured context | Command result |
| `routeSkills(namespace, phase, componentType?, agent?)` | Invoke the skills router to get relevant skills for a phase | Skills loaded into context |
| `listComponents(namespace)` | Read component types from manifest | Component type list with metadata |
| `dependencyOrder(namespace)` | Build topological order from dependency graph | Ordered component type list |

## Invocation Pattern

Core skills invoke techpacks operations using this pattern:

```
Invoke techpacks.readManifest for the active tech pack namespace.
Read the `components` section to find the agent assigned to a given component type.
```

```
Invoke techpacks.routeSkills with:
  namespace: <active-namespace>
  phase: plan-generation
  component_type: <type>
```

```
Invoke techpacks.loadAgent with:
  namespace: <active-namespace>
  agentRef: { name: "my-agent", path: "agents/my-agent.md" }
  skills: ["coding-standards", "testing-standards"]
```

## Active Tech Packs

Read `sdd/sdd-settings.yaml` (or `.sdd/sdd-settings.yaml`) to find active tech packs:

```yaml
techpacks:
  <namespace>:
    name: <tech-pack-name>
    namespace: <namespace>
    version: "1.0.0"
    mode: internal           # or external, git
    path: <tech-pack-directory>
```

For internal tech packs, resolve `path` relative to the plugin root directory.
For git-mode tech packs, resolve `install_path` relative to the project root.

```yaml
# Git-mode example:
techpacks:
  my-pack:
    name: my-pack
    namespace: my-pack
    version: "1.0.0"
    mode: git
    repo: https://github.com/org/my-pack.git
    ref: v1.0.0
    install_path: sdd/.techpacks/my-pack/techpack
```

## Enforcement Rules

1. **Single gateway.** All core→tech-pack interactions flow through this skill. No other core file reads `techpack.yaml` directly.
2. **No direct reads.** Core skills and system commands never read tech pack skill files or agent files directly. They always go through `techpacks`.
3. **Prompt isolation.** Agent markdown bodies and resolved skill contents NEVER appear in the main conversation context. Use `system-run.sh agent frontmatter` to extract only structured metadata. Spawn agents as Task subagents with their own context.
4. **Structured logging.** Every techpacks operation logs via `system-run.sh log write --level info --source techpacks.<operation> --message "<description>"`.
5. **Fail loudly.** If a manifest is missing, invalid, or a referenced path doesn't exist, return a clear error. Never silently fall back to hardcoded defaults.

## System CLI Commands

The techpacks gateway uses these system CLI commands:

| Command | Purpose |
|---------|---------|
| `system-run.sh tech-pack validate --path <dir>` | Validate a manifest |
| `system-run.sh tech-pack info --namespace <ns>` | Read manifest data |
| `system-run.sh tech-pack list` | List installed tech packs |
| `system-run.sh agent frontmatter --path <file>` | Extract agent metadata (prompt isolation) |
| `system-run.sh log write --level <l> --source <s> --message <m>` | Structured logging |
