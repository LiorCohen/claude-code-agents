---
name: manifest-validation
description: Validate plugin and marketplace manifest files against the official Claude Code specification
---

# Manifest Validation

Validates `.claude-plugin/marketplace.json` and `plugin/.claude-plugin/plugin.json` against the official Claude Code plugin specification.

**Documentation Reference**: [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
**Claude Code Version**: 2.1.27
**Schema Fetched**: 2026-01-31

---

## When to Use

- Before committing changes to manifest files
- After version bumps
- When debugging plugin loading issues
- After modifying hooks, MCP, or LSP configurations

---

## Validation Checklist

Run through all checks in order. Stop at the first failure.

### 1. JSON Syntax Valid

```bash
# Both must parse without errors
jq . plugin/.claude-plugin/plugin.json > /dev/null
jq . .claude-plugin/marketplace.json > /dev/null
```

### 2. Required Fields Present

**plugin.json** - Must have:
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique identifier (kebab-case, no spaces) |

**marketplace.json** - Must have:
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Marketplace identifier (kebab-case) |
| `owner.name` | string | Maintainer name |
| `plugins` | array | List of plugins (non-empty) |

**Each plugin entry** - Must have:
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Plugin identifier |
| `source` | string\|object | Where to fetch plugin |

```bash
# Check required fields
jq -e '.name' plugin/.claude-plugin/plugin.json
jq -e '.name, .owner.name, .plugins[0].name, .plugins[0].source' .claude-plugin/marketplace.json
```

### 3. Versions Match

If both files specify version, they must be identical:

```bash
PLUGIN_VER=$(jq -r '.version // empty' plugin/.claude-plugin/plugin.json)
MARKET_VER=$(jq -r '.plugins[0].version // empty' .claude-plugin/marketplace.json)
[ "$PLUGIN_VER" = "$MARKET_VER" ] && echo "OK: $PLUGIN_VER" || echo "MISMATCH: plugin=$PLUGIN_VER marketplace=$MARKET_VER"
```

### 4. Paths Start with `./`

All component paths must be relative to plugin root and start with `./`:

| Field | Example |
|-------|---------|
| `commands` | `["./core/commands/sdd.md"]` |
| `skills` | `["./core/skills/"]` |
| `mcpServers` | `"./.mcp.json"` |
| `lspServers` | `"./.lsp.json"` |
| `outputStyles` | `"./styles/"` |

```bash
# Check all command paths start with ./
jq -r '.commands[]? // empty' plugin/.claude-plugin/plugin.json | while read -r p; do echo "$p" | grep -qE '^\./' || echo "ERROR: command path must start with ./: $p"; done
```

### 5. Referenced Files Exist

Verify files referenced by paths actually exist:

```bash
# Check command files exist
jq -r '.commands[]? // empty' plugin/.claude-plugin/plugin.json | while read -r p; do
  [ -f "plugin/${p#./}" ] || [ -d "plugin/${p#./}" ] && echo "OK: $p" || echo "ERROR: not found: plugin/${p#./}"
done

# Check skill directories exist
jq -r '.skills[]? // empty' plugin/.claude-plugin/plugin.json | while read -r p; do
  [ -d "plugin/${p#./}" ] && echo "OK: $p" || echo "ERROR: not found: plugin/${p#./}"
done
```

### 6. Source Directory Exists

Marketplace plugin source paths must point to valid directories:

```bash
SOURCE=$(jq -r '.plugins[0].source' .claude-plugin/marketplace.json)
[ -d "$SOURCE" ] && echo "OK: $SOURCE" || echo "ERROR: source directory not found: $SOURCE"
```

### 7. Name Format Valid

Names must be kebab-case (lowercase letters, numbers, hyphens):

```bash
jq -r '.name' plugin/.claude-plugin/plugin.json | grep -E '^[a-z0-9]+(-[a-z0-9]+)*$' || echo "ERROR: invalid name format"
```

### 8. No Path Traversal

Paths must not contain `../` (security restriction):

```bash
jq -r '.. | strings | select(contains("../"))' plugin/.claude-plugin/plugin.json && echo "ERROR: path traversal detected" || echo "OK: no path traversal"
```

---

## Quick Full Validation

Run all checks at once:

```bash
echo "=== Manifest Validation ==="

# 1. JSON syntax
echo -n "1. JSON syntax: "
jq . plugin/.claude-plugin/plugin.json > /dev/null 2>&1 && \
jq . .claude-plugin/marketplace.json > /dev/null 2>&1 && \
echo "OK" || echo "FAIL"

# 2. Required fields
echo -n "2. Required fields: "
jq -e '.name' plugin/.claude-plugin/plugin.json > /dev/null 2>&1 && \
jq -e '.name and .owner.name and (.plugins | length > 0)' .claude-plugin/marketplace.json > /dev/null 2>&1 && \
echo "OK" || echo "FAIL"

# 3. Version match
echo -n "3. Version match: "
P=$(jq -r '.version // "none"' plugin/.claude-plugin/plugin.json)
M=$(jq -r '.plugins[0].version // "none"' .claude-plugin/marketplace.json)
[ "$P" = "$M" ] && echo "OK ($P)" || echo "FAIL (plugin=$P, marketplace=$M)"

# 4. Paths start with ./
echo -n "4. Path format: "
FAIL=0
for p in $(jq -r '.commands[]?, .skills[]?' plugin/.claude-plugin/plugin.json 2>/dev/null); do
  [[ "$p" == ./* ]] || { echo "FAIL ($p)"; FAIL=1; break; }
done
[ $FAIL -eq 0 ] && echo "OK"

# 5. Referenced files exist
echo -n "5. Files exist: "
FAIL=0
for p in $(jq -r '.commands[]?, .skills[]?' plugin/.claude-plugin/plugin.json 2>/dev/null); do
  [ -f "plugin/${p#./}" ] || [ -d "plugin/${p#./}" ] || { echo "FAIL (missing: plugin/${p#./})"; FAIL=1; break; }
done
[ $FAIL -eq 0 ] && echo "OK"

# 6. Source directory exists
echo -n "6. Source exists: "
S=$(jq -r '.plugins[0].source' .claude-plugin/marketplace.json)
[ -d "$S" ] && echo "OK ($S)" || echo "FAIL ($S not found)"

# 7. Name format
echo -n "7. Name format: "
jq -r '.name' plugin/.claude-plugin/plugin.json | grep -qE '^[a-z0-9]+(-[a-z0-9]+)*$' && \
echo "OK" || echo "FAIL"

# 8. No path traversal
echo -n "8. No traversal: "
jq -r '.. | strings' plugin/.claude-plugin/plugin.json 2>/dev/null | grep -q '\.\.' && \
echo "FAIL" || echo "OK"

echo "=== Done ==="
```

---

## Schema Reference

### plugin.json

```json
{
  "name": "plugin-name",           // REQUIRED: kebab-case
  "version": "1.0.0",              // Optional: semver
  "description": "Brief desc",     // Optional
  "author": {                      // Optional
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com",
  "repository": "https://github.com/user/plugin",
  "license": "MIT",
  "keywords": ["keyword1"],
  "commands": [                    // Array of command paths
    "./core/commands/sdd.md",
    "./core/commands/sdd-run.md"
  ],
  "skills": [                      // Array of skill directory paths
    "./core/skills/"
  ],
  "mcpServers": "./.mcp.json",
  "lspServers": "./.lsp.json",
  "outputStyles": "./styles/"
}
```

### marketplace.json

```json
{
  "name": "marketplace-name",      // REQUIRED: kebab-case
  "owner": {                       // REQUIRED
    "name": "Owner Name",          // REQUIRED
    "email": "contact@example.com"
  },
  "plugins": [                     // REQUIRED: non-empty array
    {
      "name": "plugin-name",       // REQUIRED
      "source": "./plugin",        // REQUIRED: path or object
      "description": "Plugin desc",
      "version": "1.0.0"
    }
  ]
}
```

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `command path must start with ./` | Path relative to wrong directory | Ensure all paths in `commands` array start with `./` |
| `version mismatch` | Forgot to update both files | Run version bump script or update both |
| `source directory not found` | Wrong source path | Verify `./plugin` exists |
| `invalid name format` | Spaces or uppercase in name | Use kebab-case: `my-plugin` |
| `path traversal detected` | Using `../` in paths | Keep all paths within plugin root |
| `referenced file not found` | Typo or missing file | Verify path exists under `plugin/` |

---

## See Also

- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
