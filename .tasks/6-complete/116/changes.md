# Task #116 — Change Report

**Branch:** `feature/task-116-fix-system-cli-violations`
**Commits:** 1
**Files changed:** 27 (+127 / -207 lines)

---

## 1. [`plugin/skills/spec-writing/SKILL.md`](plugin/skills/spec-writing/SKILL.md)

Remove false Prerequisites section; fix `npx sdd-system` to `system-run.sh` for spec validation.

~~~diff

 Use templates below as starting points.

-## Prerequisites
-
-- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)
-
 ## Input


 ### Validation Rules

-Run `npx sdd-system spec validate <path>` to check:
+Run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec validate <path>` to check:
 - Required frontmatter fields present based on `spec_type`
 - Acceptance criteria in Given/When/Then format (tech specs only)
 - All referenced definitions exist in domain glossary
~~~

---

## 2. [`plugin/skills/spec-index/SKILL.md`](plugin/skills/spec-index/SKILL.md)

Remove Prerequisites section; fix 8 bare `sdd-system` and 2 `npx sdd-system` references to `system-run.sh`.

~~~diff

 ## Commands

-The spec commands are available via the sdd-system CLI:
+The spec commands are available via the system CLI:

 ### Generate Index

 Generates `changes/INDEX.md` from all change spec files.

 ```bash
-sdd-system spec index --changes-dir changes/
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec index --changes-dir changes/
 ```

 ### Generate Snapshot
 Generates `specs/SNAPSHOT.md` compiling all active specs.

 ```bash
-sdd-system spec snapshot --specs-dir specs/
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec snapshot --specs-dir specs/
 ```

 ### Validate Spec

 ```bash
 # Validate single spec
-sdd-system spec validate changes/2026/01/21/my-change/SPEC.md
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec validate changes/2026/01/21/my-change/SPEC.md

 # Validate all specs
-sdd-system spec validate --all --specs-dir specs/
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec validate --all --specs-dir specs/
 ```

 ---

-## Prerequisites
-
-- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)
-
 ## INDEX.md Format

 ### After Creating a Spec

 1. Merge spec to main
-2. Run `sdd-system spec index` to update INDEX.md
-3. Run `sdd-system spec snapshot` to update SNAPSHOT.md
+2. Run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec index` to update INDEX.md
+3. Run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec snapshot` to update SNAPSHOT.md
 4. Commit the updated index and snapshot

 ### Before Release

-1. Run `sdd-system spec validate --all` to ensure all specs are valid
+1. Run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec validate --all` to ensure all specs are valid
 2. Review SNAPSHOT.md for completeness
 3. Verify all active specs have corresponding implementations

           node-version: '20'

       - name: Validate all specs
-        run: npx sdd-system spec validate --all --changes-dir changes/
+        run: "${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec validate --all --changes-dir changes/

       - name: Check index is up-to-date
         run: |
-          npx sdd-system spec index --changes-dir changes/
+          "${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" spec index --changes-dir changes/
           git diff --exit-code changes/INDEX.md
~~~

---

## 3. [`plugin/commands/sdd-init.md`](plugin/commands/sdd-init.md)

Fix 2 bare `sdd-system` references (check-tools, settings reconcile) to `system-run.sh`.

~~~diff

 #### 2.5 Required Tools Check (via System CLI)

-Run `sdd-system env check-tools --json` and interpret the result:
+Run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" env check-tools --json` and interpret the result:
 - Display the human-readable tool summary
 - If all tools installed: continue to next phase
 - If any tools are missing: list the missing tools with their install hints

 If this is an existing project with a version mismatch (detected in Phase 0):

-1. Run `sdd-system settings reconcile` to migrate settings to the latest schema
+1. Run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" settings reconcile` to migrate settings to the latest schema
 2. Display the command output (it prints a summary of changes and any directory warnings)
 3. **Skip Phase 3 and Phase 4** — structure already exists, git already initialized
 4. Jump to Phase 5 with upgrade-specific messaging
~~~

---

## 4. [`plugin/commands/sdd-config.md`](plugin/commands/sdd-config.md)

Replace entire Implementation section — bare `sdd-system` invocations to `system-run.sh`.

~~~diff

 ## Implementation

-This command invokes `sdd-system` CLI subcommands:
+This command invokes the system CLI via `system-run.sh`:

 ```bash
 # generate
-sdd-system config generate --env <env> [--component <name>] [--output <path>]
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config generate --env <env> [--component <name>] [--output <path>]

 # validate
-sdd-system config validate [--env <env>]
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config validate [--env <env>]

 # diff
-sdd-system config diff <env1> <env2>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config diff <env1> <env2>

 # add-env
-sdd-system config add-env <env-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config add-env <env-name>
 ```

-The `sdd-system` CLI handles the actual merge logic, validation, and file operations.
+The system CLI handles the actual merge logic, validation, and file operations.
~~~

---

## 5. [`plugin/commands/sdd-run.md`](plugin/commands/sdd-run.md)

Fix `node --enable-source-maps ... dist/cli.js` to `system-run.sh`.

~~~diff
 When you invoke `/sdd-run`, execute the following:

 ```bash
-node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js" <namespace> <action> [args] [options]
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" <namespace> <action> [args] [options]
 ```

 Where `CLAUDE_PLUGIN_ROOT` is the path to the SDD plugin directory.
~~~

---

## 6. [`plugin/skills/components/helm/helm-standards/SKILL.md`](plugin/skills/components/helm/helm-standards/SKILL.md)

Remove Prerequisites section; fix bare `sdd-system` in config generate example.

~~~diff

 Each deployment configuration gets its own helm chart.

-## Prerequisites
-
-- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)
-
 ## Directory Structure


 ```bash
 # Generate config for production environment
-sdd-system config generate --env production --component main-server \
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config generate --env production --component main-server \
   --output helm-values-config.yaml

 # Deploy with config
~~~

---

## 7. [`plugin/skills/components/helm/helm-scaffolding/SKILL.md`](plugin/skills/components/helm/helm-scaffolding/SKILL.md)

Remove Prerequisites section; fix bare `sdd-system` in config generate example.

~~~diff

 Use when creating Helm chart components.

-## Prerequisites
-
-- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)
-
 ## Settings-Driven Scaffolding

 Deployment workflow:
 ```bash
 # Generate merged config
-sdd-system config generate --env production --component main-server \
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" config generate --env production --component main-server \
   --output production-config.yaml

 # Deploy with config
~~~

---

## 8. [`plugin/skills/components/config/config-scaffolding/SKILL.md`](plugin/skills/components/config/config-scaffolding/SKILL.md)

Remove Prerequisites section; fix prose reference from `sdd-system CLI` to `The system CLI`.

~~~diff

 Use during project initialization to create the config component.

-## Prerequisites
-
-- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)
-
 ## What It Creates


 1. **Other components can import types** via workspace package `@{project}/config/types`
 2. **YAML files are the source of truth** for configuration values
-3. **`sdd-system` CLI** (via `/sdd-config`) generates merged configs for each environment
+3. **The system CLI** (via `/sdd-config`) generates merged configs for each environment
~~~

---

## 9. [`plugin/skills/components/database/database-scaffolding/SKILL.md`](plugin/skills/components/database/database-scaffolding/SKILL.md)

Remove PATH claim and Prerequisites; merge npm scripts + CLI sections into single CLI-only section; simplify root package.json update.

~~~diff

 ```text
 components/database[-<name>]/
-├── package.json              # npm scripts (call sdd-system CLI)
+├── package.json              # Component package metadata
 ├── README.md                 # Component documentation
 ├── migrations/
 │   └── 001_initial_schema.sql

 ## Usage

-After scaffolding, the database component provides npm scripts that call the sdd-system CLI:
+After scaffolding, database operations are performed via the system CLI:

 ```bash
-# From components/database/ (path depends on component name)
-npm run setup        # Deploy PostgreSQL to k8s
-npm run teardown     # Remove PostgreSQL from k8s
-npm run migrate      # Run all migrations in order
-npm run seed         # Run all seed files in order
-npm run reset        # Full reset: teardown + setup + migrate + seed
-npm run port-forward # Port forward to local
-npm run psql         # Open psql shell
-```
-
-Or use the CLI directly:
-
-```bash
-sdd-system database setup <component-name>
-sdd-system database migrate <component-name>
-sdd-system database seed <component-name>
-sdd-system database reset <component-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database setup <component-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database teardown <component-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database migrate <component-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database seed <component-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database reset <component-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database port-forward <component-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database psql <component-name>
 ```

 ## Prerequisites

-- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)
-
 The CLI commands require:
 - PostgreSQL 14+ (client tools: `psql`, `createdb`, `dropdb`)
 - Environment variables set:
 After scaffolding, update the root `package.json`:

 1. If root `package.json` doesn't exist, create it from the `project-scaffolding` skill template (`templates/project/package.json`)
-2. Add component scripts:
-   - `"<name>:setup": "npm run setup -w components/databases/<name>"`
-   - `"<name>:migrate": "npm run migrate -w components/databases/<name>"`
-   - `"<name>:seed": "npm run seed -w components/databases/<name>"`
-   - `"<name>:reset": "npm run reset -w components/databases/<name>"`
+2. Add the database component as a workspace entry (no component-level scripts needed — database operations use the system CLI directly)

 ## Related Skills
~~~

---

## 10. [`plugin/skills/components/database/database-standards/SKILL.md`](plugin/skills/components/database/database-standards/SKILL.md)

Remove Prerequisites; fix directory tree comment; fix "Test Migration" and "Database Commands" sections from `npm run` to `system-run.sh`.

~~~diff

 ---

-## Prerequisites
-
-- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)
-
 ## Directory Structure

 ```text
 components/database[-{name}]/
-├── package.json              # npm scripts (call sdd-system CLI)
+├── package.json              # Component package metadata
 ├── migrations/               # Schema migrations (numbered)
 │   ├── 001_initial_schema.sql
 │   ├── 002_add_users_table.sql
 ### Step 3: Test Migration

 ```bash
-cd components/database
-npm run migrate
-npm run psql  # Verify schema
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database migrate <component-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database psql <component-name>  # Verify schema
 ```

 ### Step 4: Add Seeds (if needed)
 ## Database Commands

 ```bash
-# From components/database/ (path depends on component name)
-npm run setup        # Deploy PostgreSQL to k8s
-npm run teardown     # Remove PostgreSQL from k8s
-npm run migrate      # Run all migrations
-npm run seed         # Run all seeds
-npm run reset        # Full reset: teardown + setup + migrate + seed
-npm run port-forward # Port forward to local
-npm run psql         # Open psql shell
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database setup <component-name>        # Deploy PostgreSQL to k8s
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database teardown <component-name>     # Remove PostgreSQL from k8s
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database migrate <component-name>      # Run all migrations
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database seed <component-name>         # Run all seeds
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database reset <component-name>        # Full reset: teardown + setup + migrate + seed
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database port-forward <component-name> # Port forward to local
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" database psql <component-name>         # Open psql shell
 ```

 ---
~~~

---

## 11. [`plugin/skills/components/contract/contract-scaffolding/SKILL.md`](plugin/skills/components/contract/contract-scaffolding/SKILL.md)

Remove Prerequisites; fix directory tree comments; merge npm scripts + CLI sections into CLI-only; simplify root package.json; fix integration diagram.

~~~diff

 Use when creating a contract component. Contract components support multiple instances (e.g., `contracts/customer-api/`, `contracts/back-office-api/`).

-## Prerequisites
-
-- `sdd-system` CLI available in PATH (installed via the SDD plugin's npm package)
-
 ## What It Creates

 The directory path is `components/contracts/{name}/` based on the component name in `.sdd/sdd-settings.yaml` (refer to the `project-settings` skill for directory mappings).

 ```text
 components/contracts/{name}/
-├── package.json          # Build scripts (call sdd-system CLI)
+├── package.json          # Component package metadata and devDependencies
 ├── openapi.yaml          # OpenAPI 3.0 specification
 ├── .gitignore            # Ignores generated/ directory
 └── generated/            # Generated types (git-ignored)
-    └── api-types.ts      # Generated after npm run generate:types
+    └── api-types.ts      # Generated TypeScript types (from openapi.yaml)
 ```

 ## OpenAPI Template

 ## Type Generation

-The contract component generates TypeScript types from the OpenAPI spec:
-
-```bash
-cd components/contract  # path depends on component name
-npm run generate:types
-npm run validate        # Validate OpenAPI spec with Spectral
-```
-
-Or use the CLI directly:
+The contract component generates TypeScript types from the OpenAPI spec via the system CLI:

 ```bash
-sdd-system contract generate-types <component-name>
-sdd-system contract validate <component-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" contract generate-types <component-name>
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" contract validate <component-name>
 ```

 This creates `generated/api-types.ts` inside the contract component.
 After scaffolding, update the root `package.json`:

 1. If root `package.json` doesn't exist, create it from the `project-scaffolding` skill template (`templates/project/package.json`)
-2. Add component scripts:
-   - `"<name>:generate": "npm run generate:types -w components/contracts/<name>"`
-   - `"<name>:validate": "npm run validate -w components/contracts/<name>"`
-3. Update meta-scripts (`generate`) to include this component
+2. Add the contract component as a workspace entry (no component-level scripts needed — contract operations use the system CLI directly)

 ## Related Skills

                     │  openapi.yaml   │
                     └────────┬────────┘
                              │
-                    npm run generate:types
+                    contract generate-types
                              │
                     ┌────────▼────────┐
                     │   generated/    │
~~~

---

## 12. [`plugin/skills/components/contract/contract-standards/SKILL.md`](plugin/skills/components/contract/contract-standards/SKILL.md)

Fix 5 `npm run` references to `system-run.sh` (generate:types, validate, workflow steps, checklist).

~~~diff
 ### Running Generation

 ```bash
-cd components/contract  # path depends on component name
-npm run generate:types
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" contract generate-types <component-name>
 ```

 ### Generated Type Usage
 ### Spectral Linting

 ```bash
-npm run validate
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" contract validate <component-name>
 ```

 Uses `.spectral.yaml` for custom rules (optional).
 ### Step 2: Validate

 ```bash
-npm run validate
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" contract validate <component-name>
 ```

 ### Step 3: Generate Types

 ```bash
-npm run generate:types
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" contract generate-types <component-name>
 ```

 ### Step 4: Implement in Server
 - [ ] Required fields are specified
 - [ ] Standard error responses are used
 - [ ] Types regenerated after spec changes
-- [ ] Validation passes (`npm run validate`)
+- [ ] Validation passes (`contract validate`)
 - [ ] No health endpoints in contract (they're infrastructure)
~~~

---

## 13. [`plugin/skills/components/backend/backend-standards/SKILL.md`](plugin/skills/components/backend/backend-standards/SKILL.md)

Fix `npm run generate:types` to system CLI reference.

~~~diff
 Start in `components/contract/`:

 1. **Define the endpoint** in `openapi.yaml` - request/response schemas
-2. **Generate types** with `npm run generate:types`
+2. **Generate types** via the system CLI (`contract generate-types`)
 3. **Import types** into server via workspace package

 This ensures types flow from contract → server → frontend.
~~~

---

## 14. [`plugin/agents/api-designer.md`](plugin/agents/api-designer.md)

Fix `cd + npm run generate:types` to `system-run.sh`.

~~~diff
 ## Type Generation

 ```bash
-cd components/contracts/{name}
-npm run generate:types
+"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" contract generate-types <component-name>
 ```

 This creates `generated/types.ts` inside the contract component.
~~~

---

## 15. [`plugin/skills/domain-population/SKILL.md`](plugin/skills/domain-population/SKILL.md)

Replace temp file pattern (`/tmp/sdd-domain-config.json`) with stdin pipe (`--config -`).

~~~diff
 This skill uses a TypeScript script for deterministic file creation:

 ```bash
-# 1. Create a config JSON file
-cat > /tmp/sdd-domain-config.json << 'EOF'
+cat << 'EOF' | "${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding domain --config -
 {
     "target_dir": "/path/to/project",
     "primary_domain": "Task Management",
     "domain_entities": ["Team", "Project", "Task", "User"]
 }
 EOF
-
-# 2. Run the domain population command
-sdd-system scaffolding domain --config /tmp/sdd-domain-config.json
-
-# 3. Clean up config file
-rm /tmp/sdd-domain-config.json
 ```

 ## Input
~~~

---

## 16. [`plugin/skills/scaffolding/SKILL.md`](plugin/skills/scaffolding/SKILL.md)

Fix prose reference from `sdd-system scaffolding project` to `system-run.sh`.

~~~diff

 ## Usage

-After gathering project configuration in `/sdd-init`, call `sdd-system scaffolding project` with a config JSON file containing the project settings. The config must include:
+After gathering project configuration in `/sdd-init`, run `"${CLAUDE_PLUGIN_ROOT}/system/system-run.sh" scaffolding project` with a config JSON file containing the project settings. The config must include:

 ```json
 {
~~~

---

## 17. [`plugin/skills/components/contract/contract-scaffolding/templates/package.json`](plugin/skills/components/contract/contract-scaffolding/templates/package.json)

Remove broken `scripts` section (references `sdd-system` which isn't available in scaffolded projects).

~~~diff
       "default": "./generated/api-types.ts"
     }
   },
-  "scripts": {
-    "generate:types": "sdd-system contract generate-types {{COMPONENT_NAME}}",
-    "validate": "sdd-system contract validate {{COMPONENT_NAME}}"
-  },
   "devDependencies": {
     "openapi-typescript": "^6.7.0",
     "@stoplight/spectral-cli": "^6.11.0"
~~~

---

## 18. [`plugin/skills/components/database/database-scaffolding/templates/package.json`](plugin/skills/components/database/database-scaffolding/templates/package.json)

Remove all broken `scripts` (7 entries referencing `sdd-system`). Now minimal: just name and private.

~~~diff
 {
   "name": "@{{PROJECT_NAME}}/database",
-  "private": true,
-  "scripts": {
-    "setup": "sdd-system database setup {{COMPONENT_NAME}}",
-    "teardown": "sdd-system database teardown {{COMPONENT_NAME}}",
-    "migrate": "sdd-system database migrate {{COMPONENT_NAME}}",
-    "seed": "sdd-system database seed {{COMPONENT_NAME}}",
-    "reset": "sdd-system database reset {{COMPONENT_NAME}}",
-    "port-forward": "sdd-system database port-forward {{COMPONENT_NAME}}",
-    "psql": "sdd-system database psql {{COMPONENT_NAME}}"
-  }
+  "private": true
 }
~~~

---

## 19. [`plugin/skills/components/database/database-scaffolding/templates/README.md`](plugin/skills/components/database/database-scaffolding/templates/README.md)

Replace `npm run` Quick Start and Available Scripts table with `/sdd-run database` commands. Fix "scripts default to" to "connections default to".

~~~diff

 ## Quick Start

-```bash
-# 1. Deploy PostgreSQL to k8s
-npm run setup
-
-# 2. Forward port to access from localhost (run in separate terminal)
-npm run port-forward
+Database operations are performed via SDD commands in your Claude Code session:

-# 3. Run migrations
-npm run migrate
-
-# 4. (Optional) Load seed data
-npm run seed
+```
+/sdd-run database setup        # Deploy PostgreSQL to k8s
+/sdd-run database port-forward  # Forward port (run in separate terminal)
+/sdd-run database migrate       # Run migrations
+/sdd-run database seed          # (Optional) Load seed data
 ```

-## Available Scripts
+## Available Commands

-| Script | Description |
-|--------|-------------|
-| `npm run setup` | Deploy PostgreSQL to local Kubernetes cluster |
-| `npm run teardown` | Remove PostgreSQL from cluster |
-| `npm run port-forward` | Forward localhost:5432 to database pod |
-| `npm run psql` | Connect to database via psql |
-| `npm run migrate` | Run all pending migrations |
-| `npm run seed` | Load seed data |
-| `npm run reset` | Drop, recreate, migrate, and seed |
+| Command | Description |
+|---------|-------------|
+| `/sdd-run database setup` | Deploy PostgreSQL to local Kubernetes cluster |
+| `/sdd-run database teardown` | Remove PostgreSQL from cluster |
+| `/sdd-run database port-forward` | Forward localhost:5432 to database pod |
+| `/sdd-run database psql` | Connect to database via psql |
+| `/sdd-run database migrate` | Run all pending migrations |
+| `/sdd-run database seed` | Load seed data |
+| `/sdd-run database reset` | Drop, recreate, migrate, and seed |

 ## Adding Migrations


 ## Default Connection Settings

-When using port-forward, scripts default to:
+When using port-forward, connections default to:

 | Setting | Value |
 |---------|-------|
~~~

---

## 20. [`plugin/skills/project-scaffolding/templates/project/README.md`](plugin/skills/project-scaffolding/templates/project/README.md)

Replace `npm run database:*` and `npm run generate` with `/sdd-run` commands in separate section.

~~~diff
 Once you have features implemented:

 ```bash
-# Start local database (requires local Kubernetes cluster)
-npm run database:setup
-npm run database:port-forward
-
-# Install dependencies and generate types
+# Install dependencies
 npm install
-npm run generate

 # Start development servers
 npm run dev
 ```

+Database and contract operations are performed via SDD commands:
+
+```
+/sdd-run database setup        # Deploy local database (requires K8s)
+/sdd-run database port-forward  # Forward database port
+/sdd-run contract generate-types # Generate TypeScript types from OpenAPI
+```
+
 ## Project Structure

 ```
~~~

---

## 21. [`plugin/skills/components/helm/helm-scaffolding/templates-server/templates/configmap.yaml`](plugin/skills/components/helm/helm-scaffolding/templates-server/templates/configmap.yaml)

Fix comment from `sdd-system config generate` to `the system CLI (config generate)`.

~~~diff
 # ConfigMap for application configuration
-# Config is generated by sdd-system config generate and passed at deploy time
+# Config is generated by the system CLI (config generate) and passed at deploy time
 apiVersion: v1
 kind: ConfigMap
 metadata:
~~~

---

## 22. [`plugin/skills/components/backend/backend-scaffolding/templates/src/config/load_config.ts`](plugin/skills/components/backend/backend-scaffolding/templates/src/config/load_config.ts)

Fix comment from `sdd-system` to `the system CLI`.

~~~diff

   const config = parse(readFileSync(configPath, 'utf-8')) as Config;

-  // Validate against schema if present (schema placed alongside config by sdd-system)
+  // Validate against schema if present (schema placed alongside config by the system CLI)
   const schemaPath = configPath.replace(/\.yaml$/, '.schema.json');
   if (existsSync(schemaPath)) {
     const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as object;
~~~

---

## 23. [`tests/src/tests/integration/database-component/templates.test.ts`](tests/src/tests/integration/database-component/templates.test.ts)

Update 3 test blocks to match new template content: scripts undefined, `npm run` to `/sdd-run`, CLI integration to template minimality.

~~~diff
   });

   /**
-   * WHY: Database management requires standard npm scripts for migrations,
-   * seeding, and reset operations. Missing scripts force manual operations.
+   * WHY: Database templates are minimal - scripts cannot reference the
+   * system CLI because ${CLAUDE_PLUGIN_ROOT} doesn't exist in scaffolded
+   * projects. Database operations are documented in database-standards.
    */
-  it('package.json defines migrate, seed, and reset scripts', () => {
+  it('package.json has no scripts (CLI not available in scaffolded projects)', () => {
     const packageJson = joinPath(DATABASE_TEMPLATES_DIR, 'package.json');
     const content = JSON.parse(readFile(packageJson)) as {
       scripts?: Record<string, string>;
     };

-    expect(content.scripts).toBeDefined();
-    expect(content.scripts?.['migrate']).toBeDefined();
-    expect(content.scripts?.['seed']).toBeDefined();
-    expect(content.scripts?.['reset']).toBeDefined();
+    expect(content.scripts).toBeUndefined();
   });

   /**
   });

   /**
-   * WHY: The README must document the npm run commands so users know
+   * WHY: The README must document the SDD commands so users know
    * how to perform database operations without reading the code.
    */
-  it('README.md documents npm run commands', () => {
+  it('README.md documents /sdd-run database commands', () => {
     const readme = joinPath(DATABASE_TEMPLATES_DIR, 'README.md');
     const content = readFile(readme);

-    expect(content).toContain('npm run migrate');
-    expect(content).toContain('npm run seed');
-    expect(content).toContain('npm run reset');
+    expect(content).toContain('/sdd-run database migrate');
+    expect(content).toContain('/sdd-run database seed');
+    expect(content).toContain('/sdd-run database reset');
   });
 });

 });

 /**
- * WHY: Database operations are now handled by the sdd-system CLI.
- * The package.json scripts call CLI commands instead of shell scripts.
- * This provides type-safe, testable implementations.
+ * WHY: Database templates are minimal packages. The system CLI is only
+ * available during plugin sessions (via ${CLAUDE_PLUGIN_ROOT}), not in
+ * scaffolded projects. Database operations are documented in standards.
  */
-describe('Database CLI Integration', () => {
+describe('Database Template Minimality', () => {
   /**
-   * WHY: package.json scripts should use sdd-system CLI commands
-   * instead of local shell scripts for better maintainability.
+   * WHY: Scaffolded templates must not reference sdd-system or the
+   * system CLI since these are not available in generated projects.
    */
-  it('package.json uses sdd-system CLI commands', () => {
+  it('package.json does not reference sdd-system', () => {
     const packageJson = joinPath(DATABASE_TEMPLATES_DIR, 'package.json');
     const content = readFile(packageJson);

-    expect(content).toContain('sdd-system database setup');
-    expect(content).toContain('sdd-system database migrate');
-    expect(content).toContain('sdd-system database seed');
-    expect(content).toContain('sdd-system database reset');
-    expect(content).toContain('sdd-system database teardown');
-  });
-
-  /**
-   * WHY: The CLI commands should use {{COMPONENT_NAME}} variable
-   * so each database component can be managed independently.
-   */
-  it('package.json uses {{COMPONENT_NAME}} variable for CLI commands', () => {
-    const packageJson = joinPath(DATABASE_TEMPLATES_DIR, 'package.json');
-    const content = readFile(packageJson);
-
-    expect(content).toContain('{{COMPONENT_NAME}}');
+    expect(content).not.toContain('sdd-system');
   });
 });
~~~

---

## 24. [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json)

Version bump 6.6.2 to 6.6.3.

~~~diff
 {
   "name": "sdd",
-  "version": "6.6.2",
+  "version": "6.6.3",
   "description": "Spec-driven development methodology for full-stack teams",
   "author": {
     "name": "Lior Cohen"
~~~

---

## 25. [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)

Version bump 6.6.2 to 6.6.3.

~~~diff
       "name": "sdd",
       "source": "./plugin",
       "description": "Spec-driven development (SDD) plugin for Claude Code...",
-      "version": "6.6.2"
+      "version": "6.6.3"
     }
   ]
 }
~~~

---

## 26. [`changelog/v6.md`](changelog/v6.md)

Add 6.6.3 changelog entry documenting all 47 violations fixed.

~~~diff

 ---

+## [6.6.3] - 2026-02-09
+
+### Fixed
+
+- **system-cli-standards**: Fix all 47 CLI invocation violations across 13+ prompt files
+  - Replace bare `sdd-system`, `npx sdd-system`, and `node ... cli.js` with canonical `system-run.sh` pattern
+  - Remove false "Available in PATH" claims and Prerequisites sections
+  - Convert temp-file patterns to stdin pipe (`--config -`) convention
+  - Remove broken npm scripts from scaffolded templates (database, contract) — `${CLAUDE_PLUGIN_ROOT}` doesn't exist in scaffolded projects
+  - Update all downstream references (`/sdd-run` for user-facing, `system-run.sh` for plugin internals)
+  - Fix database and contract template tests to match updated templates
+
+### Rationale
+
+The system CLI standards skill (6.6.2) defined the canonical invocation pattern but existing prompt files still used legacy patterns. This release enforces consistency across all skills, commands, agents, and templates.
+
+---
+
 ## [6.6.2] - 2026-02-09
~~~

---

## 27. [`package-lock.json`](package-lock.json)

Lockfile name field updated by worktree (artifact of git worktree setup).

~~~diff
 {
-  "name": "sdd",
+  "name": "task-116",
   "lockfileVersion": 3,
   "requires": true,
   "packages": {
~~~
