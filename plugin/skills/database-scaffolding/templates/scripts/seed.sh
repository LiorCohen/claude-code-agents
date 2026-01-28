#!/bin/bash
# seed.sh - Run all database seed files in order
# Usage: ./scripts/seed.sh
#
# Requires port-forward to be running, or PGHOST/PGPORT to be configured.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEEDS_DIR="$SCRIPT_DIR/../seeds"

# Default connection settings (assumes port-forward is running)
export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGDATABASE="${PGDATABASE:-{{PROJECT_NAME}}}"
export PGUSER="${PGUSER:-{{PROJECT_NAME}}}"
export PGPASSWORD="${PGPASSWORD:-{{PROJECT_NAME}}-local}"

# Verify PostgreSQL connection
if ! psql -c "SELECT 1" > /dev/null 2>&1; then
    echo "Error: Cannot connect to PostgreSQL at $PGHOST:$PGPORT"
    echo "Make sure port-forward is running: npm run port-forward"
    exit 1
fi

# Run seeds in order
echo "Running seeds..."
for f in "$SEEDS_DIR"/*.sql; do
    if [ -f "$f" ]; then
        echo "  $(basename "$f")"
        psql -f "$f"
    fi
done

echo "Seeding complete"
