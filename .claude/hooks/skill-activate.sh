#!/usr/bin/env bash
# UserPromptSubmit hook: auto-activate relevant skills based on prompt content.
# Reads skill-rules.yaml and matches the user's prompt against keyword, pattern,
# and file-path triggers. Outputs a systemMessage listing matched skills.
set -euo pipefail

# Read stdin JSON
input="$(cat)"
prompt="$(printf '%s' "$input" | jq -r '.prompt // ""')"
cwd="$(printf '%s' "$input" | jq -r '.cwd // ""')"

# Nothing to match against
if [[ -z "$prompt" ]]; then
  echo '{}'
  exit 0
fi

# Locate skill-rules.yaml relative to cwd
config="${cwd}/.claude/skill-rules.yaml"
if [[ ! -f "$config" ]]; then
  echo '{}'
  exit 0
fi

# Parse YAML to JSON
rules_json="$(yq -o=json '.' "$config" 2>/dev/null)" || { echo '{}'; exit 0; }

# Number of rules
rule_count="$(printf '%s' "$rules_json" | jq '.rules | length')"
if [[ "$rule_count" -eq 0 ]]; then
  echo '{}'
  exit 0
fi

prompt_lower="$(printf '%s' "$prompt" | tr '[:upper:]' '[:lower:]')"
matched_skills=()

for (( i=0; i<rule_count; i++ )); do
  rule="$(printf '%s' "$rules_json" | jq -c ".rules[$i]")"
  skill="$(printf '%s' "$rule" | jq -r '.skill')"
  description="$(printf '%s' "$rule" | jq -r '.description')"
  matched=false

  # Check keywords (case-insensitive substring match)
  keyword_count="$(printf '%s' "$rule" | jq '.triggers.keywords // [] | length')"
  for (( k=0; k<keyword_count; k++ )); do
    keyword="$(printf '%s' "$rule" | jq -r ".triggers.keywords[$k]")"
    keyword_lower="$(printf '%s' "$keyword" | tr '[:upper:]' '[:lower:]')"
    if [[ "$prompt_lower" == *"$keyword_lower"* ]]; then
      matched=true
      break
    fi
  done

  # Check patterns (regex match) — only if not already matched
  if [[ "$matched" == false ]]; then
    pattern_count="$(printf '%s' "$rule" | jq '.triggers.patterns // [] | length')"
    for (( p=0; p<pattern_count; p++ )); do
      pattern="$(printf '%s' "$rule" | jq -r ".triggers.patterns[$p]")"
      if [[ "$prompt" =~ $pattern ]]; then
        matched=true
        break
      fi
    done
  fi

  # Check file_paths (extract file-like tokens from prompt, glob match) — only if not already matched
  if [[ "$matched" == false ]]; then
    fp_count="$(printf '%s' "$rule" | jq '.triggers.file_paths // [] | length')"
    if [[ "$fp_count" -gt 0 ]]; then
      # Extract tokens that look like file paths (contain / or end with known extensions)
      file_tokens=()
      for token in $prompt; do
        if [[ "$token" =~ \.(ts|tsx|md|sh|json|yaml|yml)$ ]] || [[ "$token" == */* ]]; then
          file_tokens+=("$token")
        fi
      done

      for token in "${file_tokens[@]+"${file_tokens[@]}"}"; do
        for (( f=0; f<fp_count; f++ )); do
          fp_pattern="$(printf '%s' "$rule" | jq -r ".triggers.file_paths[$f]")"
          # Simple glob matching: convert glob to regex
          # Replace ** with a placeholder, then * with [^/]*, then restore **
          regex="$(printf '%s' "$fp_pattern" | sed 's/\*\*/__DOUBLESTAR__/g; s/\*/[^\/]*/g; s/__DOUBLESTAR__/.*/g')"
          if [[ "$token" =~ ^${regex}$ ]]; then
            matched=true
            break 2
          fi
        done
      done
    fi
  fi

  if [[ "$matched" == true ]]; then
    matched_skills+=("- /${skill} — ${description}")
  fi
done

if [[ ${#matched_skills[@]} -eq 0 ]]; then
  echo '{}'
  exit 0
fi

# Build systemMessage
message="Relevant skills for this task:"
for entry in "${matched_skills[@]}"; do
  message="${message}\n${entry}"
done

jq -n --arg msg "$message" '{ "systemMessage": $msg }'
