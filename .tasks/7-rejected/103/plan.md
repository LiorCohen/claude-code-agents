---
title: Validate sdd-settings writes against schema during sdd-change workflows
created: 2026-02-08 15:40 UTC
updated: 2026-02-08 18:37 UTC
---

# Implementation Plan: Validate sdd-settings writes against schema

## Overview

Add strict schema validation to all `sdd-settings.yaml` write operations to prevent invalid entries from being persisted. The plugin must enforce its own configuration schema and reject non-compliant writes with clear error messages.

## Context

Based on codebase exploration, the current architecture has:

1. **Strong validation infrastructure** ([plugin/system/src/settings/validate.ts](../../../plugin/system/src/settings/validate.ts)):
   - `validateSettings()` function with comprehensive checks
   - Cross-reference validation (databases, contracts, helm charts)
   - Naming conventions enforcement
   - Type-specific validations

2. **JSON Schema definitions** ([plugin/system/src/settings/schema.ts](../../../plugin/system/src/settings/schema.ts)):
   - Complete `settingsFileSchema` for structural validation
   - Individual component schemas
   - Metadata schemas (sdd, project)

3. **No direct write operations in system code**:
   - Settings are written through the skill layer (`project-settings` skill)
   - System commands only READ settings
   - No schema validation hook before writes currently

4. **Skill-based write operations**:
   - [plugin/skills/project-settings/SKILL.md](../../../plugin/skills/project-settings/SKILL.md) - settings management
   - [plugin/skills/change-creation/SKILL.md](../../../plugin/skills/change-creation/SKILL.md) - reads settings, may trigger updates
   - [plugin/skills/component-discovery/SKILL.md](../../../plugin/skills/component-discovery/SKILL.md) - may update settings

## Problem Statement

During `sdd-change` workflows, invalid entries are being added to `sdd-settings.yaml` that don't conform to the schema. Examples of violations:
- Extra fields not in the schema (e.g., user decisions, workflow state)
- Missing required fields
- Invalid enum values
- Broken references between components

The root cause: **no validation gate between skill logic and file writes**.

## Architectural Principle

**`sdd-settings.yaml` is strictly for plugin configuration**. It's not a general-purpose storage location for:
- User decisions (use `SPEC.md`, `PLAN.md`)
- Workflow state (use `WORKFLOW.md`)
- Custom data (use dedicated files)

The plugin must protect the integrity of its own configuration file.

## Implementation Strategy

### Phase 0: Update Settings Schema

**Improve version tracking in settings metadata.**

**Current schema issue**: The `sdd.plugin_version` field is ambiguous - it's unclear if it represents the creating version or the updating version.

**Changes**:
1. Split version field:
   - `created_by_plugin_version` - version that initialized the project (immutable)
   - `updated_by_plugin_version` - version that last modified settings (updated on every write)

2. Use datetime instead of date:
   - `created_at` - Human-readable UTC datetime when project was created (immutable)
   - `updated_at` - Human-readable UTC datetime when settings were last modified (auto-updated)
   - Format: `YYYY-MM-DD HH:MM:SS UTC` (no subseconds, space-separated, explicit UTC)

**File**: [plugin/system/src/types/settings.ts](../../../plugin/system/src/types/settings.ts)

```typescript
/** SDD metadata in settings file */
export interface SddMetadata {
  /** SDD plugin version that created this project (immutable) */
  readonly created_by_plugin_version: string;
  /** SDD plugin version that last updated settings */
  readonly updated_by_plugin_version: string;
  /** UTC datetime when project was initialized (YYYY-MM-DD HH:MM:SS UTC) */
  readonly created_at: string;
  /** UTC datetime when settings were last modified (YYYY-MM-DD HH:MM:SS UTC) */
  readonly updated_at: string;
}
```

**File**: [plugin/system/src/settings/schema.ts](../../../plugin/system/src/settings/schema.ts)

Update the `sddMetadataSchema`:

```typescript
const sddMetadataSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    created_by_plugin_version: {
      type: 'string',
      description: 'SDD plugin version that created this project',
    },
    updated_by_plugin_version: {
      type: 'string',
      description: 'SDD plugin version that last updated settings',
    },
    created_at: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2} UTC$',
      description: 'UTC datetime when project was initialized (YYYY-MM-DD HH:MM:SS UTC)',
    },
    updated_at: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2} UTC$',
      description: 'UTC datetime when settings were last modified (YYYY-MM-DD HH:MM:SS UTC)',
    },
  },
  required: ['created_by_plugin_version', 'updated_by_plugin_version', 'created_at', 'updated_at'],
  additionalProperties: false,
};
```

**Migration**: Legacy format migration is handled in the `readSettings()` function in Phase 1.

### Phase 1: Add Validation Layer in System Code

Create a validated write function that ALL settings modifications must use.

**File**: [plugin/system/src/settings/write.ts](../../../plugin/system/src/settings/write.ts) (new file)

```typescript
import * as path from 'node:path';
import Ajv from 'ajv';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { settingsFileSchema } from './schema';
import { validateSettings } from './validate';
import type { SettingsFile } from '../types/settings';
import { readText, writeText, readJson } from '@/lib/fs';
import { getPluginRoot } from '@/lib/config';
import type { PluginJson } from '@/types/config';

const ajv = new Ajv({ allErrors: true, strict: false });
// Remove $schema property as ajv doesn't support 2020-12 draft by default
const schema = { ...settingsFileSchema };
delete schema['$schema'];
const schemaValidator = ajv.compile(schema);

export interface WriteSettingsResult {
  readonly success: boolean;
  readonly errors?: readonly string[];
  readonly warnings?: readonly string[];
}

/**
 * Get current plugin version from .claude-plugin/plugin.json
 */
const getPluginVersion = async (): Promise<string> => {
  const pluginRoot = getPluginRoot();
  const pluginJsonPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  const pluginJson = await readJson<PluginJson>(pluginJsonPath);
  return pluginJson.version;
};

/**
 * Format current UTC datetime in human-readable format.
 * Returns: "YYYY-MM-DD HH:MM:SS UTC"
 */
const formatUtcDatetime = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
};

/**
 * Write settings file with schema and cross-reference validation.
 * This is the ONLY approved way to write sdd-settings.yaml.
 *
 * Validation is ALWAYS enforced - no escape hatch.
 */
export const writeSettings = async (
  filePath: string,
  settings: SettingsFile
): Promise<WriteSettingsResult> => {
  // Step 1: JSON Schema structural validation
  const schemaValid = schemaValidator(settings);
  if (!schemaValid) {
    return {
      success: false,
      errors: (schemaValidator.errors ?? []).map(
        err => `${err.instancePath || '/'} ${err.message}`
      ),
    };
  }

  // Step 2: Business logic validation (cross-references, etc.)
  const validationResult = validateSettings(settings);
  if (!validationResult.valid) {
    return {
      success: false,
      errors: validationResult.errors.map(e =>
        e.component
          ? `[${e.component}${e.field ? `.${e.field}` : ''}] ${e.message}`
          : e.message
      ),
      warnings: validationResult.warnings.map(w =>
        w.component
          ? `[${w.component}${w.field ? `.${w.field}` : ''}] ${w.message}`
          : w.message
      ),
    };
  }

  // Step 3: Update timestamp and plugin version
  const currentVersion = await getPluginVersion();
  const timestamp = formatUtcDatetime();

  const updatedSettings: SettingsFile = {
    ...settings,
    sdd: {
      ...settings.sdd,
      updated_by_plugin_version: currentVersion,
      updated_at: timestamp,
    },
  };

  // Step 4: Serialize to YAML with header
  const header = [
    '# ============================================================================',
    '# SDD PROJECT SETTINGS - DO NOT EDIT MANUALLY',
    '# ============================================================================',
    '# This file is generated and maintained by SDD commands.',
    '# To modify settings, use: /sdd-settings',
    '# ============================================================================',
    '',
  ].join('\n');

  const yamlContent = stringifyYaml(updatedSettings, {
    indent: 2,
    lineWidth: 0, // prevent line wrapping
  });

  // Step 5: Write atomically
  await writeText(filePath, header + yamlContent);

  return {
    success: true,
    warnings: validationResult.warnings.map(w =>
      w.component
        ? `[${w.component}${w.field ? `.${w.field}` : ''}] ${w.message}`
        : w.message
    ),
  };
};

/**
 * Read settings file with legacy format migration.
 */
export const readSettings = async (filePath: string): Promise<SettingsFile> => {
  const content = await readText(filePath);
  const parsed = parseYaml(content) as any;

  // Migrate legacy plugin_version to new format
  if (parsed.sdd?.plugin_version && !parsed.sdd?.created_by_plugin_version) {
    parsed.sdd.created_by_plugin_version = parsed.sdd.plugin_version;
    parsed.sdd.updated_by_plugin_version = parsed.sdd.plugin_version;
    delete parsed.sdd.plugin_version;
  }

  // Migrate legacy date fields (YYYY-MM-DD) to datetime
  if (parsed.sdd?.initialized_at && !parsed.sdd?.created_at) {
    parsed.sdd.created_at = `${parsed.sdd.initialized_at} 00:00:00 UTC`;
    delete parsed.sdd.initialized_at;
  }

  if (parsed.sdd?.last_updated && !parsed.sdd?.updated_at) {
    parsed.sdd.updated_at = `${parsed.sdd.last_updated} 00:00:00 UTC`;
    delete parsed.sdd.last_updated;
  }

  return parsed as SettingsFile;
};
```

**Exports to add to** [plugin/system/src/settings/index.ts](../../../plugin/system/src/settings/index.ts):
```typescript
export type { WriteSettingsResult } from './write';
export { writeSettings, readSettings } from './write';
```

### Phase 2: Add System CLI Command

Expose `writeSettings()` function via system CLI using the `settings` namespace.

#### 2.1: Create settings command handlers

**File**: [plugin/system/src/commands/settings/write.ts](../../../plugin/system/src/commands/settings/write.ts) (new file)

```typescript
/**
 * Settings write command.
 *
 * Validates and writes sdd-settings.yaml with automatic timestamp/version updates.
 * Reads settings from stdin as YAML.
 *
 * Usage:
 *   cat .sdd/sdd-settings.yaml | sdd-system settings write
 */

import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { CommandResult } from '@/lib/args';
import { writeSettings } from '@/settings/write';
import type { SettingsFile } from '@/types/settings';

/**
 * Read JSON or YAML input from stdin.
 */
const readStdin = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    process.stdin.on('error', reject);
  });
};

export const write = async (): Promise<CommandResult> => {
  try {
    // Read settings from stdin
    const inputStr = await readStdin();
    if (!inputStr.trim()) {
      return {
        success: false,
        error: 'No input provided. Pipe settings YAML to stdin.',
      };
    }

    // Parse YAML
    const settings = parseYaml(inputStr) as SettingsFile;

    // Write to .sdd/sdd-settings.yaml
    const settingsPath = path.join(process.cwd(), '.sdd', 'sdd-settings.yaml');
    const result = await writeSettings(settingsPath, settings);

    if (!result.success) {
      return {
        success: false,
        error: 'Settings validation failed',
        data: { errors: result.errors },
      };
    }

    return {
      success: true,
      message: 'Settings written successfully',
      data: {
        path: settingsPath,
        warnings: result.warnings,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to write settings: ${errorMessage}`,
    };
  }
};
```

**File**: [plugin/system/src/commands/settings/validate.ts](../../../plugin/system/src/commands/settings/validate.ts) (new file)

```typescript
/**
 * Settings validate command.
 *
 * Validates sdd-settings.yaml without modifying it.
 *
 * Usage:
 *   sdd-system settings validate [--json]
 */

import * as path from 'node:path';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { readSettings } from '@/settings/write';
import { validateSettings, formatValidationResult } from '@/settings/validate';

export const validate = async (
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const settingsPath = path.join(process.cwd(), '.sdd', 'sdd-settings.yaml');

  try {
    const settings = await readSettings(settingsPath);
    const result = validateSettings(settings);

    if (options.json) {
      return {
        success: result.valid,
        data: {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
        },
        error: result.valid ? undefined : 'Validation failed',
      };
    }

    // Text output
    console.log('Settings Validation Results');
    console.log('='.repeat(40));
    console.log(formatValidationResult(result));

    if (result.valid) {
      console.log('\n✓ Validation passed');
      return { success: true };
    } else {
      console.log('\n✗ Validation failed');
      return {
        success: false,
        error: 'Validation failed',
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to read or validate settings: ${errorMessage}`,
    };
  }
};
```

**File**: [plugin/system/src/commands/settings/index.ts](../../../plugin/system/src/commands/settings/index.ts) (new file)

```typescript
/**
 * Settings command namespace handler.
 */

import type { CommandResult, GlobalOptions } from '@/lib/args';
import { write } from './write';
import { validate } from './validate';

export const handleSettings = async (
  action: string,
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  switch (action) {
    case 'write':
      return write();
    case 'validate':
      return validate(args, options);
    default:
      return {
        success: false,
        error: `Unknown settings action: ${action}. Available: write, validate`,
      };
  }
};
```

#### 2.2: Register settings namespace in CLI

**File**: [plugin/system/src/cli.ts](../../../plugin/system/src/cli.ts)

Add to imports:
```typescript
import { handleSettings } from '@/commands/settings';
```

Add to NAMESPACES array:
```typescript
const NAMESPACES = ['scaffolding', 'spec', 'version', 'hook', 'database', 'contract', 'config', 'env', 'permissions', 'workflow', 'settings'] as const;
```

Add to COMMAND_HANDLERS:
```typescript
const COMMAND_HANDLERS: Readonly<Record<Namespace, CommandHandler>> = {
  // ... existing handlers
  settings: handleSettings,
};
```

Add to HELP_TEXT:
```typescript
  settings      Settings file operations
    write       Write and validate sdd-settings.yaml (reads from stdin)
    validate    Validate sdd-settings.yaml
```

#### 2.3: Update skills to use the command

Skills should invoke the command via Bash, passing the settings as YAML to stdin:

**Pattern for skills**:
```bash
cat <<'EOF' | sdd-system settings write
sdd:
  created_by_plugin_version: "6.3.6"
  updated_by_plugin_version: "6.3.6"
  created_at: "2026-02-08 10:00:00 UTC"
  updated_at: "2026-02-08 10:00:00 UTC"

project:
  name: "my-app"
  description: "Example app"
  domain: "Task Management"
  type: "fullstack"

components:
  - name: config
    type: config
    settings: {}
EOF
```

**Files to update**:
- [plugin/skills/project-settings/SKILL.md](../../../plugin/skills/project-settings/SKILL.md) - document usage of `sdd-system settings write`
- [plugin/skills/change-creation/SKILL.md](../../../plugin/skills/change-creation/SKILL.md) - use command instead of direct writes
- [plugin/skills/component-discovery/SKILL.md](../../../plugin/skills/component-discovery/SKILL.md) - use command instead of direct writes

### Phase 3: Add Pre-Commit Hook Validation

Add a pre-commit hook that validates sdd-settings.yaml before allowing commits.

**File**: [plugin/system/src/commands/hook/validate-settings.ts](../../../plugin/system/src/commands/hook/validate-settings.ts) (new file)

```typescript
/**
 * PreCommit hook: validate-settings
 *
 * Validates sdd-settings.yaml before allowing commits.
 * Blocks commit if validation fails.
 */

import * as path from 'node:path';
import type { CommandResult } from '@/lib/args';
import { readSettings } from '@/settings/write';
import { validateSettings, formatValidationResult } from '@/settings/validate';
import { exists } from '@/lib/fs';

export const validateSettingsHook = async (): Promise<CommandResult> => {
  const settingsPath = path.join(process.cwd(), '.sdd', 'sdd-settings.yaml');

  // Only validate if settings file exists
  if (!(await exists(settingsPath))) {
    return { success: true };
  }

  try {
    const settings = await readSettings(settingsPath);
    const result = validateSettings(settings);

    if (!result.valid) {
      console.error('\n❌ sdd-settings.yaml validation failed:\n');
      console.error(formatValidationResult(result));
      console.error('\nCommit blocked. Fix validation errors before committing.');
      return {
        success: false,
        error: 'Settings validation failed',
      };
    }

    if (result.warnings.length > 0) {
      console.warn('\n⚠️  sdd-settings.yaml warnings:\n');
      console.warn(formatValidationResult(result));
      console.warn('\nCommit allowed but please review warnings.');
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('\n❌ Failed to validate sdd-settings.yaml:');
    console.error(errorMessage);
    return {
      success: false,
      error: `Failed to validate settings: ${errorMessage}`,
    };
  }
};
```

**Register hook in** [plugin/system/src/commands/hook/index.ts](../../../plugin/system/src/commands/hook/index.ts):

```typescript
import { validateSettingsHook } from './validate-settings';

// In handleHook function, add case:
case 'validate-settings':
  return validateSettingsHook();
```

**Add hook configuration to plugin** `.claude-plugin/plugin.json` (if not using hooks.yaml):

```json
{
  "hooks": {
    "PreCommit": "sdd-system hook validate-settings"
  }
}
```

Or update `.claude/hooks.yaml` in generated projects to include the hook.

### Phase 4: Update Documentation

Update documentation to reflect the new validation requirements and CLI commands.

**File**: [plugin/skills/project-settings/SKILL.md](../../../plugin/skills/project-settings/SKILL.md)

Add sections:

```markdown
## Version Tracking

Settings track both creation and update metadata:

**Version tracking:**
- `created_by_plugin_version` - Plugin version that initialized the project (immutable)
- `updated_by_plugin_version` - Plugin version that last modified settings (auto-updated)

**Timestamp tracking:**
- `created_at` - UTC datetime when project was created (immutable)
- `updated_at` - UTC datetime when settings were last modified (auto-updated)
- Format: `YYYY-MM-DD HH:MM:SS UTC` (human-readable, no subseconds)

This helps diagnose version-related issues, track modification history, and understand migration needs.

## Validation

All settings modifications are automatically validated against:

1. **JSON Schema** - Structural validation (types, required fields, enum values)
2. **Cross-references** - Component references must exist
3. **Business rules** - Hybrid servers need 2+ modes, helm charts reference valid targets
4. **Naming conventions** - Lowercase, hyphenated, valid patterns

Validation failures block the write and return clear error messages.

### Manual Validation

To validate settings without modifying them:

\```bash
sdd-system settings validate
\```

For JSON output:

\```bash
sdd-system settings validate --json
\```

### Writing Settings

Skills should use the validated write command:

\```bash
cat <<'EOF' | sdd-system settings write
sdd:
  created_by_plugin_version: "6.3.6"
  updated_by_plugin_version: "6.3.6"
  created_at: "2026-02-08 10:00:00 UTC"
  updated_at: "2026-02-08 10:00:00 UTC"

project:
  name: "my-app"
  description: "Example app"

components:
  - name: config
    type: config
    settings: {}
EOF
\```

The command will:
- Validate against JSON Schema
- Check cross-references
- Auto-update `updated_at` and `updated_by_plugin_version`
- Return errors if validation fails

### Pre-Commit Hook

Settings are automatically validated before commits to prevent invalid state from being committed.
```

## Testing Strategy

### Unit Tests

**File**: [tests/src/tests/unit/settings/settings-write.test.ts](../../../tests/src/tests/unit/settings/settings-write.test.ts) (new file)

Test cases:
1. ✅ Valid settings write succeeds
2. ❌ Missing required field rejected
3. ❌ Invalid enum value rejected
4. ❌ Additional properties rejected
5. ❌ Broken component reference rejected
6. ❌ Invalid hybrid server (1 mode) rejected
7. ⚠️  Warnings shown but write succeeds
8. ✅ Datetime timestamp auto-updated on write
9. ✅ Plugin version auto-updated on write
10. ✅ Legacy plugin_version field migrated on read
11. ✅ Legacy date fields (initialized_at, last_updated) migrated to datetime

### Integration Tests

**File**: [tests/src/tests/workflows/sdd-settings-validation.test.ts](../../../tests/src/tests/workflows/sdd-settings-validation.test.ts) (new file)

Test cases:
1. Settings write through skill layer validates
2. Invalid settings rejected with clear error
3. Validation error includes field path and reason
4. Pre-commit hook blocks invalid settings

## Error Messages

Design clear, actionable error messages:

```
❌ sdd-settings.yaml validation failed:

Errors:
  [main-server.databases] References non-existent database component: "analytics-db"
  [api-chart.deploys] References non-existent server component: "web-server"
  [hybrid-server.modes] Hybrid server requires at least 2 modes (e.g., ["api", "worker"])

Commit blocked. Fix validation errors before committing.
```

```
⚠️  sdd-settings.yaml warnings:

Warnings:
  [auth-server] Server has helm: true but no helm chart deploys it. Consider adding a helm chart or setting helm: false.

Commit allowed but please review warnings.
```

## Migration Path

1. **Phase 0**: Update schema with version tracking (backward compatible via migration)
2. **Phase 1**: Add `writeSettings()` and `readSettings()` functions (no breaking changes)
3. **Phase 2**: Add CLI commands and update skills to use new pattern (backward compatible)
4. **Phase 3**: Add pre-commit hook (defense-in-depth validation)
5. **Phase 4**: Documentation updates

**Legacy compatibility**: The `readSettings()` function automatically migrates:
1. Old `plugin_version` field → `created_by_plugin_version` and `updated_by_plugin_version`
2. Old date fields (`initialized_at`, `last_updated`) → datetime fields (`created_at`, `updated_at`)

Next write persists the migrated format.

## Acceptance Criteria Mapping

- [x] **All sdd-settings writes are validated against the schema before persisting**
  - Implemented via `writeSettings()` function with JSON Schema + business rule validation

- [x] **Non-compliant entries are rejected with a clear error describing the violation**
  - Validation errors include field path, component name, and specific violation message

- [x] **Existing sdd-change workflows cannot introduce invalid settings**
  - Skills updated to use `writeSettings()`, pre-commit hook blocks invalid commits

- [x] **Schema validation covers required fields, allowed values, and structure**
  - JSON Schema validates structure, validateSettings() checks cross-references and business rules

- [x] **No regression in valid sdd-change workflows**
  - Migration path preserves backward compatibility, existing valid files unchanged

## Dependencies

- `ajv` (already in use) - JSON Schema validation
- `yaml` (already in use) - YAML parsing/serialization
- Existing validation infrastructure in [plugin/system/src/settings/validate.ts](../../../plugin/system/src/settings/validate.ts)

## Files Changed

### New Files
- [plugin/system/src/settings/write.ts](../../../plugin/system/src/settings/write.ts) - `writeSettings()`, `readSettings()`, `getPluginVersion()`, `formatUtcDatetime()`
- [plugin/system/src/commands/settings/index.ts](../../../plugin/system/src/commands/settings/index.ts) - settings namespace handler
- [plugin/system/src/commands/settings/write.ts](../../../plugin/system/src/commands/settings/write.ts) - `sdd-system settings write` command
- [plugin/system/src/commands/settings/validate.ts](../../../plugin/system/src/commands/settings/validate.ts) - `sdd-system settings validate` command
- [plugin/system/src/commands/hook/validate-settings.ts](../../../plugin/system/src/commands/hook/validate-settings.ts) - pre-commit hook
- [tests/src/tests/unit/settings/settings-write.test.ts](../../../tests/src/tests/unit/settings/settings-write.test.ts) - unit tests
- [tests/src/tests/workflows/sdd-settings-validation.test.ts](../../../tests/src/tests/workflows/sdd-settings-validation.test.ts) - workflow tests

### Modified Files
- [plugin/system/src/types/settings.ts](../../../plugin/system/src/types/settings.ts) - update `SddMetadata` interface
- [plugin/system/src/settings/schema.ts](../../../plugin/system/src/settings/schema.ts) - update `sddMetadataSchema`
- [plugin/system/src/settings/index.ts](../../../plugin/system/src/settings/index.ts) - export `writeSettings`, `readSettings`, `WriteSettingsResult`
- [plugin/system/src/commands/hook/index.ts](../../../plugin/system/src/commands/hook/index.ts) - register `validate-settings` hook
- [plugin/system/src/cli.ts](../../../plugin/system/src/cli.ts) - add `settings` namespace
- [plugin/skills/project-settings/SKILL.md](../../../plugin/skills/project-settings/SKILL.md) - document validation and CLI usage
- [plugin/skills/change-creation/SKILL.md](../../../plugin/skills/change-creation/SKILL.md) - use `sdd-system settings write` command
- [plugin/skills/component-discovery/SKILL.md](../../../plugin/skills/component-discovery/SKILL.md) - use `sdd-system settings write` command

## Notes

1. **Skill layer enforcement**: Since settings writes happen in skill prompts (executed by Claude), we need to update the skill instructions to REQUIRE using `writeSettings()`. The pre-commit hook provides defense-in-depth.

2. **No direct filesystem access**: Skills execute in Claude's context and call system code. The `writeSettings()` function must be exported and callable from skill execution context.

3. **Schema evolution**: As new component types or settings are added, update both `settingsFileSchema` in [schema.ts](../../../plugin/system/src/settings/schema.ts) and validation logic in [validate.ts](../../../plugin/system/src/settings/validate.ts).

4. **User decisions go elsewhere**: If workflows need to store user decisions, guide them to:
   - `SPEC.md` for requirements clarifications
   - `PLAN.md` for implementation decisions
   - `WORKFLOW.md` for workflow state
   - Custom files in `.sdd/` for other metadata (not sdd-settings.yaml)
