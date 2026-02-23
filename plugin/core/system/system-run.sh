#!/bin/bash
# system-run.sh - Single entry point for all prompt-to-CLI invocations
# Used by skills, agents, and commands. Hooks use hook-runner.sh instead.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
exec node --enable-source-maps "$PLUGIN_ROOT/system/dist/cli.js" "$@"
