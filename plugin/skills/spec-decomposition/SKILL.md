---
name: spec-decomposition
description: Analyze specifications and decompose into independent changes.
user-invocable: false
---

# Spec Decomposition Skill

## Purpose

Analyze a specification document to identify natural change boundaries and return a structured decomposition result. This is a pure analysis skill that takes input and returns output without user interaction.

## Input

Schema: [`schemas/input.schema.json`](./schemas/input.schema.json)

Accepts decomposition mode, spec content, and mode-specific parameters for outline, section, or hierarchical decomposition.

## Output

Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)

Returns mode-specific results: outline sections, or hierarchical epic/feature groupings with dependency graph.

## Resource Files

For detailed guidance, read these on-demand:
- [outline-modes.md](resources/outline-modes.md) — Outline, section, hierarchical mode documentation with examples
- [decomposition-algorithm.md](resources/decomposition-algorithm.md) — 5-phase algorithm, formulas, heuristics
- [data-structures.md](resources/data-structures.md) — DecomposedChange, DecompositionResult schemas, special cases

## Quick Reference

**Modes:** outline (extract headers), section (analyze one section), hierarchical (epics + features), default (full analysis)

**Algorithm phases:** Structure Extraction -> Boundary Detection -> Dependency Detection -> Independence Scoring -> Refinement

**Complexity levels:** SMALL (<= 3 ACs), MEDIUM (4-8 ACs), LARGE (> 8 ACs), EPIC (> 10 ACs + 3+ components)

**Independence score:** 0.0-1.0 scale; >= 0.5 is standalone, < 0.3 should be merged
