# Feedback Loop — .critic/ Maintenance Rules

The `.critic/` directory at the repo root stores learned patterns from real interactions. Over time, the critic gets sharper because it learns from actual feedback — not just the initial static prompts.

---

## When to Add Entries

- The user pushes back on a plan or approach → capture the pattern
- The user rejects an implementation detail → capture the anti-pattern
- The user corrects Claude's thinking → capture the correction
- A recurring mistake is identified across multiple tasks → capture it

---

## How to Add Entries

1. Identify which file the pattern belongs to: `speccing.md`, `planning.md`, `implementation.md`, `review.md`, or `completion.md`
2. Read the existing file
3. Check for overlap or contradiction with existing rules
4. Draft the proposed rule as a concise, imperative statement
5. **Present the proposed change to the user for approval.** Show: which file, what rule, whether it's new/merge/replacement
6. If the new rule overlaps with an existing rule: draft a merged rule and show both the original and merged version to the user
7. If the new rule contradicts an existing rule: show both rules to the user and ask which to keep

**Never write to `.critic/` without explicit user approval.**

---

## When to Create New Topic Files

- When a pattern doesn't fit any existing file
- When an existing file exceeds ~30 rules (split by subtopic)
- Name new files by topic: `testing.md`, `git-workflow.md`, etc.

---

## Hygiene Rules

- No contradictions within or across files
- No duplications — propose a merge to the user
- Keep rules concise — one sentence per rule where possible
- No raw conversation transcripts — distill into actionable rules
- **Never remove rules without user approval**
- All `.critic/` modifications (add, merge, replace, remove) require explicit user approval
