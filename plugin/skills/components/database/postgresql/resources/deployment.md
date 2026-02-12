# Deployment

Local deployment options for PostgreSQL.

---

## Docker (Quick Start)

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

## Docker Compose

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

volumes:
  pgdata:
```

## Kubernetes

```bash
# Simple pod for testing
kubectl run postgres --image=postgres:16 \
  --env="POSTGRES_PASSWORD=secret" \
  --port=5432

# Port forward for local access
kubectl port-forward pod/postgres 5432:5432
```
