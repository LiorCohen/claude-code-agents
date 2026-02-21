# SDD-Core / Tech Pack Integration Points

## 1. Registration (one-time, during init)

![Registration sequence](diagrams/01-registration.svg)

<details>
<summary>D2 source</summary>

[diagrams/01-registration.d2](diagrams/01-registration.d2)
</details>

## 2. CLI Delegation (every tech pack CLI call)

![CLI delegation sequence](diagrams/02-cli-delegation.svg)

<details>
<summary>D2 source</summary>

[diagrams/02-cli-delegation.d2](diagrams/02-cli-delegation.d2)
</details>

## 3. Settings Namespace (ongoing read/write)

![Settings namespace](diagrams/03-settings-namespace.svg)

<details>
<summary>D2 source</summary>

[diagrams/03-settings-namespace.d2](diagrams/03-settings-namespace.d2)
</details>

## 4. Settings Validation (during reconcile)

![Settings validation sequence](diagrams/04-settings-validation.svg)

<details>
<summary>D2 source</summary>

[diagrams/04-settings-validation.d2](diagrams/04-settings-validation.d2)
</details>

## 5. Project Scaffolding (during init)

![Project scaffolding sequence](diagrams/05-scaffolding.svg)

<details>
<summary>D2 source</summary>

[diagrams/05-scaffolding.d2](diagrams/05-scaffolding.d2)
</details>

## 6. Skill/Agent Discovery (LLM context, at prompt time)

![Skill/agent discovery](diagrams/06-skill-discovery.svg)

<details>
<summary>D2 source</summary>

[diagrams/06-skill-discovery.d2](diagrams/06-skill-discovery.d2)
</details>

## 7. Hook Integration (file write validation)

![Hook integration sequence](diagrams/07-hooks.svg)

<details>
<summary>D2 source</summary>

[diagrams/07-hooks.d2](diagrams/07-hooks.d2)
</details>

## 8. CLAUDE.md Generation (during init)

![CLAUDE.md generation sequence](diagrams/08-claudemd-gen.svg)

<details>
<summary>D2 source</summary>

[diagrams/08-claudemd-gen.d2](diagrams/08-claudemd-gen.d2)
</details>

## Integration Summary

![Integration summary](diagrams/09-integration-summary.svg)

<details>
<summary>D2 source</summary>

[diagrams/09-integration-summary.d2](diagrams/09-integration-summary.d2)
</details>

All 8 integration points flow through **`tech-pack.yaml`** as the single contract file between sdd-core and any tech pack. Integration point 6 (skill/agent discovery) is the exception — it's implicit through Claude Code loading both plugins into the same LLM context.
