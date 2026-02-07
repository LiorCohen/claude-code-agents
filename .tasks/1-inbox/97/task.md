---
id: 97
title: Plugin quality issues — multiple bugs and DX problems
priority: high
status: open
created: 2026-02-07
depends_on: []
blocks: []
---

# Task 97: Plugin quality issues — multiple bugs and DX problems

## Description

Multiple issues found during real usage of the plugin. These need investigation and fixes.

## Issues

1. **Root package.json not created when components exist** — Regression. The root `package.json` should be created as soon as there are any components aside from the initial config. Currently it is missing even when components are scaffolded.

2. **specs/index.md has "external specifications" section** — This section should not exist in `specs/index.md`.

3. **Verification doesn't use standards** — The verification workflow does not use our standards to ensure implementation meets expectations.

4. **sdd-change workflows use the external spec** — After the external spec is archived, `sdd-change` workflows should never reference it again. Currently they still do.

5. **Webapps have too many root config files** — Need to find a way to reduce the number of root config files for webapp projects.

6. **Agents are ignoring skills** — Agents appear to completely ignore our skills when they should be referencing and using them.

## Acceptance Criteria

- [ ] Root `package.json` is created when first non-config component is scaffolded
- [ ] `specs/index.md` does not contain an "external specifications" section
- [ ] Verification workflow uses project standards
- [ ] `sdd-change` workflows never reference archived external spec
- [ ] Webapp root config file count is reduced
- [ ] Agents properly reference and use skills
