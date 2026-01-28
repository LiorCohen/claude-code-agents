#!/bin/bash
# teardown.sh - Remove PostgreSQL database from local Kubernetes cluster
# Usage: ./scripts/teardown.sh
#
# This will delete the PostgreSQL deployment and all data.

set -e

NAMESPACE="${DB_NAMESPACE:-default}"
RELEASE_NAME="${DB_RELEASE_NAME:-{{PROJECT_NAME}}-db}"

echo "Removing PostgreSQL from namespace: $NAMESPACE"

# Uninstall Helm release
if helm status "$RELEASE_NAME" -n "$NAMESPACE" > /dev/null 2>&1; then
  helm uninstall "$RELEASE_NAME" -n "$NAMESPACE"
  echo "PostgreSQL uninstalled successfully"
else
  echo "Release $RELEASE_NAME not found in namespace $NAMESPACE"
fi

# Optionally delete PVC (uncomment to also delete data)
# echo "Deleting persistent volume claims..."
# kubectl delete pvc -l app.kubernetes.io/instance=$RELEASE_NAME -n $NAMESPACE

echo ""
echo "Teardown complete"
