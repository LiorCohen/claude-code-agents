# Styling and Layout

Complete reference for D2 style properties, classes, themes, and layout engines.

---

## Style Properties

All style properties are set under `style` on shapes or connections.

### Shape Style Properties

| Property | Type | Description |
|----------|------|-------------|
| `opacity` | `0.0` - `1.0` | Transparency (0 = invisible, 1 = fully opaque) |
| `fill` | color | Background fill color |
| `fill-pattern` | keyword | Pattern fill: `dots`, `lines`, `grain`, `paper` |
| `stroke` | color | Border/outline color |
| `stroke-width` | integer | Border thickness in pixels |
| `stroke-dash` | integer | Dash length (0 = solid) |
| `border-radius` | integer | Corner rounding in pixels |
| `shadow` | boolean | Drop shadow |
| `3d` | boolean | 3D effect |
| `multiple` | boolean | Stacked/multiple appearance |
| `double-border` | boolean | Double border line |
| `font` | string | Font family name |
| `font-size` | integer | Font size in pixels |
| `font-color` | color | Text color |
| `bold` | boolean | Bold text |
| `italic` | boolean | Italic text |
| `underline` | boolean | Underlined text |
| `text-transform` | keyword | `uppercase`, `lowercase`, `capitalize`, `none` |

### Connection Style Properties

Connections support all shape style properties plus:

| Property | Type | Description |
|----------|------|-------------|
| `animated` | boolean | Animated dashed flow on connections |
| `stroke-dash` | integer | Dashed line (commonly used with connections) |

### Color Values

D2 accepts CSS color formats:

```d2
a.style.fill: red
b.style.fill: "#4baae5"
c.style.fill: cornflowerblue
d.style.fill: "rgb(100, 200, 50)"
```

Always quote hex colors with `"` to avoid D2 treating `#` as a comment.

---

## Style Examples

### Shape Styling

```d2
server: Production {
  style: {
    fill: "#e8f4f8"
    stroke: "#2196F3"
    stroke-width: 2
    border-radius: 8
    shadow: true
    font-size: 16
    bold: true
  }
}
```

### Connection Styling

```d2
a -> b: critical path {
  style: {
    stroke: red
    stroke-width: 3
    animated: true
  }
}

c -> d: optional {
  style: {
    stroke-dash: 5
    opacity: 0.5
  }
}
```

### Multiple / Stacked

```d2
servers: Web Servers {
  style.multiple: true
}
```

### 3D Effect

```d2
database: DB {
  shape: cylinder
  style.3d: true
}
```

---

## Classes

Reusable style definitions applied to multiple shapes.

### Defining Classes

```d2
classes: {
  error: {
    style: {
      fill: "#ffebee"
      stroke: red
      font-color: red
      bold: true
    }
  }
  success: {
    style: {
      fill: "#e8f5e9"
      stroke: green
      font-color: green
    }
  }
  dashed-conn: {
    style: {
      stroke-dash: 5
      opacity: 0.6
    }
  }
}
```

### Applying Classes

```d2
failure: Login Failed {class: error}
ok: Login OK {class: success}
failure -> ok: retry {class: dashed-conn}
```

### Multiple Classes

Apply multiple classes via array syntax (later classes override earlier):

```d2
classes: {
  rounded: {style.border-radius: 8}
  blue: {style.fill: "#e3f2fd"}
  danger: {style.fill: "#ffebee"; style.stroke: red}
}

node.class: [rounded; blue]
alert.class: [rounded; danger]
```

### Classes with Shape Properties

Classes can include non-style properties too:

```d2
classes: {
  db: {
    shape: cylinder
    style: {
      fill: "#fff3e0"
      stroke: orange
    }
  }
  svc: {
    shape: hexagon
    style: {
      fill: "#e3f2fd"
      stroke: blue
    }
  }
}

postgres.class: db
redis.class: db
api-gateway.class: svc
auth-service.class: svc
```

---

## Themes

Set themes via CLI flag or d2-config vars.

### CLI Flags

```bash
d2 --theme 4 input.d2 output.svg
d2 --dark-theme 200 input.d2 output.svg
d2 --sketch input.d2 output.svg
```

### Via d2-config Vars

```d2
vars: {
  d2-config: {
    theme-id: 4
    dark-theme-id: 200
    sketch: true
  }
}
```

### Light Theme IDs

| ID | Name |
|----|------|
| 0 | Neutral (default) |
| 1 | Neutral Grey |
| 3 | Flagship Terrastruct |
| 4 | Cool Classics |
| 5 | Mixed Berry Blue |
| 6 | Grape Soda |
| 7 | Aubergine |
| 8 | Colorblind Clear |
| 100 | Vanilla Nitro Cola |
| 101 | Orange Creamsicle |
| 102 | Shirley Temple |
| 103 | Earth Tones |
| 104 | Evergarden |
| 105 | Buttered Toast |
| 200 | Terminal |
| 201 | Terminal Grayscale |
| 300 | Origami |

### Dark Theme IDs

Dark themes are applied when the user's system preference is dark mode (SVG only). Common dark theme IDs start at 200.

### Theme Overrides

Customize specific colors in a theme:

```d2
vars: {
  d2-config: {
    theme-id: 200
    theme-overrides: {
      B1: "#2a2a2a"
      B2: "#3a3a3a"
    }
  }
}
```

### Special Themes

The **Terminal** theme (ID 200) applies extra defaults: uppercase labels, no border radius, monospace font, dot fill-pattern on containers, double-border on outermost container.

---

## Layout Engines

| Engine | Free | Features |
|--------|------|----------|
| `dagre` | Yes | Default. Good for most diagrams. |
| `elk` | Yes | Better for complex diagrams, supports more options. |
| `tala` | No | Premium. Best layout quality, supports `near` to objects, `top`/`left` positioning. |

### Setting Layout Engine

```d2
vars: {
  d2-config: {
    layout-engine: elk
  }
}
```

Or via CLI: `d2 --layout elk input.d2 output.svg`

### Direction

Controls the primary flow direction of the layout:

```d2
direction: right    # left-to-right flow
```

Values: `up`, `down` (default), `left`, `right`.

Direction can be set per-container:

```d2
flow: {
  direction: right
  a -> b -> c
}

vertical: {
  direction: down
  x -> y -> z
}
```

### Gap Control

```d2
horizontal-gap: 100
vertical-gap: 50
```

---

## Interactive Features

### Tooltips

Text shown on hover (SVG output only):

```d2
server: Web Server {
  tooltip: Handles all incoming HTTP requests and routes to microservices
}
```

In static exports (PNG), tooltips become numbered footnotes.

### Links

Clickable links (SVG output only):

```d2
docs: Documentation {
  link: https://docs.example.com
}

a -> b: API call {
  link: https://api.example.com/docs
}
```

Quote links containing `#` fragments to avoid comment parsing:

```d2
page: {
  link: "https://example.com/page#section"
}
```

---

## CLI Usage

```bash
# Basic render
d2 input.d2 output.svg

# With options
d2 --theme 4 --layout elk --sketch input.d2 output.svg

# Watch mode (auto-re-render on save)
d2 --watch input.d2 output.svg

# PNG / PDF output
d2 input.d2 output.png
d2 input.d2 output.pdf

# Animated (for steps/scenarios)
d2 --animate-interval 1000 input.d2 output.svg

# Auto-format a D2 file
d2 fmt input.d2

# List themes / layout engines
d2 themes
d2 layout
```

---

## Legend

Declare a legend via `d2-legend` inside `vars`:

```d2
vars: {
  d2-legend: {
    good -> bad: Good relationship {style.stroke: green}
    good -> bad: Bad relationship {style.stroke: red}
  }
}
```
