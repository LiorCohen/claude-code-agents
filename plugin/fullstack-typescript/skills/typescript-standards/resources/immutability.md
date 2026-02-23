# Immutability

## Immutability Rules (Non-Negotiable)

```typescript
// GOOD: Readonly everything
interface User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
}

// GOOD: ReadonlyArray
const users: ReadonlyArray<User> = [];

// GOOD: Readonly generic types
type Config = Readonly<{
  port: number;
  host: string;
}>;

const settings: ReadonlyMap<string, string> = new Map();
const tags: ReadonlySet<string> = new Set();

// GOOD: Spread for updates
const updated = { ...user, email: newEmail };

// BAD: Mutation
user.email = newEmail;
users.push(newUser);
```

**Immutability checklist:**
- Use `readonly` on all interface/type properties
- Use `ReadonlyArray<T>` for arrays
- Use `Readonly<T>`, `ReadonlyMap<K,V>`, `ReadonlySet<T>` for generic types
- Use `const` exclusively; never use `let` or `var`
- Use spread operators for updates (never mutate)

## Functional Alternatives to `let`

```typescript
// BAD: let for accumulation
let total = 0;
for (let i = 0; i < items.length; i++) {
  total += items[i].price;
}

// GOOD: reduce
const total = items.reduce((sum, item) => sum + item.price, 0);

// BAD: let for conditional assignment
let label;
if (status === 'active') {
  label = 'Running';
} else {
  label = 'Stopped';
}

// GOOD: ternary or immediately-invoked expression
const label = status === 'active' ? 'Running' : 'Stopped';

// BAD: let for loop building an array
let results = [];
for (let i = 0; i < items.length; i++) {
  results.push(transform(items[i]));
}

// GOOD: map
const results = items.map(transform);
```

## Prefer Readonly Types

When defining function parameters, return types, and variables, default to readonly:

```typescript
// GOOD: Readonly parameters
const processUsers = (users: ReadonlyArray<User>): ReadonlyArray<User> => {
  return users.filter(u => u.active);
};

// GOOD: Readonly in interfaces
interface UserCardProps {
  readonly user: User;
  readonly onEdit: (id: string) => void;
}

// GOOD: Const with readonly types
const config: Readonly<Config> = loadConfig();
```
