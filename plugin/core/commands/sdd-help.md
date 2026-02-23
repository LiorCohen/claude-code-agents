---
name: sdd-help
description: SDD tutor — teaches concepts, methodology, and guides discovery of what's possible.
---

# /sdd-help

A teaching-focused command for learning SDD. Addresses unknown unknowns — helps you discover what's possible before you know what to ask.

**This command is read-only.** It teaches and demonstrates but never executes actions or modifies project state. For doing work, it refers you to `/sdd`.

---

## What is SDD?

**Spec-Driven Development** is a methodology where every code change starts with a specification. The spec captures what you're building and why before any code is written. This prevents the most common development failure mode: building the wrong thing.

The core principle: **specs before code, always.**

### Why Specs Before Code?

1. **Alignment** — A spec forces you to articulate what you're building. Misunderstandings surface during spec review, not after implementation.
2. **Scope control** — The spec defines boundaries. Without it, features creep and timelines slip.
3. **Reviewability** — Stakeholders can review a spec without reading code. This enables non-technical approval of technical work.
4. **Traceability** — Every line of code traces back to a spec requirement. Nothing exists "just because."

### The Change Lifecycle

Every change in SDD follows this lifecycle:

    Create → Spec → Review → Plan → Review → Implement → Verify → Complete

Each phase has a gate — you can't skip ahead. This feels slow at first but prevents expensive rework.

**Phases explained:**

1. **Create** — You describe what you want to build. SDD asks questions to understand the full scope.
2. **Spec** — Requirements are gathered interactively and written into a SPEC.md file.
3. **Spec Review** — You review the spec. Are the requirements correct? Anything missing?
4. **Plan** — An implementation plan (PLAN.md) is generated from the approved spec.
5. **Plan Review** — You review the plan. Does the technical approach make sense?
6. **Implement** — Code is written phase by phase, following the plan.
7. **Verify** — The implementation is checked against every acceptance criterion in the spec.
8. **Complete** — All checks pass. The change is done.

---

## Capability Discovery

### What Can SDD Do For Me?

SDD manages the full development lifecycle for your project:

**Build features and fix bugs:**
Tell `/sdd` what you want to build. It guides you through specifying requirements, planning the implementation, and building it — with verification at every step.

    Try: /sdd I want to create a new feature

**Import external specifications:**
Have a product spec, PRD, or requirements doc? SDD can import it, break it into manageable changes, and guide you through implementing each one.

    Try: /sdd I want to import an external spec

**Tech-pack-specific capabilities:**
Active tech packs extend SDD with additional commands for infrastructure, configuration, databases, and more. To discover what's available:

```yaml
INVOKE techpacks.loadSkill with:
  namespace: <tech-pack-namespace>
  skill: "help-content"
```

The tech pack's help content describes its specific commands and capabilities.

---

## Core Concepts

### Specs

A **spec** (SPEC.md) is the single source of truth for what a change does. It contains:
- **Problem statement** — what's wrong or missing
- **Requirements** — what must be true when this is done
- **Acceptance criteria** — how to verify each requirement
- **Domain updates** — glossary terms, entity definitions
- **Open questions** — things that need answers before implementation

Specs are created interactively. SDD asks you questions and builds the spec from your answers.

### Plans

A **plan** (PLAN.md) is the implementation strategy for an approved spec. It contains:
- **Phases** — ordered steps, each assigned to a specialist agent
- **Files to modify** — what will change in the codebase
- **Dependencies** — which phases must complete before others start

Plans are generated automatically from the spec. You review and approve them before implementation begins.

### Workflows

A **workflow** tracks the state of one or more related changes. It persists to disk (`sdd/workflows/`) so you can resume at any point — even in a new session. Workflows support:
- Multiple changes with dependencies between them
- Phase gating (can't implement until plan is approved)
- Regression (go back to an earlier phase if needed)

### Component Settings

SDD projects are organized into **components** whose types are defined by the active tech pack. Each component has **settings** that control scaffolding, configuration, and deployment. Settings live in `sdd/sdd-settings.yaml`.

### Changes

A **change** is the unit of work in SDD. It has a unique ID derived from the workflow name (e.g., `user-auth-1`), a type (feature, bugfix, refactor, epic), and progresses through the lifecycle phases.

---

## Guided Walkthrough

### Your First Feature

Here's exactly what happens when you build your first feature with SDD:

**Step 1: Start**

    /sdd I want to create a new feature

SDD asks for a name and type, then starts gathering requirements.

**Step 2: Answer Questions**

SDD asks targeted questions about what you're building:
- What problem does this solve?
- Who is the primary user?
- What are the key requirements?
- What are the acceptance criteria?

Your answers become the spec.

**Step 3: Review the Spec**

SDD presents the complete SPEC.md for your review. Read through it — are the requirements right? Anything missing?

    /sdd I want to approve the spec

**Step 4: Review the Plan**

SDD generates an implementation plan from your approved spec. Review the phases, file changes, and agent assignments.

    /sdd I want to approve the plan

**Step 5: Implement**

SDD implements the plan phase by phase, creating checkpoint commits along the way.

    /sdd I want to start implementing

**Step 6: Verify**

SDD checks the implementation against every acceptance criterion in your spec.

    /sdd I want to verify the implementation

That's it. Your feature is built, verified, and traceable back to the original requirements.

### Working with External Specs

If you have an existing requirements document:

    /sdd I want to import an external spec

SDD reads the document, classifies the requirements, identifies gaps (missing edge cases, NFRs), asks clarifying questions, then decomposes it into manageable changes with a dependency graph.

### Resuming Work

SDD persists all state. If you close your session and come back:

    /sdd

It reads your project context — git branch, workflow state — and tells you exactly where you left off and what to do next.

---

## Progressive Disclosure

### Getting Started (Simple)

Start here. You only need to know:
1. `/sdd I want to create a new feature` — to start building
2. `/sdd` — to see what's next
3. Answer the questions SDD asks

That's enough to be productive.

### Intermediate

Once comfortable with the basic flow:
- **External specs** — import existing requirements docs
- **Configuration** — manage environment-specific config
- **Open questions** — answer or assume to unblock spec approval
- **Regression** — go back to an earlier phase if requirements change

### Advanced

For power users:
- **Component settings** — fine-tune scaffolding and deployment options
- **Local environments** — full development stack on your machine
- **Direct operations** — power users discover explicit system commands naturally through `/sdd`'s cross-references
- **Multi-change workflows** — decompose large specs into dependent changes

---

## FAQ

**Q: Do I always need a spec?**
A: Yes. Even small changes benefit from a spec — it takes 2 minutes and prevents building the wrong thing. The spec can be minimal for small changes.

**Q: What if requirements change mid-implementation?**
A: Use regression. Tell `/sdd` you want to go back to the spec phase, update the spec, re-approve, re-plan, and continue.

**Q: Can I use SDD for existing projects?**
A: Yes. Run `/sdd I want to initialize a new project` in your existing directory. SDD detects what's already there and only adds what's missing.

**Q: What languages/frameworks does SDD support?**
A: The SDD methodology is stack-agnostic. Tech packs provide stack-specific scaffolding, agents, and standards. The active tech pack determines which component types, languages, and frameworks are available.
