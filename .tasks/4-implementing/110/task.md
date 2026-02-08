# Add pino logging to plugin/system with .sdd/system-logs output

---
id: 110
status: implementing
priority: medium
created: 2026-02-08
---

## Description

Implement structured logging for the plugin system using the pino library. Logs should be written to `.sdd/system-logs/` (gitignored directory).

## Requirements

### Scope & Integration
- Comprehensive logging across all system CLI commands
- Create logger utility/module for import throughout plugin/system
- Log all command execution (start/end), errors, and validation results
- Logging is **complementary** to console output (stdout/stderr), not a replacement

### Configuration
- Add `system.logging` section to sdd-settings schema:
  - `logging.level` - log level (default: `info`)
  - `logging.enabled` - enable/disable logging (default: `true`)
- Single log level for all environments (no dev/prod distinction)

### Log Management
- File naming: `system-YYYY-MM-DD.log`
- No rotation needed initially
- Ensure total size stays reasonable
- Let files accumulate for now

### Log Content & Context
- Include in all log entries:
  - Command name
  - Timestamp
  - Claude session ID (if available)
  - Process ID (PID)
- Use appropriate log levels (trace, debug, info, warn, error, fatal)

### Dependencies & Tooling
- Install `pino` and `pino-pretty`
- Add npm script to root `package.json` for tailing logs with pretty printing
  - e.g., `npm run logs` to tail latest log file with pino-pretty

## Context

The plugin system currently lacks proper logging infrastructure. Adding structured logging will help with debugging, monitoring, and understanding system behavior. This complements console output rather than replacing it.

## Acceptance Criteria

- [ ] Pino and pino-pretty installed
- [ ] Logger utility/module created and importable
- [ ] All CLI commands use the logger
- [ ] Logs write to `.sdd/system-logs/system-YYYY-MM-DD.log`
- [ ] Log directory is gitignored
- [ ] Settings schema includes `system.logging` configuration
- [ ] Logger respects `logging.enabled` and `logging.level` settings
- [ ] Log entries include command name, timestamp, session ID, and PID
- [ ] npm script added for tailing logs with pretty printing
- [ ] Documentation updated with logging approach
