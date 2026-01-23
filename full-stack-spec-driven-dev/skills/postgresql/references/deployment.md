# PostgreSQL Deployment

Local deployment patterns for Docker, Docker Compose, and Kubernetes.

---

## Docker

### Basic Container

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=app \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  postgres:16
```

### With Persistent Volume

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=app \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
```

### With Init Scripts

Mount SQL files to `/docker-entrypoint-initdb.d/` for automatic execution on first start:

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=app \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  -v ./init:/docker-entrypoint-initdb.d:ro \
  postgres:16
```

Init script directory structure:

```
init/
├── 01-schema.sql
├── 02-permissions.sql
└── 03-seed.sql
```

Scripts execute in alphabetical order. Only runs on fresh database (empty data volume).

### Connect to Container

```bash
# Interactive psql
docker exec -it postgres psql -U app -d myapp

# Run single command
docker exec postgres psql -U app -d myapp -c "SELECT version();"

# Run SQL file
docker exec -i postgres psql -U app -d myapp < script.sql
```

---

## Docker Compose

### Basic Setup

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    container_name: postgres
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### With Health Check

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  pgdata:
```

### App with Database Dependency

```yaml
services:
  app:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://app:secret@db:5432/myapp

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### With Init Scripts

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### Connect via Compose

```bash
# Interactive psql
docker compose exec db psql -U app -d myapp

# Run command
docker compose exec db psql -U app -d myapp -c "SELECT version();"

# View logs
docker compose logs db
```

---

## Kubernetes

### Simple Pod (Testing Only)

For quick testing, not production use:

```yaml
# postgres-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: postgres
  labels:
    app: postgres
spec:
  containers:
    - name: postgres
      image: postgres:16
      ports:
        - containerPort: 5432
      env:
        - name: POSTGRES_USER
          value: app
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: POSTGRES_DB
          value: myapp
      readinessProbe:
        exec:
          command: ["pg_isready", "-U", "app", "-d", "myapp"]
        initialDelaySeconds: 5
        periodSeconds: 5
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
stringData:
  password: secret
```

```bash
kubectl apply -f postgres-pod.yaml
kubectl port-forward pod/postgres 5432:5432
```

### StatefulSet with PVC (Persistent)

```yaml
# postgres-statefulset.yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
stringData:
  password: secret
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  labels:
    app: postgres
spec:
  type: ClusterIP
  ports:
    - port: 5432
      targetPort: 5432
  selector:
    app: postgres
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
  labels:
    app: postgres
spec:
  type: ClusterIP
  clusterIP: None
  ports:
    - port: 5432
      targetPort: 5432
  selector:
    app: postgres
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              value: app
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            - name: POSTGRES_DB
              value: myapp
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "app", "-d", "myapp"]
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

```bash
kubectl apply -f postgres-statefulset.yaml
```

### With Init Scripts via ConfigMap

```yaml
# postgres-init-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-init
data:
  01-schema.sql: |
    CREATE SCHEMA IF NOT EXISTS app;

    CREATE TABLE app.users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  02-permissions.sql: |
    CREATE ROLE app_role;
    GRANT USAGE ON SCHEMA app TO app_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_role;
```

Add to StatefulSet spec:

```yaml
spec:
  containers:
    - name: postgres
      # ... other config
      volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        - name: init-scripts
          mountPath: /docker-entrypoint-initdb.d
          readOnly: true
  volumes:
    - name: init-scripts
      configMap:
        name: postgres-init
```

### Connect via Kubernetes

```bash
# Port forward for local access
kubectl port-forward svc/postgres 5432:5432

# Then connect locally
psql -h localhost -U app -d myapp

# Or exec into pod
kubectl exec -it postgres-0 -- psql -U app -d myapp

# Run command
kubectl exec postgres-0 -- psql -U app -d myapp -c "SELECT version();"
```

### NodePort Service (External Access)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-external
spec:
  type: NodePort
  ports:
    - port: 5432
      targetPort: 5432
      nodePort: 30432
  selector:
    app: postgres
```

### Minikube Specifics

```bash
# Start minikube with enough resources
minikube start --cpus=2 --memory=4096

# Get service URL
minikube service postgres-external --url

# Or use tunnel
minikube tunnel
# Then connect to localhost:5432
```

### Kind Specifics

```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30432
        hostPort: 5432
        protocol: TCP
```

```bash
kind create cluster --config kind-config.yaml
# Apply postgres with NodePort 30432
# Connect to localhost:5432
```

---

## Initialization Scripts

### Directory Structure

```
init/
├── 01-schema.sql       # Table definitions
├── 02-permissions.sql  # Roles and grants
└── 03-seed.sql         # Initial data
```

### Example: 01-schema.sql

```sql
-- Create application schema
CREATE SCHEMA IF NOT EXISTS app;

-- Users table
CREATE TABLE app.users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON app.users (email);

-- Audit timestamps trigger
CREATE OR REPLACE FUNCTION app.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON app.users
    FOR EACH ROW
    EXECUTE FUNCTION app.update_updated_at();
```

### Example: 02-permissions.sql

```sql
-- Create application role
CREATE ROLE app_role;

-- Schema permissions
GRANT USAGE ON SCHEMA app TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO app_role;

-- Default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
    GRANT USAGE, SELECT ON SEQUENCES TO app_role;

-- Create application user
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT app_role TO app_user;

-- Set default schema
ALTER ROLE app_user SET search_path TO app, public;
```

### Example: 03-seed.sql

```sql
-- Seed initial data
INSERT INTO app.users (email, name, password_hash) VALUES
    ('admin@example.com', 'Admin', '$2a$10$...')
ON CONFLICT (email) DO NOTHING;
```

---

## Connection Strings

### Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?[options]
```

### Examples by Environment

```bash
# Docker (from host)
postgresql://app:secret@localhost:5432/myapp

# Docker Compose (from another container)
postgresql://app:secret@db:5432/myapp

# Kubernetes (via port-forward)
postgresql://app:secret@localhost:5432/myapp

# Kubernetes (in-cluster)
postgresql://app:secret@postgres.default.svc.cluster.local:5432/myapp

# With SSL
postgresql://app:secret@localhost:5432/myapp?sslmode=require
```

### Connection Options

| Option | Values | Description |
|--------|--------|-------------|
| `sslmode` | disable, allow, prefer, require, verify-ca, verify-full | SSL mode |
| `connect_timeout` | seconds | Connection timeout |
| `application_name` | string | Application identifier |
| `options` | string | Server options |

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs postgres

# Common issues:
# - Port already in use: stop other postgres or use different port
# - Permission denied: check volume permissions
# - Init script error: check SQL syntax
```

### Can't Connect

```bash
# Verify container is running
docker ps | grep postgres

# Check port binding
docker port postgres

# Test connectivity
nc -zv localhost 5432

# Check pg_hba.conf allows connections
docker exec postgres cat /var/lib/postgresql/data/pg_hba.conf
```

### Init Scripts Not Running

Init scripts only run when the data directory is empty (first start):

```bash
# Reset to run init scripts again
docker compose down -v  # Removes volumes
docker compose up -d
```

### Kubernetes Pod Pending

```bash
# Check events
kubectl describe pod postgres-0

# Common issues:
# - PVC not bound: check storage class
# - Insufficient resources: check node capacity
```
