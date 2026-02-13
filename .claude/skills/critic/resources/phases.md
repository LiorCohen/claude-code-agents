# Phase Checks

Each check is annotated with step ownership: **(C)** = collector (session-aware), **(R)** = reviewer (fresh-eyes).

---

## Phase 2: Starting Planning (`/tasks plan`)

- (C) Which files have you actually Read (full file) vs Grep'd? List them
- (C) Are you making assumptions without having read CLAUDE.md and relevant standards?
- (R) How were similar features implemented in this codebase?

> *"The user says: Before you write a single word of the plan, prove you understand the codebase. What files did you read? What patterns did you find?"*

**Escalation:** "Didn't read relevant files" = hard block (H11). Others = soft warning.

---

## Phase 3: Writing a Plan

- (C) Did you read the files you're planning to modify, or just grep for them?
- (R) Is every file in "Files to Modify" a real path that exists (or is being created)?
- (R) Is every change justified by acceptance criteria?
- (R) Over-engineering check: more files than needed? Unnecessary abstractions?
- (R) Under-engineering check: missing edge cases at system boundaries?
- (R) 500-line limit on skill/resource files accounted for?
- (R) Tests included? Are they meaningful?

> *"The user says: Would YOU approve this plan if someone else wrote it? If the plan is longer than the code it describes, it's too long."*

**Escalation:** Missing tests = hard block. Unverified file paths = hard block. Others = soft warning.

---

## Phase 4: Presenting Plan for Review

- (C) Was there pushback during planning? How was it resolved?
- (R) Read the plan cold — is it clear without session context?
- (R) Are "Changes" sections specific enough to implement without ambiguity?
- (R) Could a different session implement this correctly from the text alone?
- (R) What's the simplest way to achieve this? Is the plan doing that?
- (R) What would break if implemented? What's the blast radius?

> *"The user says: I'm going to read this plan cold. 'What about X?' 'Did you consider Y?' 'Why not just Z?' 'This feels over-engineered.' 'You're missing the hard part.'"*

**Escalation:** Missing acceptance criteria coverage = hard block. Ambiguous changes = soft warning. **Depth: Ultra.**

---

## Phase 5: Starting Implementation (`/tasks implement`)

- (C) Was the plan re-read (not from memory — actually Read tool)?
- (C) Were relevant standards skills read?
- (C) Is the feature branch created? Are you on it?
- (R) Does the plan match the current task.md? Any drift between plan approval and now?

> *"The user says: The plan is approved. Follow it. Not 'inspired by it' — follow it."*

**Escalation:** Working on main = hard block (H7). Didn't re-read plan = hard block (H11). Others = soft warning.

---

## Phase 6: During Implementation (ongoing)

- (C) Anti-grep: files being modified that were only grepped?
- (C) Degradation signals: placeholders, TODOs, sparse implementations, retries?
- (C) Are existing tests still passing? (evidence from session)
- (R) Compare current diff against plan's "Files to Modify" table
- (R) Gold-plating check: features, configurability, or "improvements" beyond scope?
- (R) TypeScript standards compliance (if applicable)?

> *"The user says: Show me the diff. Does it match the plan? If you touched a file not in the plan, explain why or revert it."*

**Escalation:** Files outside plan scope = hard block (H1). Breaking tests = hard block (H5). Degradation = soft warning (S8).

---

## Phase 7: Submitting for Review (`/tasks review`)

- (C) "Did you run it?" — collect build/test output evidence from session
- (C) Anti-grep: all modified files were fully read?
- (C) Counter-sycophancy: was there pushback? How was it handled?
- (R) Diff audit: plan files vs actual diff (see reviewer-prompt.md)
- (R) Test file modification check: assertions weakened?
- (R) Leftover debug statements, console.log, TODO comments?
- (R) Unnecessary comments/docstrings added to unchanged code?
- (R) Does `changes.md` accurately reflect what was done?

> *"The user says: I'm going to review this diff line by line. If I see changes not in the plan, I'm sending it back. If you changed the tests to make them pass instead of fixing the code, I'm definitely sending it back."*

**Escalation:** Diff/plan mismatch = hard block (H1/H2). No evidence = hard block (H8). Weakened tests = hard block (H12). Debug leftovers = soft warning.

---

## Phase 8: Completing a Task (`/tasks complete`)

- (C) Were all Phase 7 hard blocks resolved?
- (R) Each acceptance criterion in task.md — met? With evidence?
- (R) Loose ends? TODOs added during implementation?
- (R) Branch ready to merge? Clean state?

> *"The user says: Don't tell me it's done — prove it. Check every acceptance criterion."*

**Escalation:** Unmet acceptance criteria = hard block (H10). Uncommitted changes = hard block. TODOs = soft warning. **Depth: Ultra.**
