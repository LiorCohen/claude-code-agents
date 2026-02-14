## Overview

<description>

### Motivation

> Why is this refactor needed now?

[Business or technical driver for this refactor]

## Refactoring Goals

> Specific, measurable goals

| Goal | Success Metric | Priority |
|------|----------------|----------|
| Improve readability | Code review approval | High |
| Reduce duplication | DRY violations reduced by X% | Medium |
| Better separation | Each module has single responsibility | High |

## Current State Analysis

### Architecture Overview

> How the code is currently structured

```
[Current architecture diagram]
```

### Code Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Cyclomatic complexity | [value] | < [target] |
| Lines per function (avg) | [value] | < [target] |
| Test coverage | [value]% | >= [target]% |

### Problems with Current Approach

| Problem | Impact | Files Affected |
|---------|--------|----------------|
| [Problem 1] | [Impact on dev/perf/maintenance] | [files] |
| [Problem 2] | [Impact] | [files] |

### Code Examples (Before)

> Show problematic patterns

```typescript
// Example of current problematic code
[code snippet]
```

## Proposed Design

### New Architecture

> How the code will be structured after refactor

```text
[New architecture diagram]
```

### Design Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| [Decision 1] | [Why] | [What else was considered] |

### Code Examples (After)

> Show improved patterns

```typescript
// Example of refactored code
[code snippet]
```

## Components

> Components identified during discovery. New components will be scaffolded during implementation.

### New Components

| Component | Type | Settings | Purpose |
|-----------|------|----------|---------|

### Modified Components

| Component | Changes |
|-----------|---------|

## Transformation Plan

### Step-by-Step Changes

| Step | Files | Change | Backward Compatible |
|------|-------|--------|---------------------|
| 1 | [files] | [change] | Yes/No |
| 2 | [files] | [change] | Yes/No |

### Affected Areas

| File/Module | Change Type | Risk Level |
|-------------|-------------|------------|
| `path/to/file.ts` | Restructure | Medium |
| `path/to/module/` | Extract | Low |

## Behavior Preservation

### Invariants

> What must NOT change

- [ ] All existing API contracts unchanged
- [ ] All existing tests pass without modification
- [ ] Performance within [X]% of current

### Verification Approach

| Behavior | How to Verify |
|----------|---------------|
| API responses | Existing integration tests |
| Performance | Benchmark before/after |
| Edge cases | [Specific tests] |

## Testing Strategy

### Existing Tests

| Test Suite | Expected Result |
|------------|-----------------|
| Unit tests | All pass, no changes needed |
| Integration tests | All pass |

### New Tests

| Test | Purpose |
|------|---------|
| [test name] | Verify refactored component |

### Manual Verification

| Scenario | Steps | Expected |
|----------|-------|----------|
| [scenario] | [steps] | [result] |

## API Impact

> Usually "None - internal refactor"

### Public API Changes

- [ ] No public API changes
- [ ] API changes: [describe with migration path]

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Subtle behavior change | Medium | High | Comprehensive testing |
| Performance regression | Low | Medium | Benchmark comparison |

## Rollback Plan

1. [How to identify if rollback needed]
2. [How to rollback]

## Out of Scope

> What this refactor explicitly does NOT change

- [Related code that won't be touched]
- [Future improvements not in this refactor]

## Success Criteria

- [ ] All refactoring goals met
- [ ] All tests pass
- [ ] No behavior changes
- [ ] Code review approved
- [ ] Performance validated

## References

- [Design doc or RFC if applicable]
- [Related refactors]
