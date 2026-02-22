---
id: 158
title: Split plugin into core/ and fullstack-typescript/ subdirectories
status: inbox
created: 2026-02-22 12:00 UTC
depends_on: []
blocks: []
---

# Task 158: Split plugin into core/ and fullstack-typescript/ subdirectories

## Description

Split the plugin directory into two subdirectories that separate the SDD methodology from the tech stack implementation:

- `plugin/core/` — Core SDD methodology (tech-agnostic)
- `plugin/fullstack-typescript/` — Fullstack TypeScript tech pack (Node.js, React, PostgreSQL, Helm, etc.)

This supersedes the rejected #157 approach with a simpler directory-based split within the plugin.
