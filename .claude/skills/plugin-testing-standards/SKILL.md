# Plugin Testing Standards

Testing methodology for Claude Code plugins ensuring deterministic verification of LLM-driven workflows.

---

## Core Principles

### 1. Separation of Concerns

```
tests/
├── lib/                    # All helper/utility code (wraps Node.js)
│   ├── index.ts            # Re-exports everything
│   ├── paths.ts            # Directory constants
│   ├── fs.ts               # File system operations
│   ├── process.ts          # Command execution
│   ├── claude.ts           # Claude CLI helpers
│   └── http.ts             # HTTP utilities
└── tests/                  # Test files (NO direct node:* imports)
    ├── unit/               # No LLM required
    ├── workflows/          # LLM with deterministic verification
    └── integration/        # Full functional verification
```

### 2. No Direct Node.js Imports in Tests

Test files must NOT import from `node:*` directly. All Node.js functionality is accessed through `lib/` helpers.

```typescript
// BAD - direct node import
import * as fs from 'node:fs';
import * as path from 'node:path';

// GOOD - use lib helpers
import { readFile, joinPath, fileExists } from '../lib/index.js';
```

### 3. File Size Limit: 300 Lines

If a test file exceeds 300 lines, split it into a directory with multiple smaller files.

```
tests/unit/large-feature.test.ts  (350 lines - TOO BIG)

# Split into:
tests/unit/large-feature/
├── core.test.ts           (~100 lines)
├── validation.test.ts     (~120 lines)
└── integration.test.ts    (~130 lines)
```

### 4. WHY Comments on Every Test

Every `describe` and `it` block must have a WHY comment explaining the business/technical value, not the mechanics.

```typescript
/**
 * WHY: Ensures scaffolding substitutes project name variables.
 * Without this, generated projects have {{PROJECT_NAME}} literals
 * in package.json, breaking npm install.
 */
it('substitutes {{PROJECT_NAME}} in templates', async () => { ... });
```

---

## Test Tiers

| Tier | Name | LLM | Purpose | Duration |
|------|------|-----|---------|----------|
| 1 | Unit | No | Test pure functions, templates, structure | < 10s |
| 2 | Workflow | Yes | Verify correct agent/skill invocations | < 15min |
| 3 | Integration | Yes | Verify generated output actually works | < 20min |

### Tier 1: Unit Tests

Pure TypeScript tests with no Claude involved.

- Test scaffolding scripts directly
- Validate template files exist and have correct structure
- Validate plugin structure (commands, agents, skills)
- No network calls, no LLM

### Tier 2: Workflow Tests

Run Claude with predefined inputs, parse output, verify invocations.

- Capture stream-json output
- Parse tool/skill/agent invocations
- Compare to expected behavior
- Deterministic pass/fail

### Tier 3: Integration Tests

Verify generated output actually works.

- Run `npm install` on generated projects
- Run `npm run build` to verify TypeScript compiles
- Start servers and verify they respond
- Tests expose real issues in scaffolding/templates

---

## Deterministic LLM Testing

### Approach

1. Run Claude in non-interactive mode with predefined inputs
2. Capture structured output via `--output-format stream-json`
3. Parse tool/skill/agent invocations from JSON
4. Compare to expected behavior defined in test specs

### Stream-JSON Output Structure

```json
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Skill","input":{"skill":"init"}}]}}
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Task","input":{"subagent_type":"spec-writer"}}]}}
```

### Parsing Helper

```typescript
interface ParsedOutput {
  readonly toolUses: readonly ToolUse[];
  readonly skillInvocations: readonly string[];
  readonly agentInvocations: readonly string[];
}

const parseClaudeOutput = (output: string): ParsedOutput => {
  const toolUses: ToolUse[] = [];
  const skillInvocations: string[] = [];
  const agentInvocations: string[] = [];

  for (const line of output.split('\n')) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'assistant' && event.message?.content) {
        for (const content of event.message.content) {
          if (content.type === 'tool_use') {
            toolUses.push({ name: content.name, input: content.input, id: content.id });
            if (content.name === 'Skill') skillInvocations.push(content.input.skill);
            if (content.name === 'Task') agentInvocations.push(content.input.subagent_type);
          }
        }
      }
    } catch { /* skip non-JSON */ }
  }

  return { toolUses, skillInvocations, agentInvocations };
};
```

---

## Prompt Engineering for Determinism

Include these instructions in all automated test prompts:

```
THIS IS AN AUTOMATED TEST. You MUST:
1. Skip ALL discovery questions and use the values above
2. Skip approval steps - consider it PRE-APPROVED
3. Execute ALL steps through completion
4. Do NOT stop for user input at any point
5. Create ALL files in the CURRENT WORKING DIRECTORY (.) - do NOT use absolute paths
```

---

## Integration Test Pattern

```typescript
/**
 * WHY: Verifies that init generates projects that actually compile.
 * Catches issues like invalid TypeScript, missing dependencies, or
 * broken import paths that would break users immediately.
 */
describe('init functional verification', () => {
  /**
   * WHY: npm install must succeed for users to run the project.
   * Catches invalid package.json, missing dependencies, or
   * dependency version conflicts.
   */
  it('generated project installs dependencies', async () => {
    const result = await runClaude(PROMPT, testDir, 300);
    expect(result.exitCode).toBe(0);

    const installResult = await runCommand('npm', ['install'], { cwd: projectDir });
    expect(installResult.exitCode).toBe(0);
  });

  /**
   * WHY: TypeScript must compile for the project to be usable.
   * Catches type errors, missing type definitions, or invalid
   * tsconfig settings in templates.
   */
  it('generated project builds successfully', async () => {
    const buildResult = await runCommand('npm', ['run', 'build'], { cwd: serverDir });
    expect(buildResult.exitCode).toBe(0);
  });
});
```

---

## Critical Principle: Fix Code, Not Tests

If an integration test fails:
- The fix belongs in **scaffolding.ts** or **templates**
- NOT in test assertions or expectations
- Tests exist to catch real issues in generated output

```
# BAD: Weakening test to pass
- expect(buildResult.exitCode).toBe(0);
+ expect(buildResult.exitCode).toBeLessThan(2); // "allow warnings"

# GOOD: Fix the actual issue
# Edit scaffolding.ts or template files to fix the build error
```

---

## Directory Structure Template

```
tests/{plugin-name}/
├── src/
│   ├── lib/
│   │   ├── index.ts
│   │   ├── paths.ts
│   │   ├── fs.ts
│   │   ├── process.ts
│   │   ├── claude.ts
│   │   └── http.ts
│   └── tests/
│       ├── unit/
│       │   └── {feature}/
│       │       └── {concern}.test.ts
│       ├── workflows/
│       │   ├── {command}.test.ts
│       │   └── {skill}/
│       │       └── {scenario}.test.ts
│       └── integration/
│           └── {command}-functional.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## NPM Scripts

```json
{
  "test": "vitest run",
  "test:unit": "vitest run src/tests/unit/",
  "test:workflows": "vitest run src/tests/workflows/",
  "test:integration": "vitest run src/tests/integration/",
  "test:ci": "vitest run src/tests/unit/",
  "test:all": "vitest run"
}
```

---

## Success Criteria

1. Unit tests complete in < 10 seconds (no LLM)
2. Workflow tests are deterministic - same input produces same pass/fail
3. Integration tests verify generated projects actually build and run
4. Failures clearly identify what invocation was missing or wrong
5. Test failures indicate issues in plugin code, NOT in tests
6. All test files are < 300 lines
7. All test blocks have WHY comments
