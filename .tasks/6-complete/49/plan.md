# Plan: Auto-commit to prevent data loss (Task 49)

## Status: COMPLETED ✓

**Completed: 2026-01-29**

---

## Problem Summary

Currently, committing after file changes relies on Claude following instructions in the commit-standards skill. This is fragile - **any file changes** (specs, plans, code, components) can be left uncommitted, risking data loss if the session ends unexpectedly. We need **automated** commit prompts that trigger after writes to SDD-managed directories, ensuring no work is ever lost.

## Current State

### What exists:
1. **PreToolUse hook system** (`plugin/hooks/`) - validates writes to safe directories
2. **commit-standards skill** - documents *when* to commit but doesn't enforce it
3. **sdd-init Phase 8** - has inline `git commit` but:
   - Uses hardcoded message, not commit-standards format
   - No changelog update
   - No version bump handling
4. **sdd-new-change Step 5** - ends at "Review" with **no commit step**

### Hook System Capabilities (from [Claude Code docs](https://code.claude.com/docs/en/hooks)):
- **PreToolUse** - Before tool execution (currently used for write validation)
- **PostToolUse** - After tool completion (available but not used)
- **Stop** - When agent finishes responding
- **SubagentStop** - When subagent finishes

### Gap Analysis:
| Command | Commit Step | Standards-Compliant | Automated |
|---------|-------------|---------------------|-----------|
| sdd-init | Yes (Phase 8) | No (hardcoded msg) | No |
| sdd-new-change | **No** | N/A | No |

## Proposed Solution

### Approach: PostToolUse Hook for All SDD-Managed Directories

Use a **PostToolUse hook** that detects writes to any SDD-managed directory and prompts Claude to commit. This covers:

- `changes/` - spec and plan files
- `specs/` - domain specs, architecture docs
- `components/` - all code (backend, frontend, contract, etc.)
- `config/` - configuration files
- `tests/` - test files

**Why this approach:**
- PostToolUse hooks run after tool completion, perfect timing for commit prompts
- Hook-based solution works regardless of which command or manual edit created the files
- Covers ALL file changes, not just specific commands
- Prompting (not auto-committing) preserves user control while ensuring nothing is forgotten
- Single mechanism protects against data loss across the entire project

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/hooks/hooks.json` | Add PostToolUse hook for changes/ directory writes |
| `plugin/hooks/prompt-commit-after-write.sh` | **NEW** - PostToolUse hook script |
| `plugin/commands/sdd-new-change.md` | Add Step 6: Commit (invoke commit skill) |
| `plugin/commands/sdd-init.md` | Update Phase 8 to use commit skill format |
| `plugin/docs/permissions.md` | Document new PostToolUse hook behavior |

## Implementation

### Step 1: Create PostToolUse Hook Script

Create `plugin/hooks/prompt-commit-after-write.sh`:

```bash
#!/bin/bash
#
# SDD Auto-Commit Prompt Hook (PostToolUse)
# Prompts to commit after writes to SDD-managed directories
#
# This hook fires AFTER Write/Edit completes successfully.
# Goal: Ensure no file changes are ever lost due to uncommitted work.
#

set -euo pipefail

# Read input from Claude Code
input=$(cat)

# Extract tool and file path
tool=$(echo "$input" | jq -r '.tool // ""')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Normalize path - remove leading ./
file_path="${file_path#./}"

# Only trigger for Write or Edit tools
if [[ "$tool" != "Write" && "$tool" != "Edit" ]]; then
  exit 0
fi

# SDD-managed directories that should trigger commit prompts
# These match the safe directories in validate-sdd-writes.sh
SDD_DIRS=(
  "changes/"
  "specs/"
  "components/"
  "config/"
  "tests/"
)

# Check if file is in an SDD-managed directory
is_sdd_file=false
matched_dir=""

for dir in "${SDD_DIRS[@]}"; do
  if [[ "$file_path" == "$dir"* ]]; then
    is_sdd_file=true
    matched_dir="$dir"
    break
  fi
done

# Exit silently if not an SDD-managed file
if [[ "$is_sdd_file" != "true" ]]; then
  exit 0
fi

# Determine the relevant context directory
# For changes/, use the change directory (e.g., changes/2026/01/29/user-auth)
# For others, use the top-level category
if [[ "$file_path" == changes/* ]]; then
  # Extract change directory: changes/YYYY/MM/DD/name/file -> changes/YYYY/MM/DD/name
  # Count path segments to find the change dir
  context_dir=$(echo "$file_path" | cut -d'/' -f1-5)
else
  # Use the matched directory prefix
  context_dir="${matched_dir%/}"
fi

# Output message to Claude
jq -n --arg dir "$context_dir" --arg file "$(basename "$file_path")" --arg tool "$tool" '{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "message": (if $tool == "Write" then "Created " else "Modified " end + $file + " in " + $dir + ". Consider committing to prevent data loss.")
  }
}'
```

**Design decisions:**
- Triggers on both `Write` AND `Edit` to catch all file changes
- Covers all SDD-managed directories: `changes/`, `specs/`, `components/`, `config/`, `tests/`
- Matches the same directories as `validate-sdd-writes.sh` for consistency
- Message distinguishes "Created" vs "Modified" based on tool type
- Uses softer "Consider committing" to avoid being annoying on rapid edits

### Step 2: Register Hook in hooks.json

Update `plugin/hooks/hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/validate-sdd-writes.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/prompt-commit-after-write.sh"
          }
        ]
      }
    ]
  }
}
```

### Step 3: Update sdd-new-change Command

Add **Step 6: Commit** after Step 5 (Review):

```markdown
### 6. Commit Change Spec

After user confirms the spec and plan are ready:

1. Stage the new files:
   - `changes/YYYY/MM/DD/<change-name>/SPEC.md`
   - `changes/YYYY/MM/DD/<change-name>/PLAN.md`
   - `INDEX.md` (if updated)

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
```

### Step 4: Update sdd-init Phase 8

Replace the hardcoded commit with commit-standards format. **Auto-commit without prompting** (user already approved project creation in Phase 4):

```markdown
### Phase 8: Commit Initial Project Files

Stage and commit all created files using the commit-standards skill format:

```bash
cd ${TARGET_DIR} && git add .
```

Commit with proper message format:
```
Add <project-name>: Initialize spec-driven project

- Created project structure with <N> components
- Set up CMDO architecture (components/, specs/)
- Configured for <primary-domain> domain
[- Integrated external spec from <spec-path>] (if --spec provided)
[- Created <N> change specs in changes/] (if --spec provided)

Co-Authored-By: SDD Plugin vX.Y.Z
```

**If commit fails:** Display the error and ask the user how to proceed:
- "Commit failed: <error message>"
- Options: retry, skip commit, or abort initialization

Note: Since this is project initialization (not a feature), no version bump or changelog entry is needed.
```

### Step 5: Update permissions.md Documentation

Add section documenting the PostToolUse hook:

```markdown
## Auto-Commit Prompts

The SDD plugin includes a PostToolUse hook that reminds you to commit after creating change specs.

### Behavior

When a `SPEC.md` or `PLAN.md` file is written to the `changes/` directory, Claude receives a reminder to commit the changes.

### Why This Exists

Uncommitted specs and plans can be lost if the session ends unexpectedly. This hook ensures specs are committed promptly after creation.

### Disabling

If you prefer to manage commits manually, you can disable the hook by removing the PostToolUse section from `plugin/hooks/hooks.json`.
```

## Alternative Approaches Considered

### Option A: Stop Hook Instead of PostToolUse
**Rejected** - Stop hook fires when Claude finishes responding, which may be too late or too early depending on the conversation flow.

### Option B: Auto-Commit Without User Prompt
**Rejected** - Silently committing could surprise users and doesn't allow them to review before commit.

### Option C: Command-Only Changes (No Hook)
**Considered but enhanced** - Adding commit steps to commands alone still relies on Claude following instructions. The hook provides a safety net.

### Option D: Skill Frontmatter Hooks
**Considered** - Skills can define hooks in frontmatter, but this would require modifying the change-creation skill rather than having centralized hook management.

## Verification

1. **Test sdd-new-change flow:**
   - Run `/sdd-new-change --type feature --name test-feature`
   - Verify SPEC.md and PLAN.md are created
   - Verify Claude receives commit reminder from hook
   - Verify commit is created with proper format

2. **Test sdd-init flow:**
   - Run `/sdd-init --name test-project`
   - Verify Phase 8 creates commit with proper format
   - Verify no changelog/version bump (init is special case)

3. **Test hook behavior across all SDD directories:**
   - Write to `changes/` - hook should trigger
   - Write to `specs/domain/` - hook should trigger
   - Write to `specs/architecture/` - hook should trigger
   - Write to `components/backend/` - hook should trigger
   - Write to `tests/` - hook should trigger
   - Edit existing file in any SDD dir - hook should trigger
   - Write to `docs/` - hook should NOT trigger (not in SDD_DIRS)
   - Write to root `package.json` - hook should NOT trigger

4. **Test edge cases:**
   - User declines commit after sdd-new-change - should see warning
   - Hook disabled - commands should still prompt for commit
   - Permission denied for git commit - should show helpful error

## Rollout Considerations

- **Backwards compatible** - Existing projects won't break
- **No version bump required** - This is a plugin improvement, not user-facing feature
- **Hook requires jq** - Same as existing PreToolUse hook

## Resolved Questions

1. **Should the hook fire for all SDD-managed directories?** - **Yes.** Hook triggers for `changes/`, `specs/`, `components/`, `config/`, and `tests/` - anywhere code or specs live.

2. **What if git commit fails (dirty working tree, etc.)?** - **Ask the user.** If commit fails, prompt the user with the error and ask how they want to proceed.

3. **Should we auto-commit without prompting for sdd-init?** - **Yes.** Phase 8 should auto-commit (as it currently does) without prompting, since the user already approved the project creation.

4. **Should Edit trigger the hook too?** - **Yes.** Both Write and Edit should trigger to catch all file modifications, not just new files.
