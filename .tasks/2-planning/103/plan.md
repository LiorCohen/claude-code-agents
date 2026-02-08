---
title: Validate sdd-settings writes against schema during sdd-change workflows
created: 2026-02-08
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

### Phase 1: Add Validation Layer in System Code

Create a validated write function that ALL settings modifications must use.

**File**: [plugin/system/src/settings/write.ts](../../../plugin/system/src/settings/write.ts) (new file)

```typescript
import Ajv from 'ajv';
import * as yaml from 'yaml';
import { settingsFileSchema } from './schema';
import { validateSettings } from './validate';
import type { SettingsFile } from '../types/settings';
import { writeText } from '../lib/fs';

const ajv = new Ajv({ allErrors: true, strict: true });
const schemaValidator = ajv.compile(settingsFileSchema);

export interface WriteSettingsOptions {
  readonly skipValidation?: boolean; // escape hatch for emergency fixes
}

export interface WriteSettingsResult {
  readonly success: boolean;
  readonly errors?: readonly string[];
  readonly warnings?: readonly string[];
}

/**
 * Write settings file with schema and cross-reference validation.
 * This is the ONLY approved way to write sdd-settings.yaml.
 */
export const writeSettings = async (
  filePath: string,
  settings: SettingsFile,
  options: WriteSettingsOptions = {}
): Promise<WriteSettingsResult> => {
  // Step 1: JSON Schema structural validation
  if (!options.skipValidation) {
    const schemaValid = schemaValidator(settings);
    if (!schemaValid) {
      return {
        success: false,
        errors: (schemaValidator.errors ?? []).map(
          err => `${err.instancePath} ${err.message}`
        ),
      };
    }
  }

  // Step 2: Business logic validation (cross-references, etc.)
  if (!options.skipValidation) {
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
  }

  // Step 3: Update last_updated timestamp
  const updatedSettings: SettingsFile = {
    ...settings,
    sdd: {
      ...settings.sdd,
      last_updated: new Date().toISOString().split('T')[0],
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

  const yamlContent = yaml.stringify(updatedSettings, {
    indent: 2,
    lineWidth: 0, // prevent line wrapping
  });

  // Step 5: Write atomically
  await writeText(filePath, header + yamlContent);

  return {
    success: true,
    warnings: options.skipValidation ? [] : validateSettings(updatedSettings).warnings.map(w =>
      w.component
        ? `[${w.component}${w.field ? `.${w.field}` : ''}] ${w.message}`
        : w.message
    ),
  };
};

/**
 * Read settings file.
 */
export const readSettings = async (filePath: string): Promise<SettingsFile> => {
  const content = await readText(filePath);
  return yaml.parse(content) as SettingsFile;
};
```

**Exports to add to** [plugin/system/src/settings/index.ts](../../../plugin/system/src/settings/index.ts):
```typescript
export type { WriteSettingsOptions, WriteSettingsResult } from './write';
export { writeSettings, readSettings } from './write';
```

### Phase 2: Update Skills to Use Validated Writes

**File**: [plugin/skills/project-settings/SKILL.md](../../../plugin/skills/project-settings/SKILL.md)

Update the skill instructions to REQUIRE using `writeSettings()`:

```markdown
## Write Operations

**CRITICAL**: All write operations MUST use the validated write function:

\```typescript
import { writeSettings } from '@/settings';

const result = await writeSettings(settingsPath, updatedSettings);
if (!result.success) {
  // Return error to user with validation details
  return {
    success: false,
    errors: result.errors,
  };
}
\```

**NEVER** write directly using `fs.writeFileSync`, `writeText`, or `yaml.dump`.
```

**Files to audit and update**:
1. [plugin/skills/project-settings/SKILL.md](../../../plugin/skills/project-settings/SKILL.md) - main settings management
2. [plugin/skills/change-creation/SKILL.md](../../../plugin/skills/change-creation/SKILL.md) - may modify affected_components
3. [plugin/skills/component-discovery/SKILL.md](../../../plugin/skills/component-discovery/SKILL.md) - adds new components

### Phase 3: Add Pre-Commit Hook Validation

**File**: [plugin/system/src/commands/hook/validate-settings.ts](../../../plugin/system/src/commands/hook/validate-settings.ts) (new file)

```typescript
import * as path from 'node:path';
import { readSettings } from '../../settings/write';
import { validateSettings, formatValidationResult } from '../../settings/validate';

/**
 * Pre-commit hook to validate sdd-settings.yaml changes.
 * Exits with error if validation fails.
 */
export const validateSettingsHook = async (): Promise<void> => {
  const settingsPath = path.join(process.cwd(), '.sdd', 'sdd-settings.yaml');

  try {
    const settings = await readSettings(settingsPath);
    const result = validateSettings(settings);

    if (!result.valid) {
      console.error('\n❌ sdd-settings.yaml validation failed:\n');
      console.error(formatValidationResult(result));
      console.error('\nCommit blocked. Fix validation errors before committing.');
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      console.warn('\n⚠️  sdd-settings.yaml warnings:\n');
      console.warn(formatValidationResult(result));
      console.warn('\nCommit allowed but please review warnings.');
    }
  } catch (err) {
    console.error('\n❌ Failed to validate sdd-settings.yaml:');
    console.error(err);
    process.exit(1);
  }
};
```

### Phase 4: Add CLI Command for Manual Validation

**File**: [plugin/system/src/commands/settings/validate.ts](../../../plugin/system/src/commands/settings/validate.ts) (new file)

```typescript
import * as path from 'node:path';
import { readSettings } from '../../settings/write';
import { validateSettings, formatValidationResult } from '../../settings/validate';

export const validateSettingsCommand = async (): Promise<void> => {
  const settingsPath = path.join(process.cwd(), '.sdd', 'sdd-settings.yaml');

  console.log('Validating sdd-settings.yaml...\n');

  try {
    const settings = await readSettings(settingsPath);
    const result = validateSettings(settings);

    console.log(formatValidationResult(result));

    if (result.valid) {
      console.log('\n✅ Validation passed');
      process.exit(0);
    } else {
      console.log('\n❌ Validation failed');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Failed to read or validate settings:');
    console.error(err);
    process.exit(1);
  }
};
```

**Add to CLI** ([plugin/system/src/cli.ts](../../../plugin/system/src/cli.ts) or equivalent):
```typescript
import { validateSettingsCommand } from './commands/settings/validate';

// In CLI command router:
if (command === 'validate-settings') {
  await validateSettingsCommand();
}
```

### Phase 5: Update Documentation

**File**: [plugin/skills/project-settings/SKILL.md](../../../plugin/skills/project-settings/SKILL.md)

Add section:

```markdown
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
sdd validate-settings
\```

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
8. ✅ Timestamp auto-updated on write
9. ✅ Skip validation flag bypasses checks

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

1. **Phase 1**: Add `writeSettings()` function (no breaking changes)
2. **Phase 2**: Update skills to use new function (backward compatible)
3. **Phase 3**: Add pre-commit hook (validates but doesn't block existing workflows)
4. **Phase 4**: Add CLI validation command (new feature)
5. **Phase 5**: Documentation updates

No breaking changes - existing valid settings files continue to work.

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
- [plugin/system/src/settings/write.ts](../../../plugin/system/src/settings/write.ts)
- [plugin/system/src/commands/hook/validate-settings.ts](../../../plugin/system/src/commands/hook/validate-settings.ts)
- [plugin/system/src/commands/settings/validate.ts](../../../plugin/system/src/commands/settings/validate.ts)
- [tests/src/tests/unit/settings/settings-write.test.ts](../../../tests/src/tests/unit/settings/settings-write.test.ts)
- [tests/src/tests/workflows/sdd-settings-validation.test.ts](../../../tests/src/tests/workflows/sdd-settings-validation.test.ts)

### Modified Files
- [plugin/system/src/settings/index.ts](../../../plugin/system/src/settings/index.ts) - export new functions
- [plugin/skills/project-settings/SKILL.md](../../../plugin/skills/project-settings/SKILL.md) - require writeSettings()
- [plugin/skills/change-creation/SKILL.md](../../../plugin/skills/change-creation/SKILL.md) - use writeSettings()
- [plugin/skills/component-discovery/SKILL.md](../../../plugin/skills/component-discovery/SKILL.md) - use writeSettings()
- [plugin/system/src/cli.ts](../../../plugin/system/src/cli.ts) - add validate-settings command

## Notes

1. **Skill layer enforcement**: Since settings writes happen in skill prompts (executed by Claude), we need to update the skill instructions to REQUIRE using `writeSettings()`. The pre-commit hook provides defense-in-depth.

2. **No direct filesystem access**: Skills execute in Claude's context and call system code. The `writeSettings()` function must be exported and callable from skill execution context.

3. **Schema evolution**: As new component types or settings are added, update both `settingsFileSchema` in [schema.ts](../../../plugin/system/src/settings/schema.ts) and validation logic in [validate.ts](../../../plugin/system/src/settings/validate.ts).

4. **User decisions go elsewhere**: If workflows need to store user decisions, guide them to:
   - `SPEC.md` for requirements clarifications
   - `PLAN.md` for implementation decisions
   - `WORKFLOW.md` for workflow state
   - Custom files in `.sdd/` for other metadata (not sdd-settings.yaml)
