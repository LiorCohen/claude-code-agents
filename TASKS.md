# Tasks / Improvements Backlog

## Pending

### 1. Initial template lacks content for different components
The initial template generated for new components is sparse and doesn't include enough content/guidance for the different component types.

### 2. Add npm run scripts for component lifecycle management
There should be a way to run/stop components using `npm run <component>` or similar. Each component type would have its own semantics for what "run" and "stop" mean, with different run commands depending on the component type.

**Examples:**
- Services: start/stop the service process
- CLI tools: execute the command
- Libraries: run tests or build
- etc.

### 5. Specs from sdd-init with external spec missing plans
When generating specs from `sdd-init` using an external spec, the resulting specs don't include plans for some reason.

### 6. Large external specs should produce epics, not changes
When provided with a large external spec, the system should break things down into epics rather than individual changes. Currently the generated specs are weak and implementation keeps relying on the external spec.

### 7. External specs should be for archive/reference only
External specs are meant for archiving and reference. Claude should ignore these files during implementation and create self-sufficient specs that don't require referring back to the external spec.

### 8. Multiple changes should be grouped as epics
If an external spec requires 8+ changes, this should have been structured as an epic, not individual changes.

### 9. sdd-init should produce ready-to-work components
After running `sdd-init`, all components should be in a ready-to-work state without additional setup or configuration needed.

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
The planner follows a naive, robotic predefined plan template. Instead, it should use **planning rules** that guide decision-making, not a fixed plan structure. This would allow for more adaptive, context-aware planning.

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
Need a better way to indicate separators inside a session. Currently things are hard to track. Could include:
- Visual separators between different phases/tasks
- Clear section headers
- Progress indicators
- Context markers to help orientation

### 27. JSON Schema for skill inputs/outputs
Skills currently use YAML examples for inputs/outputs. Need proper JSON Schema definitions instead for:
- Type safety and validation
- Clear contract definitions
- Better tooling support

### 28. Schema validation skill for marketplace
Create a marketplace skill that "typechecks" plugin artifacts:
- Validate skills against their schemas
- Validate commands against their schemas
- Validate agents against their schemas
- Detect schema mismatches and report them

### 29. sdd-tasks command for state review and IDE integration
Need a command that provides a review of the current SDD state without requiring users to jump to the IDE. Should:
- Show current lifecycle state (what phase are we in?)
- Summarize pending tasks, specs, changes
- Offer to open relevant files in IDE
- Provide a welcoming, interactive way to engage with SDD at any lifecycle state
- Reduce friction of context-switching between CLI and IDE

### 30. Planners and spec writers should not be template-constrained
Planners and spec writers are being too rigid, writing things simplistically because they follow predefined templates and treat them as constraints. Need to:
- Make clear that templates are guidance, not constraints
- Encourage thoughtful, context-aware writing
- Allow flexibility to deviate from templates when appropriate
- Produce rich, meaningful specs rather than formulaic checkbox-filling

### 31. Welcome prompt after plugin installation
Investigate if there's a way to show a welcome prompt/message after plugin installation. Would help with:
- Introducing users to available commands
- Guiding first steps
- Making the plugin feel more welcoming and discoverable

### 32. Use ASCII art/banners for clear visual delineation
Command summaries need to be very obvious in scrollback. Use big ASCII letters or ASCII art to clearly delineate where in the scrollback things happened:
- Phase transitions
- Command completions
- Important milestones
- Section headers

Makes it easy to scroll and find key moments.

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

---

## Low Priority

### 3. Docs missing: CMDO Guide
Documentation needs a guide explaining CMDO (Component-Module-Domain-Organization?) that covers:
- Design decisions and rationale
- Structure overview
- Methodology and how to apply it

---

## Completed

### 4. SDD commands cause excessive permission prompts ✓
**Completed: 2026-01-28 (v4.7.0)**

Added PreToolUse hook that auto-approves writes to safe SDD directories and blocks sensitive paths. Hook auto-registers when plugin is installed. See `plugin/docs/permissions.md` for details.

**Plan:** [plans/PLAN-task-4-permission-prompts.md](plans/PLAN-task-4-permission-prompts.md)
