---
name: spec-index
description: Manage spec registry and generate snapshots.
user-invocable: false
---


# Spec Index Skill

## Commands

The spec commands are available via the system CLI:

### Generate Index

Generates `changes/INDEX.md` from all change spec files.

```bash
<plugin-root>/system/system-run.sh spec index --changes-dir changes/
```

### Generate Snapshot

Generates `specs/SNAPSHOT.md` compiling all active specs.

```bash
<plugin-root>/system/system-run.sh spec snapshot --specs-dir specs/
```

### Validate Spec

Validates spec frontmatter and format.

```bash
# Validate single spec
<plugin-root>/system/system-run.sh spec validate changes/2026/01/21/my-change/SPEC.md

# Validate all specs
<plugin-root>/system/system-run.sh spec validate --all --specs-dir specs/
```

---

## INDEX.md Format

The index is a registry of all change specs, located at `changes/INDEX.md`:

```markdown
# Change Index

Last updated: YYYY-MM-DD

Total: X specs (Active: Y, Deprecated: Z, Archived: W)

## Active Changes

| Change | Type | Spec | Domain | Issue | Since |
|--------|------|------|--------|-------|-------|
| User Authentication | feature | [SPEC](2025/01/01/user-auth/SPEC.md) | Identity | [PROJ-123](url) | 2025-01-01 |

## Deprecated

| Change | Type | Spec | Domain | Issue | Deprecated |
|--------|------|------|--------|-------|------------|
| Old Auth | feature | [SPEC](2025/01/15/old-auth/SPEC.md) | Identity | [PROJ-100](url) | 2025-02-01 |

## Archived

*None*
```

Note: Links are relative within the `changes/` directory (e.g., `YYYY/MM/DD/...`).

---

## SNAPSHOT.md Format

The snapshot is a compiled view of current product state:

```markdown
# Product Snapshot

Generated: YYYY-MM-DD

This document represents the current active state of the product by compiling all active specifications.

## By Domain

### Identity

#### User Authentication
**Spec:** [changes/2025/01/01/user-auth/SPEC.md](changes/2025/01/01/user-auth/SPEC.md)
**Issue:** [PROJ-123](url)

[Summary of change capabilities]

---

### Billing

...
```

---

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts index command and directory paths for changes and specs.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns success status and any validation errors or warnings.

## Workflow

### After Creating a Spec

1. Merge spec to main
2. Run `<plugin-root>/system/system-run.sh spec index` to update INDEX.md
3. Run `<plugin-root>/system/system-run.sh spec snapshot` to update SNAPSHOT.md
4. Commit the updated index and snapshot

### Before Release

1. Run `<plugin-root>/system/system-run.sh spec validate --all` to ensure all specs are valid
2. Review SNAPSHOT.md for completeness
3. Verify all active specs have corresponding implementations

---
