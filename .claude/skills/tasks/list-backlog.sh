#!/usr/bin/env bash
# Renders .tasks/INDEX.md as a formatted backlog view.
# Adds section icons, rewrites task links, skips archival/empty sections.
set -euo pipefail

TASKS_DIR=".tasks"
INDEX="$TASKS_DIR/INDEX.md"

if [[ ! -f "$INDEX" ]]; then
  echo "No tasks index found." >&2
  exit 1
fi

# --- State ---
archival=false
section_head=""
section_body=""
section_has_items=false
subsection_head=""
subsection_body=""
sub_has_items=false
first_output=true

# --- Helpers ---

icon_for_heading() {
  case "$1" in
    "## Planning")         echo "## 📐 Planning" ;;
    "## Plan Review")      echo "## ✅ Plan Review" ;;
    "## Implementing")     echo "## 🔨 Implementing" ;;
    "## Reviewing")        echo "## 🔍 Reviewing" ;;
    "## Inbox")            echo "## 📥 Inbox" ;;
    "### High Priority")   echo "### 🔴 High Priority" ;;
    "### Medium Priority") echo "### 🟡 Medium Priority" ;;
    "### Low Priority")    echo "### 🔵 Low Priority" ;;
    "### Unprioritized")   echo "### ⚪ Unprioritized" ;;
    *) echo "$1" ;;
  esac
}

rewrite_link() {
  local line="$1"
  local pattern='\(([^)]+)\)'
  if [[ "$line" =~ $pattern ]]; then
    local target="${BASH_REMATCH[1]}"
    local dir="${target%/*}"
    local new_target
    if [[ -f "$TASKS_DIR/$dir/plan.md" ]]; then
      new_target="$TASKS_DIR/$dir/plan.md"
    else
      new_target="$TASKS_DIR/$dir/task.md"
    fi
    echo "${line/\($target\)/($new_target)}"
  else
    echo "$line"
  fi
}

flush_subsection() {
  if $sub_has_items; then
    [[ -n "$section_body" ]] && section_body+=$'\n\n'
    section_body+="$subsection_head"$'\n\n'"$subsection_body"
    section_has_items=true
  fi
  subsection_head=""
  subsection_body=""
  sub_has_items=false
}

flush_section() {
  flush_subsection
  if $section_has_items; then
    if ! $first_output; then
      printf '\n\n---\n\n'
    fi
    printf '%s\n\n%s\n' "$section_head" "$section_body"
    first_output=false
  fi
  section_head=""
  section_body=""
  section_has_items=false
}

# --- Main loop ---

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip the title
  if [[ "$line" =~ ^"# " ]] && [[ ! "$line" =~ ^"## " ]]; then
    continue
  fi

  # Detect archival sections — skip until next ---
  if [[ "$line" =~ ^"## Complete" || "$line" =~ ^"## Rejected" || "$line" =~ ^"## Consolidated" ]]; then
    archival=true
    continue
  fi
  if $archival; then
    [[ "$line" == "---" ]] && archival=false
    continue
  fi

  # Section separator — flush
  if [[ "$line" == "---" ]]; then
    flush_section
    continue
  fi

  # Skip (none)
  [[ "$line" == "(none)" ]] && continue

  # H2 heading — new section
  if [[ "$line" =~ ^"## " ]]; then
    flush_section
    section_head="$(icon_for_heading "$line")"
    continue
  fi

  # H3 heading — new subsection
  if [[ "$line" =~ ^"### " ]]; then
    flush_subsection
    subsection_head="$(icon_for_heading "$line")"
    continue
  fi

  # Task item — rewrite link
  if [[ "$line" =~ ^"- [#" ]]; then
    local_line="$(rewrite_link "$line")"
    if [[ -n "$subsection_head" ]]; then
      [[ -n "$subsection_body" ]] && subsection_body+=$'\n'
      subsection_body+="$local_line"
      sub_has_items=true
    else
      [[ -n "$section_body" ]] && section_body+=$'\n'
      section_body+="$local_line"
      section_has_items=true
    fi
    continue
  fi

  # Other lines (blank, etc.) — ignored between sections
done < "$INDEX"

# Flush remaining
flush_section
echo
