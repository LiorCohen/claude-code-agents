---
id: 16
title: Plan changes should cascade to dependent items
priority: inbox
status: open
created: 2026-01-25
---

# Task 16: Plan changes should cascade to dependent items

## Description

After `sdd-init` generates a plan, changes to one part may affect other parts - especially when reviewing/implementing the first change. The system should:
- Recognize when a change impacts downstream plan items
- Prompt for or automatically update affected specs/plans
- Maintain consistency across the entire plan when early items are modified
