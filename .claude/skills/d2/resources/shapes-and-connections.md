# Shapes and Connections

Complete reference for D2 shape types and connection syntax.

---

## Shape Types

### Basic Shapes

```d2
rect: Rectangle                    # shape: rectangle (default)
sq: Square {shape: square}
pg: Page {shape: page}
para: Parallelogram {shape: parallelogram}
doc: Document {shape: document}
cyl: Database {shape: cylinder}
q: Queue {shape: queue}
pkg: Package {shape: package}
stp: Step {shape: step}
call: Note {shape: callout}
store: Storage {shape: stored_data}
usr: User {shape: person}
dia: Decision {shape: diamond}
ov: Oval {shape: oval}
cir: Circle {shape: circle}
hex: Hexagon {shape: hexagon}
cld: Cloud {shape: cloud}
c4: C4 Person {shape: c4-person}
```

### Special Shapes

```d2
# Text — no border, just text on the diagram
title: Architecture Overview {
  shape: text
  style.font-size: 28
}

# Code — renders a code block
snippet: |go
  func main() {}
| {
  shape: code
}

# Image — external image URL (no label, just the image)
logo: {
  shape: image
  icon: https://example.com/logo.png
}

# SQL Table — tabular database schema shape
users: {
  shape: sql_table
  id: int {constraint: primary_key}
  name: varchar
}

# Class — UML class diagram shape
MyClass: {
  shape: class
  +public_field: string
  -private_field: int
  +method(arg): return_type
}

# Sequence Diagram — a container rendered as a sequence diagram
flow: {
  shape: sequence_diagram
  alice -> bob: hello
}
```

### Shape with Icon

Any shape can have an icon URL:

```d2
server: Web Server {
  icon: https://icons.terrastruct.com/aws/Compute/Amazon-EC2.svg
}
```

The `shape: image` type uses `icon` as the image source and renders only the image (no border).

---

## Connections

### Arrow Types

| Syntax | Description |
|--------|-------------|
| `a -> b` | Directed arrow from a to b |
| `a <- b` | Directed arrow from b to a |
| `a <-> b` | Bidirectional arrow |
| `a -- b` | Line with no arrowhead |

### Connection Labels

```d2
a -> b: sends request
a <- b: returns response
a <-> b: syncs data
a -- b: associated with
```

### Chained Connections

```d2
# Multiple shapes in one line
a -> b -> c -> d
a -> b: step 1 -> c: step 2
```

### Multiple Connections

Multiple connections between the same pair are allowed and auto-indexed:

```d2
client -> server: HTTP GET     # index [0]
client -> server: WebSocket    # index [1]
```

### Connection References

Reference existing connections to style or modify them:

```d2
a -> b: request

# Reference by index
(a -> b)[0].style.stroke: red
(a -> b)[0].style.stroke-dash: 5
(a -> b)[0].style.animated: true
```

### Self-Referencing Connections

```d2
server -> server: health check
```

---

## Arrowheads

Customize source and target arrowheads:

```d2
a -> b: {
  source-arrowhead: 1 {
    shape: diamond
    filled: true
  }
  target-arrowhead: * {
    shape: cf-many
  }
}
```

### Arrowhead Shapes

| Shape | Description |
|-------|-------------|
| `triangle` | Default filled triangle |
| `arrow` | Open arrow (like >) |
| `diamond` | Diamond (composition in UML) |
| `circle` | Small circle |
| `cf-one` | Crow's foot: one |
| `cf-many` | Crow's foot: many |
| `cf-one-required` | Crow's foot: exactly one |
| `cf-many-required` | Crow's foot: one or many |
| `box` | Small box |
| `cross` | Cross mark (X) |

### Arrowhead Labels

```d2
a -> b: {
  source-arrowhead: 1 {
    shape: cf-one-required
  }
  target-arrowhead: * {
    shape: cf-many
  }
}
```

### Entity Relationship Diagram

```d2
users -> orders: places {
  source-arrowhead: 1 {shape: cf-one-required}
  target-arrowhead: N {shape: cf-many}
}
orders -> products: contains {
  source-arrowhead: 1 {shape: cf-many-required}
  target-arrowhead: N {shape: cf-many}
}
```

---

## Containers

### Basic Nesting

```d2
aws: Amazon Web Services {
  vpc: VPC {
    public: Public Subnet {
      lb: Load Balancer
    }
    private: Private Subnet {
      app: App Server
      db: Database {shape: cylinder}
    }
  }
}
```

### Dot Notation

Shorthand for defining nested shapes without braces:

```d2
aws.vpc.public.lb: Load Balancer
aws.vpc.private.db: Database {shape: cylinder}

# Connections through containers
aws.vpc.public.lb -> aws.vpc.private.app: forward
```

### Parent Reference (`_`)

Use `_` to reference the parent scope from within a container:

```d2
christmas: {
  presents
}
birthdays: {
  presents
  _.christmas.presents -> presents: regift
}
```

Use `_._.x` for grandparent scope.

### Container Labels

```d2
system: Production System {
  label: Production System v2.0
}
```

### Semicolons for Inline

```d2
row: {a; b; c; d}
```

---

## Labels

### Explicit Labels

```d2
# Key and label differ
db: PostgreSQL Database
api: REST API v2
```

### Markdown Labels

```d2
explanation: |md
  # System Overview
  This uses **microservices** with:
  - Service A
  - Service B
|
```

### Code Labels

```d2
handler: |go
  func Handle(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(200)
  }
|
```

### LaTeX Labels

```d2
formula: |latex
  E = mc^2
|
```

### Block String Escaping

When content contains `|`, use extra pipes or a custom delimiter:

```d2
# Double pipe for content with single pipe
my_code: ||ts
  declare function getSmallPet(): Fish | Bird;
||

# Custom delimiter after first pipe
my_code: |`ts
  const x = (a > 1) || (b < 2)
`|
```

### Quoting Special Characters

If a label needs D2 reserved characters (`{`, `}`, `:`, `.`, `->`, `#`, `;`, `|`), quote it:

```d2
"a]b{c}d": My node
"a -> b": Not a connection, this is a shape name
```

### Empty Label

```d2
spacer: "" {
  width: 50
  height: 50
}
```
