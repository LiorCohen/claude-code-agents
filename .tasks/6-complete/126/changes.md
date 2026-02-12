---
generated: 2026-02-12 18:50 UTC
branch: feature/task-126-hooks
commits: 2
---

# Task #126 — Changes

**Files changed:** 4 (+316 / -2 lines)

| File | Added | Removed |
|------|------:|--------:|
| [.claude/hooks/skill-activate.sh](.claude/hooks/skill-activate.sh) | +113 | -0 |
| [.claude/hooks/stop-check.sh](.claude/hooks/stop-check.sh) | +119 | -0 |
| [.claude/settings.json](.claude/settings.json) | +14 | -2 |
| [.claude/skill-rules.yaml](.claude/skill-rules.yaml) | +70 | -0 |

---

## 1. [`.claude/hooks/skill-activate.sh`](.claude/hooks/skill-activate.sh)

New UserPromptSubmit hook — reads skill-rules.yaml, matches prompt against keyword/pattern/file-path triggers, outputs matched skills as systemMessage.

```diff
+#!/usr/bin/env bash
+# UserPromptSubmit hook: auto-activate relevant skills based on prompt content.
+# Reads skill-rules.yaml and matches the user's prompt against keyword, pattern,
+# and file-path triggers. Outputs a systemMessage listing matched skills.
+set -euo pipefail
+
+# Read stdin JSON
+input="$(cat)"
+prompt="$(printf '%s' "$input" | jq -r '.prompt // ""')"
+cwd="$(printf '%s' "$input" | jq -r '.cwd // ""')"
+
+# Nothing to match against
+if [[ -z "$prompt" ]]; then
+  echo '{}'
+  exit 0
+fi
+
+# Locate skill-rules.yaml relative to cwd
+config="${cwd}/.claude/skill-rules.yaml"
+if [[ ! -f "$config" ]]; then
+  echo '{}'
+  exit 0
+fi
+
+# Parse YAML to JSON
+rules_json="$(yq -o=json '.' "$config" 2>/dev/null)" || { echo '{}'; exit 0; }
+
+# Number of rules
+rule_count="$(printf '%s' "$rules_json" | jq '.rules | length')"
+if [[ "$rule_count" -eq 0 ]]; then
+  echo '{}'
+  exit 0
+fi
+
+prompt_lower="$(printf '%s' "$prompt" | tr '[:upper:]' '[:lower:]')"
+matched_skills=()
+
+for (( i=0; i<rule_count; i++ )); do
+  rule="$(printf '%s' "$rules_json" | jq -c ".rules[$i]")"
+  skill="$(printf '%s' "$rule" | jq -r '.skill')"
+  description="$(printf '%s' "$rule" | jq -r '.description')"
+  matched=false
+
+  # Check keywords (case-insensitive substring match)
+  keyword_count="$(printf '%s' "$rule" | jq '.triggers.keywords // [] | length')"
+  for (( k=0; k<keyword_count; k++ )); do
+    keyword="$(printf '%s' "$rule" | jq -r ".triggers.keywords[$k]")"
+    keyword_lower="$(printf '%s' "$keyword" | tr '[:upper:]' '[:lower:]')"
+    if [[ "$prompt_lower" == *"$keyword_lower"* ]]; then
+      matched=true
+      break
+    fi
+  done
+
+  # Check patterns (regex match) — only if not already matched
+  if [[ "$matched" == false ]]; then
+    pattern_count="$(printf '%s' "$rule" | jq '.triggers.patterns // [] | length')"
+    for (( p=0; p<pattern_count; p++ )); do
+      pattern="$(printf '%s' "$rule" | jq -r ".triggers.patterns[$p]")"
+      if [[ "$prompt" =~ $pattern ]]; then
+        matched=true
+        break
+      fi
+    done
+  fi
+
+  # Check file_paths — only if not already matched
+  if [[ "$matched" == false ]]; then
+    fp_count="$(printf '%s' "$rule" | jq '.triggers.file_paths // [] | length')"
+    if [[ "$fp_count" -gt 0 ]]; then
+      file_tokens=()
+      set -f  # disable glob expansion on prompt content
+      for token in $prompt; do
+        if [[ "$token" =~ \.(ts|tsx|md|sh|json|yaml|yml)$ ]] || [[ "$token" == */* ]]; then
+          file_tokens+=("$token")
+        fi
+      done
+      set +f  # re-enable glob expansion
+
+      for token in "${file_tokens[@]+"${file_tokens[@]}"}"; do
+        for (( f=0; f<fp_count; f++ )); do
+          fp_pattern="$(printf '%s' "$rule" | jq -r ".triggers.file_paths[$f]")"
+          regex="$(printf '%s' "$fp_pattern" | sed 's/\*\*/__DOUBLESTAR__/g; s/\*/[^\/]*/g; s/__DOUBLESTAR__/.*/g')"
+          if [[ "$token" =~ ^${regex}$ ]]; then
+            matched=true
+            break 2
+          fi
+        done
+      done
+    fi
+  fi
+
+  if [[ "$matched" == true ]]; then
+    matched_skills+=("- /${skill} — ${description}")
+  fi
+done
+
+if [[ ${#matched_skills[@]} -eq 0 ]]; then
+  echo '{}'
+  exit 0
+fi
+
+# Build systemMessage
+NL=$'\n'
+message="Relevant skills for this task:"
+for entry in "${matched_skills[@]}"; do
+  message="${message}${NL}${entry}"
+done
+
+jq -n --arg msg "$message" '{ "systemMessage": $msg }'
```

## 2. [`.claude/hooks/stop-check.sh`](.claude/hooks/stop-check.sh)

New Stop hook — runs objective checks (git status, branch detection, task status, typecheck) and reports findings as structured JSON.

```diff
+#!/usr/bin/env bash
+# Stop hook: runs objective verification checks before allowing Claude to stop.
+# Reports findings as structured JSON so Claude sees facts, not self-assessments.
+set -euo pipefail
+
+# Read stdin JSON
+input="$(cat)"
+cwd="$(printf '%s' "$input" | jq -r '.cwd // ""')"
+stop_hook_active="$(printf '%s' "$input" | jq -r '.stop_hook_active // false')"
+
+# Prevent infinite loop — if we already blocked once, approve this time
+if [[ "$stop_hook_active" == "true" ]]; then
+  echo '{}'
+  exit 0
+fi
+
+cd "$cwd"
+
+NL=$'\n'
+block=false
+block_reasons=()
+report=""
+
+# --- 1. Uncommitted changes ---
+dirty_files="$(git status --porcelain 2>/dev/null || true)"
+if [[ -n "$dirty_files" ]]; then
+  block=true
+  block_reasons+=("Uncommitted changes detected")
+  report+="### Uncommitted changes${NL}FOUND — ...${NL}"
+else
+  report+="### Uncommitted changes${NL}CLEAN — no uncommitted changes${NL}${NL}"
+fi
+
+# --- 2. Feature branch detection ---
+# --- 3. Task status check (only on feature branches) ---
+# --- 4. Typecheck (only on feature branches with plugin/system changes) ---
+# --- 5. Reminders (non-objective, for Claude to evaluate) ---
+#
+# (Full implementation in file — 119 lines total)
+#
+# Output: { "decision": "block", "reason": "...", "systemMessage": "..." }
+#     or: { "systemMessage": "..." }
```

## 3. [`.claude/settings.json`](.claude/settings.json)

Replaced prompt-based Stop hook with command-based hooks; added UserPromptSubmit hook.

```diff
   "hooks": {
     "Stop": [
       {
+        "matcher": "*",
         "hooks": [
           {
-            "type": "prompt",
-            "prompt": "Before stopping, verify implementation completeness..."
+            "type": "command",
+            "command": "bash .claude/hooks/stop-check.sh"
+          }
+        ]
+      }
+    ],
+    "UserPromptSubmit": [
+      {
+        "matcher": "*",
+        "hooks": [
+          {
+            "type": "command",
+            "command": "bash .claude/hooks/skill-activate.sh"
           }
         ]
       }
```

## 4. [`.claude/skill-rules.yaml`](.claude/skill-rules.yaml)

New trigger definitions for 10 skills — keywords, regex patterns, and file-path globs.

```diff
+rules:
+  - skill: typescript-standards
+    description: TypeScript coding standards for strict, immutable, type-safe code
+    triggers:
+      keywords: [typescript, ts file, type error, typecheck, strict mode]
+      patterns: ["\\.(ts|tsx)\\b"]
+      file_paths: ["**/*.ts", "**/*.tsx"]
+
+  - skill: plugin-testing-standards
+    ...
+  - skill: system-cli-standards
+    ...
+  - skill: skills-standards
+    ...
+  - skill: agents-standards
+    ...
+  - skill: commands-standards
+    ...
+  - skill: critic
+    ...
+  - skill: docs-standards
+    ...
+  - skill: manifest-validation
+    ...
+  - skill: plugin-product-standards
+    ...
```
