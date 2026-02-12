---
id: 69
title: Fix sdd-init workflow test timeout
status: inbox
created: 2026-02-01
depends_on: []
blocks: []
---

# Task 69: Fix sdd-init workflow test timeout

## Description

The `tests/src/tests/workflows/sdd-init.test.ts` test is failing with a timeout:

```
Error: Claude timed out after 420s
```

This workflow test actually runs Claude to test the `/sdd-init` command and is timing out after 7 minutes. Possible causes:

1. **Test is too slow** - The sdd-init workflow may be doing too much work, causing Claude to take too long
2. **Infinite loop or stuck state** - Claude might be getting stuck in a loop or waiting for something
3. **Test timeout too short** - The 420s timeout may need to be increased for this complex workflow
4. **Test environment issues** - Something in the test setup might be causing delays

## Investigation Needed

- Review what sdd-init actually does and why it might take so long
- Check if the test was passing before and when it started failing
- Consider if the test can be simplified or split into smaller tests
- Evaluate if this should be a unit test with mocked Claude responses instead

## Acceptance Criteria

- [ ] sdd-init.test.ts passes reliably
- [ ] Test completes in a reasonable time (< 2 minutes ideally)
- [ ] If test is inherently slow, document why and ensure CI can handle it
