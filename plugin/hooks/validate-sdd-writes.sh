#!/bin/bash
#
# SDD Write Validation Hook
# Auto-approves writes to safe SDD directories, blocks sensitive paths
#
# This hook is auto-registered when the SDD plugin is installed.
#

set -euo pipefail

# Read input from Claude Code
input=$(cat)

# Extract tool and file path
tool=$(echo "$input" | jq -r '.tool // ""')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Normalize path - remove leading ./
file_path="${file_path#./}"

# Define blocked patterns (security-sensitive)
BLOCKED_PATTERNS=(
  ".env"
  "secrets/"
  ".git/"
  "node_modules/"
  "credentials"
  "*.pem"
  "*.key"
  "id_rsa"
  "id_ed25519"
)

# Define safe directories for SDD operations
SAFE_DIRS=(
  "specs/"
  "components/"
  "config/"
  ".github/workflows/"
  "docs/"
  "tests/"
)

# Define safe root files
SAFE_FILES=(
  "README.md"
  "CLAUDE.md"
  "package.json"
  ".gitignore"
  "sdd-settings.yaml"
  "tsconfig.json"
  "vitest.config.ts"
  "jest.config.js"
  "jest.config.ts"
)

# Function to output allow decision
allow() {
  jq -n '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "decision": {
        "behavior": "allow"
      }
    }
  }'
  exit 0
}

# Function to output block decision
block() {
  local reason="$1"
  jq -n --arg reason "$reason" '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "decision": {
        "behavior": "block",
        "message": $reason
      }
    }
  }'
  exit 0
}

# Function to pass through (let Claude handle normally)
passthrough() {
  exit 0
}

# Skip if not Write or Edit
if [[ "$tool" != "Write" && "$tool" != "Edit" ]]; then
  passthrough
fi

# Skip if no file path
if [[ -z "$file_path" ]]; then
  passthrough
fi

# Check blocked patterns first (highest priority)
for pattern in "${BLOCKED_PATTERNS[@]}"; do
  case "$file_path" in
    *"$pattern"*)
      block "SDD hook: Blocked write to sensitive path containing '$pattern': $file_path"
      ;;
  esac
done

# Check safe directories
for dir in "${SAFE_DIRS[@]}"; do
  if [[ "$file_path" == "$dir"* ]]; then
    allow
  fi
done

# Check safe root files
for file in "${SAFE_FILES[@]}"; do
  if [[ "$file_path" == "$file" ]]; then
    allow
  fi
done

# Not in safe list - let Claude's normal permission flow handle it
passthrough
