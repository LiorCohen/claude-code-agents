---
id: 150
title: Agent Workflow Testing Framework ("Playwright for Claude")
priority: low
status: inbox
created: 2026-02-16 18:00 UTC
depends_on: []
blocks: []
---

# Agent Workflow Testing Framework ("Playwright for Claude")

## Description

Build an interactive testing framework for SDD plugin workflows. The plugin has complex, multi-turn, prompt-driven interactions (skills, commands, agents) that cannot be tested with traditional unit tests. We need a mechanism analogous to Playwright — but instead of driving a browser, it drives the Claude Code CLI in isolated workspaces with hooks-based interception.

The framework drives the **real Claude Code CLI** (`claude -p`) using the user's subscription (no API key needed), intercepts tool calls via Claude Code hooks, simulates user responses by denying `AskUserQuestion` with scripted answers, and asserts on tool call sequences and workspace state.

## Motivation

- Plugin workflows are prompt-driven state machines with branching logic, user interactions, and file-system side effects
- Traditional tests can't capture multi-turn conversations, tool call sequences, or user interaction flows
- No existing tool handles this: the ecosystem has eval frameworks (Promptfoo, DeepEval, Inspect AI) but none test Claude Code plugin workflows specifically
- Without workflow testing, prompt changes, model updates, and refactors can silently break complex workflows
- 80-95% of AI agent projects fail to reach production; testing effort concentrates on tools/parsers (>70%) while prompts/planning get <5% of testing

## Research: Ecosystem Landscape (Feb 2026)

### What exists — closest tools

| Tool | What it does | Gap for us |
|------|-------------|------------|
| **[LangWatch Scenario](https://github.com/langwatch/scenario)** | Agentic testing for agentic codebases. Multi-turn, tool assertions, mock APIs. Python. | API-level, not CLI-level. Not Claude Code aware. |
| **[Inspect AI](https://inspect.aisi.org.uk/)** | UK AISI open-source agent eval. Sandboxed tool use (bash, python, text-edit), multi-model. | Python-based. No Claude Code plugin awareness. |
| **[Promptfoo](https://github.com/promptfoo/promptfoo)** (10.5k stars) | Multi-turn prompt eval, red-teaming, CI/CD native. YAML test specs. | Prompt evaluation, not full workflow orchestration. |
| **[DeepEval](https://github.com/confident-ai/deepeval)** | Pytest-like LLM testing. Agent metrics (tool correctness, plan adherence). | Python. API-level. No Claude Code integration. |
| **[LangSmith](https://langchain.com/langsmith)** | Multi-turn evals, trace-based testing, LLM-as-judge. | LangChain ecosystem. Observability, not pre-deployment testing. |
| **[Braintrust](https://braintrust.dev)** | Trace-to-test workflow. Convert failed traces to regression tests. | Cloud SaaS. Post-hoc, not pre-deployment. |
| **[Langfuse](https://langfuse.com)** | Open-source observability + eval. Self-hosted. | Observability-first, not test-first. |

### Key industry findings

- **Anthropic's recommended approach**: Start with 20-50 real tasks. Assert on task completion, not text matching. Three grader types: code-based (fast), model-based (flexible), human (calibration).
- **LLM-as-judge**: Mature but should augment, not replace, deterministic assertions. Good for trend detection and regression prevention.
- **Trace-based testing**: Recording execution traces and converting failures to regression tests is becoming standard.
- **Tool calls are the stable API surface**: Structured, predictable, and represent actual behavior. Most reliable assertion target.
- **Non-determinism is the core challenge**: Move from "does output match?" to "does it accomplish the task?"

### What nobody has built

No tool exists for testing Claude Code plugin workflows specifically. The gap:
- CLI-level workflow testing using subscription (not API key)
- Claude Code plugin-aware (skills, commands, agents)
- Real tool execution in isolated workspaces (not mocked)
- TypeScript/Vitest ecosystem (not Python)
- Hooks-based interception with scripted user responses

## Proposed Architecture

### Core concept

Drive the real Claude Code CLI in isolated temp workspaces. Use Claude Code hooks as middleware for interception, logging, and user simulation. Assert on tool call sequences and workspace state.

```
┌──────────────────────────────────────────────────┐
│              Test Spec (Vitest)                    │
│  scenario, fixtures, scripted answers, assertions  │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│              Test Harness                          │
│  1. Create temp workspace from fixture             │
│  2. Inject .claude/settings.json with hooks:       │
│     - PreToolUse  → log + intercept questions      │
│     - PostToolUse → log tool results               │
│  3. Write scripted answers to .test/answers.json   │
│  4. Shell out: claude -p "prompt" --max-turns 20   │
│  5. Read .test/tool-log.jsonl after completion     │
│  6. Assert on tool log + workspace state           │
│  7. Cleanup temp workspace                         │
└──────────────────────┬───────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   PreToolUse      PostToolUse    Filesystem
   hook writes     hook writes    diffing
   tool calls +    tool results   (before/after
   intercepts      to log         snapshots)
   questions
```

### Authentication

- Uses `claude -p` CLI which authenticates via logged-in subscription (Pro/Max)
- No `ANTHROPIC_API_KEY` needed — the Agent SDK requires an API key but the CLI does not
- This is a critical design choice: the Agent SDK (`@anthropic-ai/claude-code`) explicitly [disallows subscription auth](https://github.com/anthropics/claude-code/issues/5891)

### Per-test workspace structure

```
/tmp/sdd-test-<id>/
  ├── .claude/
  │   └── settings.json          # injected hooks config
  ├── .test/
  │   ├── answers.json           # scripted user responses
  │   ├── tool-calls.jsonl       # ← PreToolUse hook writes here
  │   └── tool-results.jsonl     # ← PostToolUse hook writes here
  ├── .claude-plugin/ → symlink  # real plugin
  ├── .sdd/                      # from fixture
  ├── SPEC.md                    # from fixture
  └── sdd-settings.yaml          # from fixture
```

### Hooks-based interception

Claude Code hooks receive full tool parameters as JSON on stdin and can:
1. **Log** every tool call (name + params) to JSONL
2. **Deny** tool calls and feed a reason back to Claude
3. **Modify** tool inputs before execution (v2.0.10+)

Key hook types used:
- **PreToolUse** (all tools): Log tool name + params to `.test/tool-calls.jsonl`
- **PreToolUse** (AskUserQuestion): Deny with scripted answer from `.test/answers.json`, feeding the answer back to Claude as the denial reason
- **PostToolUse** (all tools): Log tool name + params + response to `.test/tool-results.jsonl`

### User interaction simulation

`AskUserQuestion` is a tool. A PreToolUse hook with matcher `"AskUserQuestion"` fires before it executes. The hook reads the question, looks up a scripted answer from the test fixture, and **denies** the tool call with the answer as the reason. Claude sees the denial message (containing the answer) and proceeds as if the user responded.

```bash
#!/bin/bash
INPUT=$(cat)
QUESTIONS=$(echo "$INPUT" | jq -c '.tool_input.questions')
ANSWER=$(python3 "$CLAUDE_PROJECT_DIR/.test/answer-script.py" "$QUESTIONS")
jq -n --arg answer "$ANSWER" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $answer
  }
}'
```

### What to assert on

| Assert on | Reliability | Example |
|-----------|-------------|---------|
| Tool call presence | High | "Must call `Write` at least once" |
| Tool call parameters | High | "Write path must match `*.md`" |
| Tool call ordering | Medium | "Must `Read` before `Write`" |
| Question content | Medium | "Must ask about component type" |
| Workspace file state | High | "File `backend/src/index.ts` exists" |
| File content patterns | High | "`package.json` contains `express`" |
| Output keywords | Low-Medium | Avoid relying on exact text |

### Test tiers (cost-conscious)

| Tier | What | Model | When to run |
|------|-------|-------|-------------|
| **Smoke** | Does the skill load and call the right first tool? | haiku | Every commit |
| **Workflow** | Does the full happy path complete? | sonnet | PR merge |
| **Edge case** | Missing files, bad input, etc? | sonnet | Weekly / release |
| **Regression** | Specific bug reproduction | varies | When bugs found |

### Example test file

```typescript
import { describe, it, expect } from 'vitest';
import { createWorkspace, runClaude } from './harness';

describe('backend-scaffolding', () => {
  it('creates express backend from settings', async () => {
    const ws = await createWorkspace({
      fixture: 'scaffolded-project',
      answers: {
        'Framework': 'Express',
        'Database':  'PostgreSQL',
      },
    });

    await runClaude(ws, {
      prompt: 'Run /sdd scaffolding for the backend component',
      maxTurns: 25,
      timeout: 180_000,
    });

    // Assert on files created
    expect(ws.exists('backend/src/index.ts')).toBe(true);
    expect(ws.exists('backend/package.json')).toBe(true);
    expect(ws.read('backend/package.json')).toContain('express');

    // Assert on tool call sequence
    const log = ws.getToolLog();
    expect(log).toContainCall('Read', {
      file_path: expect.stringContaining('sdd-settings')
    });

    // Assert no unexpected questions
    expect(log.filter(c => c.tool === 'AskUserQuestion')).toHaveLength(2);

    await ws.dispose();
  }, 180_000);
});
```

### Fixtures system

Reusable project snapshots representing different states:

```
tests/fixtures/
  ├── empty-project/            # just git init
  ├── scaffolded-project/       # after /sdd-init
  ├── with-backend/             # has backend component
  ├── with-change-in-progress/  # mid-workflow state
  └── broken-config/            # invalid settings (error case)
```

## Key Design Decisions

1. **CLI over SDK**: The Agent SDK requires an API key; the CLI uses subscription auth. CLI is the right choice.
2. **Real execution over mocks**: Actual tool calls in real workspaces, not simulated. Catches real issues.
3. **Hooks as middleware**: Claude Code's hook system is the interception layer — no need to build one.
4. **Tool calls as assertion surface**: Structured, predictable, represent actual behavior. More reliable than text matching.
5. **Temp workspaces for isolation**: Each test gets a disposable workspace. Like Playwright's browser contexts.
6. **Tiered cost management**: Use haiku for structural tests, sonnet for behavioral, tag tests by tier, run selectively.

## Open Questions

1. **Plugin loading**: Does Claude Code load the plugin when `cwd` has a `.claude-plugin/`? If so, symlinking into test workspace should work.
2. **CLI flags**: Full inventory of `claude -p` flags for programmatic use (--max-turns, --allowedTools, --output-format, --permission-mode).
3. **Parallel execution**: Can multiple Claude Code CLI sessions run concurrently in separate workspaces?
4. **Determinism strategy**: Run each test N times and require majority pass? Use temperature 0?
5. **Hook reliability for AskUserQuestion**: Verify that denying AskUserQuestion with a scripted answer actually causes Claude to proceed correctly.
6. **Cost tracking**: How to monitor subscription usage across test runs?

## Scope

### In scope

- Test harness library (TypeScript, Vitest-compatible)
- Workspace management (create, fixture loading, cleanup)
- Hook injection (PreToolUse logging, AskUserQuestion interception, PostToolUse logging)
- Assertion helpers for tool call sequences and workspace state
- Fixture system for project snapshots
- Integration with existing test infrastructure (`npm test`)

### Out of scope

- Visual UI for test results (use Vitest's built-in reporter)
- Cloud/CI execution (local first, CI later)
- Testing non-plugin Claude Code workflows
- Open-sourcing as standalone tool (internal first)

## Acceptance Criteria

- [ ] Test harness can create isolated temp workspaces from fixtures
- [ ] Hooks are injected that log all tool calls to JSONL
- [ ] AskUserQuestion can be intercepted with scripted answers
- [ ] `claude -p` runs in workspace using subscription auth
- [ ] Assertion helpers can check tool call presence, params, and ordering
- [ ] Assertion helpers can check workspace file state after test
- [ ] At least one real smoke test passes for an existing skill
- [ ] Tests clean up temp workspaces after completion
- [ ] `npm test` runs the workflow tests alongside existing tests
