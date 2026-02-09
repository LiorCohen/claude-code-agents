# Tasks Backlog

---

## Planning

- [#67](2-planning/67/plan.md): Store user instructions in plans, specs, and .sdd/
- [#103](2-planning/103/plan.md): Validate sdd-settings writes against schema during sdd-change workflows

---

## Ready

(none)

---

## Implementing

(none)

---

## Reviewing

- [#99](5-reviewing/99/changes.md): sdd-init should ensure sdd-settings are updated during plugin updates

---

## High Priority
- [#114](1-inbox/114/): Use .temp/ for test environments and preserve on failure
- [#111](1-inbox/111/): Fix test suite creating .sdd/ artifacts in source directories
- [#109](1-inbox/109/): Ban Claude's built-in memory - causes non-deterministic behavior
- [#17](1-inbox/17/): Plans should follow TDD with test review first
- [#91](1-inbox/91/): Fix agents standards violations from audit report

---

## Medium Priority

- [#113](1-inbox/113/): Investigate and remove domain dead code across plugin
- [#86](1-inbox/86/): Consider component-catalog skill for component type definitions
- [#82](1-inbox/82/): Reorganize archive into .sdd directory
- [#79](1-inbox/79/): Use project-name-derived component names in on-demand scaffolding
- [#70](1-inbox/70/): Git checkpoint workflow for AI-assisted development
- [#71](1-inbox/71/): Anti-stop hook to prevent accidental session termination
- [#16](1-inbox/16/): Plan changes should cascade to dependent items
- [#56](1-inbox/56/): Create architecture skill with meaningful guidance
- [#66](1-inbox/66/): Single context-aware SDD command

---

## Low Priority

- [#73](1-inbox/73/): User instructions memory for plugin overrides
- [#3](1-inbox/3/): Docs missing: CMDO Guide
- [#24](1-inbox/24/): Add plugin Slack support
- [#31](1-inbox/31/): Welcome prompt after plugin installation
- [#22](1-inbox/22/): Add critic agent to marketplace
- [#26](1-inbox/26/): Better session separators/visual indicators
- [#20](1-inbox/20/): Plugin installation debugging skill + workflow fix

---

## Inbox (unprioritized)

- [#108](1-inbox/108/): Plans created using sdd-change should include timestamps in implementation status
- [#107](1-inbox/107/): Add Radix and Shadcn as part of frontend standards and scaffolding
- [#106](1-inbox/106/): Add dependency approval rule to standards - never introduce new libs/tech without explicit user approval
- [#105](1-inbox/105/): Widen permission wildcards to reduce excessive permission prompts
- [#102](1-inbox/102/): sdd-change verify should never mark complete without explicit user authorization
- [#94](1-inbox/94/): local-env is missing settings
- [#80](1-inbox/80/): Plans should become YAML files
- [#76](1-inbox/76/): Git worktrees for parallel spec/plan execution
- [#74](1-inbox/74/): Task performance scoring system
- [#72](1-inbox/72/): Fix broken test benchmarks
- [#69](1-inbox/69/): Fix sdd-init workflow test timeout
- [#12](1-inbox/12/): User onboarding and process state tracking
- [#21](1-inbox/21/): Project sanity verification command
- [#33](1-inbox/33/): Tests are not useful - need better test creation approach
- [#35](1-inbox/35/): Checksumming and drift detection for specs/components
- [#38](1-inbox/38/): Integration and E2E testing should be separate components
- [#39](1-inbox/39/): Capture ad-hoc code changes and sync specs
- [#40](1-inbox/40/): Fix sdd-change-new test - spec format mismatch
- [#43](1-inbox/43/): CI/CD components and .github folder integration

---

## Complete

- [#112](6-complete/112/): Add sdd-version command showing project and installed plugin versions ✓ (2026-02-09)
- [#110](6-complete/110/): Add pino logging to plugin/system with .sdd/system-logs output ✓ (2026-02-08)
- [#104](6-complete/104/): sdd-run without arguments should show usage text ✓ (2026-02-08)
- [#95](6-complete/95/): Fix commands standards violations from audit report ✓ (2026-02-08)
- [#100](6-complete/100/): Ensure all sdd-change outputs use markdown with clickable links ✓ (2026-02-08)
- [#98](6-complete/98/): Plan templates don't reference standards skills ✓ (2026-02-08)
- [#97](6-complete/97/): Plugin quality issues — multiple bugs and DX problems ✓ (2026-02-07)
- [#96](6-complete/96/): Fix sdd-init Phase 1 — plugin verification first, tool checks via system CLI ✓ (2026-02-07)
- [#93](6-complete/93/): Centralize sdd-settings ownership in project-settings skill ✓ (2026-02-07)
- [#92](6-complete/92/): Merge ci-dev agent into devops agent ✓ (2026-02-07)
- [#90](6-complete/90/): Fix skills standards violations from audit report ✓ (2026-02-07)
- [#27](6-complete/27/): JSON Schema for skills + validation skill ✓ (2026-02-06)
- [#89](6-complete/89/): Skills standards audit report ✓ (2026-02-06)
- [#88](6-complete/88/): Remove product-discovery skill ✓ (2026-02-06)
- [#87](6-complete/87/): Reorganize component skills into colocated directory structure ✓ (2026-02-06)
- [#85](6-complete/85/): External spec workflow UX and architecture improvements ✓ (2026-02-05)
- [#81](6-complete/81/): Redesign sdd-change with external spec workflow ✓ (2026-02-05)
- [#78](6-complete/78/): Minimal sdd-init redesign ✓ (2026-02-02)
- [#77](6-complete/77/): sdd-new-change planning regression - filesystem issues ✓ (2026-02-02)
- [#68](6-complete/68/): Plans should focus on WHAT, not HOW ✓ (2026-02-01)
- [#47](6-complete/47/): Local environment create/start/stop workflow ✓ (2026-02-01)
- [#44](6-complete/44/): Component settings system + Helm charts ✓ (2026-02-01)
- [#50](6-complete/50/): Move sdd-settings.yaml to .sdd/ directory ✓ (2026-02-01)
- [#64](6-complete/64/): Refactor planning system architecture ✓ (2026-01-31)
- [#65](6-complete/65/): Move external spec handling from sdd-init to sdd-new-change ✓ (2026-01-31)
- [#11](6-complete/11/): Missing deeper config integration ✓ (2026-01-30)
- [#60](6-complete/60/): Standardize TypeScript imports and tsconfig ✓ (2026-01-30)
- [#62](6-complete/62/): Unified CLI system ✓ (2026-01-30)
- [#49](6-complete/49/): Auto-commit hook ✓ (2026-01-29)
- [#18](6-complete/18/): Commit standards skill ✓ (2026-01-29)
- [#55](6-complete/55/): Split CHANGELOG.md ✓ (2026-01-29)
- [#51](6-complete/51/): GitHub Actions releases ✓ (2026-01-29)
- [#45](6-complete/45/): Ban mutable operations ✓ (2026-01-28)
- [#9](6-complete/9/): Ready-to-work components ✓ (2026-01-28)
- [#19](6-complete/19/): Task management skill ✓ (2026-01-28)
- [#7](6-complete/7/): External spec handling ✓ (2026-01-28)
- [#2](6-complete/2/): npm run scripts ✓ (2026-01-28)
- [#4](6-complete/4/): Permission prompts ✓ (2026-01-28)

---

## Rejected

- [#23](7-rejected/23/): Autocomplete for SDD command arguments — feature not supported by Claude Code
- [#14](7-rejected/14/): Unclear when to run type generation — obsolete with workflow gating (v6.1.0)
- [#52](7-rejected/52/): Clean up .gitkeep and placeholder content — obsolete with on-demand scaffolding (#78)
- [#54](7-rejected/54/): Missing postgresql-standards skill — already exists at components/database/postgresql/
- [#63](7-rejected/63/): Consolidate overlapping skills — addressed by #87, #88, #89
- [#83](7-rejected/83/): Apply zero session context to sdd-implement workflow — obsolete, superseded by #81 and #85
- [#84](7-rejected/84/): Apply zero session context to sdd-init workflow — obsolete, superseded by #81 and #85
- [#59](7-rejected/59/): Audit and update all agents for compatibility — obsolete, audit completed, findings in #91

---

## Consolidated

- [#1](8-consolidated/1/) → #9
- [#5](8-consolidated/5/) → #7
- [#6](8-consolidated/6/) → #7
- [#8](8-consolidated/8/) → #6
- [#15](8-consolidated/15/) → #64
- [#25](8-consolidated/25/) → #64
- [#28](8-consolidated/28/) → #27
- [#29](8-consolidated/29/) → #10
- [#30](8-consolidated/30/) → #64
- [#32](8-consolidated/32/) → #26
- [#34](8-consolidated/34/) → #59
- [#36](8-consolidated/36/) → #35
- [#37](8-consolidated/37/) → #16
- [#41](8-consolidated/41/) → #65
- [#42](8-consolidated/42/) → #9
- [#46](8-consolidated/46/) → #44
- [#53](8-consolidated/53/) → #44
- [#58](8-consolidated/58/) → #62
- [#61](8-consolidated/61/) → #62
- [#13](8-consolidated/13/) → #12
- [#48](8-consolidated/48/) → #87
- [#57](8-consolidated/57/) → #44
- [#101](8-consolidated/101/) → #100
- [#10](8-consolidated/10/) → #66
