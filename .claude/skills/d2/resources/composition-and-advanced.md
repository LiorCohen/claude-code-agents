# Composition and Advanced Features

Reference for variables, globs, imports, layers, scenarios, and steps.

---

## Variables (vars)

Define reusable values via the `vars` block. Reference with `${name}`.

### Basic Variables

```d2
vars: {
  env: Production
  color: "#4baae5"
}

server: ${env} Server {
  style.fill: ${color}
}
```

### Nested Variables

```d2
vars: {
  colors: {
    primary: "#1565c0"
    secondary: "#42a5f5"
    danger: "#c62828"
  }
}

header.style.fill: ${colors.primary}
alert.style.fill: ${colors.danger}
```

### Scoped Variables

Inner scopes override outer. Each container can define its own `vars`:

```d2
vars: {
  region: Global
}

title: ${region} Infrastructure

us_east: {
  vars: {
    region: us-east-1
  }
  server: ${region} API   # renders "us-east-1 API"
}
```

### Escaped Variables

Use single quotes to prevent substitution:

```d2
vars: {
  name: Alice
}
note: 'Send field ${name}'   # literal "${name}" in output
```

### Spread Variables

Spread a variable map into another context:

```d2
vars: {
  base-constraints: [NOT NULL; UNQ]
  shared-note: DISCLAIMER {
    I am not a lawyer
    near: top-center
  }
}

data: {
  shape: sql_table
  id: int {constraint: [PK; ...${base-constraints}]}
}

note: DRAFT DISCLAIMER {
  ...${shared-note}
}
```

### d2-config Variables

Special `d2-config` key in `vars` configures the renderer:

```d2
vars: {
  d2-config: {
    theme-id: 4
    dark-theme-id: 200
    pad: 50
    center: true
    sketch: true
    layout-engine: elk
  }
}
```

| Config Key | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme-id` | int | 0 | Light theme ID |
| `dark-theme-id` | int | none | Dark theme ID (for system dark mode) |
| `pad` | int | 100 | Padding around diagram in pixels |
| `center` | bool | false | Center the diagram |
| `sketch` | bool | false | Hand-drawn aesthetic |
| `layout-engine` | string | `dagre` | Layout engine: `dagre`, `elk`, `tala` |
| `theme-overrides` | map | none | Override specific theme colors |
| `dark-theme-overrides` | map | none | Override specific dark theme colors |

---

## Globs

Bulk-apply properties to multiple shapes using wildcard patterns.

### Single-Level Glob (`*`)

Matches all direct children:

```d2
servers: {
  web1
  web2
  web3
  *.style.fill: "#e3f2fd"
  *.shape: hexagon
}
```

### Wildcard in Names

```d2
iphone 10
iphone 11 mini
iphone 11 pro
iphone 12 mini

*.height: 300
*.width: 140
*mini.height: 200
*pro.height: 400
```

### Recursive Glob (`**`)

Matches all descendants recursively:

```d2
system: {
  frontend: {
    react
    next
  }
  backend: {
    express
    postgres
  }
}

system.**.style.border-radius: 7
```

### Triple Glob (`***`)

Matches all descendants including self:

```d2
***.style.fill: lightblue
(*** -> ***)[*].style.stroke: red
```

### Connection Globs

Apply to all connections:

```d2
a; b; c
* -> *: connects
```

### Scoped Globs

Globs are scoped to their container:

```d2
foods: {
  pizzas: {
    cheese; pepperoni; hawaiian
    *.shape: circle
  }
  people: {
    alice; bob
    *.shape: person
  }
  people.* -> pizzas.hawaiian: eats
}
```

### Filter Globs (`&`)

Target only shapes matching a property:

```d2
# Only apply to shapes that are already "person"
*: {
  &shape: person
  style.multiple: true
}
```

### Nested Filter + Recursive

```d2
# Find all sequence diagrams recursively, then set all shapes inside to person
**: {
  &shape: sequence_diagram
  **: {shape: person}
}
```

---

## Imports

Reuse D2 content across files.

### Regular Import

Import a file as a shape's contents:

```d2
# Imports the full contents of base.d2 as the value of "network"
network: @base
```

Equivalent to writing the contents of `base.d2` inside `network: { ... }`.

### Spread Import

Insert a file's contents into the current map:

```d2
# Spread base.d2 contents into the current scope
...@base
```

Spread imports only work inside maps (not as a value assignment).

### Partial Import

Import a specific object from a file:

```d2
# Import only the "manager" object from people.d2
ceo: @people.manager
```

### File Extension

Omit the `.d2` extension in imports (autoformatter removes it):

```d2
...@shared       # imports shared.d2
network: @base   # imports base.d2
```

### Relative Imports

Imports are relative to the importing file's location:

```d2
...@../shared/styles    # go up one directory
...@./local             # explicit current directory (unnecessary, autoformatted away)
```

---

## Layers

Layers represent different levels of abstraction. Each layer starts as a **blank** board (does not inherit from parent).

```d2
title: System Overview {
  shape: text
  near: top-center
}

High Level View: {
  link: layers.detailed
}

layers: {
  detailed: {
    title: Detailed Architecture {
      shape: text
      near: top-center
    }
    frontend -> backend: API calls
    backend -> database: queries
  }
}
```

### Navigating Between Layers

Use `link: layers.<name>` to create clickable navigation in SVG output:

```d2
overview: Click to drill down {
  link: layers.detail
}

layers: {
  detail: {
    service-a -> service-b
    back: Go back {
      link: _
    }
  }
}
```

`link: _` links back to the parent layer.

### Nested Layers

Layers can be nested arbitrarily deep:

```d2
layers: {
  level1: {
    node: {
      link: layers.level2
    }
    layers: {
      level2: {
        deep-node
      }
    }
  }
}
```

---

## Scenarios

Scenarios represent different views of the same base diagram. Each scenario **inherits** all objects from its parent and can modify or add to them.

```d2
# Base diagram
client -> server: request
server -> db: query

scenarios: {
  error_case: {
    # Inherited shapes exist — modify them
    server -> client: 500 Error {
      style.stroke: red
    }
    (server -> db)[0].style.opacity: 0.2
  }

  cached: {
    server -> cache: check cache {
      style.stroke: green
    }
    (server -> db)[0].style.stroke-dash: 5
  }
}
```

Key points:
- Scenarios inherit **all** objects and connections from the parent board
- New objects/connections are added on top
- Existing objects can be referenced and modified (style changes, opacity, etc.)
- Output produces multiple boards (one base + one per scenario)

### Dimming Base Elements

A common pattern is to dim irrelevant parts of the base to highlight the scenario's focus:

```d2
a -> b -> c -> d

scenarios: {
  focus_bc: {
    (a -> b)[0].style.opacity: 0.1
    a.style.opacity: 0.3
    (c -> d)[0].style.opacity: 0.1
    d.style.opacity: 0.3
  }
}
```

---

## Steps

Steps are like scenarios but each step inherits from the **previous step** (not the base). Used for progressive/animated diagrams.

```d2
# Base board (step 0)
title: Deployment Pipeline {
  shape: text
  near: top-center
}

steps: {
  1: {
    code: Write Code
  }
  2: {
    # Inherits "code" from step 1
    code -> test: Run Tests
  }
  3: {
    # Inherits everything from step 2
    test -> deploy: Deploy
  }
  4: {
    deploy -> monitor: Monitor
  }
}
```

### Animated Output

Use `--animate-interval` with the CLI for animated step transitions:

```bash
d2 --animate-interval 1500 pipeline.d2 pipeline.svg
```

---

## Overrides

Later declarations override earlier ones for the same key:

```d2
x: Hello
x: World    # x now has label "World"

x.style.fill: red
x.style.fill: blue   # fill is now blue
```

Connection labels use indexing — they don't override:

```d2
a -> b: first    # (a -> b)[0]
a -> b: second   # (a -> b)[1]  — new connection, not an override
```

---

## Reserved Keywords

These identifiers have special meaning and cannot be used as shape names without quoting:

| Keyword | Purpose |
|---------|---------|
| `shape` | Set shape type |
| `label` | Set display label |
| `style` | Style properties container |
| `icon` | Icon URL |
| `tooltip` | Hover text |
| `link` | Clickable URL |
| `near` | Position control |
| `width` | Shape width |
| `height` | Shape height |
| `direction` | Layout direction |
| `class` | Apply a class |
| `classes` | Define classes |
| `vars` | Define variables |
| `layers` | Define layers |
| `scenarios` | Define scenarios |
| `steps` | Define steps |
| `constraint` | SQL table constraint |
| `grid-rows` | Grid row count |
| `grid-columns` | Grid column count |
| `grid-gap` | Grid gap size |
| `horizontal-gap` | Horizontal spacing |
| `vertical-gap` | Vertical spacing |
| `source-arrowhead` | Source arrowhead config |
| `target-arrowhead` | Target arrowhead config |
| `top` | Top position (TALA only) |
| `left` | Left position (TALA only) |
