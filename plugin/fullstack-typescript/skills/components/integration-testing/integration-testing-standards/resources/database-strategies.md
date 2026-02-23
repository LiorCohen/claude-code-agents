# Database Strategies

Strategies for managing test database state: initialization, cleanup, and seeding.

---

## Test Database Initialization

```typescript
// components/<testing-component>/tests/integration/helpers/database.ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export const getTestDatabase = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      max: 5,
    });
  }
  return pool;
};

export const closeTestDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
```

## Cleanup Strategies

### Transaction Rollback (Fastest)

```typescript
import { describe, it, beforeEach, afterEach } from 'vitest';
import { getTestDatabase } from '../helpers/database';

describe('User API', () => {
  let client: PoolClient;

  beforeEach(async () => {
    const pool = getTestDatabase();
    client = await pool.connect();
    await client.query('BEGIN');
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    client.release();
  });

  it('creates user', async () => {
    // Test runs in transaction, rolled back after
  });
});
```

### Truncate Tables (Clean State)

```typescript
// components/<testing-component>/tests/integration/helpers/cleanup.ts
const TABLES_TO_TRUNCATE = [
  'plan_items',
  'plans',
  'users',
  // Order matters - respect foreign keys
];

export const truncateTables = async (pool: Pool): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const table of TABLES_TO_TRUNCATE) {
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
    await client.query('COMMIT');
  } finally {
    client.release();
  }
};
```

### Delete by Test Marker (Surgical)

```typescript
export const cleanupTestData = async (pool: Pool, testRunId: string): Promise<void> => {
  const client = await pool.connect();
  try {
    // Delete only data created by this test run
    await client.query(`DELETE FROM users WHERE metadata->>'testRunId' = $1`, [testRunId]);
  } finally {
    client.release();
  }
};
```

---

## Seed Data

### SQL Seed Files

```sql
-- components/<testing-component>/fixtures/seed-data.sql
INSERT INTO users (id, email, name, role, client_id, password_hash, created_at)
VALUES
  ('seed-admin-1', 'admin@test.com', 'Test Admin', 'admin', 'test-client', '$2b$10$...', NOW()),
  ('seed-planner-1', 'planner@test.com', 'Test Planner', 'planner', 'test-client', '$2b$10$...', NOW());

INSERT INTO plans (id, name, owner_id, status, created_at)
VALUES
  ('seed-plan-1', 'Test Plan', 'seed-planner-1', 'draft', NOW());
```

### Programmatic Seeding

```typescript
// components/<testing-component>/tests/integration/helpers/seed.ts
import { Pool } from 'pg';
import { hashPassword } from './auth';

export const seedTestUsers = async (pool: Pool): Promise<void> => {
  const passwordHash = await hashPassword('TestPass123!');

  await pool.query(`
    INSERT INTO users (id, email, name, role, client_id, password_hash, created_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (id) DO NOTHING
  `, ['seed-user-1', 'test@example.com', 'Test User', 'planner', 'test-client', passwordHash]);
};
```
