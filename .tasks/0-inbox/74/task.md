---
id: 74
title: Task performance scoring system
status: inbox
created: 2026-02-02 12:08 UTC
depends_on: []
blocks: []
---

# Task 74: Task performance scoring system

## Description

Add a scoring mechanism to evaluate task/ticket session performance. The system should calculate a weighted score based on multiple criteria, similar to the PPM ticket evaluation system.

## Scoring Criteria

### 1. Spec Stability (25% weight)
How stable were the requirements throughout the session?
- **100**: No changes to original spec
- **75**: Minor clarifications only
- **50**: Moderate scope adjustments
- **25**: Significant spec rewrites
- **0**: Complete pivot from original requirements

### 2. First-Attempt Accuracy (25% weight)
Did the agent understand and execute correctly on first attempt?
- **100**: Correct approach from the start
- **75**: Minor corrections needed
- **50**: Moderate rework required
- **25**: Significant misunderstanding initially
- **0**: Completely wrong approach

### 3. Implementation Quality (25% weight)
How well does the implementation meet the spec?
- **100**: Exceeds spec requirements
- **75**: Fully meets spec
- **50**: Meets most requirements
- **25**: Partial implementation
- **0**: Does not meet requirements

### 4. Session Efficiency (25% weight)
How efficiently was the task completed?
- **100**: Optimal path, no wasted effort
- **75**: Minor inefficiencies
- **50**: Some backtracking or rework
- **25**: Significant wasted effort
- **0**: Excessive iterations/rework

## Calculation

Final score = (Spec Stability × 0.25) + (First-Attempt × 0.25) + (Quality × 0.25) + (Efficiency × 0.25)

## Acceptance Criteria

- [ ] Define scoring schema (criteria, weights, rubrics)
- [ ] Add scoring fields to task schema
- [ ] Create scoring skill or command to evaluate completed tasks
- [ ] Store scores in task metadata
- [ ] Display scores in task completion report
- [ ] Optional: Aggregate scores for velocity/quality metrics
