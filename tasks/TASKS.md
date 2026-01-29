# Tasks / Improvements Backlog

## High Priority

---

## Planned

### 51. Add GitHub Actions workflow for automated releases
Add marketplace-level GitHub Actions that create a release in the repo (LiorCohen/claude-code-plugins) for every plugin change that requires a version change:
- Trigger on push to main branch
- Detect if plugin version changed (compare current vs previous commit)
- Extract changelog entry for the new version from CHANGELOG.md
- Create GitHub release with version tag and changelog as release notes
- Only create release when version actually changes (not for infrastructure-only commits)

**Plan:** [plans/planned/PLAN-task-51-github-actions-releases.md](plans/planned/PLAN-task-51-github-actions-releases.md)

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

### 35. Checksumming and drift detection for specs/components
Create a skill for snapshot management and drift detection:
- **Snapshots**: Compute checksums of components and domain specs, store in `.sdd/` (committed to VCS)
- **Drift detection**: New command `/sdd-check-drift` or commit hook to detect when code drifts from specs
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
**Depends on:** #35 (checksumming and drift detection)

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

### 41. sdd-new-change should handle external specs
`sdd-new-change` currently doesn't support external specs the way `sdd-init` does. Need to:
- Accept an external spec as input for creating a new change
- Apply the same external spec handling rules (archive/reference only, create self-sufficient specs)
- Consistent behavior between `sdd-init` and `sdd-new-change` for external spec workflows

### 43. CI/CD components and .github folder integration
Need to figure out how to handle separate CI/CD components and how they integrate with the root `.github/` folder:
- How do CI/CD component types work with monorepo structure?
- Should workflows be defined per-component or centralized?
- How to handle component-specific vs shared workflows
- Relationship between component specs and actual `.github/workflows/` files

### 44. Helm chart template + observability stack
Need a Helm chart template for component scaffolding:
- Generate proper Helm chart structure for k8s deployments
- Include standard templates (deployment, service, configmap, etc.)
- Integrate with existing infrastructure component types
- Add Victoria Logs for log aggregation
- Add Victoria Metrics for metrics collection

### 47. Local environment create/start/stop workflow
Missing a way to manage local development environments:
- Create a local environment (spin up k8s, databases, services)
- Start/stop the local environment
- Consistent commands across projects (e.g., `npm run env:up`, `npm run env:down`)
- Integrate with docker-compose or local k8s (minikube, kind, k3d)
- Handle dependencies between services

### 49. Auto-commit specs and plans after creation
After specs and/or plans are created in the different workflows (sdd-init, sdd-new-change, etc.), they should be committed automatically to prevent accidental loss of information:
- Prompt user to commit after spec/plan creation
- Or auto-commit with a standard message
- Ensure work-in-progress artifacts are safely persisted
- Reduces risk of losing planning work due to session interruption or accidental deletion

### 50. Move sdd-settings.yaml to .sdd/ directory
**Depends on:** #35 (checksumming and drift detection - introduces `.sdd/` directory)

Move the `sdd-settings.yaml` configuration file into the `.sdd/` directory:
- Consolidates all SDD project state/config in one location
- `.sdd/` becomes the single source for SDD metadata (settings, checksums, snapshots)
- Update all references to `sdd-settings.yaml` path
- Ensure backwards compatibility or migration path for existing projects

### 54. Missing postgresql-standards skill
Add a `postgresql-standards` skill that provides guidance and standards for PostgreSQL database design and usage:
- Schema design and naming conventions
- Index strategies and query optimization
- Migration best practices
- Connection pooling and resource management
- Security (roles, permissions, row-level security)
- Data types and constraints
- Transaction handling
- Backup and recovery considerations

### 53. Missing helm-standards skill
Add a `helm-standards` skill that provides guidance and standards for writing Helm charts:
- Chart structure and naming conventions
- Values file organization
- Template best practices
- Security considerations (RBAC, securityContext, etc.)
- Resource management (limits, requests)
- Health checks and probes
- ConfigMap and Secret handling
- **Readability first:** Prioritize simple, readable templates over clever solutions. Minimize use of special functions and Go template wizardry. Charts should be easy to understand at a glance.

### 52. Clean up .gitkeep and placeholder content during implementation
When changes are implemented and actual content is added to directories, ensure that:
- `.gitkeep` files are removed once the directory has real content
- Placeholder content (example files, TODO comments, stub implementations) is replaced or removed
- The implementation phase should detect and clean up scaffolding artifacts
- Prevents stale placeholders from accumulating in the codebase

---

## Low Priority

### 48. Organize plugin skills directory by cohesion
The `.claude/skills/` directory contains skills that could be better organized by grouping related skills together. Need to:
- Analyze existing skills and identify cohesive groups (e.g., git/commit-related, testing-related, coding-standards)
- Create subdirectories for skill groups if appropriate
- Update any references to skill paths
- Improve discoverability and maintainability of the skills collection

### 3. Docs missing: CMDO Guide
Documentation needs a guide explaining CMDO (Component-Module-Domain-Organization?) that covers:
- Design decisions and rationale
- Structure overview
- Methodology and how to apply it

### 24. Add plugin Slack support
Enable Slack integration for the plugin (details TBD - notifications, commands, etc.).

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

### 46. Missing Helm chart template → merged into #44

### 36. Drift detection for direct code changes → merged into #35

### 42. Restructure specs directory → merged into #9

---

## Completed

### 45. TypeScript standards: ban mutable array/object operations ✓
**Completed: 2026-01-28**

Added explicit "Banned Mutable Operations" section to `.claude/skills/typescript-standards/SKILL.md`:
- Banned array methods: `.push()`, `.pop()`, `.shift()`, `.unshift()`, `.splice()`, `.sort()`, `.reverse()`, `.fill()`
- Banned object operations: direct assignment, dynamic property assignment, `delete`
- Banned Map/Set mutations: `.set()`, `.delete()`, `.add()`, `.clear()`
- Each banned operation includes the immutable alternative
- Updated summary checklist with new mutation checks

### 9. sdd-init should produce ready-to-work components ✓
**Completed: 2026-01-28 (v5.0.0)**

BREAKING CHANGE: Restructured project scaffolding for clean-slate approach:
- Removed all greetings example code (9 files deleted)
- Directory restructure: `specs/changes/` → `changes/`, `specs/external/` → `archive/`
- Added PostgreSQL database support (replaced in-memory hack)
- Added `.gitkeep` files for empty directories, `.claudeignore` for archive/
- Simplified completion reports to focus on next steps
- Empty barrels with helpful comments guide users to add their own features

**Includes:** Task #42 (restructure specs directory)

**Plan:** [plans/complete/PLAN-task-9-ready-to-work-components.md](plans/complete/PLAN-task-9-ready-to-work-components.md)

### 19. Create task management skill in marketplace ✓
**Completed: 2026-01-28**

Added task management skill at `.claude/skills/tasks/` with:
- Commands: `/tasks`, `/tasks add`, `/tasks complete`, `/tasks merge`, `/tasks prioritize`, `/tasks plan`, `/tasks plans`
- Reorganized task data into `tasks/` directory (TASKS.md + plans/)
- Updated commit skill to verify tasks/plans are updated before committing

### 7. External spec handling is broken ✓
**Completed: 2026-01-28**

Fixed all issues with external spec processing:
- Specs generated from `sdd-init` with external spec now include both SPEC.md and PLAN.md
- External specs with 3+ changes produce epic structures with order-preserving prefixes (01-, 02-, 03-)
- Generated specs embed full `source_content` making them completely self-sufficient
- External specs are consumed ONCE during import, then NEVER read again (archived to `specs/external/` for audit only)

**Core principle:** External specs are consumed once during import, then never referenced again. Generated SPEC.md files are completely self-sufficient.

**Plan:** [plans/complete/PLAN-task-7-external-spec-handling.md](plans/complete/PLAN-task-7-external-spec-handling.md)

### 2. Add npm run scripts for component lifecycle management ✓
**Completed: 2026-01-28 (v4.8.0)**

Added component-specific npm scripts to root package.json generated by scaffolding:
- Pattern: `npm run <component-name>:<action>` (e.g., `backend:dev`, `api:generate`)
- Meta-scripts: `dev`, `build`, `test`, `start` with proper dependency ordering (contract types generated first)
- Database k8s scripts: `setup`, `teardown`, `port-forward`, `psql`, `migrate`, `seed`, `reset`

**Plan:** [plans/complete/PLAN-task-2-npm-lifecycle-scripts.md](plans/complete/PLAN-task-2-npm-lifecycle-scripts.md)

### 4. SDD commands cause excessive permission prompts ✓
**Completed: 2026-01-28 (v4.7.0)**

Added PreToolUse hook that auto-approves writes to safe SDD directories and blocks sensitive paths. Hook auto-registers when plugin is installed. See `plugin/docs/permissions.md` for details.

**Plan:** [plans/complete/PLAN-task-4-permission-prompts.md](plans/complete/PLAN-task-4-permission-prompts.md)
