---
name: sdd-generate-snapshot
description: Regenerate the product snapshot from active specs.
---

# /sdd-generate-snapshot

Regenerate product snapshot.

## Usage

```
/project:generate-snapshot
```

## Flow

### 1. Find Active Specs

- Scan `specs/features/` for all SPEC.md files
- Filter for `status: active`
- Group by domain

### 2. Generate INDEX.md

Update the spec registry with:
- Total count of specs
- Breakdown by status (active, deprecated, archived)
- Table of all specs with:
  - Feature name
  - Path to spec
  - Domain
  - Issue reference
  - Creation date

### 3. Generate SNAPSHOT.md

Compile current product state:
- Organize by domain
- For each active feature:
  - Feature name
  - Link to spec
  - Issue reference
  - Summary of capabilities
  - Key endpoints (from API Contract section)
- Generate table of contents

### 4. Report

```
✓ Generated specs/INDEX.md
  - Total: 15 specs
  - Active: 12
  - Deprecated: 2
  - Archived: 1

✓ Generated specs/SNAPSHOT.md
  - Domains: Identity, Billing, Core
  - Features: 12

Next steps:
1. Review specs/SNAPSHOT.md
2. Commit changes: git add specs/ && git commit -m "Update snapshot"
```

## When to Use

- After merging a new spec
- After deprecating/archiving a spec
- Before a release (to document current state)
- Periodically to keep documentation fresh

## Implementation

Uses `scripts/generate-index.py` and `scripts/generate-snapshot.py`

## Example Output

### INDEX.md

```markdown
# Spec Index

Last updated: 2025-01-07

Total: 15 specs (Active: 12, Deprecated: 2, Archived: 1)

## Active

| Feature | Spec | Domain | Issue | Since |
|---------|------|--------|-------|-------|
| User Authentication | [SPEC](features/user-auth/SPEC.md) | Identity | [PROJ-123](#) | 2025-01-01 |
| Password Reset | [SPEC](features/password-reset/SPEC.md) | Identity | [PROJ-124](#) | 2025-01-02 |
...
```

### SNAPSHOT.md

```markdown
# Product Snapshot

Generated: 2025-01-07

This document represents the current active state of the product.

## Table of Contents

- [Identity](#identity)
- [Billing](#billing)
- [Core](#core)

## By Domain

### Identity

#### User Authentication
**Spec:** [features/user-auth/SPEC.md](features/user-auth/SPEC.md)
**Issue:** [PROJ-123](#)

Provides secure user authentication with email/password.

**Capabilities:**
- User registration with email verification
- Login with session management
- Password requirements enforcement
- Account lockout after failed attempts

**Endpoints:**
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/session

---

...
```
