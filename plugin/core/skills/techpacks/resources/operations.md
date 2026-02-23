# Techpacks Operations — Detailed Implementation

## Common Preamble

All operations start by reading the project's `sdd/sdd-settings.yaml` to find the tech pack entry. Path resolution depends on mode:
- `mode: internal` — resolve `path` relative to the plugin root directory (via `getPluginRoot()`)
- `mode: external` — `path` is absolute
- `mode: git` — resolve `install_path` relative to the project root

## 1. readManifest(namespace)

**Purpose:** Parse and return the full validated `techpack.yaml`.

**Steps:**
1. Read the tech pack entry from `sdd-settings.yaml` under `techpacks.<namespace>`
2. Resolve the tech pack directory path
3. Read `techpack.yaml` from the resolved directory
4. Parse YAML content
5. Return the full manifest as a structured object

**Returns:** The parsed manifest with sections: `techpack`, `components`, `commands`, `skills`, `lifecycle`, `documentation`.

**Logging:** `system-run.sh log write --level info --source techpacks.readManifest --message "Read manifest for <namespace>"`

## 2. resolvePath(namespace, relativePath)

**Purpose:** Resolve a manifest-relative path to an absolute filesystem path.

**Steps:**
1. Read the tech pack entry from settings
2. Resolve the tech pack directory
3. Join the tech pack directory with the relative path
4. Return the absolute path

**Returns:** Absolute file path string.

**Example:** `resolvePath("my-pack", "agents/my-agent.md")` → `/path/to/plugin/my-pack/agents/my-agent.md`

## 3. loadSkill(namespace, skillPath)

**Purpose:** Load a tech pack skill file into the current context.

**Steps:**
1. Resolve the skill path using `resolvePath(namespace, skillPath)`
2. Read the skill file content
3. Return the content for inclusion in the current context

**Important:** The skill content is loaded into the CURRENT context (not a subagent). This is appropriate for standards, guidelines, and reference skills that inform the current operation.

**Logging:** `system-run.sh log write --level info --source techpacks.loadSkill --message "Loaded skill: <skillPath>"`

## 4. loadAgent(namespace, agentRef)

**Purpose:** Read agent metadata and spawn as a Task subagent with prompt isolation.

**Steps:**
1. Resolve the agent path: `resolvePath(namespace, agentRef.path)`
2. Extract frontmatter metadata via system CLI: `system-run.sh agent frontmatter --path <resolved-path> --json`
3. Parse the JSON response to get: `name`, `model`, `tools`, `skills` list
4. For each skill name in the frontmatter, resolve to absolute path via the manifest:
   - Read the manifest's skills router or component entries to find the skill path
   - Call `resolvePath(namespace, skillPath)` for each
5. Compose a bootstrap prompt for the subagent:
   ```
   Read your agent file at: <absolute-agent-path>
   Read and follow these skills:
   - <absolute-skill-path-1>
   - <absolute-skill-path-2>
   Then execute the task described below.
   ```
6. Spawn as a Task subagent using the agent's declared model

**Important:** The agent's markdown body and skill contents NEVER enter the main context. Only the structured frontmatter metadata (step 2) is visible to the orchestrator. The subagent reads its own files.

**Logging:** `system-run.sh log write --level info --source techpacks.loadAgent --message "Spawned agent: <agentRef.name>" --data '{"skills":[...]}'`

## 5. routeCommand(namespace, command, args)

**Purpose:** Invoke the tech pack's command router skill.

**Steps:**
1. Read the manifest to get `commands.router` path
2. Validate the command name exists in `commands.available`
3. Build a structured context block:
   ```yaml
   command: <command-name>
   namespace: <namespace>
   args: <parsed-args>
   ```
4. Load the command router skill via `loadSkill(namespace, commands.router)`
5. Present the context block and let the router handle dispatch

**Returns:** The command router's response.

**Logging:** `system-run.sh log write --level info --source techpacks.routeCommand --message "Routing command: <command>" --data '{"namespace":"<ns>","args":{...}}'`

## 6. routeSkills(namespace, phase, componentType?, agent?)

**Purpose:** Invoke the skills router to load relevant skills for a lifecycle phase.

**Steps:**
1. Read the manifest to get `skills.router` path
2. Build a structured context block:
   ```yaml
   phase: <phase>
   component_type: <optional>
   component_name: <optional>
   agent: <optional>
   ```
3. Load the skills router skill via `loadSkill(namespace, skills.router)`
4. The router returns a list of skill paths to load
5. Load each returned skill into context

**Valid phases:** `component-discovery`, `project-scaffolding`, `plan-generation`, `implementation`, `verification`, `testing`

**Logging:** `system-run.sh log write --level info --source techpacks.routeSkills --message "Routing skills for phase: <phase>" --data '{"component_type":"<type>"}'`

## 7. listComponents(namespace)

**Purpose:** Read component types and metadata from the manifest.

**Steps:**
1. Read the manifest via `readManifest(namespace)`
2. Extract the `components` section
3. For each component type, return: name, description, directory_pattern, depends_on, whether it has an agent

**Returns:** Array of component type metadata objects.

## 8. dependencyOrder(namespace)

**Purpose:** Build topological order from the component dependency graph.

**Steps:**
1. Read the manifest via `readManifest(namespace)`
2. Extract `components.*.depends_on` for each component type
3. Build a directed graph
4. Perform topological sort (Kahn's algorithm)
5. Return the ordered list

**Returns:** Array of component type names in dependency order (dependencies first).

**Example:** `[component-a, component-b, component-c, component-d]` (ordered by dependency — dependencies first)
