# Special Diagrams

Reference for sequence diagrams, grid layouts, SQL tables, and UML class diagrams.

---

## Sequence Diagrams

Set `shape: sequence_diagram` on a container. Children become actors, connections become messages.

### Basic Sequence

```d2
api_flow: {
  shape: sequence_diagram

  client
  gateway: API Gateway
  auth: Auth Service
  db: Database {shape: cylinder}

  client -> gateway: POST /login
  gateway -> auth: validate credentials
  auth -> db: SELECT user
  db -> auth: user record
  auth -> gateway: JWT token
  gateway -> client: 200 OK + token
}
```

### Self-Referencing Messages

Use a quoted string on the actor:

```d2
flow: {
  shape: sequence_diagram
  server
  server."validates input"
  server -> db: query
}
```

### Spans (Activation Boxes)

Create a span by adding messages within an actor:

```d2
flow: {
  shape: sequence_diagram
  client
  server

  client -> server: request
  server."processing" {
    server -> server: validate
    server -> server: transform
  }
  server -> client: response
}
```

### Groups

Group related messages visually:

```d2
flow: {
  shape: sequence_diagram
  alice
  bob

  auth phase: {
    alice -> bob: login request
    bob -> alice: challenge
    alice -> bob: credentials
  }

  data phase: {
    alice -> bob: fetch data
    bob -> alice: data response
  }
}
```

### Notes

Add notes to actors:

```d2
flow: {
  shape: sequence_diagram
  alice
  bob

  alice -> bob: hello
  bob."thinking about response"
  bob -> alice: hi back
}
```

### Sequence Diagram Styling

Actors in sequence diagrams can use shapes and styles:

```d2
flow: {
  shape: sequence_diagram
  client: Mobile App {
    shape: person
  }
  server: Backend {
    shape: hexagon
  }
  db: PostgreSQL {
    shape: cylinder
  }

  client -> server: API call
  server -> db: query
}
```

---

## Grid Diagrams

Grid layouts arrange children in rows/columns. Set `grid-rows` or `grid-columns` on any container.

### Row-Based Grid

```d2
comparison: {
  grid-rows: 3

  Feature A
  Feature B
  Feature C
}
```

### Column-Based Grid

```d2
dashboard: {
  grid-columns: 3

  Panel 1
  Panel 2
  Panel 3
}
```

### Fixed Grid Dimensions

```d2
layout: {
  grid-rows: 2
  grid-columns: 2

  Top Left
  Top Right
  Bottom Left
  Bottom Right
}
```

### Gap Control

```d2
tight: {
  grid-columns: 3
  grid-gap: 0

  a; b; c
}

spacious: {
  grid-columns: 3
  grid-gap: 20

  x; y; z
}
```

### Cell Dimensions

Individual cells can have custom widths/heights. Cells expand to fill available space.

```d2
layout: {
  grid-rows: 2

  header
  body

  header.width: 800
}
```

### Nested Grids

Grids can be nested for complex layouts:

```d2
page: {
  grid-gap: 0
  grid-columns: 1

  header
  body: "" {
    grid-gap: 0
    grid-columns: 2
    content
    sidebar
  }
  footer
}
```

### Grid with Styled Cells

```d2
classes: {
  cell: {
    width: 120
    height: 80
    style: {
      fill: "#e3f2fd"
      stroke: "#1565c0"
      border-radius: 8
    }
  }
}

board: {
  grid-columns: 4
  grid-rows: 3
  grid-gap: 10

  a.class: cell
  b.class: cell
  c.class: cell
  d.class: cell
}
```

### Connections Between Grid Cells

Grid cells can be connected. Connections are drawn outside the grid:

```d2
grid: {
  grid-columns: 3
  a; b; c
}

grid.a -> grid.c: skip
```

---

## SQL Tables

Set `shape: sql_table` to create database schema diagrams.

### Basic Table

```d2
users: {
  shape: sql_table
  id: int {constraint: primary_key}
  email: varchar {constraint: unique}
  name: varchar
  created_at: timestamp
  updated_at: timestamp
}
```

### Constraints

| Constraint | Meaning |
|-----------|---------|
| `primary_key` | Primary key (PK) |
| `foreign_key` | Foreign key (FK) |
| `unique` | Unique constraint |

Multiple constraints:

```d2
users: {
  shape: sql_table
  id: int {constraint: primary_key}
  email: varchar {constraint: [unique; not null]}
}
```

### Foreign Key Relationships

Connect columns across tables:

```d2
users: {
  shape: sql_table
  id: int {constraint: primary_key}
  name: varchar
}

orders: {
  shape: sql_table
  id: int {constraint: primary_key}
  user_id: int {constraint: foreign_key}
  total: decimal
}

orders.user_id -> users.id
```

### Full Schema Example

```d2
direction: right

users: {
  shape: sql_table
  id: int {constraint: primary_key}
  email: varchar {constraint: unique}
  name: varchar
  org_id: int {constraint: foreign_key}
}

organizations: {
  shape: sql_table
  id: int {constraint: primary_key}
  name: varchar
  plan: varchar
}

projects: {
  shape: sql_table
  id: int {constraint: primary_key}
  name: varchar
  org_id: int {constraint: foreign_key}
  created_by: int {constraint: foreign_key}
}

users.org_id -> organizations.id
projects.org_id -> organizations.id
projects.created_by -> users.id
```

### SQL Tables in Containers

```d2
cloud: {
  db: {
    shape: sql_table
    id: int {constraint: primary_key}
    data: jsonb
  }

  cache: {
    shape: sql_table
    key: varchar {constraint: primary_key}
    value: text
    ttl: int
  }

  db -> cache: invalidates
}
```

---

## UML Class Diagrams

Set `shape: class` for UML-style class shapes.

### Basic Class

```d2
User: {
  shape: class
  # Visibility prefixes: + public, - private, # protected
  +id: string
  +email: string
  -passwordHash: string
  #role: Role

  +authenticate(password: string): boolean
  +updateProfile(data: ProfileData): void
  -hashPassword(plain: string): string
}
```

### Visibility Prefixes

| Prefix | Visibility |
|--------|-----------|
| `+` | Public |
| `-` | Private |
| `#` | Protected |

### Class Relationships

```d2
Animal: {
  shape: class
  +name: string
  +speak(): string
}

Dog: {
  shape: class
  +breed: string
  +fetch(): void
}

Cat: {
  shape: class
  +indoor: boolean
  +purr(): void
}

# Inheritance
Dog -> Animal: inherits
Cat -> Animal: inherits

# Association
Owner: {
  shape: class
  +name: string
}
Owner -> Animal: owns {
  source-arrowhead: 1 {shape: cf-one}
  target-arrowhead: * {shape: cf-many}
}
```

### Interface Pattern

```d2
Serializable: {
  shape: class
  +serialize(): string
  +deserialize(data: string): void
}

JsonDocument: {
  shape: class
  +content: object
  +serialize(): string
  +deserialize(data: string): void
}

JsonDocument -> Serializable: implements {
  style.stroke-dash: 5
}
```
