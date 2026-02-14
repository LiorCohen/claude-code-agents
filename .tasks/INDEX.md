# Tasks Backlog

---

## Planning

(none)

---

## Plan Review

(none)

---

## Implementing

(none)

---

## Reviewing

(none)

---

## Inbox

### High Priority

- [#140](1-inbox/140/): Template-to-code drift detection for scaffolded components
- [#137](1-inbox/137/): Split system CLI commands into internal and public categories
- [#131](1-inbox/131/): Add Ralph Wiggum mode for task implementation
- [#130](1-inbox/130/): Add created_by_plugin_version to sdd-settings components
- [#128](1-inbox/128/): Maintain plugin user stories in product/ folder
- [#114](1-inbox/114/): Use .temp/ for test environments and preserve on failure
- [#109](1-inbox/109/): Ban Claude's built-in memory - causes non-deterministic behavior
- [#67](1-inbox/67/): Store user instructions in plans, specs, and .sdd/
- [#17](1-inbox/17/): Plans should follow TDD with test review first

### Medium Priority

- [#129](1-inbox/129/): Frontend workflow guidelines — step-by-step recipes for common coding tasks
- [#119](1-inbox/119/): Add session hook with blurb and plugin update check
- [#113](1-inbox/113/): Investigate and remove domain dead code across plugin
- [#71](1-inbox/71/): Anti-stop hook to prevent accidental session termination
- [#70](1-inbox/70/): Git checkpoint workflow for AI-assisted development
- [#66](1-inbox/66/): Single context-aware SDD command
- [#56](1-inbox/56/): Create architecture skill with meaningful guidance
- [#16](1-inbox/16/): Plan changes should cascade to dependent items

### Low Priority

- [#86](1-inbox/86/): Consider component-catalog skill for component type definitions
- [#73](1-inbox/73/): User instructions memory for plugin overrides
- [#31](1-inbox/31/): Welcome prompt after plugin installation
- [#26](1-inbox/26/): Better session separators/visual indicators
- [#24](1-inbox/24/): Add plugin Slack support
- [#20](1-inbox/20/): Plugin installation debugging skill + workflow fix
- [#3](1-inbox/3/): Docs missing: CMDO Guide

### Unprioritized

- [#139](1-inbox/139/): Remove component bundles — always ask users to pick components explicitly
- [#138](1-inbox/138/): Separate component discovery from scaffolding in sdd-change new flow
- [#135](1-inbox/135/): Add installation instructions defaulting to user scope
- [#133](1-inbox/133/): Add ESLint to backend scaffolding with allowed-structure enforcement
- [#120](1-inbox/120/): Replace Date with DateTime across codebase
- [#106](1-inbox/106/): Add dependency approval rule to standards - never introduce new libs/tech without explicit user approval
- [#105](1-inbox/105/): Widen permission wildcards to reduce excessive permission prompts
- [#102](1-inbox/102/): sdd-change verify should never mark complete without explicit user authorization
- [#94](1-inbox/94/): local-env is missing settings
- [#80](1-inbox/80/): Plans should become YAML files
- [#76](1-inbox/76/): Git worktrees for parallel spec/plan execution
- [#74](1-inbox/74/): Task performance scoring system
- [#69](1-inbox/69/): Fix sdd-init workflow test timeout
- [#43](1-inbox/43/): CI/CD components and .github folder integration
- [#40](1-inbox/40/): Fix sdd-change-new test - spec format mismatch
- [#39](1-inbox/39/): Capture ad-hoc code changes and sync specs
- [#38](1-inbox/38/): Integration and E2E testing should be separate components
- [#35](1-inbox/35/): Checksumming and drift detection for specs/components
- [#33](1-inbox/33/): Tests are not useful - need better test creation approach
- [#21](1-inbox/21/): Project sanity verification command
- [#12](1-inbox/12/): User onboarding and process state tracking

---

## Complete

- [#134](6-complete/134/): Fix CLI invocation: replace broken CLAUDE_PLUGIN_ROOT pattern, add command validation, fix permissions precondition ✓ (2026-02-14)
- [#136](6-complete/136/): Remove version bump command from system CLI ✓ (2026-02-14)
- [#132](6-complete/132/): Fix critic skill: use datetime-based filenames for .temp output ✓ (2026-02-13)
- [#107](6-complete/107/): Revisit frontend scaffold — add Radix/Shadcn, align with documented stack ✓ (2026-02-13)
- [#127](6-complete/127/): Fix system CLI TypeScript standards violations from audit ✓ (2026-02-13)
- [#126](6-complete/126/): Implement hook system — skill auto-activation and objective Stop checks ✓ (2026-02-12)
- [#125](6-complete/125/): Fix skills standards violations from audit report ✓ (2026-02-12)
- [#124](6-complete/124/): Add critic skill for self-checking at every task lifecycle phase ✓ (2026-02-12)
- [#123](6-complete/123/): Update TypeScript standards with missing patterns and corrections ✓ (2026-02-10)
- [#122](6-complete/122/): Fix TypeScript standards violations in plugin/system ✓ (2026-02-11)
- [#121](6-complete/121/): Fix skills standards violations from audit report ✓ (2026-02-10)
- [#118](6-complete/118/): Upgrade all JSON schemas to latest stable version (2020-12) ✓ (2026-02-12)
- [#117](6-complete/117/): Generic scaffolding engine in system CLI ✓ (2026-02-10)
- [#116](6-complete/116/): Fix system CLI standards violations from audit report ✓ (2026-02-10)
- [#115](6-complete/115/): Create system-cli-standards skill and audit CLI invocation violations ✓ (2026-02-09)
- [#112](6-complete/112/): Add sdd-version command showing project and installed plugin versions ✓ (2026-02-09)
- [#110](6-complete/110/): Add pino logging to plugin/system with .sdd/system-logs output ✓ (2026-02-08)
- [#104](6-complete/104/): sdd-run without arguments should show usage text ✓ (2026-02-08)
- [#100](6-complete/100/): Ensure all sdd-change outputs use markdown with clickable links ✓ (2026-02-08)
- [#99](6-complete/99/): sdd-init should ensure sdd-settings are updated during plugin updates ✓ (2026-02-09)
- [#98](6-complete/98/): Plan templates don't reference standards skills ✓ (2026-02-08)
- [#97](6-complete/97/): Plugin quality issues — multiple bugs and DX problems ✓ (2026-02-07)
- [#96](6-complete/96/): Fix sdd-init Phase 1 — plugin verification first, tool checks via system CLI ✓ (2026-02-07)
- [#95](6-complete/95/): Fix commands standards violations from audit report ✓ (2026-02-08)
- [#93](6-complete/93/): Centralize sdd-settings ownership in project-settings skill ✓ (2026-02-07)
- [#92](6-complete/92/): Merge ci-dev agent into devops agent ✓ (2026-02-07)
- [#90](6-complete/90/): Fix skills standards violations from audit report ✓ (2026-02-07)
- [#89](6-complete/89/): Skills standards audit report ✓ (2026-02-06)
- [#88](6-complete/88/): Remove product-discovery skill ✓ (2026-02-06)
- [#87](6-complete/87/): Reorganize component skills into colocated directory structure ✓ (2026-02-06)
- [#85](6-complete/85/): External spec workflow UX and architecture improvements ✓ (2026-02-05)
- [#82](6-complete/82/): Reorganize archive into .sdd directory ✓ (2026-02-12)
- [#81](6-complete/81/): Redesign sdd-change with external spec workflow ✓ (2026-02-05)
- [#78](6-complete/78/): Minimal sdd-init redesign ✓ (2026-02-02)
- [#77](6-complete/77/): sdd-new-change planning regression - filesystem issues ✓ (2026-02-02)
- [#68](6-complete/68/): Plans should focus on WHAT, not HOW ✓ (2026-02-01)
- [#65](6-complete/65/): Move external spec handling from sdd-init to sdd-new-change ✓ (2026-01-31)
- [#64](6-complete/64/): Refactor planning system architecture ✓ (2026-01-31)
- [#62](6-complete/62/): Unified CLI system ✓ (2026-01-30)
- [#60](6-complete/60/): Standardize TypeScript imports and tsconfig ✓ (2026-01-30)
- [#55](6-complete/55/): Split CHANGELOG.md ✓ (2026-01-29)
- [#51](6-complete/51/): GitHub Actions releases ✓ (2026-01-29)
- [#50](6-complete/50/): Move sdd-settings.yaml to .sdd/ directory ✓ (2026-02-01)
- [#49](6-complete/49/): Auto-commit hook ✓ (2026-01-29)
- [#47](6-complete/47/): Local environment create/start/stop workflow ✓ (2026-02-01)
- [#45](6-complete/45/): Ban mutable operations ✓ (2026-01-28)
- [#44](6-complete/44/): Component settings system + Helm charts ✓ (2026-02-01)
- [#27](6-complete/27/): JSON Schema for skills + validation skill ✓ (2026-02-06)
- [#19](6-complete/19/): Task management skill ✓ (2026-01-28)
- [#18](6-complete/18/): Commit standards skill ✓ (2026-01-29)
- [#11](6-complete/11/): Missing deeper config integration ✓ (2026-01-30)
- [#9](6-complete/9/): Ready-to-work components ✓ (2026-01-28)
- [#7](6-complete/7/): External spec handling ✓ (2026-01-28)
- [#4](6-complete/4/): Permission prompts ✓ (2026-01-28)
- [#2](6-complete/2/): npm run scripts ✓ (2026-01-28)

---

## Rejected

- [#103](7-rejected/103/): Validate sdd-settings writes against schema — obsolete, implemented via reconciliation system
- [#91](7-rejected/91/): Fix agents standards violations from audit report — obsolete
- [#84](7-rejected/84/): Apply zero session context to sdd-init workflow — obsolete, superseded by #81 and #85
- [#83](7-rejected/83/): Apply zero session context to sdd-implement workflow — obsolete, superseded by #81 and #85
- [#72](7-rejected/72/): Fix broken test benchmarks — obsolete
- [#63](7-rejected/63/): Consolidate overlapping skills — addressed by #87, #88, #89
- [#59](7-rejected/59/): Audit and update all agents for compatibility — obsolete, audit completed, findings in #91
- [#54](7-rejected/54/): Missing postgresql-standards skill — already exists at components/database/postgresql/
- [#52](7-rejected/52/): Clean up .gitkeep and placeholder content — obsolete with on-demand scaffolding (#78)
- [#23](7-rejected/23/): Autocomplete for SDD command arguments — feature not supported by Claude Code
- [#22](7-rejected/22/): Add critic agent to marketplace — obsolete, critic skill already exists
- [#14](7-rejected/14/): Unclear when to run type generation — obsolete with workflow gating (v6.1.0)

---

## Consolidated

- [#79](8-consolidated/79/) → #138
- [#111](8-consolidated/111/) → #114
- [#108](8-consolidated/108/) → #120
- [#101](8-consolidated/101/) → #100
- [#61](8-consolidated/61/) → #62
- [#58](8-consolidated/58/) → #62
- [#57](8-consolidated/57/) → #44
- [#53](8-consolidated/53/) → #44
- [#48](8-consolidated/48/) → #87
- [#46](8-consolidated/46/) → #44
- [#42](8-consolidated/42/) → #9
- [#41](8-consolidated/41/) → #65
- [#37](8-consolidated/37/) → #16
- [#36](8-consolidated/36/) → #35
- [#34](8-consolidated/34/) → #59
- [#32](8-consolidated/32/) → #26
- [#30](8-consolidated/30/) → #64
- [#29](8-consolidated/29/) → #10
- [#28](8-consolidated/28/) → #27
- [#25](8-consolidated/25/) → #64
- [#15](8-consolidated/15/) → #64
- [#13](8-consolidated/13/) → #12
- [#10](8-consolidated/10/) → #66
- [#8](8-consolidated/8/) → #6
- [#6](8-consolidated/6/) → #7
- [#5](8-consolidated/5/) → #7
- [#1](8-consolidated/1/) → #9
