---
name: sdd-new-change
description: Start a new change (feature, bugfix, refactor, or epic) by creating a spec and implementation plan.
---

# /sdd-new-change

Start a new change with a typed specification and implementation plan.

## Usage

```
/sdd-new-change --type <feature|bugfix|refactor|epic> --name <change-name>
```

**Arguments:**
- `--type` (required): Type of change - `feature`, `bugfix`, `refactor`, or `epic`
- `--name` (required): Name for the change (lowercase, hyphens allowed)

**Examples:**
```bash
# New feature
/sdd-new-change --type feature --name user-authentication

# Bug fix
/sdd-new-change --type bugfix --name fix-session-timeout

# Refactor
/sdd-new-change --type refactor --name extract-validation-layer

# Epic (multiple features)
/sdd-new-change --type epic --name checkout-system
```

## Flow

**Permission Note**: This command creates 2-3 files (SPEC.md, PLAN.md, updates INDEX.md). If the user experiences many approval prompts, mention they can configure permissions per `plugin/hooks/PERMISSIONS.md`.

### 1. Parse Arguments (CRITICAL - DO FIRST)

**First, parse and validate the arguments:**

1. **If no arguments provided**, display usage and exit:
   ```
   Usage: /sdd-new-change --type <feature|bugfix|refactor|epic> --name <change-name>

   Arguments:
     --type <type>  Type of change: feature, bugfix, refactor, or epic (required)
     --name <name>  Name for the change directory (required)

   Examples:
     /sdd-new-change --type feature --name user-authentication
     /sdd-new-change --type bugfix --name fix-login-timeout
     /sdd-new-change --type refactor --name extract-auth-layer
   ```
   **Do not proceed without both arguments.**

2. **Validate `--type`:**
   - Must be one of: `feature`, `bugfix`, `refactor`, `epic`
   - If invalid, show error: "Invalid type '<type>'. Must be one of: feature, bugfix, refactor"

3. **Validate `--name`:**
   - Must be valid directory name (lowercase, hyphens allowed, no spaces)
   - If invalid, show error and requirements

**DO NOT proceed to Step 2 until both arguments are validated.**

### 2. Check Git Branch

**Now that we have the change info, check the branch:**

1. Run `git branch --show-current` to get the current branch name
2. If the current branch is `main` or `master`:
   - **STOP immediately**
   - Inform the user: "You are currently on the `main`/`master` branch."
   - Suggest: "Would you like to create a branch first? Suggested branch name: `<type>/<change-name>`"
     - Use the actual type and change name from Step 1 (e.g., `feature/user-auth`, `bugfix/fix-timeout`)
   - Wait for user response:
     - If user says yes: Ask if they want to use the suggested name or provide their own
     - If user provides a branch name: Create the branch with `git checkout -b <branch-name>`
     - If user says no: Warn them that they're about to create files on main/master, ask for explicit confirmation
3. If on any other branch: Proceed to Step 3

**DO NOT proceed to Step 3 until the branch situation is resolved.**

### 3. Collect Change Information

Prompt for additional details based on change type:

**For all types:**
- Issue reference (required)
- Domain (e.g., "Identity", "Billing", "Core")
- Brief description (1-2 sentences)

**Additional prompts by type:**

**For `feature`:**
- (No additional required prompts - user stories and acceptance criteria can be added in the spec)

**For `bugfix`:**
- "What are the symptoms of this bug?"
- "What is the expected behavior?"
- (Root cause can be documented later after investigation)

**For `refactor`:**
- "What are the main goals of this refactor?"
- "Which files/modules are primarily affected?"

**For `epic`:**
- "What is the overall goal of this epic?"
- "What child changes (features) should this epic contain?" (collect names and brief descriptions)
- "Are there dependencies between the child changes?"

### 4. Create Change Spec and Plan

Use the `change-creation` skill to create the change. Invoke the skill with:

```
name: <collected change name>
type: <collected type>
title: <change name formatted as title>
description: <collected description>
domain: <collected domain>
issue: <collected issue reference>

# For bugfix type:
root_cause: <to be determined during investigation>
affected_files: <if provided>

# For refactor type:
refactor_goals: <collected goals>
affected_files: <collected files/modules>
```

The `change-creation` skill will:
1. Create change directory: `changes/YYYY/MM/DD/<change-name>/`
2. Create SPEC.md with proper frontmatter and type-specific sections
3. Create PLAN.md with type-appropriate phases
4. Update INDEX.md with the new change entry (includes type indicator)

See `skills/change-creation/SKILL.md` for detailed specification.

### 5. Review

- Show both spec and plan to user
- Wait for confirmation before proceeding
- If user requests changes, edit the files accordingly

### 6. Commit Change Spec

After user confirms the spec and plan are ready:

1. Stage the new files:
   ```bash
   git add changes/YYYY/MM/DD/<change-name>/SPEC.md \
           changes/YYYY/MM/DD/<change-name>/PLAN.md \
           INDEX.md
   ```

2. Commit using the commit-standards format:
   ```
   Add <change-name>: Create <type> spec and plan

   - Created SPEC.md with <type> specification
   - Created PLAN.md with implementation phases
   - Updated INDEX.md with change entry

   Co-Authored-By: SDD Plugin vX.Y.Z
   ```

3. Confirm commit to user:
   ```
   ✓ Committed change spec: <commit-hash>

   Ready to implement! Run:
     /sdd-implement-change changes/YYYY/MM/DD/<change-name>
   ```

**If commit fails:** Display the error and ask the user how to proceed:
- "Commit failed: <error message>"
- Options: retry, skip commit (with data loss warning), or investigate

**Note:** If the user skips commit or declines, warn that uncommitted specs risk data loss.

## Important Notes

- **Both arguments required**: The command will ALWAYS require `--type` and `--name` before proceeding
- **Branch check is mandatory**: After validating arguments, the command checks the current git branch
- **Feature branches recommended**: Working on `main`/`master` is discouraged
- **Suggested naming**: `<type>/<change-name>` follows common git workflow conventions (epics use `epic/<name>`)
- **Epic flow**: For epics, after creating the parent spec/plan, child change directories are created under `changes/`
- **Type-specific templates**: Each change type gets appropriate spec sections and plan phases
- **User control**: Users can override the branch suggestion and proceed on main/master if they explicitly confirm

## Example Interactions

### Example 1: New feature on main branch (creates feature branch)

```
User: /sdd-new-change --type feature --name user-authentication

Agent: ✓ Type: feature
Agent: ✓ Name: user-authentication

Agent: Checking current git branch...
Agent: You are currently on the `main` branch.
Agent: Would you like to create a branch first?
       Suggested branch name: `feature/user-authentication`

User: yes

Agent: Creating branch `feature/user-authentication`...
Agent: [Runs: git checkout -b feature/user-authentication]
Agent: ✓ Now on branch `feature/user-authentication`

Agent: Now let's gather additional information...
Agent: Please provide the issue reference (required):

User: PROJ-123

Agent: Which domain does this change belong to?

User: Identity

Agent: Brief description of the change:

User: Allow users to authenticate using email and password

Agent: [Creates spec and plan using change-creation skill...]

Agent: ✓ Created changes/2026/01/21/user-authentication/SPEC.md
Agent: ✓ Created changes/2026/01/21/user-authentication/PLAN.md
Agent: ✓ Updated INDEX.md
```

### Example 2: Bugfix already on a branch

```
User: /sdd-new-change --type bugfix --name fix-session-timeout

Agent: ✓ Type: bugfix
Agent: ✓ Name: fix-session-timeout

Agent: Checking current git branch...
Agent: Current branch: `bugfix/other-issue`
Agent: ✓ Proceeding on current branch

Agent: Now let's gather additional information...
Agent: Please provide the issue reference (required):

User: BUG-456

Agent: Which domain does this change belong to?

User: Identity

Agent: Brief description of the bug:

User: Sessions expire prematurely after 5 minutes instead of 30

Agent: What are the symptoms of this bug?

User: Users are logged out unexpectedly, session token shows expired status

Agent: What is the expected behavior?

User: Sessions should remain valid for 30 minutes of inactivity

Agent: [Creates bugfix spec and plan...]

Agent: ✓ Created changes/2026/01/21/fix-session-timeout/SPEC.md
Agent: ✓ Created changes/2026/01/21/fix-session-timeout/PLAN.md
Agent: ✓ Updated INDEX.md
```

### Example 3: Refactor

```
User: /sdd-new-change --type refactor --name extract-validation-layer

Agent: ✓ Type: refactor
Agent: ✓ Name: extract-validation-layer

Agent: Checking current git branch...
Agent: You are currently on the `main` branch.
Agent: Would you like to create a branch first?
       Suggested branch name: `refactor/extract-validation-layer`

User: yes, use that name

Agent: Creating branch `refactor/extract-validation-layer`...
Agent: ✓ Now on branch `refactor/extract-validation-layer`

Agent: Now let's gather additional information...
Agent: Please provide the issue reference (required):

User: TECH-789

Agent: Which domain does this change belong to?

User: Core

Agent: Brief description of the refactor:

User: Move validation logic from controllers to dedicated validation layer

Agent: What are the main goals of this refactor?

User: Centralize validation, improve testability, reduce duplication

Agent: Which files/modules are primarily affected?

User: src/controllers/*.ts, will create new src/validation/ directory

Agent: [Creates refactor spec and plan...]

Agent: ✓ Created changes/2026/01/21/extract-validation-layer/SPEC.md
Agent: ✓ Created changes/2026/01/21/extract-validation-layer/PLAN.md
Agent: ✓ Updated INDEX.md
```

### Example 4: Missing arguments

```
User: /sdd-new-change

Agent: Usage: /sdd-new-change --type <feature|bugfix|refactor|epic> --name <change-name>

Arguments:
  --type <type>  Type of change: feature, bugfix, refactor, or epic (required)
  --name <name>  Name for the change directory (required)

Examples:
  /sdd-new-change --type feature --name user-authentication
  /sdd-new-change --type bugfix --name fix-login-timeout
  /sdd-new-change --type refactor --name extract-auth-layer
```
