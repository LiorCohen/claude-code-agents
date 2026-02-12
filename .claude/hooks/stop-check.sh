#!/usr/bin/env bash
# Stop hook: runs objective verification checks before allowing Claude to stop.
# Reports findings as structured JSON so Claude sees facts, not self-assessments.
set -euo pipefail

# Read stdin JSON
input="$(cat)"
cwd="$(printf '%s' "$input" | jq -r '.cwd // ""')"
session_id="$(printf '%s' "$input" | jq -r '.session_id // ""')"
cd "$cwd"

# Prevent infinite loop — if we already blocked once, approve this time.
# Uses a marker file since Claude Code hook input has no re-entry field.
marker=".temp/.stop-hook-blocked"
if [[ -f "$marker" ]]; then
  rm -f "$marker"
  echo '{}'
  exit 0
fi

NL=$'\n'
block=false
block_reasons=()
report=""

# --- 1. Uncommitted changes ---
dirty_files="$(git status --porcelain 2>/dev/null || true)"
commit_pending=false
# Check for session-specific commit-pending marker (set by the commit skill)
if [[ -n "$session_id" && -f ".temp/.commit-pending-${session_id}" ]]; then
  commit_pending=true
fi

if [[ -n "$dirty_files" ]]; then
  if [[ "$commit_pending" == true ]]; then
    report+="### Uncommitted changes${NL}FOUND — commit skill is awaiting user approval (not blocking):${NL}\`\`\`${NL}${dirty_files}${NL}\`\`\`${NL}${NL}"
  else
    block=true
    block_reasons+=("Uncommitted changes detected")
    report+="### Uncommitted changes${NL}FOUND — the following files have uncommitted changes:${NL}\`\`\`${NL}${dirty_files}${NL}\`\`\`${NL}${NL}"
  fi
else
  report+="### Uncommitted changes${NL}CLEAN — no uncommitted changes${NL}${NL}"
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
  report+="### Branch context${NL}On feature branch: ${branch} (task #${task_id})${NL}${NL}"
else
  report+="### Branch context${NL}On branch: ${branch} (not a feature branch — skipping task-specific checks)${NL}${NL}"
fi

# --- 3. Task status check (only on feature branches) ---
if [[ "$on_feature_branch" == true && -n "$task_id" ]]; then
  if [[ -d ".tasks/4-implementing/${task_id}" ]]; then
    report+="### Task status${NL}Task #${task_id} is in **implementing** status. Consider moving to review if implementation is complete.${NL}${NL}"
  elif [[ -d ".tasks/5-reviewing/${task_id}" ]]; then
    report+="### Task status${NL}Task #${task_id} is in **reviewing** status.${NL}${NL}"
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
      report+="### Task status${NL}Task #${task_id} found in ${found_status}.${NL}${NL}"
    else
      report+="### Task status${NL}Task #${task_id} — task folder not found.${NL}${NL}"
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
      report+="### Typecheck${NL}FAIL — type errors found:${NL}\`\`\`${NL}${typecheck_output}${NL}\`\`\`${NL}${NL}"
    else
      report+="### Typecheck${NL}PASS — no type errors${NL}${NL}"
    fi
  else
    report+="### Typecheck${NL}SKIPPED — no plugin/system changes detected${NL}${NL}"
  fi
else
  report+="### Typecheck${NL}SKIPPED — not on a feature branch${NL}${NL}"
fi

# --- 5. Reminders (non-objective, for Claude to evaluate) ---
report+="### Reminders${NL}"
report+="- Have all acceptance criteria from the plan been addressed?${NL}"
report+="- Did you run tests if required?${NL}"
report+="- Are there any contradictions or inconsistencies in the codebase?${NL}"
report+="- Did you update docs if plugin functionality changed?${NL}"

# --- Build output ---
system_message="## Pre-stop verification${NL}${NL}${report}"

if [[ "$block" == true ]]; then
  mkdir -p .temp
  touch "$marker"
  reason=""
  for (( r=0; r<${#block_reasons[@]}; r++ )); do
    if [[ $r -gt 0 ]]; then reason+="; "; fi
    reason+="${block_reasons[$r]}"
  done
  jq -n \
    --arg decision "block" \
    --arg reason "$reason" \
    --arg msg "$system_message" \
    '{ "decision": $decision, "reason": $reason, "systemMessage": $msg }'
else
  jq -n --arg msg "$system_message" '{ "systemMessage": $msg }'
fi
