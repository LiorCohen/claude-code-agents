---
name: sdd-init
description: Initialize a new project from the spec-driven template, optionally from an external spec.
---

# /sdd-init

Initialize a new spec-driven project, optionally from an existing external specification.

## Usage

```
/sdd-init --name <project-name> [--spec <path-to-external-spec>]
```

**Arguments:**
- `--name <project-name>` (required): Name of the project directory to create
- `--spec <path>` (optional): Path to an external specification file to use as the initial spec

**Examples:**
```bash
# Standard initialization
/sdd-init --name my-app

# Initialize from existing spec
/sdd-init --name my-app --spec /path/to/existing-spec.md
```

## Workflow

**CRITICAL**: This command follows an approval-based workflow. Do NOT create any files or directories until the user has approved the project configuration.

This command orchestrates multiple skills to complete initialization:

| Phase | Skill Used                  | Purpose |
|-------|-----------------------------|----------------|
| 0     | (inline)                    | Parse arguments |
| 1     | `product-discovery`         | Understand what user is building |
| 2     | `component-recommendation`  | Recommend technical components |
| 3     | (inline)                    | Display configuration summary |
| 4     | (inline)                    | Get user approval |
| 5     | (inline)                    | Initialize git   |
| 6.1   | `project-settings`          | Create sdd-settings.yaml |
| 6.2   | `scaffolding`               | Create project structure |
| 6.3   | `domain-population`         | Populate specs from discovery |
| 7     | `external-spec-integration` | Process external spec (if provided) |
| 8     | (inline)                    | Commit initial project files |
| 9     | (inline)                    | Display completion report |

---

### Phase 0: Parse Arguments

1. **If no arguments provided**, display usage and exit:
   ```
   Usage: /sdd-init --name <project-name> [--spec <path>]

   Arguments:
     --name <project-name>  Name of the project directory to create (required)
     --spec <path>          Path to external specification file (optional)

   Examples:
     /sdd-init --name my-app
     /sdd-init --name my-app --spec /path/to/spec.md
   ```
   **Do not proceed without at least `--name`.**

2. **Parse command arguments:**
   - Extract project name (required)
   - Extract spec path (if provided)

3. **If external spec is provided:**
   - Validate path exists
   - **Determine spec type:**
     - **If path is a file:** Use that file directly
     - **If path is a directory:**
       1. Look for entry point file in order: `README.md`, `SPEC.md`, `index.md`, `spec.md`
       2. If no entry point found, collect all `.md` files in the directory
       3. Store: `spec_is_directory: true`, `spec_files: [list of .md files]`
       4. Display: "Loaded spec directory: <path> ({N} markdown files found)"

   - **Extract outline** (chunked, no LLM needed):
     - For single file: Extract headers from that file
     - For directory: Extract headers from all files, prefixed with filename
     ```
     INVOKE spec-decomposition skill with:
       mode: "outline"
       spec_content: <file content or concatenated content>
       spec_is_directory: <true if directory>
       spec_files: <list of files if directory>
     ```
   - Store: `spec_outline` (sections with line ranges and source file)
   - Store: `spec_path` (absolute path to original spec file or directory)
   - Display: "Loaded external spec from: <path> ({N} sections found)"

   Note: The spec remains at its original location until Phase 7, when it's copied into the project.

4. **Directory check:**
   - Validate project name (lowercase, hyphens allowed)
   - Check if current directory basename matches project name
   - If match and empty: Ask "Initialize here? (yes/no)"
   - If match and not empty: "Will create subdirectory '<project-name>/' instead."
   - Determine target directory for later phases

---

### Phase 1: Product Discovery

**INVOKE the `product-discovery` skill** with:

```yaml
project_name: <from Phase 0>
spec_outline: <if --spec provided, else null>
spec_path: <if --spec provided, else null>
```

Note: The skill will read only the intro section using the outline's line ranges.

The skill conducts interactive discovery and returns:

```yaml
product_description: "1-2 sentence problem statement"
primary_domain: "Task Management"
user_personas:
  - type: "Project Manager"
    actions: "create projects, assign tasks"
core_workflows: ["Create projects", "Assign tasks"]
domain_entities: ["Team", "Project", "Task"]
integrations: ["Slack"]
constraints: []
scope: "mvp"
```

Store these results for subsequent phases.

---

### Phase 2: Technical Recommendation

**INVOKE the `component-recommendation` skill** with:

```yaml
discovery_results:
  product_description: <from Phase 1>
  primary_domain: <from Phase 1>
  user_personas: <from Phase 1>
  core_workflows: <from Phase 1>
  domain_entities: <from Phase 1>
  integrations: <from Phase 1>
  constraints: <from Phase 1>
  scope: <from Phase 1>
```

The skill recommends components and returns:

```yaml
project_type: "fullstack"
components:
  - type: contract
    name: contract
  - type: server
    name: server
  - type: webapp
    name: webapp
  - type: database
    name: database
  - type: helm
    name: helm
  - type: testing
    name: testing
  - type: cicd
    name: cicd
```

Store configuration for subsequent phases.

---

### Phase 3: Configuration Summary

Display a summary combining product context and technical configuration:

```markdown
## Project Configuration Summary

### Product Understanding

**Name:** <project-name>
**Problem:** <product_description>
**Domain:** <primary_domain>

**Users:**
- <User type 1>: <what they do>
- <User type 2>: <what they do>

**Core Capabilities:**
- <Capability 1>
- <Capability 2>

**Key Domain Entities:** <Entity1>, <Entity2>, <Entity3>
[**Integrations:** <list if any>]
[**Constraints:** <list if any>]

### Technical Configuration

**Location:** <target_directory>

**Components to create:**
- Contract (OpenAPI spec) - for <entities/workflows>
- Server (Node.js backend) - to handle <workflows>
- Webapp (React frontend) - for <user types>
- Database (PostgreSQL) - to persist <entities>
- Config (YAML configuration)
- Helm (Kubernetes deployment)
- Testing setup
- CI/CD workflows

### What Will Be Pre-populated

- **Glossary:** <Entity1>, <Entity2>, <Entity3>
- **User Personas:** <User type 1>, <User type 2>
- **Initial Use Cases:** Stubs for <Capability 1>, <Capability 2>

**Files to create:** ~XX files
```

---

### Phase 4: User Approval

**CRITICAL:** Ask the user explicitly:

```
Do you want to proceed with creating this project structure? (yes/no)
```

**DO NOT create any files until the user confirms with "yes".**

If the user says no, ask what they'd like to change and return to Phase 1 or Phase 2.

---

### Phase 5: Initialize Git Repository

Create the project directory (if it doesn't already exist) and initialize git before writing any project files:

If not already in a git repository:
```bash
mkdir -p ${TARGET_DIR} && cd ${TARGET_DIR} && git init
```

If already in a git repository (current directory case):
- Skip this phase (git is already initialized)

---

### Phase 6: Project Creation (Only After Approval)

#### Step 6.1: Create Project Settings

**INVOKE the `project-settings` skill** with operation `create`:

```yaml
plugin_version: <read from plugin's .claude-plugin/plugin.json>
project_name: <from Phase 0>
project_description: <from Phase 1>
project_domain: <from Phase 1>
project_type: <from Phase 2>
components: <from Phase 2>
```

Creates `sdd-settings.yaml` in the project root.

#### Step 6.2: Scaffold Project Structure

**INVOKE the `scaffolding` skill** with:

```yaml
project_name: <from Phase 0>
project_description: <from Phase 1>
primary_domain: <from Phase 1>
target_dir: <absolute path to target>
components: <from Phase 2>
```

#### Step 6.3: Populate Domain Knowledge

**INVOKE the `domain-population` skill** with:

```yaml
target_dir: <absolute path to target>
primary_domain: <from Phase 1>
product_description: <from Phase 1>
user_personas: <from Phase 1>
core_workflows: <from Phase 1>
domain_entities: <from Phase 1>
```

---

### Phase 7: External Spec Integration (if --spec provided)

**Only if external spec was provided via `--spec` argument.**

**INVOKE the `external-spec-integration` skill** with:

```yaml
spec_path: <absolute path to external spec>
spec_outline: <from Phase 0>
target_dir: <absolute path to project>
primary_domain: <from Phase 1>
```

The skill:
1. Copies external spec to `specs/external/`
2. Presents outline to user for boundary level selection
3. Analyzes each section individually (using outline line ranges)
4. Presents combined decomposition for user adjustment
5. Creates change specifications
6. Updates INDEX.md and glossary

---

### Phase 8: Commit Initial Project Files

Stage and commit all created files:
```bash
cd ${TARGET_DIR} && git add . && git commit -m "Initial project setup from spec-driven template"
```

---

### Phase 9: Completion Report

1. List the created structure:
   ```bash
   tree ${TARGET_DIR} -L 3 -I node_modules
   ```

2. Display completion message:

**If external spec was provided:**
```
Project initialized: <project-name>
Location: <absolute-path-to-target-dir>
Description: <project-description>
Primary Domain: <primary-domain>
Components created: <list>
External spec: specs/external/<filename>
Changes created: N

Changes (in implementation order):
  1. change-1 (feature): Brief description
  2. change-2 (feature): Brief description

Next steps:
  1. cd <project-name> (if not current directory)
  2. npm install --workspaces
  3. Review: specs/INDEX.md, specs/domain/glossary.md
  4. Start: /sdd-implement-change specs/changes/YYYY/MM/DD/<first-change>
```

**If standard initialization:**
```
Project initialized: <project-name>
Location: <absolute-path-to-target-dir>
Description: <project-description>
Primary Domain: <primary-domain>
Components created: <list>

Next steps:
  1. cd <project-name> (if not current directory)
  2. npm install --workspaces
  3. cd components/<contract-component-name> && npm run generate:types
  4. Review: specs/domain/glossary.md, components/<contract-component-name>/openapi.yaml
  5. Create first change: /sdd-new-change --type feature --name <name>
```

**DO NOT STOP until you have completed every phase and verified the structure.**

---

## Important Notes

- This command ALWAYS asks for user approval before creating files
- Users can customize which components to include
- Product discovery enables pre-populated glossary, use-cases, and component recommendations
- External spec support includes multi-change decomposition with user adjustment
- All skills are invoked in sequence with proper data passing between phases
