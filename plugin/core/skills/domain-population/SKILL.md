---
name: domain-population
description: Populate domain specs (glossary, entity definitions, use-cases) from SPEC.md content during implementation.
user-invocable: false
---

# Domain Population Skill

Populates the domain specification files with content extracted from change context.

## Purpose

During implementation, this skill:
- Updates `specs/domain/glossary.md` with discovered entities
- Creates entity definition stubs in `specs/domain/definitions/`
- Creates use-case stubs in `specs/domain/use-cases/`
- Updates `specs/SNAPSHOT.md` with product overview

## When to Use

- During `/sdd I want to start implementing` to execute domain updates from SPEC.md
- When importing domain concepts from external specs during implementation

## Usage

This skill uses the system CLI for deterministic file creation:

```bash
cat << 'EOF' | <plugin-root>/system/system-run.sh scaffolding domain --config -
{
    "target_dir": "/path/to/project",
    "primary_domain": "Task Management",
    "product_description": "Task management for engineering teams",
    "user_personas": [
        {"type": "Project Manager", "actions": "create projects, assign tasks"},
        {"type": "Team Member", "actions": "update progress"}
    ],
    "core_workflows": ["Create projects", "Assign tasks", "Update progress"],
    "domain_entities": ["Team", "Project", "Task", "User"]
}
EOF
```

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts target directory, domain name, product description, and optional personas, workflows, and entities.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns success status and list of updated domain spec files.

## File Templates

### Glossary Entry Format

For each entity, add a row to `specs/domain/glossary.md`:

```markdown
| <Entity> | <Brief definition> | <Related terms> |
```

### Entity Definition Stub

Creates `specs/domain/definitions/<entity-slug>.md`:

```markdown
---
name: <Entity>
domain: <primary_domain>
status: draft
---

# <Entity>

## Description

<Placeholder - what role this entity plays based on discovery context>

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| (to be defined) | | |

## Relationships

- (to be defined)

## States (if applicable)

(to be defined)
```

### Use-Case Stub

Creates `specs/domain/use-cases/<workflow-slug>.md`:

```markdown
---
name: <Workflow>
domain: <primary_domain>
actors: <relevant user types>
status: draft
---

# <Workflow>

## Summary

<Placeholder - what this capability allows users to do>

## Actors

- <User type from SPEC.md>

## Preconditions

(to be defined)

## Main Flow

1. (to be defined)

## Postconditions

(to be defined)
```

### SNAPSHOT.md Product Overview

Adds to `specs/SNAPSHOT.md`:

```markdown
## Product Overview

**Problem:** <product_description>

**Target Users:**
- <User type 1>: <what they do>
- <User type 2>: <what they do>

**Core Capabilities:**
- <Capability 1>
- <Capability 2>

**Key Entities:** <Entity1>, <Entity2>, <Entity3>
```

## Example

### Input

```json
{
    "target_dir": "/Users/dev/my-task-tracker",
    "primary_domain": "Task Management",
    "product_description": "Task management for engineering teams",
    "user_personas": [
        {"type": "Project Manager", "actions": "create projects, assign tasks"},
        {"type": "Team Member", "actions": "update progress, view assignments"}
    ],
    "core_workflows": [
        "Create projects",
        "Assign tasks",
        "Update task progress"
    ],
    "domain_entities": ["Team", "Project", "Task", "User"]
}
```

### Output

```text
Populating domain specs for: Task Management

Creating entity definitions...
  Created: specs/domain/definitions/team.md
  Created: specs/domain/definitions/project.md
  Created: specs/domain/definitions/task.md
  Created: specs/domain/definitions/user.md

Creating use-case stubs...
  Created: specs/domain/use-cases/create-projects.md
  Created: specs/domain/use-cases/assign-tasks.md
  Created: specs/domain/use-cases/update-task-progress.md

Updating glossary...
  Updated: specs/domain/glossary.md

Updating SNAPSHOT...
  Updated: specs/SNAPSHOT.md

============================================================
Domain population complete!
============================================================
Created 4 entity definitions
Created 3 use-case stubs
Updated glossary with 4 entries
Updated SNAPSHOT with product overview
```

## Notes

- Uses system CLI for deterministic file creation
- Preserves existing content in glossary and SNAPSHOT (appends/merges)
- Creates slugified filenames (lowercase, hyphens)
- All files are stubs meant to be filled in later
