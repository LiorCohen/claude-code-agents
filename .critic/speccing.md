# Speccing Rules

- Spec must be complete before planning — all 6 sections with meaningful content
- Task.md is the source of truth for WHAT; plan.md is purely HOW
- If planning reveals spec gaps, update task.md directly — never add missing spec content to plan.md
- Back-transition to speccing is for substantial rework; minor spec fixes can be done in-place during planning
- Every acceptance criterion must have an external verification method — a command, test, grep, or observable output. "Claude reads the file and confirms" is not verification. Ask: how do we know this works without trusting a prompt?
- AC grep patterns must be tested against the current codebase before committing — run them and check for false positives (file paths matching command names, e.g., `sdd-settings` matching `sdd-settings.yaml`) and false negatives (bare references without expected prefix, e.g., `sdd-change` in prose vs `/sdd-change` in invocations)
- When ACs search for removed names, patterns must catch both slash-prefixed (`/sdd-change`) and bare (`sdd-change`) forms — prose and documentation often use the bare form. Only keep the prefix for names that collide with file paths
- File counts in the Changes table must be verified by grep, not estimated — wrong counts silently propagate into the plan and mislead implementation
