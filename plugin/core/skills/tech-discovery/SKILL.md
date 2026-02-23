---
name: component-discovery
description: Discover required technical components through targeted questions based on classified requirements.
user-invocable: false
---

# Component Discovery Skill

Identifies required technical components through analysis of classified requirements and targeted discovery questions. **This skill is purely analytical - it never modifies sdd-settings.yaml or scaffolds components.**

## Purpose

Based on transformation output (classified requirements):
- Ask targeted discovery questions to determine WHICH components are needed
- Analyze requirements + answers to identify component types
- Ask component-specific questions to understand scope
- Document discovered components in SPEC.md (not in system files)
- Return component list for spec writing

**IMPORTANT**: This skill does NOT:
- Modify `sdd-settings.yaml`
- Scaffold components
- Make any system changes

It only analyzes and documents. Implementation decides when to actually create components.

## When to Use

- After transformation step in external spec workflow
- Runs ONCE after transformation, before decomposition
- During `/sdd I want to create a new feature` interactive mode to identify needed components

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts change name, type, existing components, and optionally classified requirements from external spec processing.

## Discovery Framework

### Step 1: Load Tech Pack Discovery Knowledge

Before asking discovery questions, load the tech-specific discovery knowledge:

```
Invoke techpacks.routeSkills with:
  namespace: <active-namespace>
  phase: component-discovery
```

This loads component types, descriptions, discovery question sets, and settings schemas from the active tech pack.

### Step 2: Core Discovery Questions

The tech pack's discovery skill provides the mapping from requirements to component types. Use the loaded question sets to:

1. Ask high-level questions to identify which component types are needed
2. For each identified type, ask component-specific follow-up questions
3. Determine component settings based on answers

**General discovery approach:**
- What data needs to be persisted?
- What user-facing interfaces are needed?
- What external integrations are required?
- What background processing is needed?
- What deployment requirements exist?

### Step 3: Visual Assets Prompt

When UI/UX is involved and spec doesn't include visual assets:

```text
Do you have any visual assets I can reference?
  - Mockups or wireframes (Figma, Sketch, etc.)
  - Screenshots of existing UI
  - Rough sketches or drawings
  - Reference images from other products

If you can share images, I can extract much more accurate
requirements than from text descriptions alone.
```

**Skip this if** spec already includes images or links to design tools.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns a list of components with names, types, and settings.

Component settings from this output flow into the SPEC.md `## Components` section's Settings column, where they inform the scaffolding phase during implementation.

## Skills

Use the following skills for reference:
- `techpacks` — Gateway for all tech-pack interactions. Use `techpacks.listComponents` to get available component types and `techpacks.routeSkills(phase: component-discovery)` to load tech-specific discovery knowledge.

## Available Components

Invoke `techpacks.listComponents` for the active tech pack namespace to get the full list of available component types, their descriptions, directory patterns, and whether they support multiple instances. Do NOT hardcode component types — the tech pack manifest is the source of truth.

## Workflow

### Step 1: Analyze Requirements

Map discovered information to component types from the tech pack. Use `techpacks.routeSkills(phase: component-discovery)` to load the tech-specific discovery knowledge that maps requirements to component types and settings.

### Step 2: Present Recommendation with Settings

```text
Based on what you've described, I recommend:

**Components:**
- **[Component Name]** - to handle <purpose>
  - Settings: <key settings from discovery>

- **[Component Name]** - for <purpose>
  - Settings: <key settings from discovery>

[Additional components with justification]

Does this match what you had in mind?
```

### Step 3: Handle Adjustments

If the user wants changes, update both components and settings based on the tech pack's component type definitions and cross-reference rules.

### Step 4: Multiple Component Instances

Some component types support multiple instances. When the requirements suggest multiple instances of the same type (e.g., separate services for different domains), ask the user whether to consolidate or split.

The tech pack's discovery knowledge provides guidance on when to split vs consolidate for each component type.

### Step 5: Settings Validation

Before returning, validate discovered configuration against the tech pack's cross-reference rules. Invoke `techpacks.routeSkills(phase: component-discovery)` to get the validation rules.

### Step 6: Return Configuration

Return the final configuration with all settings.

## Notes

### Critical: No System Modifications

- **NEVER modifies `sdd-settings.yaml`** - only documents in SPEC.md
- **NEVER scaffolds components** - that's implementation phase
- **NEVER creates any files** - purely analytical

### Workflow Position

```text
External Spec → Transformation → **Component Discovery** → Decomposition → SPEC.md
                                        ↓
                                  Documents in SPEC.md
                                  (no system changes)
```

### When Components Are Created

Components are actually created during **implementation phase**:
1. SPEC.md documents needed components
2. PLAN.md confirms components to scaffold
3. Implementation phase updates `sdd-settings.yaml`
4. Implementation phase scaffolds new components

### General Notes

- This skill is conversational and handles user interaction for adjustments
- Component list is stored in context.md. During spec solicitation, the `spec-solicitation` skill populates the Components section of SPEC.md using discovered components and solicited technical details
- Always validate settings dependencies before accepting the final configuration
- Settings drive what gets scaffolded - they are not just metadata
- For external specs, run ONCE before decomposition (not per-item)
