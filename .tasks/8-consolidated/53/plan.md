---
task_id: 53
title: Missing helm-standards skill
status: new
created: 2026-01-31
---

# Plan: helm-standards Skill (Task 53)

## Problem Summary

Create a marketplace-level `helm-standards` skill that provides comprehensive Helm chart writing guidance. The skill emphasizes **readability first** - prioritizing simple, understandable templates over clever Go template wizardry.

**Note:** A plugin-level `helm-standards` skill already exists at `plugin/skills/helm-standards/SKILL.md` with SDD-specific patterns. This marketplace skill provides general, portable Helm guidance.

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/skills/helm-standards/SKILL.md` | Create new skill file |
| `.tasks/issues/inbox/53.md` | Update with plan path, move to appropriate priority |
| `.tasks/INDEX.md` | Update index entry |

## Implementation

### Phase 1: Create the Skill File

Create `.claude/skills/helm-standards/SKILL.md` with the following structure:

```markdown
---
name: helm-standards
description: Helm chart writing standards emphasizing readability and simplicity
---

# Helm Standards Skill

[Content organized as follows]
```

**Skill Sections:**

1. **Philosophy: Readability First**
   - Simple templates over clever solutions
   - Minimize special functions and Go template wizardry
   - Charts should be understandable at a glance
   - When in doubt, be explicit

2. **Chart Structure & Naming**
   - Standard directory layout table (including mandatory values.schema.json)
   - File naming conventions
   - Chart.yaml required fields
   - Version management

3. **Values File Organization**
   - `values.yaml` - base defaults (development-safe)
   - `values-{env}.yaml` - environment overrides
   - Required top-level keys
   - Comment conventions for documentation
   - ✅ GOOD / ❌ BAD examples

4. **values.schema.json (Mandatory)**
   - Always required - validates values.yaml at install/upgrade time
   - JSON Schema structure and conventions
   - Required vs optional properties
   - Type definitions for all values
   - Description fields for documentation
   - Default values in schema
   - Example schema snippets
   - ✅ GOOD / ❌ BAD examples

5. **Template Best Practices**
   - File organization (deployment, service, configmap)
   - Formatting and indentation rules
   - Using `toYaml` and `nindent` correctly
   - Avoiding nested conditionals
   - ✅ GOOD / ❌ BAD template examples

6. **Security Considerations**
   - RBAC patterns (when to use)
   - securityContext defaults
   - Secret handling (reference by name, not embed values)
   - ConfigMap vs Secret decision table
   - ReadOnly mounts

7. **Resource Management**
   - Limits vs requests explained
   - Development vs production sizing
   - Resource specification table template

8. **Health Checks & Probes**
   - Liveness vs readiness explained
   - Probe configuration examples
   - Common paths (/health/live, /health/ready)
   - Timing parameters guidance

9. **ConfigMap & Secret Handling**
   - Naming conventions
   - File mounting patterns
   - Config checksum annotations for auto-restart
   - Environment variable injection

10. **Summary Checklist**
    - Pre-deployment verification items
    - Security checklist
    - Documentation requirements

11. **Related Skills**
    - Link to `typescript-standards` for backend code
    - Reference plugin-level `helm-scaffolding` for SDD projects

### Phase 2: Update Task Metadata

1. Update task file frontmatter with `plan` path
2. Move task to appropriate priority (suggest: medium)
3. Update INDEX.md

## Content Guidelines

Follow patterns from existing standards skills:

- **Tables** for quick reference (like typescript-standards)
- **✅ GOOD / ❌ BAD** code examples throughout
- **Why explanations** - not just rules, but reasoning
- **Concise** - developers should find answers quickly
- **Actionable** - every section provides clear guidance

## Example Content Snippet

```markdown
## Template Best Practices

### Avoid Nested Conditionals

✅ GOOD - Flat, readable structure:
```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
# ...
{{- end }}
```

❌ BAD - Nested complexity:
```yaml
{{- if .Values.ingress.enabled }}
{{- if .Values.ingress.tls }}
{{- if .Values.ingress.tls.enabled }}
# Three levels deep - hard to follow
{{- end }}
{{- end }}
{{- end }}
```

**Why:** Each nesting level increases cognitive load. Flatten by combining conditions or restructuring values.
```

## Verification

1. Skill file exists at `.claude/skills/helm-standards/SKILL.md`
2. YAML frontmatter includes `name` and `description`
3. Content covers all 9 topic areas from task description (including values.schema.json)
4. values.schema.json section emphasizes it is **mandatory**
5. Uses consistent formatting with other standards skills
6. Includes summary checklist
7. Task file updated with plan reference
8. INDEX.md reflects current state
