# Escalation Matrix

Each trigger has a step owner (C = collector, R = reviewer, C+R = both), applicable phases, default thinking depth, and required action.

---

## Hard Blocks (must resolve before proceeding)

| ID | Trigger | Step | Phase(s) | Depth | Action |
|----|---------|------|----------|-------|--------|
| H1 | Files in diff not in plan (scope creep) | R | 6, 7, 8 | Standard | List unplanned files, require justification or revert |
| H2 | Files in plan not in diff (incomplete) | R | 7, 8 | Standard | List missing files, require implementation or plan amendment |
| H3 | Low confidence on architectural decision | C+R | 2, 3, 5 | Deep | C flags low confidence, R evaluates the decision |
| H4 | Contradicts CLAUDE.md or standards | R | All | Deep | Quote the violated rule, require fix |
| H5 | Breaking existing tests | C | 6, 7 | Standard | Show failing test from session output, require fix |
| H6 | Plugin boundary violation | R | 6, 7 | Standard | Show the cross-boundary reference, require removal |
| H7 | Working on main during implementation | C | 5, 6 | Quick | Stop immediately, require feature branch |
| H8 | No build/test evidence before review | C | 7, 8 | Quick | Require actual command output from session |
| H9 | Destructive command without verification | C | All | Quick | Flag the command, require user confirmation |
| H10 | Unmet acceptance criteria at completion | R | 8 | Ultra | List unmet criteria with evidence gaps |
| H11 | Files modified but only grepped, not read | C | 2, 3, 5, 6 | Standard | List files only grepped, require full read |
| H12 | Test assertions weakened to make tests pass | R | 7 | Deep | Show original vs modified assertions |

---

## Soft Warnings (noted, not blocking)

| ID | Trigger | Step | Phase(s) | Depth | Note |
|----|---------|------|----------|-------|------|
| S1 | Minor style deviation | R | 6, 7 | Quick | Note the deviation, suggest fix |
| S2 | Optional improvement spotted | R | 3, 6 | Standard | Suggest as future task, don't expand scope |
| S3 | Non-critical edge case | R | 3, 6 | Deep | Document as known limitation |
| S4 | Documentation opportunity | R | 7 | Quick | Note but don't add unless in plan |
| S5 | Verbose commit history | R | 7 | Quick | Suggest squash if excessive |
| S6 | Gold-plating detected | R | 6 | Standard | Flag extra work, note it's beyond scope |
| S7 | TODOs added during implementation | C+R | 6, 7 | Quick | Note for follow-up, don't block |
| S8 | Degradation signals | C | 6 | Standard | Recommend context reset |
| S9 | On main while task is in implementing | C | 5, 6 | Quick | Suggest switching to feature branch |
| S10 | Sycophantic agreement detected | C | All | Standard | Flag that Claude agreed without evidence |

---

## Depth Guide

- **Quick** — surface-level structural checks (file exists, frontmatter valid, branch correct)
- **Standard** — routine checks requiring modest reasoning (diff audit, plan coverage)
- **Deep** (`think hard`) — potential hard blocks, multi-file cross-referencing (standards analysis, acceptance criteria)
- **Ultra** (`think harder`) — architectural decisions, plan-vs-implementation semantic comparison (Phase 4 full plan review, Phase 7 pre-review audit)

Escalate when a lower-depth check surfaces something suspicious. De-escalate when initial investigation shows the issue is minor.
