---
name: sdd-new-feature
description: Start a new feature by creating a spec and implementation plan.
---

# /sdd-new-feature

Start a new feature.

## Usage

```
/project:new-feature [feature-name]
```

## Flow

### 1. Collect Feature Name (CRITICAL - DO FIRST)

**First, get the feature name:**

1. If feature name was provided as argument, use it
2. If not provided, prompt: "What is the feature name?"
   - Must be valid directory name (lowercase, hyphens allowed)
   - Example: "user-authentication", "payment-processing"
3. Store the feature name for use in subsequent steps

**DO NOT proceed to Step 2 until feature name is collected.**

### 2. Check Git Branch

**Now that we have the feature name, check the branch:**

1. Run `git branch --show-current` to get the current branch name
2. If the current branch is `main` or `master`:
   - **STOP immediately**
   - Inform the user: "You are currently on the `main`/`master` branch."
   - Suggest: "Would you like to create a feature branch first? Suggested branch name: `feature/<feature-name>`"
     - Use the actual feature name collected in Step 1
   - Wait for user response:
     - If user says yes: Ask if they want to use the suggested name or provide their own
     - If user provides a branch name: Create the branch with `git checkout -b <branch-name>`
     - If user says no: Warn them that they're about to create files on main/master, ask for explicit confirmation
3. If on any other branch: Proceed to Step 3

**DO NOT proceed to Step 3 until the branch situation is resolved.**

### 3. Collect Remaining Feature Information

- Prompt for additional feature details:
  - Issue reference (required)
  - Domain
  - Brief description

### 4. Create Spec (`spec-writer` agent)

- Get current date in YYYY/MM/DD format
- Create `specs/features/YYYY/MM/DD/<feature-name>/SPEC.md` using template
- Fill in skeleton with user input
- Set `created` frontmatter field to current date
- Present for review and confirmation

### 5. Create Plan (`planner` agent)

- Analyze the spec
- Determine components affected (contract, server, webapp, helm, testing)
- Create `specs/features/YYYY/MM/DD/<feature-name>/PLAN.md` (same directory as spec)
- Break down into phases with agent assignments
- Estimate effort for each phase
- Present plan for approval

### 6. Review

- Show both spec and plan to user
- Wait for confirmation before proceeding
- If approved, update INDEX.md

## Important Notes

- **Feature name collected first**: The command will ALWAYS collect the feature name before any other action
- **Branch check is mandatory**: After getting the feature name, the command checks the current git branch
- **Feature branches recommended**: Working on `main`/`master` is discouraged for new features
- **Suggested naming**: `feature/<feature-name>` follows common git workflow conventions (uses the actual feature name)
- **User control**: Users can override the suggestion and proceed on main/master if they explicitly confirm

## Example Interaction

### Example 1: Feature name provided, on main branch (creates feature branch)

```
User: /project:new-feature user-authentication

Agent: ✓ Feature name: user-authentication

Agent: Checking current git branch...
Agent: You are currently on the `main` branch.
Agent: Would you like to create a feature branch first?
       Suggested branch name: `feature/user-authentication`

User: yes

Agent: Creating branch `feature/user-authentication`...
Agent: [Runs: git checkout -b feature/user-authentication]
Agent: ✓ Now on branch `feature/user-authentication`

Agent: Now let's gather additional information for the feature...
Agent: Please provide the issue reference (required):

User: PROJ-123

Agent: Which domain does this feature belong to?

User: Identity

Agent: Brief description of the feature:

User: Allow users to authenticate using email and password

Agent: [Creates spec and plan...]
```

### Example 2: Feature name not provided, already on feature branch

```
User: /project:new-feature

Agent: What is the feature name?

User: payment-processing

Agent: ✓ Feature name: payment-processing

Agent: Checking current git branch...
Agent: Current branch: `feature/existing-branch`
Agent: ✓ Proceeding on current branch

Agent: Now let's gather additional information for the feature...
Agent: Please provide the issue reference (required):

User: PROJ-456

[Continues with feature creation...]
```

### Example 3: On main branch (user declines branch creation)

```
User: /project:new-feature quick-fix

Agent: ✓ Feature name: quick-fix

Agent: Checking current git branch...
Agent: You are currently on the `main` branch.
Agent: Would you like to create a feature branch first?
       Suggested branch name: `feature/quick-fix`

User: no

Agent: ⚠️  WARNING: You are about to create feature files directly on the `main` branch.
Agent: This is not recommended for the standard git workflow.
Agent: Are you sure you want to proceed? (yes/no)

User: yes

Agent: Proceeding on `main` branch...
Agent: Now let's gather additional information for the feature...
Agent: Please provide the issue reference (required):

[Continues with feature creation...]
```