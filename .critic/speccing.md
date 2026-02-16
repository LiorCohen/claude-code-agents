# Speccing Rules

- Spec must be complete before planning — all 6 sections with meaningful content
- Task.md is the source of truth for WHAT; plan.md is purely HOW
- If planning reveals spec gaps, update task.md directly — never add missing spec content to plan.md
- Back-transition to speccing is for substantial rework; minor spec fixes can be done in-place during planning
- Every acceptance criterion must have an external verification method — a command, test, grep, or observable output. "Claude reads the file and confirms" is not verification. Ask: how do we know this works without trusting a prompt?
