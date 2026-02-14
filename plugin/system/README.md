# SDD System CLI

Unified command-line tool for SDD plugin operations.

## Usage

```bash
sdd-system <namespace> <action> [args] [options]
```

## Namespaces

### scaffolding

Project and domain scaffolding operations.

```bash
sdd-system scaffolding project --config config.json   # Create new SDD project
sdd-system scaffolding domain --config config.json    # Populate domain specs
```

### spec

Spec validation and management.

```bash
sdd-system spec validate specs/feature.md   # Validate single spec
sdd-system spec validate --all              # Validate all specs
sdd-system spec index --changes-dir changes/ # Generate changes/INDEX.md
sdd-system spec snapshot --specs-dir specs/ # Generate SNAPSHOT.md
```

### database

Database component operations (for scaffolded database components).

```bash
sdd-system database setup <name>         # Deploy PostgreSQL to k8s
sdd-system database teardown <name>      # Remove PostgreSQL
sdd-system database migrate <name>       # Run migrations
sdd-system database seed <name>          # Seed database
sdd-system database reset <name>         # Full reset
sdd-system database port-forward <name>  # Port forward to local
sdd-system database psql <name>          # Open psql shell
```

### contract

Contract component operations.

```bash
sdd-system contract generate-types <name>  # Generate TS types from OpenAPI
sdd-system contract validate <name>        # Validate OpenAPI spec
```

### hook

Hook handlers (called by hook-runner.sh, not typically invoked directly).

```bash
sdd-system hook validate-write   # PreToolUse: auto-approve/block writes
sdd-system hook prompt-commit    # PostToolUse: commit prompts
```

## Global Options

- `--json` - Output in JSON format
- `--verbose` - Verbose logging
- `--help` - Show help

## Development

```bash
# Type check
npm run typecheck

# Build
npm run build

# Development mode (using tsx for hot reloading)
npm run dev -- <command>
```

## Architecture

```
plugin/system/
├── src/                    # TypeScript source
│   ├── cli.ts              # Main entry point
│   ├── commands/           # Command handlers by namespace
│   ├── lib/                # Shared utilities
│   └── types/              # Type definitions
├── dist/                   # Compiled JS (not committed)
├── package.json
└── tsconfig.json
```
