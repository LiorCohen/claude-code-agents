# Tasks / Improvements Backlog

## High Priority

### 2. Add npm run scripts for component lifecycle management [BROKEN]
There should be a way to run/stop components using `npm run <component>` or similar. Each component type would have its own semantics for what "run" and "stop" mean, with different run commands depending on the component type.

**Examples:**
- Services: start/stop the service process
- CLI tools: execute the command
- Libraries: run tests or build
- etc.

### 7. External spec handling is broken [CRITICAL]
Multiple issues with how external specs are processed:
- Specs generated from `sdd-init` with an external spec don't include plans
- Large external specs should produce epics, not individual changes (8+ changes = epic)
- Generated specs are weak and implementation keeps relying on the external spec
- External specs should be for archive/reference only - Claude should create self-sufficient specs that don't require referring back to the external spec

### 9. sdd-init should produce ready-to-work components [CRITICAL]
After running `sdd-init`, all components should be in a ready-to-work state without additional setup or configuration needed. The initial template generated for new components is currently sparse and doesn't include enough content/guidance for the different component types.

---

## Pending

### 10. Missing /sdd-help command
Need a `/sdd-help` command for when users are stuck or need guidance on what to do next.

### 11. Missing deeper config integration
Configuration system needs deeper integration (details TBD).

### 12. User onboarding and process state tracking
Need to:
- Introduce users to the different commands available
- Provide suggestions about next steps
- Track where we are in a given process
- Support resuming workflow without requiring the same session

### 13. sdd-init should provide thorough repo guide
`sdd-init` should offer a thorough and kind guide to the repository, not just summaries. Users need comprehensive orientation to understand the codebase structure, patterns, and how to work within it.

### 14. Unclear when to run type generation
Need to document/clarify when type generation should be run in the workflow. Is it:
- After spec creation?
- Before implementation?
- Automatically as part of another command?
- Manually triggered?

### 15. Planner is too rigid and template-driven
The planner follows a naive, robotic predefined plan template. Instead, it should use **planning rules** that guide decision-making, not a fixed plan structure. This would allow for more adaptive, context-aware planning. Templates should be guidance, not constraints - encourage thoughtful, context-aware writing and allow flexibility to deviate when appropriate. Produce rich, meaningful specs rather than formulaic checkbox-filling.

### 16. Plan changes should cascade to dependent items
After `sdd-init` generates a plan, changes to one part may affect other parts - especially when reviewing/implementing the first change. The system should:
- Recognize when a change impacts downstream plan items
- Prompt for or automatically update affected specs/plans
- Maintain consistency across the entire plan when early items are modified

### 17. Plans should follow TDD with test review first
Currently the generated plans don't follow Test-Driven Development. Plans should include a **test review step before implementation** to ensure:
- Tests are written/reviewed first
- Implementation is guided by test expectations
- True TDD workflow is enforced

### 18. Add commit standards skill inside plugin
The commit skill currently lives at the marketplace level (`.claude/skills/commit/`). Need to add commit standards as a skill inside the plugin itself so users of the plugin get consistent commit guidance.

### 19. Create task management skill in marketplace
Add a new skill at `.claude/skills/` for managing tasks/backlog processes like the one used in this session. Should help with:
- Adding new task items
- Organizing/categorizing tasks
- Marking tasks complete
- Reviewing the backlog

### 20. Plugin installation debugging skill + workflow fix
Currently forced to delete `~/.claude/plugins` to use the marketplace/plugin in a new project. This is broken. Need:
- A debugging skill to diagnose plugin installation issues
- A sane workflow for developing/testing plugins locally
- Clear guidance on how plugin resolution works
- Fix whatever is causing the need to manually clear the plugins cache

### 21. Project sanity verification command
Need a strict, skeptical, and thorough verification command that validates project health. Should:
- Run after `sdd-init` (required) and optionally after `new-change`
- Take a skeptical approach - assume things are broken until proven otherwise
- Verify specs are complete and self-sufficient
- Check that plans are coherent and dependencies are clear
- Validate component structure and readiness
- Ensure no orphaned or inconsistent artifacts
- Report issues with actionable guidance
- Needs a proper plan before implementation

### 22. Add critic agent to marketplace
Create a critic agent at the marketplace level that can:
- Review code, specs, plans with a critical eye
- Challenge assumptions and identify weaknesses
- Provide constructive but honest feedback
- Help improve quality through skeptical review

### 23. Autocomplete for SDD commands
Typing commands manually is tedious. Need autocomplete support for `/sdd-*` commands to improve developer experience.

### 24. Add plugin Slack support
Enable Slack integration for the plugin (details TBD - notifications, commands, etc.).

### 25. Planner must block on open questions in specs
When specs contain open questions, implementation cannot proceed. The planner must:
- Detect open questions in specs before planning
- Block/halt if unresolved questions exist
- Require questions to be resolved before allowing implementation to begin
- Provide clear guidance on which questions need answers

### 26. Better session separators/visual indicators
Need a better way to indicate separators inside a session. Currently things are hard to track. Use big ASCII letters or ASCII art to clearly delineate where in the scrollback things happened:
- Phase transitions
- Command completions
- Important milestones
- Section headers
- Progress indicators
- Context markers to help orientation

Makes it easy to scroll and find key moments.

### 27. JSON Schema for skills + validation skill
Skills currently use YAML examples for inputs/outputs. Need:
- Proper JSON Schema definitions for type safety and clear contracts
- A marketplace skill that "typechecks" plugin artifacts (skills, commands, agents)
- Detect schema mismatches and report them

### 29. sdd-tasks command for state review and IDE integration
Need a command that provides a review of the current SDD state without requiring users to jump to the IDE. Should:
- Show current lifecycle state (what phase are we in?)
- Summarize pending tasks, specs, changes
- Offer to open relevant files in IDE
- Provide a welcoming, interactive way to engage with SDD at any lifecycle state
- Reduce friction of context-switching between CLI and IDE

### 33. Tests are not useful - need better test creation approach
Current tests don't capture important things. Need:
- A better methodology for creating meaningful tests
- Tests that verify actual behavior, not just structure
- Focus on what matters for the plugin's functionality
- Possibly rethink the testing strategy entirely

### 34. Audit agent assumptions around interactivity
Identify the different assumptions we've made with our agents and evaluate whether these assumptions make sense when interactivity is required as part of their processes:
- Which agents assume non-interactive execution?
- Which processes actually need user input mid-flow?
- Are there agents that should pause for feedback but don't?
- Are there agents that block unnecessarily when they could proceed?

### 35. Checksumming skill for component/spec snapshots
Create a skill that takes a snapshot of existing components and domain specs:
- Compute checksums of current state
- Store snapshot data in `.sdd/` directory in the project
- `.sdd/` directory should be committed to version control
- Enables detecting drift, validating consistency, and tracking changes over time

### 36. Drift detection for direct code changes
Developers often change code directly, bypassing the spec/plan workflow. Need a mechanism to detect when implementation has drifted from specs:
- New command like `/sdd-check-drift` or hook that runs on commit
- Compare current code state against:
  - `specs/domain/` (domain concepts, glossary)
  - `specs/architecture/` (architectural decisions)
  - Active change specs in `specs/changes/`
- Identify violations or inconsistencies with specs
- Report what's out of sync and suggest remediation
- Goal: discourage direct changes but handle them gracefully when they occur

### 37. Plan revision workflow for iterative development
Developers often discover needed changes mid-implementation. Need a workflow for "I've started implementing, but want to revise the plan":
- New command like `/sdd-revise-plan <change-dir>`
- Acknowledge current implementation state
- Allow updating PLAN.md (and possibly SPEC.md if requirements changed)
- Track which phases need to be re-done
- Maintain history of revisions (audit trail)
- Handle partial implementations gracefully
- Support the natural iterative loop: implement → learn → revise → re-implement

### 38. Integration and E2E testing should be separate components
Integration tests and end-to-end tests should be distinct component types, not lumped together. Each has different:
- Scope and purpose
- Setup/teardown requirements
- Execution patterns
- Dependencies

### 39. Capture ad-hoc code changes and sync specs
When users instruct Claude to make code changes directly (outside the SDD workflow), we need to:
- Detect that code was changed outside of a spec/plan
- Prompt to update relevant specs accordingly
- Especially important after implementing a change - ensure specs reflect what was actually built
- Keep specs as the source of truth, even when implementation deviates
- Prevent specs from becoming stale/out-of-sync with reality

### 40. Fix sdd-new-change test - spec format mismatch
The `tests/src/tests/workflows/sdd-new-change.test.ts` test is failing because the generated SPEC.md format doesn't match what the test expects:
- Test expects YAML frontmatter with `sdd_version:` field
- Actual output uses markdown metadata format (`## Metadata` section)
- Need to either update the test expectations or fix the spec generation to use frontmatter
- Related to spec format consistency across the plugin

---

## Low Priority

### 3. Docs missing: CMDO Guide
Documentation needs a guide explaining CMDO (Component-Module-Domain-Organization?) that covers:
- Design decisions and rationale
- Structure overview
- Methodology and how to apply it

### 31. Welcome prompt after plugin installation
Investigate if there's a way to show a welcome prompt/message after plugin installation. Would help with:
- Introducing users to available commands
- Guiding first steps
- Making the plugin feel more welcoming and discoverable

---

## Merged

### 8. Multiple changes should be grouped as epics → merged into #6

### 28. Schema validation skill for marketplace → merged into #27

### 30. Planners and spec writers should not be template-constrained → merged into #15

### 32. Use ASCII art/banners for clear visual delineation → merged into #26

### 1. Initial template lacks content for different components → merged into #9

### 5. Specs from sdd-init with external spec missing plans → merged into #7

### 6. Large external specs should produce epics, not changes → merged into #7

---

## Completed

### 4. SDD commands cause excessive permission prompts ✓
**Completed: 2026-01-28 (v4.7.0)**

Added PreToolUse hook that auto-approves writes to safe SDD directories and blocks sensitive paths. Hook auto-registers when plugin is installed. See `plugin/docs/permissions.md` for details.

**Plan:** [plans/PLAN-task-4-permission-prompts.md](plans/PLAN-task-4-permission-prompts.md)
