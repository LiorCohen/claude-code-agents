---
title: Add pino logging to plugin/system with .sdd/system-logs output
created: 2026-02-08
---

# Plan: Add pino logging to plugin/system with .sdd/system-logs output

## Problem Summary

The plugin system lacks structured logging infrastructure. Console output serves its purpose for user-facing feedback (progress, results, errors shown to the user), but the system doesn't record what happens for later debugging, auditing, or troubleshooting. This plan adds file-based system logging using pino, writing to date-partitioned log files in `.sdd/system-logs/`.

**Important distinction:**
- **Console = user output** (what users see in real-time)
- **File logging = system logging** (what we record for debugging/audit)

## Files to Modify

| File | Changes |
|------|---------|
| [plugin/system/package.json](../../../plugin/system/package.json) | Add `pino` and `pino-pretty` dependencies |
| [plugin/system/src/lib/logger.ts](../../../plugin/system/src/lib/logger.ts) | Replace console-only logger with pino-based logger that writes to file |
| [plugin/system/src/settings/schema.ts](../../../plugin/system/src/settings/schema.ts) | Add `system.logging` section to settings schema |
| [plugin/system/src/types/settings.ts](../../../plugin/system/src/types/settings.ts) | Add `SystemSettings` and `LoggingSettings` types |
| [plugin/system/src/cli.ts](../../../plugin/system/src/cli.ts) | Initialize file logger with settings and context |
| [.gitignore](../../../.gitignore) | Add `.sdd/system-logs/` directory |
| [package.json](../../../package.json) | Add `npm run logs` script for tailing with pretty printing |

## Changes

### 1. Dependencies

Add pino and pino-pretty to plugin/system:
- `pino` - Core structured logging library
- `pino-pretty` - Pretty-printing for development/debugging

### 2. Settings Schema Extension

Add new `system` section to settings schema with logging configuration:
- `system.logging.enabled` (boolean, default: true) - Enable/disable file logging
- `system.logging.level` (string, default: "info") - Log level (trace, debug, info, warn, error, fatal)

The settings schema validates these fields and provides defaults.

### 3. File Logger Implementation

**CRITICAL CONSTRAINT: Zero changes to existing console output. Console is user-facing OUTPUT, not logging. All 200+ existing console.log/error/warn calls remain exactly as-is.**

Add NEW pino-based file logger for system logging:
- **Console output** - Zero changes. Console is for USER OUTPUT (progress, results, feedback). Stays identical.
- **File logging** - NEW. Pino writes SYSTEM LOGS to `.sdd/system-logs/system-YYYY-MM-DD.log`

Create separate pino logger instance for file-based system logging:
- Logs system events (command execution, errors, validation) to files
- Does NOT touch console output
- Does NOT intercept or modify any console.* calls
- Runs independently of user-facing console output

**Baseline requirement - log every CLI invocation:**
- Command invocation (namespace + action)
- Arguments passed to the command
- Command result (success/failure, output, errors)

File logger includes context in every log entry:
- Command name (namespace + action)
- Arguments array
- Timestamp (handled by pino)
- Process ID (handled by pino)
- Claude session ID (from `CLAUDE_SESSION_ID` environment variable, if available)

File logging respects `system.logging.enabled` and `system.logging.level` from settings.

### 4. CLI Integration

**NO changes to command handlers or existing code paths.**

Update ONLY the CLI entry point ([cli.ts](../../../plugin/system/src/cli.ts)) to:
1. Load settings from `.sdd/sdd-settings.yaml` (if exists)
2. Initialize pino file logger with settings
3. **Log every CLI invocation:**
   - Command start: namespace, action, arguments
   - Command result: success/failure, output data, errors
4. Existing console output and logger usage remains unchanged

Settings are optional - if not found, use defaults (enabled: true, level: info).

**What does NOT change:**
- Command handler implementations - no modifications
- All console output (200+ calls) - untouched. Console is for USER OUTPUT, not logging.
- Any output formatting or user-facing messages
- Existing logger.ts behavior - if it currently outputs to console, that stays

### 5. Log Management

Log files are created in `.sdd/system-logs/` with date-based naming:
- Format: `system-YYYY-MM-DD.log`
- New log file created automatically for each day
- Files accumulate (no rotation or deletion yet)
- Directory is gitignored

Initial implementation does not limit file size or count - this can be added later if needed.

### 6. Developer Tooling

Add npm script to root `package.json`:
```bash
npm run logs
```

This script:
- Finds the latest log file in `.sdd/system-logs/`
- Tails it using `tail -f`
- Pipes through `pino-pretty` for readable formatting

## Dependencies

1. Install pino dependencies first
2. Update settings schema and types
3. Update logger implementation
4. Update CLI to use new logger
5. Add npm script and update .gitignore

No blocking dependencies between schema updates and logger implementation - can be done in parallel.

## Tests

### Unit Tests

- [ ] `test_logger_creates_directory_if_missing` - Logger creates `.sdd/system-logs/` if it doesn't exist
- [ ] `test_logger_writes_to_correct_file` - Logger writes to `system-YYYY-MM-DD.log` based on current date
- [ ] `test_logger_includes_required_context` - Log entries include command, arguments, timestamp, PID, session ID
- [ ] `test_logger_captures_invocation_details` - Every CLI invocation logs namespace, action, and arguments
- [ ] `test_logger_respects_enabled_setting` - When `logging.enabled` is false, no file writes occur
- [ ] `test_logger_respects_level_setting` - When `logging.level` is "error", info/debug logs are not written
- [ ] `test_logger_uses_defaults_when_settings_missing` - Falls back to enabled=true, level=info
- [ ] `test_console_output_unchanged` - All existing console output works identically (console is OUTPUT, not logging)
- [ ] `test_no_console_calls_modified` - Verify zero changes to console usage (200+ calls)
- [ ] `test_settings_schema_validates_logging_config` - Schema accepts valid logging config
- [ ] `test_settings_schema_rejects_invalid_level` - Schema rejects invalid log levels
- [ ] `test_settings_schema_provides_defaults` - Schema defaults logging.enabled=true, level=info

### Integration Tests

- [ ] `test_cli_command_logs_to_file` - Running `sdd-system spec validate` writes logs to file
- [ ] `test_cli_logs_command_start_and_end` - Log file contains start/end entries for command
- [ ] `test_cli_logs_invocation_arguments` - Log entries include all arguments passed to command
- [ ] `test_cli_logs_command_result` - Log entries include command result (success/failure, output, errors)
- [ ] `test_cli_logs_errors` - Errors are logged with full context
- [ ] `test_cli_respects_settings` - CLI reads settings and configures logger appropriately
- [ ] `test_multiple_commands_same_day` - Multiple commands append to same date file
- [ ] `test_commands_different_days` - Commands on different days write to different files
- [ ] `test_session_id_captured` - When CLAUDE_SESSION_ID env var is set, it appears in logs

### E2E Tests

- [ ] `test_logs_script_tails_latest_file` - `npm run logs` correctly identifies and tails latest log
- [ ] `test_logs_script_pretty_prints` - Output from `npm run logs` is human-readable
- [ ] `test_gitignore_excludes_logs` - `.sdd/system-logs/` is properly gitignored

## Verification

- [ ] Pino dependencies installed in plugin/system/package.json
- [ ] Settings schema includes `system.logging` with correct types and defaults
- [ ] Logger writes to `.sdd/system-logs/system-YYYY-MM-DD.log`
- [ ] **Every CLI invocation is logged** with namespace, action, arguments, and result
- [ ] Log entries include command, arguments, timestamp, PID, session ID (if available)
- [ ] **ALL existing console output unchanged** (verified: no modifications to 200+ console calls)
- [ ] Console output (user-facing) continues to work identically to before
- [ ] File logging (system logging) works independently of console output
- [ ] Logger respects `logging.enabled` and `logging.level` settings
- [ ] `.sdd/system-logs/` is gitignored
- [ ] `npm run logs` tails latest log with pretty printing
- [ ] All tests pass
