# SDD-Core / Tech Pack Integration Points

## 1. Registration (one-time, during init)

```mermaid
sequenceDiagram
    participant User
    participant Core as sdd-core<br/>init-orchestration
    participant FS as File System
    participant TP as tech-pack.yaml

    User->>Core: /sdd init
    Core->>FS: scan .claude/plugins/ for<br/>directories with tech-pack.yaml
    FS-->>Core: found: sdd-fullstack-ts/
    Core->>TP: read tech-pack.yaml
    TP-->>Core: name: fullstack-ts<br/>version: 1.0.0<br/>requires_sdd_core: ">=8.0.0"
    Core->>Core: validate version compatibility
    Core->>FS: write .sdd/tech-packs.yaml
    Note over FS: tech_packs:<br/>  - name: fullstack-ts<br/>    version: 1.0.0<br/>    manifest: .claude/plugins/...
    Core->>FS: write .sdd/sdd-settings.yaml
    Note over FS: tech_packs:<br/>  fullstack-ts:<br/>    components: []
    Core-->>User: registered tech pack: fullstack-ts
```

## 2. CLI Delegation (every tech pack CLI call)

```mermaid
sequenceDiagram
    participant User
    participant Core as sdd-core CLI
    participant FS as .sdd/tech-packs.yaml
    participant TP as tech-pack.yaml
    participant TPCLI as Tech Pack CLI

    User->>Core: sdd-system fullstack-ts database setup my-db
    Core->>Core: parse arg[0]: "fullstack-ts"<br/>not a core namespace
    Core->>FS: read .sdd/tech-packs.yaml
    FS-->>Core: manifest: .claude/plugins/<br/>sdd-fullstack-ts/tech-pack.yaml
    Core->>TP: read tech-pack.yaml
    TP-->>Core: requires_sdd_core: ">=8.0.0"<br/>cli_entry_point: system/dist/cli.js
    Core->>Core: version check: 8.0.0 >= 8.0.0 ✓
    Core->>TPCLI: spawn subprocess<br/>node system/dist/cli.js database setup my-db
    TPCLI->>TPCLI: parse: group=database<br/>action=setup, args=[my-db]
    TPCLI->>TPCLI: execute handler
    TPCLI-->>Core: exit code 0
    Core-->>User: forward output + exit code
```

## 3. Settings Namespace (ongoing read/write)

```mermaid
graph TB
    subgraph ".sdd/sdd-settings.yaml"
        subgraph core_envelope["Core Envelope (owned by sdd-core)"]
            sdd["sdd:<br/>  initialized_by: 8.0.0<br/>  updated_by: 8.0.0"]
            project["project:<br/>  name: my-app"]
            system["system:<br/>  logging: { enabled: true }"]
        end
        subgraph tp_ns["tech_packs (namespaced)"]
            subgraph fts["fullstack-ts:"]
                fts_comp["components:<br/>  - name: main-server<br/>    type: server<br/>    settings: { server_type: api }<br/>  - name: app-db<br/>    type: database<br/>    settings: { provider: postgresql }"]
            end
            subgraph pyapi["python-api:"]
                py_comp["components:<br/>  - name: ml-service<br/>    type: server<br/>    settings: { framework: fastapi }"]
            end
        end
    end

    core_read["sdd-core<br/>reads/writes"] -->|owns| core_envelope
    fts_read["sdd-fullstack-ts<br/>reads/writes"] -->|owns| fts
    py_read["sdd-python-api<br/>reads/writes"] -->|owns| pyapi

    style core_envelope fill:#e1f5fe
    style fts fill:#fff3e0
    style pyapi fill:#f3e5f5
```

## 4. Settings Validation (during reconcile)

```mermaid
sequenceDiagram
    participant User
    participant Core as sdd-core CLI
    participant Settings as sdd-settings.yaml
    participant TP as tech-pack.yaml
    participant Schema as schemas/*.json

    User->>Core: sdd-system settings reconcile
    Core->>Settings: read sdd-settings.yaml
    Core->>Core: validate core envelope<br/>(sdd, project, system)

    loop for each tech_packs.<name>
        Core->>TP: read tech-pack.yaml<br/>(follow manifest pointer)
        TP-->>Core: component_types:<br/>  server: { settings_schema: ./schemas/server.json }

        loop for each component
            Core->>Schema: load JSON schema<br/>for component type
            Schema-->>Core: server-settings.json
            Core->>Core: validate component.settings<br/>against schema
        end
    end

    alt all valid
        Core-->>User: settings valid
    else validation errors
        Core-->>User: errors scoped to<br/>"fullstack-ts.main-server:<br/>missing required field 'server_type'"
    end
```

## 5. Project Scaffolding (during init)

```mermaid
sequenceDiagram
    participant User
    participant Core as sdd-core<br/>scaffolding engine
    participant TP as tech-pack.yaml
    participant Templates as Tech Pack<br/>templates/
    participant FS as User Project

    User->>Core: /sdd init (with components configured)

    Note over Core: Create core structure
    Core->>FS: specs/, changes/, .sdd/
    Core->>FS: CLAUDE.md, README.md, package.json

    Core->>TP: read tech-pack.yaml
    TP-->>Core: component_types with<br/>scaffolding_skill, scripts, description

    loop for each component in settings
        Core->>Core: resolve component type<br/>→ scaffolding_skill
        Core->>Templates: read template directory<br/>(e.g., backend-scaffolding/templates/)
        Templates-->>Core: template files
        Core->>Core: executeSpec(): variable substitution,<br/>copy files, apply conditions
        Core->>FS: write component directory<br/>(e.g., components/servers/main-server/)
    end

    Core->>TP: read scripts for each component type
    Core->>FS: merge scripts into package.json

    Core->>TP: read descriptions for each component type
    Core->>FS: generate specs/architecture/overview.md
    Core-->>User: scaffolding complete
```

## 6. Skill/Agent Discovery (LLM context, at prompt time)

```mermaid
graph TB
    subgraph claude_code["Claude Code Runtime"]
        context["LLM Context Window"]
    end

    subgraph sdd_core["sdd-core plugin"]
        core_skills["Core Skills<br/>spec-writing<br/>planning<br/>change-orchestration<br/>component-discovery<br/>workflow-state"]
        core_cmds["Commands<br/>/sdd<br/>/sdd-run<br/>/sdd-help"]
    end

    subgraph tech_pack["sdd-fullstack-ts plugin"]
        tp_skills["Tech Pack Skills<br/>backend-standards<br/>backend-scaffolding<br/>frontend-standards<br/>frontend-scaffolding<br/>database-standards<br/>contract-standards"]
        tp_agents["Agents<br/>backend-dev<br/>frontend-dev<br/>api-designer<br/>db-advisor<br/>devops<br/>tester"]
        tp_manifest["tech-pack.yaml<br/>(readable by core skills)"]
    end

    core_skills -->|"loaded into"| context
    core_cmds -->|"loaded into"| context
    tp_skills -->|"loaded into"| context
    tp_agents -->|"loaded into"| context

    context -->|"LLM connects by convention:<br/>planning references scaffolding skills<br/>orchestration delegates to agents<br/>discovery reads tech-pack.yaml"| context

    style claude_code fill:#f5f5f5
    style sdd_core fill:#e1f5fe
    style tech_pack fill:#fff3e0
```

## 7. Hook Integration (file write validation)

```mermaid
sequenceDiagram
    participant CC as Claude Code
    participant Hook as sdd-core<br/>validate-write hook
    participant TP as tech-pack.yaml
    participant Rules as Write Rules

    CC->>Hook: PreToolUse: Write file<br/>path: components/servers/main-server/src/index.ts

    Hook->>Rules: check core rules
    Note over Rules: always allow: specs/*, changes/*<br/>always block: .sdd/sdd-settings.yaml (direct edit)

    Hook->>TP: read tech-pack.yaml<br/>(via .sdd/tech-packs.yaml pointer)
    TP-->>Hook: component_types with paths

    Hook->>Hook: check if path falls under<br/>a registered component directory

    alt path matches component
        Hook-->>CC: ALLOW (component file)
    else path is core-protected
        Hook-->>CC: BLOCK (protected file)
    else unknown path
        Hook-->>CC: ALLOW (not managed by SDD)
    end
```

## 8. CLAUDE.md Generation (during init)

```mermaid
sequenceDiagram
    participant Core as sdd-core<br/>scaffolding
    participant TP as tech-pack.yaml
    participant FS as User Project<br/>CLAUDE.md

    Core->>Core: generate core sections
    Note over Core: - SDD workflow instructions<br/>- Spec conventions<br/>- Directory structure<br/>- Core CLI commands

    Core->>TP: read tech-pack.yaml
    TP-->>Core: component_types, cli_actions

    Core->>Core: generate tech pack sections
    Note over Core: - Available component types + descriptions<br/>- Available agents + roles<br/>- Tech pack CLI commands<br/>  "sdd-system fullstack-ts ..."<br/>- Standards skills to reference

    Core->>FS: write CLAUDE.md
    Note over FS: Combined core +<br/>tech pack instructions
```

## Integration Summary

```mermaid
graph LR
    subgraph core["sdd-core"]
        init["Init Orchestrator"]
        cli["CLI Router"]
        scaffold["Scaffolding Engine"]
        settings["Settings Engine"]
        hooks["Hook Runner"]
        prompts["Core Skills/Commands"]
        schema["tech-pack.schema.json"]
    end

    subgraph contract["Contract Layer"]
        tpy["tech-pack.yaml"]
        tpyaml[".sdd/tech-packs.yaml"]
        sdds[".sdd/sdd-settings.yaml"]
    end

    subgraph tp["Tech Pack"]
        tp_cli["Tech Pack CLI"]
        tp_skills["Skills + Agents"]
        tp_templates["Templates"]
        tp_schemas["Settings Schemas"]
    end

    init -->|"1. reads"| tpy
    init -->|"1. writes"| tpyaml
    init -->|"1. writes"| sdds
    cli -->|"2. reads"| tpyaml
    cli -->|"2. spawns"| tp_cli
    settings -->|"3,4. reads/writes"| sdds
    settings -->|"4. validates against"| tp_schemas
    scaffold -->|"5. reads"| tpy
    scaffold -->|"5. copies"| tp_templates
    hooks -->|"7. reads"| tpy
    schema -->|"validates"| tpy
    prompts -.->|"6. LLM context"| tp_skills

    style core fill:#e1f5fe
    style contract fill:#fffde7
    style tp fill:#fff3e0
```

All 8 integration points flow through **`tech-pack.yaml`** as the single contract file between sdd-core and any tech pack. Integration point 6 (skill/agent discovery) is the exception — it's implicit through Claude Code loading both plugins into the same LLM context.
