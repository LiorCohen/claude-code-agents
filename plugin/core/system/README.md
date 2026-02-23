# SDD Core System CLI

Command-line tool for core SDD methodology operations.

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

### settings

Settings management and declared actions processing.

```bash
sdd-system settings reconcile                          # Reconcile settings to latest schema
sdd-system settings process-actions --namespace <ns>    # Process declared actions from tech system
```

### tech-pack

Tech pack management.

```bash
sdd-system tech-pack validate <path>   # Validate tech pack manifest
sdd-system tech-pack list              # List installed tech packs
sdd-system tech-pack info <namespace>  # Show tech pack details
sdd-system tech-pack install <path>    # Register a tech pack
sdd-system tech-pack remove <ns>       # Unregister a tech pack
```

### agent

Agent metadata extraction.

```bash
sdd-system agent frontmatter <path>   # Extract structured metadata from agent .md file
```

### log

Structured logging.

```bash
sdd-system log write --level info --message "Operation completed"   # Write structured log entry
```

### archive

Archive file management.

```bash
sdd-system archive store --type spec --path changes/old/   # Archive files
```

### permissions

Permission management.

```bash
sdd-system permissions configure   # Merge SDD recommended permissions
```

### workflow

Workflow phase gate management.

```bash
sdd-system workflow check-gate --target impl   # Check prerequisites for phase advance
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
plugin/core/system/
├── src/                    # TypeScript source
│   ├── cli.ts              # Main entry point
│   ├── commands/           # Command handlers by namespace
│   ├── lib/                # Shared utilities
│   ├── settings/           # Settings schema, validation, sync, reconciliation
│   └── types/              # Type definitions
├── dist/                   # Compiled JS (not committed)
├── package.json
└── tsconfig.json
```
