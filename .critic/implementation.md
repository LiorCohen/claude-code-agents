# Implementation Rules

- Follow the approved plan exactly — deviations require going back to planning
- Use `npm run build:plugin` not `npx tsc` — tsc alone doesn't run tsc-alias
- Plugin boundary: nothing inside `plugin/` references `.claude/`, `.tasks/`, or root files
- Don't add error handling for scenarios that can't happen internally — only at system boundaries
- Three similar lines is better than a premature abstraction
- Don't add docstrings, comments, or type annotations to code you didn't change
- Don't rename unused variables with `_` prefix — delete unused code
- Prefer editing existing files over creating new ones
- Run tests after every significant change, not just at the end
- If a test fails, fix the code — never modify the test to make it pass (unless the test was wrong)
- When something is blocked, investigate the root cause — don't brute-force or retry
- Don't create helpers or utilities for one-time operations
- If you're touching more files than the plan specified, you're probably over-engineering
- A bug fix doesn't need surrounding code cleaned up
- Silent scope reduction is as bad as scope creep — don't quietly drop acceptance criteria
- Watch for degradation signals: placeholder code, `// TODO: implement`, sparse implementations — recommend context reset
