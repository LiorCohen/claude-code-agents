---
title: Move external spec handling from sdd-init to sdd-new-change
created: 2026-01-31
---

# Plan: Move External Spec Handling from sdd-init to sdd-new-change

## Problem Summary

External spec handling is currently embedded in `sdd-init`, but it makes more sense as part of `sdd-new-change` because:
1. External specs can be imported at any time, not just during project initialization
2. `sdd-new-change` is the natural entry point for creating changes
3. Better separation of concerns (init = scaffolding, new-change = change creation)

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/commands/sdd-init.md` | Remove `--spec` argument, Phase 0 spec handling, Phase 7, and related docs |
| `plugin/commands/sdd-new-change.md` | Add `--spec` mode, branch flow for spec vs interactive mode |
| `plugin/skills/external-spec-integration/SKILL.md` | Update "When to Use" section to reference sdd-new-change |
| `tests/src/tests/workflows/sdd-init-external-spec.test.ts` | Rename to `sdd-new-change-external-spec.test.ts`, rewrite for new command |
| `tests/data/sdd-init-external.yaml` | Rename to `sdd-new-change-external.yaml` |
| `docs/commands.md` | Remove `--spec` from sdd-init section, add `--spec` to sdd-new-change section |
| `README.md` | Update command table to move `--spec` from sdd-init to sdd-new-change |
| `plugin/skills/product-discovery/SKILL.md` | Remove "Phase 7" reference (line 73), update spec handling context |

## Archive Location Note

**Discrepancy found:** The test currently checks `specs/external/` but external-spec-integration skill says `archive/`.

The skill (`plugin/skills/external-spec-integration/SKILL.md`) is authoritative - it says external specs are archived to `archive/` at the project root. The test needs to be updated to check `archive/` instead of `specs/external/`.

## Implementation

### Phase 1: Update sdd-init.md

Remove all external spec functionality:

1. **Update description** (line 2): Remove "optionally from an external spec"
2. **Update heading** (line 6): Remove ", optionally from an existing external specification"
3. **Update Usage section** (lines 12-27): Remove `[--spec <path-to-external-spec>]` from usage, remove `--spec` argument description, remove external spec example
4. **Update Phase table** (lines 36-50): Remove Phase 7 row entirely
5. **Update Phase Tracking checklist** (lines 58-71): Remove Phase 7 line, update references
6. **Remove Phase 0 spec handling** (lines 103-127): Remove the entire "If external spec is provided" block
7. **Update Phase 1 input** (lines 140-149): Remove `spec_outline` and `spec_path` parameters
8. **Remove Phase 7 section entirely** (lines 332-353)
9. **Update Phase 8 commit message** (lines 368-375): Remove external spec lines
10. **Update Phase 9 completion report** (lines 393-416): Remove the external spec variant entirely, keep only standard initialization
11. **Remove external spec notes** (lines 451-459): Remove notes about external spec workflow

### Phase 2: Update sdd-new-change.md

Add external spec mode:

1. **Update description** (line 2): Add "or from an external specification"
2. **Update heading** (line 6-7): Mention external spec capability
3. **Update Usage section**: Add new `--spec` mode
   ```
   Usage:
     /sdd-new-change --type <feature|bugfix|refactor|epic> --name <change-name>
     /sdd-new-change --spec <path-to-external-spec>
   ```
4. **Update Arguments section**: Add `--spec` argument, note that `--type` and `--name` are only required without `--spec`
5. **Add examples** for spec mode:
   ```bash
   # From external spec (single or multiple changes)
   /sdd-new-change --spec /path/to/external-spec.md
   ```
6. **Update Flow section**: Add branching logic at Step 1
   - If `--spec` provided: Go to new Step 1b (External Spec Flow)
   - If `--type` and `--name` provided: Continue with existing Step 2+
7. **Add Step 1b: External Spec Flow** (new section):
   - Parse and validate `--spec` path
   - Extract outline (same logic as was in sdd-init Phase 0)
   - Check git branch (same as Step 2)
   - Invoke `external-spec-integration` skill with:
     - `spec_path`: the provided path
     - `spec_outline`: extracted outline
     - `target_dir`: current project root
     - `primary_domain`: read from sdd-settings.yaml or ask user
   - Display results and next steps
   - Commit created changes
8. **Add example interaction** for external spec mode

### Phase 3: Update external-spec-integration skill

1. **Update "When to Use" section** (lines 23-26):
   - Change from: "During `/sdd-init --spec <path>` when external spec is provided"
   - Change to: "During `/sdd-new-change --spec <path>` when external spec is provided"
   - Update standalone import note if needed

### Phase 3.5: Update product-discovery skill

1. **Update line 73** in `plugin/skills/product-discovery/SKILL.md`:
   - Remove or update the reference to "Phase 7"
   - Current text: "spec will be copied to project later in Phase 7"
   - This context no longer applies since external spec handling moves to sdd-new-change
   - The skill can still accept `spec_outline`/`spec_path` for other use cases, but the Phase 7 reference must be removed

### Phase 4: Update Tests

The external spec workflow has a dedicated test that needs significant changes.

#### 4.1: Rename test files

```bash
git mv tests/src/tests/workflows/sdd-init-external-spec.test.ts \
       tests/src/tests/workflows/sdd-new-change-external-spec.test.ts

git mv tests/data/sdd-init-external.yaml \
       tests/data/sdd-new-change-external.yaml
```

#### 4.2: Rewrite test file

**Key changes to `sdd-new-change-external-spec.test.ts`:**

1. **Update file header comment**: Change description from "sdd-init with external spec" to "sdd-new-change with external spec"

2. **Update prompt** (`EXTERNAL_SPEC_PROMPT`):
   - Change from: `/sdd-init --name test-external-spec --spec ./external-spec.md`
   - Change to: `/sdd-new-change --spec ./external-spec.md`
   - Remove project initialization phases (0-6)
   - Keep external spec decomposition instructions

3. **Update test setup** (`beforeAll`):
   - Create minimal SDD project structure (like `sdd-new-change.test.ts` does)
   - Create `specs/changes/`, `specs/domain/`, etc.
   - Create `sdd-settings.yaml` with primary_domain for the skill to read

4. **Update assertions**:
   - Remove subdirectory check (no longer creates project subdirectory)
   - Update archive path: `specs/external/` → `archive/` (verify actual location)
   - Keep: SPEC.md and PLAN.md verification
   - Keep: self-sufficiency checks
   - Keep: epic structure verification for 3+ changes

5. **Update benchmark recording**:
   - Change test name from `sdd-init-external` to `sdd-new-change-external`
   - Update `TEST_FILE` reference

6. **Update describe/it blocks**:
   - Change describe from `'sdd-init with external spec'` to `'sdd-new-change with external spec'`

### Phase 5: Update Documentation

#### 5.1: Update docs/commands.md

1. **Update `/sdd-init` section** (lines 10-32):
   - Remove `[--spec <path>]` from usage
   - Remove `--spec` argument description
   - Remove any external spec mention from "What it does"

2. **Update `/sdd-new-change` section** (lines 35-57):
   - Add `--spec` to usage: `/sdd-new-change --spec <path>` as alternative
   - Add `--spec` argument description
   - Add "What it does" bullet for external spec import
   - Add example for spec mode

#### 5.2: Update README.md

1. **Update Commands table** (line 73):
   - Change `/sdd-init --name [name] [--spec path]` to `/sdd-init --name [name]`
   - Change `/sdd-new-change --type [type] --name [name]` to include spec option

## Verification

### 1. Command and Skill Files

- [ ] `sdd-init.md` has no references to `--spec`, Phase 7, or external spec
- [ ] `sdd-new-change.md` has complete `--spec` mode documentation
- [ ] `external-spec-integration/SKILL.md` references `sdd-new-change`
- [ ] `product-discovery/SKILL.md` has no "Phase 7" reference
- [ ] Phase numbering in sdd-init is contiguous (0-8 instead of 0-9)
- [ ] All examples in sdd-new-change are valid

### 2. Documentation

- [ ] `docs/commands.md` shows `--spec` on sdd-new-change, not sdd-init
- [ ] `README.md` command table is updated

### 3. Tests

- [ ] Old test files removed: `sdd-init-external-spec.test.ts`, `sdd-init-external.yaml`
- [ ] New test files exist: `sdd-new-change-external-spec.test.ts`, `sdd-new-change-external.yaml`
- [ ] Test checks `archive/` not `specs/external/` for archived spec
- [ ] Run `npm test` to verify all tests pass
- [ ] Run external spec test specifically to verify workflow works

### 4. No Dangling References

Run these greps to ensure no old references remain:

```bash
# Should return only changelogs and task history (not active code/docs)
grep -r "sdd-init.*--spec" --include="*.md" --include="*.ts" plugin/ docs/ tests/src/

# Should return nothing
grep -r "sdd-init-external" tests/src/

# Should return nothing in plugin/ (only changelogs are OK)
grep -r "Phase 7" plugin/commands/
```
