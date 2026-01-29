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
