#!/bin/bash
# system-run.sh - Entry point for core SDD system CLI
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec node --enable-source-maps "$SCRIPT_DIR/dist/cli.js" "$@"
