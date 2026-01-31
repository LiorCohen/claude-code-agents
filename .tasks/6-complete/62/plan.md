# Plan: Consolidate Plugin TypeScript into Unified CLI System (Task 62)

## Status: COMPLETED

---

## Executive Summary

This task creates a new `plugin/system/` directory containing a unified TypeScript CLI tool that consolidates all plugin scripting functionality. This is a **major architectural refactor** that will:

1. Replace scattered TypeScript files with a single, cohesive CLI tool
2. Convert shell scripts to TypeScript where practical
3. Establish consistent patterns for error handling, logging, and JSON I/O
4. Create a foundation for future extensibility

**Supersedes:** #58 (shell→TS), #61 (consolidate TS files)

---

## Current State Analysis

### TypeScript Files (7 source files)

| Location | Purpose | Entry Point |
|----------|---------|-------------|
| `plugin/scripts/validate-spec.ts` | Validate spec frontmatter | `npx ts-node --esm` |
| `plugin/scripts/generate-index.ts` | Generate spec indices | `npx ts-node --esm` |
| `plugin/scripts/generate-snapshot.ts` | Create project snapshots | `npx ts-node --esm` |
| `plugin/scripts/lib/frontmatter.ts` | YAML frontmatter parsing | Library |
| `plugin/scripts/lib/spec-utils.ts` | Spec file utilities | Library |
| `plugin/skills/scaffolding/scaffolding.ts` | Project scaffolding | `npx ts-node --esm` |
| `plugin/skills/domain-population/domain-population.ts` | Domain spec population | `npx ts-node --esm` |

### Shell Scripts (10 scripts → ALL converted to TypeScript)

| Script | Purpose | Conversion Strategy |
|--------|---------|---------------------|
| `plugin/hooks/validate-sdd-writes.sh` | PreToolUse hook | **Replace with thin wrapper** → `sdd-system hook validate-write` |
| `plugin/hooks/prompt-commit-after-write.sh` | PostToolUse hook | **Replace with thin wrapper** → `sdd-system hook prompt-commit` |
| `.claude/skills/commit/bump-version.sh` | Version bumping | **Convert to TS** → `sdd-system version bump` |
| `database-scaffolding/templates/scripts/setup.sh` | K8s PostgreSQL deployment | **Convert to TS** → `sdd-system database setup` |
| `database-scaffolding/templates/scripts/teardown.sh` | K8s PostgreSQL teardown | **Convert to TS** → `sdd-system database teardown` |
| `database-scaffolding/templates/scripts/migrate.sh` | Run migrations | **Convert to TS** → `sdd-system database migrate` |
| `database-scaffolding/templates/scripts/seed.sh` | Seed database | **Convert to TS** → `sdd-system database seed` |
| `database-scaffolding/templates/scripts/reset.sh` | Reset database | **Convert to TS** → `sdd-system database reset` |
| `database-scaffolding/templates/scripts/port-forward.sh` | Port forwarding | **Convert to TS** → `sdd-system database port-forward` |
| `database-scaffolding/templates/scripts/psql.sh` | PostgreSQL CLI | **Convert to TS** → `sdd-system database psql` |

**Result:** Zero shell scripts in the plugin (except the thin `hook-runner.sh` wrapper).

### Hook Architecture: Thin Shell Wrappers

Hooks require shell entry points for the Claude hooks system, but we can make them trivial wrappers:

```bash
#!/bin/bash
# plugin/hooks/hook-runner.sh - Single entry point for all hooks
exec npx ts-node --esm "${CLAUDE_PLUGIN_ROOT}/system/src/cli.ts" hook "$@"
```

Then `hooks.json` calls this with the hook name as an argument:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/hook-runner.sh validate-write" }]
    }],
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/hook-runner.sh prompt-commit" }]
    }]
  }
}
```

**Benefits:**
- All hook logic in TypeScript (type-safe, testable)
- Single shell script to maintain
- Easy to add new hooks - just add a new command handler
- Hooks can share utilities from the CLI lib

---

## Proposed Architecture

### Directory Structure

```
plugin/system/
├── src/                          # TypeScript source (in repo, excluded from release)
│   ├── cli.ts                    # Main CLI entry point
│   ├── commands/                 # All commands organized by namespace
│   │   ├── scaffolding/          # Scaffolding namespace
│   │   │   ├── project.ts        # Project scaffolding (from skills/scaffolding)
│   │   │   └── domain.ts         # Domain population (from skills/domain-population)
│   │   ├── spec/                 # Spec namespace
│   │   │   ├── validate.ts       # Spec validation (from scripts/validate-spec)
│   │   │   ├── index.ts          # Spec index generation (from scripts/generate-index)
│   │   │   └── snapshot.ts       # Snapshot generation (from scripts/generate-snapshot)
│   │   ├── version/              # Version namespace
│   │   │   └── bump.ts           # Version bumping (from .claude/skills/commit/bump-version)
│   │   ├── database/             # Database component namespace
│   │   │   ├── setup.ts          # Deploy PostgreSQL to k8s
│   │   │   ├── teardown.ts       # Remove PostgreSQL
│   │   │   ├── migrate.ts        # Run migrations
│   │   │   ├── seed.ts           # Seed database
│   │   │   ├── reset.ts          # Reset (teardown + setup + migrate + seed)
│   │   │   ├── port-forward.ts   # Port forward to local
│   │   │   └── psql.ts           # Open psql shell
│   │   ├── contract/             # Contract component namespace
│   │   │   ├── generate-types.ts # Generate TypeScript types from OpenAPI spec
│   │   │   └── validate.ts       # Validate OpenAPI spec with Spectral
│   │   ├── backend/              # Backend component namespace (future)
│   │   │   └── ...               # TBD - currently no shell scripts
│   │   ├── frontend/             # Frontend component namespace (future)
│   │   │   └── ...               # TBD - currently no shell scripts
│   │   └── hook/                 # Hook namespace
│   │       ├── validate-write.ts # PreToolUse: auto-approve/block writes
│   │       └── prompt-commit.ts  # PostToolUse: commit prompts
│   ├── lib/                      # Shared utilities
│   │   ├── frontmatter.ts        # Frontmatter parsing (from scripts/lib)
│   │   ├── spec-utils.ts         # Spec utilities (from scripts/lib)
│   │   ├── fs.ts                 # File system helpers
│   │   ├── logger.ts             # Consistent logging/output
│   │   └── config.ts             # Configuration loading
│   └── types/                    # Shared type definitions
│       ├── spec.ts               # Spec-related types
│       ├── component.ts          # Component types
│       └── config.ts             # Config file types
├── dist/                         # Compiled JS (NOT in repo, generated at release)
│   ├── cli.js + cli.js.map
│   ├── commands/**/*.js + *.js.map  # All namespaced commands
│   ├── lib/*.js + *.js.map
│   └── types/*.js + *.js.map
├── node_modules/                 # Runtime deps (installed by sdd-init)
├── package.json                  # dependencies + devDependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # Documentation

plugin/hooks/
├── hooks.json                    # Hook registration (PreToolUse + PostToolUse)
└── hook-runner.sh                # Thin wrapper: node --enable-source-maps dist/cli.js
```

### Build Strategy: TypeScript Compilation

**Why compile (not bundle):**
- Handles ANY dependency type (native modules, dynamic requires)
- Standard Node.js module resolution
- No bundler quirks or edge cases
- Easier debugging (1:1 file mapping)

**Build command (tsc):**
```bash
tsc --project tsconfig.json
```

**Output structure:**
```
plugin/system/dist/
├── cli.js
├── cli.js.map
├── commands/
│   ├── scaffold-project.js
│   ├── validate-spec.js
│   ├── generate-spec-index.js
│   ├── components/
│   │   └── database/
│   │       ├── setup.js
│   │       └── ...
│   └── ...
├── hooks/
│   ├── validate-write.js
│   └── prompt-commit.js
└── lib/
    ├── frontmatter.js
    └── ...
```

**Source maps for debugging:**
- Each `.js` file has a corresponding `.js.map`
- Node's `--enable-source-maps` shows TS line numbers in stack traces
- Errors reference `src/commands/scaffold.ts:142` not `dist/commands/scaffold.js:89`

**Hook-runner.sh:**
```bash
#!/bin/bash
exec node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js" hook "$@"
```

**Runtime dependency installation via /sdd-init:**

The `/sdd-init` command handles plugin dependency installation as its first step:

```typescript
// In sdd-init command logic (simplified)
async function ensureDependencies() {
  const nodeModulesPath = path.join(PLUGIN_ROOT, 'system', 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('Installing SDD system dependencies...');
    execSync('npm install --production', {
      cwd: path.join(PLUGIN_ROOT, 'system')
    });
  }
}
```

**User workflow:**
```bash
# 1. Install the SDD plugin (via marketplace or manually)
# 2. Run sdd-init in your project (normal workflow)
/sdd-init    # Auto-installs deps if missing, then continues

# That's it! No separate init step needed.
```

**Benefits of `/sdd-init` approach:**
- SDD-specific (doesn't trigger other plugins' hooks)
- Part of existing workflow users already run
- More intuitive - no separate `claude --init` step
- Lazy installation - only when SDD is actually used

**What dependency installation does:**
- Checks if `node_modules/` exists in plugin/system/
- If missing: runs `npm install --production`
- Installs only `dependencies` (not devDependencies)
- Creates `node_modules/` with runtime packages (yaml, etc.)
- Only runs once (or after plugin updates clear node_modules)

**Development workflow:**
- Use `tsx src/cli.ts` for rapid iteration during development
- Run `npm run build -w plugin/system` to test locally
- `dist/` is in `.gitignore` (NOT committed)
- `src/` is excluded from releases (only `dist/` ships)

**GitHub Actions release workflow:**
```yaml
# In .github/workflows/release.yml
- name: Build system CLI
  run: npm run build -w plugin/system

- name: Package plugin for release
  run: |
    # Remove src/ and dev files from release
    rm -rf plugin/system/src
    rm -rf plugin/system/node_modules
    rm plugin/system/tsconfig.json
    # dist/ and package.json remain
```

**Root package.json configuration:**
```json
{
  "workspaces": ["plugin/system", "tests"],
  "scripts": {
    "build:plugin": "npm run build -w plugin/system",
    "typecheck:plugin": "npm run typecheck -w plugin/system"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3",
    "typescript-language-server": "^5.1.3"
  }
}
```
- `npm install` at repo root installs all dependencies for building/development
- `npm run build:plugin` compiles TypeScript to `plugin/system/dist/`
- `npm run typecheck:plugin` type-checks without emitting

### CLI Interface

```bash
# Primary entry point - all commands are namespaced
sdd-system <namespace> <action> [args] [options]

# Scaffolding namespace
sdd-system scaffolding project --config <config.json>   # Create new SDD project structure
sdd-system scaffolding domain --config <config.json>    # Populate domain specs from config

# Spec namespace
sdd-system spec validate <spec.md> | --all    # Validate spec frontmatter/structure
sdd-system spec index --specs-dir <dir>       # Generate specs/index.md
sdd-system spec snapshot --specs-dir <dir>    # Create project snapshot

# Version namespace
sdd-system version bump <major|minor|patch>   # Bump version in package.json

# Component namespaces (by scaffolding type)
# Each scaffolding type (database, backend, frontend, contract) has its own subcommands

# Database component (from database-scaffolding)
sdd-system database setup <name>         # Deploy PostgreSQL to k8s
sdd-system database teardown <name>      # Remove PostgreSQL from k8s
sdd-system database migrate <name>       # Run migrations
sdd-system database seed <name>          # Seed database
sdd-system database reset <name>         # Reset (teardown + setup + migrate + seed)
sdd-system database port-forward <name>  # Port forward to local
sdd-system database psql <name>          # Open psql shell

# Backend component (from backend-scaffolding) - placeholder for future
sdd-system backend <action> <name>       # TBD - add as needed

# Frontend component (from frontend-scaffolding) - placeholder for future
sdd-system frontend <action> <name>      # TBD - add as needed

# Contract component (from contract-scaffolding)
sdd-system contract generate-types <name>  # Generate TS types from OpenAPI spec
sdd-system contract validate <name>        # Validate OpenAPI spec with Spectral

# Hook namespace (called by hook-runner.sh, reads JSON from stdin)
sdd-system hook validate-write           # PreToolUse hook handler
sdd-system hook prompt-commit            # PostToolUse hook handler

# Global options (apply to all commands)
--json          # JSON output mode
--verbose       # Verbose logging
--help          # Show help
```

**Namespaces:**
| Namespace | Purpose |
|-----------|---------|
| `scaffolding` | Project and domain scaffolding |
| `spec` | Spec validation, indexing, snapshots |
| `version` | Version bumping |
| `database` | Database component operations |
| `contract` | Contract component operations |
| `backend` | Backend component operations (future) |
| `frontend` | Frontend component operations (future) |
| `hook` | Hook handlers |

**User-facing command: `/sdd-run`**

A single unified command that passes through to the CLI:
```
/sdd-run database migrate my-db
/sdd-run scaffolding project --config config.json
/sdd-run spec validate --all
/sdd-run version bump patch
```

`/sdd-run <args>` = `sdd-system <args>`

No need for separate `/sdd-db`, `/sdd-scaffold`, etc. - one command does it all.

### Command Schema Architecture

**Every command has a strict JSON Schema definition embedded as a const:**

```typescript
// Example: src/commands/database/index.ts
export const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["setup", "teardown", "migrate", "seed", "reset", "port-forward", "psql"],
      description: "Database action to perform"
    },
    name: {
      type: "string",
      description: "Component name (e.g., 'my-db')",
      pattern: "^[a-z][a-z0-9-]*$"
    }
  },
  required: ["action", "name"]
} as const;

export type DatabaseArgs = {
  action: "setup" | "teardown" | "migrate" | "seed" | "reset" | "port-forward" | "psql";
  name: string;
};

export async function handler(args: DatabaseArgs): Promise<void> {
  // args are already validated against schema
}

// Example: src/commands/contract/index.ts
export const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["generate-types", "validate"],
      description: "Contract action to perform"
    },
    name: {
      type: "string",
      description: "Component name (e.g., 'my-contract')",
      pattern: "^[a-z][a-z0-9-]*$"
    }
  },
  required: ["action", "name"]
} as const;

export type ContractArgs = {
  action: "generate-types" | "validate";
  name: string;
};
```

**Schema validation flow:**
1. CLI parses raw arguments
2. Arguments validated against command's embedded schema
3. Invalid args → clear error message with schema requirements
4. Valid args → passed to command handler with TypeScript types

**Benefits:**
- Schema co-located with command logic (single source of truth)
- Type-safe argument handling
- Auto-generated help text from schema descriptions
- Consistent validation across all commands
- Self-documenting API
- No separate schema files to maintain

### Package Configuration

**Two levels of package.json:**

1. **Root** (`/package.json`) - Repo development with npm workspaces
2. **System** (`plugin/system/package.json`) - The actual CLI tool

**Note:** There is no `plugin/package.json`. The existing one should be deleted - the plugin doesn't need a package.json at its root level.

**plugin/system/package.json:**
```json
{
  "name": "@sdd/system",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist/cli.js",
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "dev": "tsx src/cli.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "yaml": "^2.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.9.0",
    "@types/node": "^22.0.0"
  }
}
```

**Note:**
- `dependencies` are installed at plugin runtime via `/sdd-init`
- `devDependencies` are only needed for development/building
- Add runtime dependencies to `dependencies` as needed (yaml parser, etc.)

---

## Implementation Plan

### Phase 1: Foundation (Infrastructure)

**Goal:** Create the directory structure and CLI framework.

#### Step 1.1: Create directory structure
- Create `plugin/system/` directory
- Create subdirectories: `src/`, `src/commands/`, `src/lib/`, `src/types/`
- Initialize `package.json` with correct dependencies
- Create `tsconfig.json` extending plugin config

#### Step 1.2: Create CLI framework (`src/cli.ts`)
- Argument parsing (no external deps, use native)
- Command routing
- JSON Schema validation for all command arguments
- Global error handling with schema-based error messages
- JSON output mode support
- Help text generation (auto-generated from schemas)

#### Step 1.3: Create shared utilities
- `src/lib/logger.ts` - Consistent logging with color, JSON mode
- `src/lib/fs.ts` - File system helpers (async, immutable patterns)
- `src/lib/config.ts` - Configuration file loading and validation

### Phase 2: Library Migration

**Goal:** Move shared library code to unified location.

#### Step 2.1: Migrate frontmatter parsing
- Move `plugin/scripts/lib/frontmatter.ts` → `plugin/system/src/lib/frontmatter.ts`
- No functional changes, just relocation

#### Step 2.2: Migrate spec utilities
- Move `plugin/scripts/lib/spec-utils.ts` → `plugin/system/src/lib/spec-utils.ts`
- Update imports to use new paths

#### Step 2.3: Create type definitions
- Extract interfaces from existing code into `src/types/`
- Ensure all types are readonly and immutable

### Phase 3: Command Migration

**Goal:** Convert existing scripts to CLI commands (all commands are namespaced).

#### Step 3.1: Create spec namespace commands
- Move `plugin/scripts/validate-spec.ts` → `plugin/system/src/commands/spec/validate.ts`
- Move `plugin/scripts/generate-index.ts` → `plugin/system/src/commands/spec/index.ts`
- Move `plugin/scripts/generate-snapshot.ts` → `plugin/system/src/commands/spec/snapshot.ts`
- Refactor to use CLI framework
- Update error handling and output formatting

#### Step 3.2: Create scaffolding namespace commands
- Move `plugin/skills/scaffolding/scaffolding.ts` → `plugin/system/src/commands/scaffolding/project.ts`
- Move `plugin/skills/domain-population/domain-population.ts` → `plugin/system/src/commands/scaffolding/domain.ts`
- This includes the largest migration (~930 lines for project scaffolding)
- Refactor to use shared utilities

#### Step 3.3: Create version namespace commands
- Convert `.claude/skills/commit/bump-version.sh` → `plugin/system/src/commands/version/bump.ts`
- Replace `jq` with native JSON parsing
- Use `sdd-system version bump patch` instead of `./bump-version.sh patch`

#### Step 3.4: Create hook namespace commands
- Create `plugin/system/src/commands/hook/validate-write.ts` from `plugin/hooks/validate-sdd-writes.sh` logic
- Create `plugin/system/src/commands/hook/prompt-commit.ts` from `plugin/hooks/prompt-commit-after-write.sh` logic
- `sdd-system hook <name>` routes to appropriate handler, reads stdin
- All JSON parsing/output now in TypeScript (no more jq dependency)

#### Step 3.8: Create thin shell wrapper
- Create `plugin/hooks/hook-runner.sh` - single 3-line script
- Receives hook name as argument, passes stdin to CLI
- Update `plugin/hooks/hooks.json` to use new wrapper

#### Step 3.5: Create database namespace commands
- Create `plugin/system/src/commands/database/` directory
- Convert database shell scripts to TypeScript:
  - `setup.ts` - kubectl apply for PostgreSQL
  - `teardown.ts` - kubectl delete
  - `migrate.ts` - run SQL migrations in order
  - `seed.ts` - run seed SQL
  - `reset.ts` - teardown + setup + migrate + seed
  - `port-forward.ts` - kubectl port-forward
  - `psql.ts` - exec into psql shell
- All commands take component name as positional argument
- Remove shell script templates from database-scaffolding skill
- Update database-scaffolding package.json template to use CLI commands

#### Step 3.6: Create contract namespace commands
- Create `plugin/system/src/commands/contract/` directory
- Create contract commands:
  - `generate-types.ts` - Wrapper for openapi-typescript (generates TS types from OpenAPI spec)
  - `validate.ts` - Wrapper for Spectral (validates OpenAPI spec)
- Update contract-scaffolding package.json template to use CLI commands

### Phase 4: Integration

**Goal:** Wire everything together and update references.

#### Step 4.1: Update plugin package.json
- Add `system` workspace reference
- Update npm scripts to use `sdd-system` commands

#### Step 4.2: Update skill references
- Update `plugin/skills/scaffolding/SKILL.md` to reference `sdd-system scaffolding project`
- Update `plugin/skills/domain-population/SKILL.md` to reference `sdd-system scaffolding domain`
- Update commit skill to use `sdd-system version bump`

#### Step 4.3: Update hooks (keep shell, update internals)
- Hooks remain shell scripts (required for Claude hooks system)
- Update any hook logic that called old scripts to use new CLI

#### Step 4.4: Cleanup old locations
- Remove `plugin/scripts/` directory (all migrated)
- Remove TS files from `plugin/skills/scaffolding/` and `plugin/skills/domain-population/`
- Keep SKILL.md files, update them to reference CLI

### Phase 5: Testing & Documentation

#### Step 5.1: Update test imports
- Update `tests/src/` imports that reference old locations
- Ensure tests still pass with new structure

#### Step 5.2: Add CLI tests
- Unit tests for each command
- Integration tests for full workflows

#### Step 5.3: Documentation
- Create `plugin/system/README.md` with usage guide
- Update main `plugin/README.md` to reference system CLI
- Document migration path for any external consumers

---

## Files to Modify

| Current Location | Action | New Location |
|------------------|--------|--------------|
| `plugin/scripts/validate-spec.ts` | Move | `plugin/system/src/commands/spec/validate.ts` |
| `plugin/scripts/generate-index.ts` | Move | `plugin/system/src/commands/spec/index.ts` |
| `plugin/scripts/generate-snapshot.ts` | Move | `plugin/system/src/commands/spec/snapshot.ts` |
| `plugin/scripts/lib/frontmatter.ts` | Move | `plugin/system/src/lib/frontmatter.ts` |
| `plugin/scripts/lib/spec-utils.ts` | Move | `plugin/system/src/lib/spec-utils.ts` |
| `plugin/skills/scaffolding/scaffolding.ts` | Move | `plugin/system/src/commands/scaffolding/project.ts` |
| `plugin/skills/domain-population/domain-population.ts` | Move | `plugin/system/src/commands/scaffolding/domain.ts` |
| `.claude/skills/commit/bump-version.sh` | Convert | `plugin/system/src/commands/version/bump.ts` |
| `plugin/hooks/hooks.json` | Update | (point to hook-runner.sh) |
| `package.json` (root) | Update | (add plugin/system to workspaces) |
| `plugin/tsconfig.json` | Update | (add system to include) |
| `tests/src/lib/paths.ts` | Update | (update path constants) |
| `plugin/skills/contract-scaffolding/templates/package.json` | Update | (use sdd-system contract commands) |
| `plugin/skills/database-scaffolding/templates/package.json` | Update | (use sdd-system database commands) |

## Files to Create

| File | Purpose |
|------|---------|
| `plugin/system/package.json` | Package manifest with bin entry |
| `plugin/system/tsconfig.json` | TypeScript configuration |
| `plugin/system/src/cli.ts` | Main CLI entry point |
| `plugin/system/src/commands/hook/validate-write.ts` | PreToolUse hook logic (from shell) |
| `plugin/system/src/commands/hook/prompt-commit.ts` | PostToolUse hook logic (from shell) |
| `plugin/system/src/commands/database/setup.ts` | Database setup command |
| `plugin/system/src/commands/database/teardown.ts` | Database teardown command |
| `plugin/system/src/commands/database/migrate.ts` | Database migrate command |
| `plugin/system/src/commands/database/seed.ts` | Database seed command |
| `plugin/system/src/commands/database/reset.ts` | Database reset command |
| `plugin/system/src/commands/database/port-forward.ts` | Database port-forward command |
| `plugin/system/src/commands/database/psql.ts` | Database psql command |
| `plugin/system/src/commands/contract/generate-types.ts` | Contract generate-types command |
| `plugin/system/src/commands/contract/validate.ts` | Contract validate command |
| `plugin/system/src/lib/logger.ts` | Logging utilities |
| `plugin/system/src/lib/fs.ts` | File system helpers |
| `plugin/system/src/lib/config.ts` | Config loading |
| `plugin/system/src/types/spec.ts` | Spec type definitions |
| `plugin/system/src/types/component.ts` | Component type definitions |
| `plugin/system/src/types/config.ts` | Config type definitions |
| `plugin/system/src/lib/schema-validator.ts` | JSON Schema validation utility |
| `plugin/system/README.md` | Documentation |
| `plugin/hooks/hook-runner.sh` | Thin wrapper that calls CLI |

**Generated at release time (by GitHub Actions):**
- `plugin/system/dist/**/*.js` - Compiled JavaScript
- `plugin/system/dist/**/*.js.map` - Source maps

**Installed at runtime (by /sdd-init):**
- `plugin/system/node_modules/` - Runtime dependencies

## Files to Delete

| File | Reason |
|------|--------|
| `plugin/package.json` | Not needed - only system/ has package.json |
| `plugin/scripts/validate-spec.ts` | Migrated to system/ |
| `plugin/scripts/generate-index.ts` | Migrated to system/ |
| `plugin/scripts/generate-snapshot.ts` | Migrated to system/ |
| `plugin/scripts/lib/frontmatter.ts` | Migrated to system/ |
| `plugin/scripts/lib/spec-utils.ts` | Migrated to system/ |
| `plugin/scripts/` directory | Empty after migration |
| `plugin/skills/scaffolding/scaffolding.ts` | Migrated to system/ |
| `plugin/skills/domain-population/domain-population.ts` | Migrated to system/ |
| `plugin/hooks/validate-sdd-writes.sh` | Logic moved to TypeScript |
| `plugin/hooks/prompt-commit-after-write.sh` | Logic moved to TypeScript |
| `plugin/skills/database-scaffolding/templates/scripts/setup.sh` | Replaced by CLI command |
| `plugin/skills/database-scaffolding/templates/scripts/teardown.sh` | Replaced by CLI command |
| `plugin/skills/database-scaffolding/templates/scripts/migrate.sh` | Replaced by CLI command |
| `plugin/skills/database-scaffolding/templates/scripts/seed.sh` | Replaced by CLI command |
| `plugin/skills/database-scaffolding/templates/scripts/reset.sh` | Replaced by CLI command |
| `plugin/skills/database-scaffolding/templates/scripts/port-forward.sh` | Replaced by CLI command |
| `plugin/skills/database-scaffolding/templates/scripts/psql.sh` | Replaced by CLI command |
| `plugin/skills/database-scaffolding/templates/scripts/` | Empty after migration |

---

## Risk Analysis

### High Risk: Breaking Existing Workflows

**Risk:** Commands called by skills/agents may break if paths change.

**Mitigation:**
- Add compatibility shims during transition
- Update all skill/command references in same commit
- Comprehensive testing of affected workflows

### Medium Risk: Test Breakage

**Risk:** Tests import from old locations.

**Mitigation:**
- Update `tests/src/lib/paths.ts` with new constants
- Run full test suite before and after migration
- Fix imports incrementally

### Low Risk: Build Complexity

**Risk:** Adding another package adds build complexity.

**Mitigation:**
- Use npm workspaces for unified dependency management
- Single `npm run build` at root builds everything
- Document build process clearly

---

## What We're NOT Doing

1. **NOT converting backend/frontend template scripts** - These are standard npm lifecycle scripts (dev, build, test, lint) that run existing tools (tsx, vite, vitest, eslint) - they stay local to user projects
2. **NOT adding external CLI framework** - Keep it simple, native arg parsing
3. **NOT creating a npm package for public distribution** - Internal tool only
4. **NOT changing the test infrastructure** - Tests stay in `tests/`, just update imports

## What We ARE Doing with Hooks

- Hook **logic** moves to TypeScript (`plugin/system/src/hooks/`)
- Hook **entry point** stays as single thin shell wrapper (`plugin/hooks/hook-runner.sh`)
- Shell wrapper is ~3 lines, just passes args/stdin to TypeScript CLI
- All JSON parsing, path matching, decision logic now type-safe and testable

---

## Success Criteria

1. ✅ All TypeScript functionality accessible via `sdd-system` CLI
2. ✅ All existing tests pass
3. ✅ Skills/commands updated to use new CLI
4. ✅ Old script locations removed
5. ✅ Version bumping works via `sdd-system version bump`
6. ✅ JSON output mode works for all commands
7. ✅ Documentation updated

---

## Estimated Scope

- **New files:** ~29 (includes 2 contract command files)
- **Modified files:** ~14 (includes template package.json updates)
- **Deleted files:** ~19 (includes plugin/package.json + 8 database shell scripts)
- **Lines of new code:** ~950 (CLI framework, logger, utilities, hook handlers, db commands, contract commands)
- **Lines migrated:** ~1,700 (existing scripts + hook logic)

---

## Decisions Made

1. **`sdd-system` is workspace-local** - invoked via relative path from hooks/skills
2. **`dist/` is NOT committed** - generated by GitHub Actions release workflow
3. **`src/` excluded from releases** - only compiled `dist/` ships with plugin
4. **npm workspaces for development** - `npm install` at root installs all deps
5. **tsc for compilation** (not bundling) - handles any dependency type robustly
6. **`/sdd-init` installs runtime deps** - lazy installation, part of existing workflow
7. **Dependencies in package.json** - standard Node.js approach, no bundler quirks
8. **Zero shell scripts** - all logic in TypeScript, only `hook-runner.sh` wrapper remains
9. **Unified `/sdd-run` command** - single entry point to CLI, no separate `/sdd-db`, `/sdd-scaffold`, etc.
10. **No `plugin/package.json`** - only two package.json files: root (workspaces) and system/ (CLI tool)
11. **JSON Schema for all command args** - embedded as consts in command files, strict validation, auto-generated help
12. **Component commands match scaffolding types** - database, backend, frontend, contract (project-scaffolding is top-level command)

---

## Dependencies

This task should be completed **before**:
- Any new TypeScript scripts are added
- Major skill/command updates that would need re-migration

This task should be completed **after**:
- Task 60 (TypeScript import standardization) - ensures consistent imports in migrated code

---

## Version Impact

- **MINOR version bump** - Architectural refactor, no breaking external API
- New feature: unified CLI system
- Internal restructuring only
