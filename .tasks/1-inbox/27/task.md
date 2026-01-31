---
id: 27
title: JSON Schema for skills + validation skill
priority: medium
status: open
created: 2026-01-25
---

# Task 27: JSON Schema for skills + validation skill

## Description

Skills currently use YAML examples for inputs/outputs. Need:
- Proper JSON Schema definitions for type safety and clear contracts
- A marketplace skill that "typechecks" plugin artifacts (skills, commands, agents)
- Detect schema mismatches and report them

## Related

- Merged: #28 (Schema validation skill for marketplace)
