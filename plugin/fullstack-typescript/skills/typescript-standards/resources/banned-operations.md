# Banned Mutable Operations

**CRITICAL:** These operations mutate data in place and are strictly forbidden.

## Banned Array Methods

| Method | Why Banned | Use Instead |
|--------|------------|-------------|
| `.push()` | Mutates array | `[...arr, item]` or `.concat([item])` |
| `.pop()` | Mutates array | `arr.slice(0, -1)` for new array |
| `.shift()` | Mutates array | `arr.slice(1)` for new array |
| `.unshift()` | Mutates array | `[item, ...arr]` |
| `.splice()` | Mutates array | `.slice()` + spread to reconstruct |
| `.sort()` | Mutates array | `[...arr].sort()` or `.toSorted()` |
| `.reverse()` | Mutates array | `[...arr].reverse()` or `.toReversed()` |
| `.fill()` | Mutates array | `Array.from()` with mapping |

```typescript
// BAD: Mutable operations
const items: string[] = [];
items.push('new');           // Mutates!
items.splice(1, 1);          // Mutates!
items.sort();                // Mutates!

// GOOD: Immutable alternatives
const items: ReadonlyArray<string> = [];
const withNew = [...items, 'new'];
const withoutSecond = [...items.slice(0, 1), ...items.slice(2)];
const sorted = [...items].sort();  // Or items.toSorted() in ES2023+
```

## Banned Object Operations

| Operation | Why Banned | Use Instead |
|-----------|------------|-------------|
| `obj.prop = value` | Mutates object | `{ ...obj, prop: value }` |
| `obj['key'] = value` | Mutates object | `{ ...obj, [key]: value }` |
| `delete obj.prop` | Mutates object | Destructure + rest: `const { prop, ...rest } = obj` |
| `Object.assign(target, ...)` | Mutates target | `{ ...target, ...source }` |

```typescript
// BAD: Mutable operations
const user = { name: 'Alice', age: 30 };
user.age = 31;               // Mutates!
user['role'] = 'admin';      // Mutates!
delete user.age;             // Mutates!

// GOOD: Immutable alternatives
const user: Readonly<User> = { name: 'Alice', age: 30 };
const older = { ...user, age: 31 };
const withRole = { ...user, role: 'admin' };
const { age, ...withoutAge } = user;
```

## Banned Map/Set Operations

| Operation | Why Banned | Use Instead |
|-----------|------------|-------------|
| `map.set()` | Mutates map | `new Map([...map, [key, value]])` |
| `map.delete()` | Mutates map | Filter and reconstruct |
| `set.add()` | Mutates set | `new Set([...set, item])` |
| `set.delete()` | Mutates set | Filter and reconstruct |
| `map.clear()` | Mutates map | `new Map()` |
| `set.clear()` | Mutates set | `new Set()` |

```typescript
// BAD: Mutable operations
const cache = new Map<string, number>();
cache.set('key', 42);        // Mutates!
cache.delete('key');         // Mutates!

// GOOD: Immutable alternatives
const cache: ReadonlyMap<string, number> = new Map();
const withEntry = new Map([...cache, ['key', 42]]);
const withoutKey = new Map([...cache].filter(([k]) => k !== 'key'));
```
