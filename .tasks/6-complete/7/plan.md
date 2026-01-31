# Plan: Fix External Spec Handling (Task 7)

## Status: COMPLETED ✓

**Completed: 2026-01-28 (v4.9.0)**

---

## Core Principle

**External specs are consumed ONCE during import, then NEVER referenced again.**

Generated SPEC.md files must be completely self-sufficient. Implementation agents, planning skills, and any downstream processes must NEVER read from `specs/external/`. The archived external spec exists solely for audit/compliance purposes - it is not part of the working specification.

## Problem Summary

From TASKS.md, external spec handling had 4 issues:
1. Specs from `sdd-init` with external spec don't include plans
2. External specs should produce epics when decomposed into 3+ changes
3. Generated specs are weak - implementation relies on external spec
4. External specs should be archive-only - generated specs must be self-sufficient

## Files Modified

| File | Changes |
|------|---------|
| `plugin/skills/external-spec-integration/SKILL.md` | All 4 issues - main workflow file |
| `plugin/skills/change-creation/SKILL.md` | Issue 3 - add `source_content` param, embed content |
| `plugin/skills/spec-decomposition/SKILL.md` | Issue 2 - add `recommend_epic` flag |
| `plugin/commands/sdd-init.md` | Issue 4 - added warning about external spec isolation |
| `plugin/commands/sdd-implement-change.md` | Issue 4 - added note about never reading specs/external |

## Implementation

### Issue 1: Ensure Plans Are Always Created

**File: `plugin/skills/external-spec-integration/SKILL.md`**

1. Update **Output structure** (~line 36-47) to include `plan_path` for each change
2. Update **Step 7** (~line 218-236) to verify both SPEC.md and PLAN.md exist after each `change-creation` invocation
3. Update **Step 9 summary** (~line 256-270) to display both files in tree format:
   ```
   specs/changes/YYYY/MM/DD/change-name/
   ├── SPEC.md
   └── PLAN.md
   ```

### Issue 2: External Specs Produce Epics When 3+ Changes

**Core rule: External specs with 3+ decomposed changes become epics.**

External specs that decompose into multiple changes need proper organization. When decomposition produces 3 or more changes, wrap them in an epic structure.

**File: `plugin/skills/external-spec-integration/SKILL.md`**

Update workflow to create epic when threshold met:
- After decomposition, if `changes.length >= 3`, create epic structure
- 1-2 changes remain as individual changes (no epic wrapper needed)
- User can still adjust decomposition (merge/split) before final structure is created

**Child change naming with order-preserving prefixes:**
- Epic child changes must have unique leading numbers to preserve implementation order
- Format: `NN-change-name` where NN is zero-padded sequence (01, 02, 03...)
- Example structure:
  ```
  specs/changes/YYYY/MM/DD/user-management-epic/
  ├── SPEC.md
  ├── PLAN.md
  └── changes/
      ├── 01-user-registration/
      ├── 02-email-verification/
      ├── 03-password-reset/
      └── 04-profile-management/
  ```
- Order reflects dependency graph from decomposition (topological sort)
- Numbers are assigned during `sdd-init` and preserved throughout lifecycle

**File: `plugin/skills/spec-decomposition/SKILL.md`**

- Added `recommend_epic` flag to DecompositionResult (`true` when `changes.length >= 3`)
- Keep existing per-change complexity estimation for sizing purposes

### Issue 3: Make Specs Self-Sufficient

**File: `plugin/skills/external-spec-integration/SKILL.md`**

Update **Step 4** (~line 155-169):
- Store full section content as `source_content` on each DecomposedChange
- Pass `source_content` to change-creation in Step 7

**File: `plugin/skills/change-creation/SKILL.md`**

- Add `source_content` parameter to input table (~line 18-36)
- Update feature template (~line 99-154) to embed content:
  ```markdown
  ## Original Requirements

  > Imported from external specification. This spec is self-contained.

  <source_content>
  ```

### Issue 4: Enforce Archive-Only / Never-Read-Again Principle

**File: `plugin/skills/external-spec-integration/SKILL.md`**

- Update **Purpose** section (~line 8-17):
  - External specs archived for audit trail ONLY
  - Explicit statement: "External specs are consumed once during import and NEVER read again"
  - Generated specs must assume external source is unavailable
- Update **Step 1** (~line 51-65):
  - Archive is for compliance/audit, not for implementation use
  - Display: "Archived to specs/external/ (audit only - will not be read after import)"
- Add explicit warning in Step 9: "IMPORTANT: Implementation must use generated SPEC.md files only. Do not reference specs/external/."

**File: `plugin/skills/change-creation/SKILL.md`**

- Remove or deprecate the `external_source` field from generated SPEC.md content
- If kept for traceability, add comment: "<!-- Audit reference only - do not read -->"
- Generated specs must NOT include instructions to "see external spec for details"

**Additional enforcement:**
- Consider adding `.claudeignore` pattern for `specs/external/**` after import completes (prevents accidental reads)
- All agents/skills that read specs should explicitly skip `specs/external/` directory

## Verification

1. **Plans created**: Run `sdd-init --spec <test-spec>`, verify each change has both SPEC.md and PLAN.md
2. **Epic threshold**: Run `sdd-init --spec` with external spec that decomposes to 3+ changes, verify epic structure is created; verify 1-2 changes remain as individual changes
3. **Self-sufficient specs**: After import, grep generated SPEC.md for original content - should be embedded, not referenced
4. **Archive independence**: Delete `specs/external/` after import, verify implementation proceeds without errors
5. **No external references**: Grep all generated specs for "specs/external" or "see external" - should find zero implementation-facing references
6. **Agent isolation**: Run `sdd-implement-change` on a generated spec, verify no reads to `specs/external/` occur

## Execution Order

1. `external-spec-integration/SKILL.md` - Purpose and Step 1: enforce never-read-again principle (Issue 4)
2. `spec-decomposition/SKILL.md` - Add `recommend_epic` flag (Issue 2)
3. `change-creation/SKILL.md` - Add `source_content` param, remove external references from template (Issues 3 & 4)
4. `external-spec-integration/SKILL.md` - Step 4: extract FULL content for embedding (Issue 3)
5. `external-spec-integration/SKILL.md` - Create epic structure when 3+ changes (Issue 2)
6. `external-spec-integration/SKILL.md` - Steps 7 & 9: plan verification + warning about external isolation (Issues 1 & 4)
7. Review other skills/agents that might read specs to ensure they skip `specs/external/`

## Test Results

New test `tests/src/tests/workflows/sdd-init-external-spec.test.ts` passed:
- External spec archived to `specs/external/`
- 4 SPEC.md files created with embedded content
- 4 PLAN.md files created alongside each spec
- Specs are self-sufficient (no references to external spec for reading)
