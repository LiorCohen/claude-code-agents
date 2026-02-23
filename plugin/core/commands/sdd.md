---
name: sdd
description: Context-aware workflow assistant — reads project state, suggests next steps, and executes via /sdd-run.
---

# /sdd

Your SDD workflow assistant. Reads project context, understands natural language, and guides you through the spec-driven development lifecycle.

## How It Works

`/sdd` is the hub command. It knows about:
- **`/sdd-help`** — for learning SDD concepts and methodology (refer novices here)
- **`/sdd-run`** — for direct, explicit commands (show power users the equivalent)

## Strict Approval Protocol

**NEVER execute actions without explicit user approval.** Every interaction follows this pattern:

1. **Understand** — read context, interpret the user's request
2. **Explain** — tell the user what you understood and what you intend to do (including the specific `/sdd-run` command)
3. **Ask** — request explicit approval before proceeding
4. **Execute** — only after the user approves, by invoking the Skill tool with `sdd-run`

This is non-negotiable. Natural language interpretation can misfire — the approval step catches misunderstandings before they become actions.

**Example:**

    User: /sdd I want to add user authentication

    Assistant: I understand you want to create a new feature change for user
    authentication. I would run:

      /sdd-run change create --type feature --name user-auth

    This will start the spec-driven workflow — first gathering requirements,
    then creating a spec for your review.

    Shall I proceed?

    User: yes

    Assistant: [Invokes Skill(sdd-run, args: "change create --type feature --name user-auth")]

---

## When Invoked Without Arguments

Read project context and suggest the most relevant next action.

### Context to Read

1. **Git branch** — `git branch --show-current`
   - Feature branch → active workflow, focus on that change
   - Main branch → show overview
2. **Workflow state** — `sdd/workflows/` directory
   - Active changes and their current phases
3. **Project initialization state** — does `sdd/sdd-settings.yaml` exist?
4. **Component settings** — what's configured in `sdd-settings.yaml`

### Multi-Workflow Handling

**On a feature branch:** Focus on the workflow matching that branch. Show its current phase and suggest the next action.

    Current branch: feature/user-auth
    Active change: user-auth-1 (User Authentication) — spec_review

    The spec is ready for your review.

    SUGGESTED: Review the spec, then approve it.
      I would run: /sdd-run change approve spec user-auth-1

    Shall I proceed, or would you like to do something else?

**On main with active workflows:** List all active workflows with their current phases.

    You have 2 active workflows:

    1. user-auth-1 (User Authentication) — plan_review
       Branch: feature/user-auth
    2. payment-1 (Payment Integration) — implementing
       Branch: feature/payment

    Which would you like to work on, or would you like to create a new change?

**No active workflows:** Suggest creating a new change or show general project status.

    No active workflows found.

    You can:
    - Start a new feature: tell me what you want to build
    - Import an external spec: provide a path to a spec file
    - Check project status: /sdd-run version

    What would you like to do?

**Not an SDD project (no sdd-settings.yaml):**

    This doesn't appear to be an SDD project yet.

    To get started:
    - Learn about SDD: /sdd-help
    - Initialize this project: I can run /sdd-run init

    Would you like me to initialize this project?

---

## When Invoked With Arguments

Interpret the natural language request and map it to a `/sdd-run` command.

### Interpretation Rules

1. Parse the user's intent from their natural language input
2. Map to the appropriate `/sdd-run` namespace and action
3. Explain what you understood and the command you would run
4. Wait for confirmation before executing

### Common Mappings (Core)

| User Says | Interpreted As |
|-----------|---------------|
| "I want to create a new feature" | `/sdd-run change create --type feature` |
| "I want to import an external spec" | `/sdd-run change create --spec <path>` |
| "I want to approve the spec" | `/sdd-run change approve spec <change-id>` |
| "I want to approve the plan" | `/sdd-run change approve plan <change-id>` |
| "I want to start planning" | `/sdd-run change plan <change-id>` |
| "I want to start implementing" | `/sdd-run change implement <change-id>` |
| "I want to verify the implementation" | `/sdd-run change verify <change-id>` |
| "I want to submit for review" | `/sdd-run change review <change-id>` |
| "I want to answer an open question" | `/sdd-run change answer <change-id> ...` |
| "I want to go back to the spec phase" | `/sdd-run change regress <change-id> --to spec` |
| "I want to initialize a new project" | `/sdd-run init` |
| "What version am I running?" | `/sdd-run version` |
| "I want to configure permissions" | `/sdd-run permissions configure` |
| "I want to continue" | `/sdd-run change continue <change-id>` |
| "I want to request changes" | `/sdd-run change request-changes <change-id>` |

### Tech Pack Mappings

Additional intent mappings are provided by active tech packs. Load them via:

```yaml
INVOKE techpacks.loadSkill with:
  namespace: <tech-pack-namespace>
  skill: "capabilities"
```

The capabilities skill returns tech-pack-specific intent→command mappings (e.g., database setup, config generation, local environment management).

When the user's intent is ambiguous, ask for clarification before suggesting a command.

When the change-id is needed but not provided, infer it from context:
- If on a feature branch, look up the associated workflow
- If only one active workflow exists, use that
- If a change-id IS provided, match it directly via name prefix (e.g., `user-auth-1` belongs to workflow `user-auth`) — no scanning needed
- Otherwise, list active workflows by name and ask which change they mean

### Settings Management

When users describe settings changes in natural language (e.g., "I want to add a new component", "enable monitoring for my service"), delegate to the `project-settings` skill internally. Do NOT route these through `/sdd-run` — settings are managed by the skill directly.

---

## Cross-Referencing Behavior

### When to Reference `/sdd-help`

If the user seems unfamiliar with a concept:

    You mentioned "specs" — if you'd like to learn more about the spec-driven
    approach and how specs work in SDD, try /sdd-help.

### When to Reference `/sdd-run`

After completing or suggesting an action, show the direct equivalent:

    You can also run this directly next time:
      /sdd-run change approve spec user-auth-1

### On First Use in Uninitialized Project

    Welcome! This project hasn't been set up with SDD yet.

    - To learn about SDD first: /sdd-help
    - To initialize right away: I can run /sdd-run init for you

---

## Execution

When the user approves an action, invoke via the Skill tool:

    Skill(sdd-run, args: "change create --type feature --name user-auth")

**NEVER** inline `/sdd-run` logic. Always delegate via the Skill tool to keep the two commands decoupled.