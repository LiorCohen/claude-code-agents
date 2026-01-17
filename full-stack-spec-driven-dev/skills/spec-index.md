---
name: spec-index
description: Manage spec registry and generate snapshots.
---

**FIRST:** Print this banner exactly (including blank lines):

```
╔══════════════════════════════════════════════════════════════════╗
║  🔧 SKILL: spec-index                                            ║
║  📋 Manage spec registry and generate snapshots                  ║
╚══════════════════════════════════════════════════════════════════╝
```

# Spec Index Skill

## Scripts

### generate-index.py

Generates `specs/INDEX.md` from all spec files.

```bash
python scripts/generate-index.py --specs-dir specs/
```

### generate-snapshot.py

Generates `specs/SNAPSHOT.md` compiling all active specs.

```bash
python scripts/generate-snapshot.py --specs-dir specs/
```

### validate-spec.py

Validates spec frontmatter and format.

```bash
# Validate single spec
python scripts/validate-spec.py specs/features/my-feature/SPEC.md

# Validate all specs
python scripts/validate-spec.py --all --specs-dir specs/
```

---

## INDEX.md Format

The index is a registry of all specs:

```markdown
# Spec Index

Last updated: YYYY-MM-DD

Total: X specs (Active: Y, Deprecated: Z, Archived: W)

## Active

| Feature | Spec | Domain | Issue | Since |
|---------|------|--------|-------|-------|
| User Authentication | [SPEC](features/user-auth/SPEC.md) | Identity | [PROJ-123](url) | 2025-01-01 |

## Deprecated

| Feature | Spec | Domain | Issue | Deprecated |
|---------|------|--------|-------|------------|
| Old Auth | [SPEC](features/old-auth/SPEC.md) | Identity | [PROJ-100](url) | 2025-02-01 |

## Archived

*None*
```

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
**Spec:** [features/user-auth/SPEC.md](features/user-auth/SPEC.md)
**Issue:** [PROJ-123](url)

[Summary of feature capabilities]

---

### Billing

...
```

---

## Workflow

### After Creating a Spec

1. Merge spec to main
2. Run `generate-index.py` to update INDEX.md
3. Run `generate-snapshot.py` to update SNAPSHOT.md
4. Commit the updated index and snapshot

### Before Release

1. Run `validate-spec.py --all` to ensure all specs are valid
2. Review SNAPSHOT.md for completeness
3. Verify all active specs have corresponding implementations

---

## Automation

These scripts can be integrated into CI:

```yaml
# .github/workflows/validate-specs.yaml
name: Validate Specs

on:
  pull_request:
    paths:
      - 'specs/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Validate all specs
        run: python scripts/validate-spec.py --all --specs-dir specs/

      - name: Check index is up-to-date
        run: |
          python scripts/generate-index.py --specs-dir specs/
          git diff --exit-code specs/INDEX.md
```
