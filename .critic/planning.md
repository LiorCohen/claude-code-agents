# Planning Rules

- Read all relevant files in full before writing a plan — grep finds files, reading understands them
- Plans must reference real file paths — verify they exist before listing them
- Fewer focused changes beat many scattered changes
- Every change must be justified by task acceptance criteria — no "while we're at it"
- Check for existing patterns before inventing new ones
- Plans should be implementable by a different session with zero additional context
- Don't plan for hypothetical future requirements
- If you're unsure about architecture, read more code — don't guess
- Include meaningful tests in every plan — "test that it works" is not a test
- Account for the 500-line limit on skill and resource files
- Check INDEX.md for overlapping tasks before creating plans that duplicate existing work
- The right amount of complexity is the minimum needed for the current task
- Don't add configurability, feature flags, or backwards-compatibility shims
- Don't design for N when you only need 1
- If the solution is more complex than the problem, reconsider the approach
- When replacing an existing feature, systematically compare old vs new capability lists — enumerate every check/behavior the old version performs and verify the new version covers each one or explicitly justifies dropping it
- Don't assume macOS has GNU tools — `grep -P` (Perl regex) doesn't work on BSD grep; use bash `[[ =~ ]]` for regex matching in portable scripts
