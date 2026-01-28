---
name: external-spec-integration
description: Process external specifications into change specs with decomposition and user adjustment.
---

# External Spec Integration Skill

Processes external specification files into the SDD change structure, with optional multi-change decomposition.

## Purpose

When a user provides an external specification via `--spec`:
- Copy the external spec to the archive (`specs/external/`)
- Analyze the spec for potential decomposition into multiple changes
- Present decomposition options to user for adjustment
- Create change specifications using the `change-creation` skill
- Update shared files (INDEX.md, glossary)

## When to Use

- During `/sdd-init --spec <path>` when external spec is provided
- For standalone spec import: `/sdd-import-spec <path>`

## Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `spec_path` | Yes | Absolute path to the external specification file |
| `spec_outline` | Yes | Pre-extracted outline from Phase 0 (sections with line ranges) |
| `target_dir` | Yes | Absolute path to the project directory |
| `primary_domain` | Yes | Primary domain for the project |

## Output

```yaml
success: true
external_spec_archived: "specs/external/original-spec.md"
changes_created:
  - name: "user-authentication"
    path: "specs/changes/2026/01/25/user-authentication/"
    type: "feature"
  - name: "password-reset"
    path: "specs/changes/2026/01/25/password-reset/"
    type: "feature"
suggested_order: ["user-authentication", "password-reset"]
shared_concepts_added: ["User", "Session", "Token"]
```

## Workflow

### Step 1: Copy External Spec to Archive

**If spec is a single file:**
1. Determine the original filename from the spec path
2. Copy to: `specs/external/<original-filename>`
3. Store: `archived_spec_path = {target_dir}/specs/external/<filename>`
4. Display: "Copied external spec to: specs/external/<filename>"

**If spec is a directory:**
1. Determine the directory name from the spec path
2. Copy entire directory to: `specs/external/<directory-name>/`
3. Store: `archived_spec_dir = {target_dir}/specs/external/<directory-name>/`
4. Display: "Copied external spec directory to: specs/external/<directory-name>/ ({N} files)"

**Important:** All subsequent section reads use the archived path, not the original `spec_path`.

### Step 2: Present Outline to User

The `spec_outline` is already extracted (passed from sdd-init Phase 0). Present it to the user for confirmation.

**If `spec_outline.has_headers` is true:**

Display the structure with indentation based on header level.

**For single file:**
```
I found the following structure in this spec:

## User Authentication (lines 10-50)
   ### Login Flow (lines 15-30)
   ### Registration (lines 31-50)
## Dashboard (lines 51-120)
   ### Analytics (lines 55-80)
   ### Settings (lines 81-120)

I'll create a change for each H2 section.
Total: 2 changes (User Authentication, Dashboard)

Options:
  [A] Accept this breakdown
  [L] Use different level (H1 or H3 as change boundaries)
  [S] Single change (don't split)
  [C] Cancel
```

**For directory (multiple files):**
```
I found the following structure in this spec directory (3 files):

📄 README.md
   # Product Overview (lines 1-50)

📄 auth/authentication.md
   # User Authentication (lines 1-60)
      ## Login Flow (lines 10-40)
      ## Registration (lines 41-60)

📄 dashboard/overview.md
   # Dashboard (lines 1-80)
      ## Analytics (lines 20-50)
      ## Settings (lines 51-80)

I'll create a change for each H1 section (one per file's main topic).
Total: 3 changes (Product Overview, User Authentication, Dashboard)

Options:
  [A] Accept this breakdown
  [L] Use different level (H2 as change boundaries)
  [F] Use files as boundaries (one change per file)
  [S] Single change (don't split)
  [C] Cancel
```

**If `spec_outline.has_headers` is false:**

```
This spec has no markdown headers. I'll treat it as a single change.

Options:
  [A] Accept
  [C] Cancel
```

### Step 3: Handle User Level Choice

**If user chooses `[L]`**, ask which level to use:

```
Which header level should define change boundaries?
  [1] H1 headers (# Title)
  [2] H2 headers (## Title) - default
  [3] H3 headers (### Title)
```

Re-display the outline with the new boundary level highlighted.

**If user chooses `[F]` (directory specs only)**, use each file as a change boundary:
- One change per markdown file
- Use the file's first H1 header as the change name, or filename if no headers
- Re-display showing file-based grouping

### Step 4: Analyze Each Section

For each section at the chosen boundary level:

1. **Read section content** from the archived location:
   - **Single file:** Read from `archived_spec_path` using `start_line` to `end_line`
   - **Directory:** Read from `archived_spec_dir/<section.source_file>` using `start_line` to `end_line`
2. **Analyze the section:**
   ```
   INVOKE spec-decomposition skill with:
     mode: "section"
     spec_content: <content of this section only>
     section_header: <e.g., "## User Authentication">
     default_domain: <primary_domain>
   ```
3. **Collect** the `DecomposedChange` result
4. **Display progress:** "Analyzing: User Authentication (1/2)..."

### Step 5: Present Combined Decomposition

Combine all section analyses into a unified view:

```
Analysis complete. Here are the identified changes:

[c1] user-authentication (Identity) - feature - MEDIUM
     Login and session management
     Sections: "User Authentication"
     Endpoints: POST /auth/login, DELETE /auth/logout
     Dependencies: none

[c2] dashboard (Core) - feature - MEDIUM
     User dashboard with analytics
     Sections: "Dashboard"
     Endpoints: GET /dashboard, GET /analytics
     Dependencies: c1

Shared concepts (will be added to glossary):
  - User, Session, Analytics

Suggested implementation order: c1 → c2

Options:
  [A] Accept this breakdown
  [M] Merge changes (e.g., "merge c1 c2")
  [R] Rename a change (e.g., "rename c1 new-name")
  [T] Change type (e.g., "type c2 bugfix")
  [K] Keep as single spec (skip decomposition)
  [C] Cancel
```

### Step 6: Handle User Adjustments

Process user adjustments in a loop:

| Option | Action |
|--------|--------|
| **[A] Accept** | Proceed to Step 7 with accepted changes |
| **[M] Merge** | Combine selected changes, re-display |
| **[R] Rename** | Update change name, re-display |
| **[T] Change type** | Update change type (feature/bugfix/refactor), re-display |
| **[K] Keep as single** | Create single change containing all content |
| **[C] Cancel** | Return with cancelled status |

Continue until user accepts or cancels.

### Step 7: Create Change Specifications

For each accepted change, invoke the `change-creation` skill:

```
INVOKE change-creation skill with:
  name: <change-name>
  type: <feature|bugfix|refactor>
  title: <Change Title>
  description: <extracted description>
  domain: <primary_domain or detected>
  issue: TBD
  user_stories: <extracted user stories>
  acceptance_criteria: <extracted ACs>
  api_endpoints: <extracted endpoints>
  external_source: ../../external/<filename>
  decomposition_id: <uuid> (if multi-change)
  prerequisites: <prerequisite change names> (if dependencies)
```

### Step 8: Update Shared Files

**Update INDEX.md with External Specifications table:**

```markdown
## External Specifications

| Source | Imported | Changes |
|--------|----------|---------|
| [<filename>](external/<filename>) | YYYY-MM-DD | change-1, change-2, ... |
```

**Update domain glossary with shared concepts:**

Add extracted shared concepts from decomposition to `specs/domain/glossary.md`.

### Step 9: Return Summary

Display completion summary:

```
External spec processed successfully!

External spec copied to: specs/external/<filename>
Created N change specifications:
  - specs/changes/YYYY/MM/DD/change-1/ (feature)
  - specs/changes/YYYY/MM/DD/change-2/ (feature)

Suggested implementation order: change-1 → change-2 → ...

Next step: Start with the first change:
  /sdd-implement-change specs/changes/YYYY/MM/DD/change-1
```

## Examples

### Example 1: Multi-Change Decomposition

```
Input:
  spec_path: /tmp/user-management-spec.md
  target_dir: /home/dev/my-app
  primary_domain: "User Management"

[Spec contains: user registration, login, password reset, profile management]

Agent: I've identified 4 changes in this specification:

[c1] user-registration (User Management) - feature - MEDIUM
     User registration with email verification
     Sections: "Registration", "Email Verification"
     Endpoints: POST /users, POST /users/verify
     Dependencies: none

[c2] user-authentication (User Management) - feature - MEDIUM
     Login and session management
     Sections: "Login", "Sessions"
     Endpoints: POST /auth/login, DELETE /auth/logout
     Dependencies: c1

[c3] password-reset (User Management) - feature - SMALL
     Password reset flow
     Sections: "Password Reset"
     Endpoints: POST /auth/reset, POST /auth/reset/confirm
     Dependencies: c2

[c4] profile-management (User Management) - feature - SMALL
     User profile CRUD
     Sections: "Profile"
     Endpoints: GET /users/me, PATCH /users/me
     Dependencies: c1

Shared concepts: User, Session, Token, Email
Suggested order: c1 → c2 → c3 → c4

Options: [A] Accept [M] Merge [S] Split [R] Rename [T] Type [K] Keep single [C] Cancel

User: A

Output:
  success: true
  external_spec_archived: "specs/external/user-management-spec.md"
  changes_created:
    - {name: "user-registration", path: "specs/changes/2026/01/25/user-registration/", type: "feature"}
    - {name: "user-authentication", path: "specs/changes/2026/01/25/user-authentication/", type: "feature"}
    - {name: "password-reset", path: "specs/changes/2026/01/25/password-reset/", type: "feature"}
    - {name: "profile-management", path: "specs/changes/2026/01/25/profile-management/", type: "feature"}
  suggested_order: ["user-registration", "user-authentication", "password-reset", "profile-management"]
  shared_concepts_added: ["User", "Session", "Token", "Email"]
```

### Example 2: User Merges Changes

```
Agent: [displays 4 changes as above]

User: merge c3 c4

Agent: Merged "password-reset" and "profile-management" into "user-account-management".

[c1] user-registration - feature - MEDIUM
     ...

[c2] user-authentication - feature - MEDIUM
     ...

[c3] user-account-management - feature - MEDIUM
     Password reset and profile management
     Sections: "Password Reset", "Profile"
     Endpoints: POST /auth/reset, POST /auth/reset/confirm, GET /users/me, PATCH /users/me
     Dependencies: c2

Suggested order: c1 → c2 → c3

Options: [A] Accept [M] Merge [S] Split [R] Rename [T] Type [K] Keep single [C] Cancel

User: A
```

### Example 3: Keep as Single Spec

```
Agent: [displays 4 changes]

User: K

Agent: Keeping as single change. Creating unified change spec...

Output:
  success: true
  external_spec_archived: "specs/external/user-management-spec.md"
  changes_created:
    - {name: "user-management", path: "specs/changes/2026/01/25/user-management/", type: "feature"}
  suggested_order: ["user-management"]
```

## Dependencies

This skill orchestrates:
- `spec-decomposition` - Analyzes spec for multi-change breakdown
- `change-creation` - Creates individual change directories

## Notes

- This skill is conversational and handles user interaction
- Always preserves the original external spec in `specs/external/`
- Decomposition is optional - user can always keep as single spec
- Dependencies between changes are tracked and affect suggested order
