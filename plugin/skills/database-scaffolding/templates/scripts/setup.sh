#!/bin/bash
# setup.sh - Deploy PostgreSQL database to local Kubernetes cluster
# Usage: ./scripts/setup.sh
#
# Prerequisites:
#   - kubectl configured with local cluster (Docker Desktop, minikube, kind)
#   - Helm 3 installed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="${DB_NAMESPACE:-default}"
RELEASE_NAME="${DB_RELEASE_NAME:-{{PROJECT_NAME}}-db}"

echo "Deploying PostgreSQL to namespace: $NAMESPACE"

# Create namespace if it doesn't exist
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Add Bitnami repo if not present
helm repo add bitnami https://charts.bitnami.com/bitnami 2>/dev/null || true
helm repo update

# Install PostgreSQL
helm upgrade --install "$RELEASE_NAME" bitnami/postgresql \
  --namespace "$NAMESPACE" \
  --set auth.database={{PROJECT_NAME}} \
  --set auth.username={{PROJECT_NAME}} \
  --set auth.password={{PROJECT_NAME}}-local \
  --set primary.persistence.size=1Gi \
  --wait

echo ""
echo "PostgreSQL deployed successfully!"
echo ""
echo "Connection details:"
echo "  Host: $RELEASE_NAME-postgresql.$NAMESPACE.svc.cluster.local"
echo "  Port: 5432"
echo "  Database: {{PROJECT_NAME}}"
echo "  Username: {{PROJECT_NAME}}"
echo "  Password: {{PROJECT_NAME}}-local"
echo ""
echo "To connect locally, run: npm run port-forward"
