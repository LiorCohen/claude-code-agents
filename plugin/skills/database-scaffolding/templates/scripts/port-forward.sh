#!/bin/bash
# port-forward.sh - Forward local port to PostgreSQL pod in Kubernetes
# Usage: ./scripts/port-forward.sh
#
# This enables connecting to the database from your local machine.
# Default forwards to localhost:5432

set -e

NAMESPACE="${DB_NAMESPACE:-default}"
RELEASE_NAME="${DB_RELEASE_NAME:-{{PROJECT_NAME}}-db}"
LOCAL_PORT="${DB_LOCAL_PORT:-5432}"

echo "Forwarding localhost:$LOCAL_PORT to PostgreSQL..."
echo "Press Ctrl+C to stop"
echo ""

kubectl port-forward \
  "svc/$RELEASE_NAME-postgresql" \
  "$LOCAL_PORT:5432" \
  -n "$NAMESPACE"
