---
name: product-discovery
description: Interactive discovery of product requirements through adaptive questioning.
---

# Product Discovery Skill

Conducts an interactive discovery conversation to understand what the user is building before making technical decisions.

## Purpose

Extract structured product information through adaptive questioning:
- Problem/purpose the product solves
- Target users and their roles
- Core workflows and capabilities
- Domain entities and concepts
- Integrations with external systems
- Constraints and scope

## When to Use

- During `/sdd-init` to gather product context before scaffolding
- For project refinement or pivot analysis
- When onboarding to understand an existing product

## Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `project_name` | Yes | Name of the project |
| `spec_outline` | No | Pre-extracted outline with sections and line ranges (from Phase 0) |
| `spec_path` | No | Path to external spec file (for reading intro section) |

## Output

Return structured discovery results:

```yaml
product_description: "1-2 sentence problem statement"
primary_domain: "Task Management"
user_personas:
  - type: "Project Manager"
    actions: "create projects, assign tasks"
  - type: "Team Member"
    actions: "update progress, view assignments"
core_workflows:
  - "Task assignment"
  - "Progress tracking"
domain_entities:
  - "Team"
  - "Project"
  - "Task"
integrations: ["Slack"]  # Empty list if none
constraints: ["MVP scope"]  # Empty list if none
scope: "mvp"  # "mvp" or "full"
```

## Workflow

### Step 1: Opening Question

**If external spec was provided (`spec_outline` and `spec_path` are set):**

The outline is already extracted. Read only the **intro section** for discovery:

1. Identify the intro section:
   - **Single file:**
     - If outline has headers: content before the first header, or first H1/H2 content
     - If no headers: first ~2000 characters of the spec
   - **Directory:**
     - Look for entry point: `README.md`, `index.md`, or first file alphabetically
     - Read that file's intro (before first header, or first H1/H2 content)
2. Read only that section content from `spec_path` (the original location - spec will be copied to project later in Phase 7)
3. Parse the intro for: problem statement, user types, domain concepts
4. Present what was extracted and ask for confirmation/additions:
   > "Based on the spec you provided, here's what I understood: [summary]. Is this accurate, or would you like to add/correct anything?"

Add note about detailed breakdown:
> "The full spec will be broken down into changes after project setup."

**If no external spec:**
- Ask the opening discovery question:
  > "Before I set up the project, tell me about what you're building. What problem does it solve and who is it for?"

### Step 2: Parse Response

Analyze the user's response to extract:

| Element | Look For |
|---------|----------|
| Problem/Purpose | What the product solves, pain points addressed |
| Users/Personas | User types, roles, "for X teams", personas |
| Workflows | Features, actions, "users can X", capabilities |
| Entities | Domain nouns, data types, "manages X", objects |
| Scope | "MVP", "phase 1", "initial", "full" |
| Integrations | APIs, services, "integrates with", third-party |
| Constraints | Compliance, scale, requirements, limitations |

### Step 3: Adaptive Follow-up

Only ask follow-up questions for missing elements. Use this table:

| If missing... | Ask... | Skip if user mentioned... |
|---------------|--------|---------------------------|
| Users | "Who are the different types of users?" | User types, roles, personas, "for X teams" |
| Workflows | "What are the main things users will do?" | Features, actions, "users can X" |
| Entities | "What are the key objects/concepts in your domain?" | Domain nouns, data types, "manages X" |
| Scope | "Is this an MVP or a more complete product?" | "MVP", "phase 1", "initial", "full" |
| Integrations | "Does this need to connect to other systems?" | APIs, services, "integrates with" |

**Depth Guidelines:**

1. If the initial answer is comprehensive (covers problem + users + features), skip directly to confirmation
2. If the answer is brief, ask 2-3 targeted follow-ups from the table
3. If user says "just set it up" or shows impatience, proceed with minimal discovery:
   - Set `scope: "mvp"`
   - Use project name for domain inference
   - Leave other fields as minimal/empty
4. **Never ask more than 4 questions total** (including the opening question)

### Step 4: Summarize and Confirm

Present the understanding for confirmation:

```
Here's what I understood:

**Product:** <name> [<scope if mentioned>]
**Problem:** <1-2 sentence description of what it solves>
**Users:**
  - <User type 1> (<what they do>)
  - <User type 2> (<what they do>)
**Core Capabilities:**
  - <Capability 1>
  - <Capability 2>
  - <Capability 3>
**Key Entities:** <Entity1>, <Entity2>, <Entity3>
[**Integrations:** <if mentioned>]
[**Constraints:** <if mentioned>]

Did I understand correctly, or would you like to clarify anything?
```

If user provides corrections, update and re-confirm.

### Step 5: Return Results

Once confirmed, structure the output as specified in the Output section.

## Examples

### Example 1: Comprehensive Initial Answer

```
User: I'm building a task tracker for small engineering teams. Project managers
create projects and assign tasks, team members update their progress.
It's an MVP - just core task management with Slack notifications for now.
Main entities are Teams, Projects, Tasks, and Users.

[Skip to confirmation - user provided comprehensive info]

Discovery Results:
  product_description: "Task management for engineering teams"
  primary_domain: "Task Management"
  user_personas:
    - type: "Project Manager"
      actions: "create projects, assign tasks"
    - type: "Team Member"
      actions: "update progress"
  core_workflows:
    - "Create projects"
    - "Assign tasks"
    - "Update task progress"
  domain_entities: ["Team", "Project", "Task", "User"]
  integrations: ["Slack"]
  constraints: []
  scope: "mvp"
```

### Example 2: Brief Answer Needing Follow-up

```
User: It's an e-commerce platform

[Missing: users, workflows, entities - ask 2-3 follow-ups]

Agent: Who are the users? (e.g., shoppers, merchants, admins)
User: Shoppers buy things, merchants list products, we have internal admins

Agent: What are the main things users will do?
User: Browse products, add to cart, checkout. Merchants manage inventory.

Agent: What are the key entities in your domain?
User: Products, Orders, Users, Inventory, Payments

[Now confirm]

Discovery Results:
  product_description: "E-commerce platform for online shopping"
  primary_domain: "E-commerce"
  user_personas:
    - type: "Shopper"
      actions: "browse, add to cart, checkout"
    - type: "Merchant"
      actions: "list products, manage inventory"
    - type: "Admin"
      actions: "internal operations"
  core_workflows:
    - "Browse products"
    - "Add to cart"
    - "Checkout"
    - "Manage inventory"
  domain_entities: ["Product", "Order", "User", "Inventory", "Payment"]
  integrations: []
  constraints: []
  scope: "full"
```

### Example 3: User Wants to Skip Discovery

```
User: Just set it up, it's a simple REST API

[User showing impatience - proceed with minimal discovery]

Agent: Understood - I'll set up a basic backend API project. You can fill in
the domain details later in the specs.

Discovery Results:
  product_description: "REST API backend"
  primary_domain: "General"
  user_personas: []
  core_workflows: []
  domain_entities: []
  integrations: []
  constraints: []
  scope: "mvp"
```

## Notes

- This skill is purely conversational - it reads user input and asks questions
- It does not create any files
- The structured output is used by subsequent skills (component-recommendation, domain-population)
- Keep the conversation natural and adaptive, not like a rigid form