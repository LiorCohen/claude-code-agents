#!/usr/bin/env bash
# Stop hook: runs objective verification checks before allowing Claude to stop.
# Reports findings as structured JSON so Claude sees facts, not self-assessments.
set -euo pipefail

# Read stdin JSON
input="$(cat)"
cwd="$(printf '%s' "$input" | jq -r '.cwd // ""')"
stop_hook_active="$(printf '%s' "$input" | jq -r '.stop_hook_active // false')"

# Prevent infinite loop — if we already blocked once, approve this time
if [[ "$stop_hook_active" == "true" ]]; then
  echo '{}'
  exit 0
fi

cd "$cwd"

block=false
block_reasons=()
report=""

# --- 1. Uncommitted changes ---
dirty_files="$(git status --porcelain 2>/dev/null || true)"
if [[ -n "$dirty_files" ]]; then
  block=true
  block_reasons+=("Uncommitted changes detected")
  report+="### Uncommitted changes\nFOUND — the following files have uncommitted changes:\n\`\`\`\n${dirty_files}\n\`\`\`\n\n"
else
  report+="### Uncommitted changes\nCLEAN — no uncommitted changes\n\n"
fi

# --- 2. Feature branch detection ---
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
task_id=""
on_feature_branch=false

if [[ "$branch" =~ ^feature/task-([0-9]+) ]]; then
  on_feature_branch=true
  task_id="${BASH_REMATCH[1]}"
fi

if [[ "$on_feature_branch" == true ]]; then
  report+="### Branch context\nOn feature branch: ${branch} (task #${task_id})\n\n"
else
  report+="### Branch context\nOn branch: ${branch} (not a feature branch — skipping task-specific checks)\n\n"
fi

# --- 3. Task status check (only on feature branches) ---
if [[ "$on_feature_branch" == true && -n "$task_id" ]]; then
  if [[ -d ".tasks/4-implementing/${task_id}" ]]; then
    report+="### Task status\nTask #${task_id} is in **implementing** status. Consider moving to review if implementation is complete.\n\n"
  elif [[ -d ".tasks/5-reviewing/${task_id}" ]]; then
    report+="### Task status\nTask #${task_id} is in **reviewing** status.\n\n"
  else
    # Check other directories
    found_status=""
    for dir in .tasks/*/; do
      if [[ -d "${dir}${task_id}" ]]; then
        found_status="$(basename "$dir")"
        break
      fi
    done
    if [[ -n "$found_status" ]]; then
      report+="### Task status\nTask #${task_id} found in ${found_status}.\n\n"
    else
      report+="### Task status\nTask #${task_id} — task folder not found.\n\n"
    fi
  fi
fi

# --- 4. Typecheck (only on feature branches with plugin/system changes) ---
if [[ "$on_feature_branch" == true ]]; then
  # Check if any staged or unstaged changes touch plugin/system/
  changed_files="$(git diff --name-only HEAD 2>/dev/null || true)"
  staged_files="$(git diff --name-only --cached 2>/dev/null || true)"
  all_changed="${changed_files}${staged_files}"

  if printf '%s' "$all_changed" | grep -q "^plugin/system/"; then
    typecheck_output="$(npm run typecheck:plugin 2>&1)" && typecheck_exit=0 || typecheck_exit=$?
    if [[ $typecheck_exit -ne 0 ]]; then
      block=true
      block_reasons+=("Typecheck failed")
      report+="### Typecheck\nFAIL — type errors found:\n\`\`\`\n${typecheck_output}\n\`\`\`\n\n"
    else
      report+="### Typecheck\nPASS — no type errors\n\n"
    fi
  else
    report+="### Typecheck\nSKIPPED — no plugin/system changes detected\n\n"
  fi
else
  report+="### Typecheck\nSKIPPED — not on a feature branch\n\n"
fi

# --- 5. Reminders (non-objective, for Claude to evaluate) ---
report+="### Reminders\n"
report+="- Have all acceptance criteria from the plan been addressed?\n"
report+="- Did you run tests if required?\n"
report+="- Are there any contradictions or inconsistencies in the codebase?\n"
report+="- Did you update docs if plugin functionality changed?\n"

# --- Build output ---
system_message="## Pre-stop verification\n\n${report}"

if [[ "$block" == true ]]; then
  reason="$(printf '%s\n' "${block_reasons[@]}" | paste -sd '; ' -)"
  jq -n \
    --arg decision "block" \
    --arg reason "$reason" \
    --arg msg "$system_message" \
    '{ "decision": $decision, "reason": $reason, "systemMessage": $msg }'
else
  jq -n --arg msg "$system_message" '{ "systemMessage": $msg }'
fi
