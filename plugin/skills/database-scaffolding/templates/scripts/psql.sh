#!/bin/bash
# psql.sh - Connect to PostgreSQL database via psql
# Usage: ./scripts/psql.sh
#
# Requires port-forward to be running in another terminal,
# or PGHOST/PGPORT to be configured.

set -e

# Default connection settings (assumes port-forward is running)
export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGDATABASE="${PGDATABASE:-{{PROJECT_NAME}}}"
export PGUSER="${PGUSER:-{{PROJECT_NAME}}}"
export PGPASSWORD="${PGPASSWORD:-{{PROJECT_NAME}}-local}"

echo "Connecting to $PGDATABASE@$PGHOST:$PGPORT as $PGUSER..."
echo ""

psql
