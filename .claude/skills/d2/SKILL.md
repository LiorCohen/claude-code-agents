---
name: d2
description: "D2 diagramming language reference for architecture diagrams, sequence diagrams, grid layouts, SQL tables, and class diagrams. Produces .d2 files rendered via CLI or playground."
---

# D2 Diagramming Language

D2 is a text-to-diagram language. Write `.d2` files and render them to SVG/PNG via the `d2` CLI or https://play.d2lang.com.

---

## When to Use

- Creating architecture or system diagrams for plans and documentation
- Drawing sequence diagrams for API or workflow interactions
- Building data model diagrams with SQL table shapes
- Laying out grid-based comparison or dashboard diagrams
- Visualizing deployment topologies, state machines, or flowcharts

---

## Quick Reference

| Concept | Syntax |
|---------|--------|
| Shape | `name` or `name: Label` |
| Connection | `a -> b` or `a -> b: label` |
| Reverse / bidirectional | `a <- b` / `a <-> b` |
| Line (no arrow) | `a -- b` |
| Container | `parent: { child1; child2 }` |
| Dot nesting | `parent.child.grandchild` |
| Set shape type | `name.shape: oval` |
| Style | `name.style.fill: "#ff0000"` |
| Icon | `name.icon: https://url/icon.svg` |
| Tooltip | `name.tooltip: hover text` |
| Link | `name.link: https://example.com` |
| Class | `classes: { c: { style: {...} } }` then `name.class: c` |
| Variable | `vars: { k: v }` then `${k}` |
| Direction | `direction: right` |
| Comment | `# single line comment` |
| SQL table | `name.shape: sql_table` then `col: type {constraint: pk}` |
| Sequence diagram | `name.shape: sequence_diagram` |
| Grid | `name.grid-rows: 3` or `name.grid-columns: 3` |
| Layers | `layers: { name: { ... } }` |
| Scenarios | `scenarios: { name: { ... } }` (inherits parent) |
| Steps | `steps: { 1: { ... } 2: { ... } }` (each inherits previous) |
| Import | `a: @file` or `...@file` (spread) |
| Glob | `*.style.fill: red` / `**.style.fill: red` |
| Null (delete) | `x: null` / `(a -> b)[0]: null` |

---

## Core Syntax

### Shapes

Any identifier becomes a shape. The default shape is `rectangle`.

```d2
server
database: My Database
api: API Gateway {
  shape: hexagon
}
```

All shape types: `rectangle`, `square`, `page`, `parallelogram`, `document`, `cylinder`, `queue`, `package`, `step`, `callout`, `stored_data`, `person`, `diamond`, `oval`, `circle`, `hexagon`, `cloud`, `text`, `code`, `class`, `sql_table`, `image`, `sequence_diagram`, `c4-person`.

### Connections

```d2
a -> b: request
b -> a: response
a <-> b: bidirectional
a -- b: line (no arrowhead)

# Multiple connections between same shapes are indexed
a -> b: first   # (a -> b)[0]
a -> b: second  # (a -> b)[1]
```

### Connection References

Style existing connections by referencing them:

```d2
a -> b: request
(a -> b)[0].style.stroke: red
(a -> b)[0].style.stroke-dash: 5
```

### Arrowheads

```d2
a -> b: {
  source-arrowhead: 1 {
    shape: diamond
  }
  target-arrowhead: * {
    shape: cf-many
  }
}
```

Arrowhead shapes: `triangle` (default), `arrow`, `diamond`, `circle`, `cf-one`, `cf-many`, `cf-one-required`, `cf-many-required`.

### Containers (Nesting)

```d2
cloud: AWS {
  vpc: VPC {
    subnet: Private Subnet {
      ec2: Web Server
      db: Database {
        shape: cylinder
      }
    }
  }
}

# Dot notation shorthand
cloud.vpc.subnet.ec2 -> cloud.vpc.subnet.db: query
```

### Labels and Text

```d2
# Markdown labels
explanation: |md
  # Architecture Overview
  This system uses **microservices**.
|

# Code blocks
snippet: |go
  func main() {
    fmt.Println("hello")
  }
|

# LaTeX
formula: |latex
  \\frac{n!}{k!(n-k)!}
|
```

### Direction

Controls layout flow. Values: `up`, `down` (default), `left`, `right`.

```d2
direction: right
a -> b -> c
```

### Null (Deletion)

Remove shapes, connections, or attributes:

```d2
x: {style.fill: red}
x.style.fill: null    # remove fill
x: null                # remove shape entirely
(a -> b)[0]: null      # remove connection
```

### Comments

```d2
# This is a comment
server  # Inline comment

"""
This is a block comment
spanning multiple lines
"""
```

---

## Positions (near)

Position items at fixed points around the diagram:

```d2
title: Architecture Overview {
  shape: text
  near: top-center
  style.font-size: 28
}

legend: {
  near: bottom-right
}
```

**Values:** `top-left`, `top-center`, `top-right`, `center-left`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right`.

**Label/icon positioning** (additional values):

```d2
node: {
  label.near: outside-top-center
  icon: https://icons.terrastruct.com/aws/Compute/Amazon-EC2.svg
  icon.near: outside-left-center
}
```

Extra values for label/icon: `outside-top-left`, `outside-top-center`, `outside-top-right`, `outside-left-center`, `outside-right-center`, `outside-bottom-left`, `outside-bottom-center`, `outside-bottom-right`.

---

## Dimensions

```d2
node: {
  width: 200
  height: 100
}
```

Cannot be set on containers (they resize to fit children).

---

## Configuration via Vars

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

Layout engines: `dagre` (default, free), `elk` (free, more features), `tala` (premium).

---

## Resource Files

For detailed guidance, read these on-demand:
- [shapes-and-connections.md](resources/shapes-and-connections.md) — Complete shape catalog, connection types, arrowheads
- [styling-and-layout.md](resources/styling-and-layout.md) — All style properties, classes, themes, layout engines
- [special-diagrams.md](resources/special-diagrams.md) — Sequence diagrams, grid layouts, SQL tables, class diagrams
- [composition-and-advanced.md](resources/composition-and-advanced.md) — Vars, globs, imports, layers, scenarios, steps

---

## Input / Output

This skill defines no input parameters or structured output.
