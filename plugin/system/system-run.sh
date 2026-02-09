#!/bin/bash
# system-run.sh - Single entry point for all prompt-to-CLI invocations
# Used by skills, agents, and commands. Hooks use hook-runner.sh instead.
exec node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js" "$@"
