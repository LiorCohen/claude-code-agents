#!/bin/bash
# hook-runner.sh - Single entry point for all SDD hooks
# Passes hook name and stdin to the TypeScript CLI
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
exec node --enable-source-maps "$PLUGIN_ROOT/system/dist/cli.js" hook "$@"
