# Task #121 — Change Report

**Branch:** `feature/task-121-fix-skills-standards-violations`
**Commits:** 1
**Files changed:** 28 (+375 / -52 lines)

---

## 1. [plugin/skills/scaffolding/SKILL.md](plugin/skills/scaffolding/SKILL.md)

Fixed `helm-charts` → `helm_charts` in directory naming examples (2 occurrences).

```diff
@@ -136,7 +136,7 @@ components:
   - type: database
     name: task-db                    # -> components/databases/task-db/
   - type: helm
-    name: task-service               # -> components/helm-charts/task-service/
+    name: task-service               # -> components/helm_charts/task-service/
   - type: testing
     name: e2e                        # -> components/testing/e2e/
   - type: cicd
@@ -167,7 +167,7 @@ components:
 | `{type: server, name: order-service}` | `components/servers/order-service/` |
 | `{type: webapp, name: admin-portal}` | `components/webapps/admin-portal/` |
 | `{type: contract, name: public-api}` | `components/contracts/public-api/` |
-| `{type: helm, name: main}` | `components/helm-charts/main/` |
+| `{type: helm, name: main}` | `components/helm_charts/main/` |
```

---

## 2. [plugin/skills/project-settings/SKILL.md](plugin/skills/project-settings/SKILL.md)

Fixed `helm-charts` → `helm_charts` in example component path.

```diff
@@ -90,7 +90,7 @@ components:

   - name: main-server-api
     type: helm
-    path: components/helm-charts/main-server-api
+    path: components/helm_charts/main-server-api
     settings:
       deploys: main-server
       deploy_type: server
```

---

## 3. [plugin/skills/components/helm/helm-scaffolding/SKILL.md](plugin/skills/components/helm/helm-scaffolding/SKILL.md)

Fixed `helm-charts` → `helm_charts` in all 9 scaffold spec `dest` paths and lint script. Added `## Output` section with schema reference.

```diff
@@ -266,15 +266,15 @@ See the full Helm chart spec example in the task description. Each template file
     "has_ingress": true
   },
   "operations": [
-    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/Chart.yaml", "dest": "components/helm-charts/<chart-name>/Chart.yaml" },
-    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/values.yaml", "dest": "components/helm-charts/<chart-name>/values.yaml" },
-    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/_helpers.tpl", "dest": "components/helm-charts/<chart-name>/templates/_helpers.tpl" },
-    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/configmap.yaml", "dest": "components/helm-charts/<chart-name>/templates/configmap.yaml" },
-    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/servicemonitor.yaml", "dest": "components/helm-charts/<chart-name>/templates/servicemonitor.yaml" },
-    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/deployment.yaml", "dest": "components/helm-charts/<chart-name>/templates/deployment.yaml", "when": [...] },
-    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/service.yaml", "dest": "components/helm-charts/<chart-name>/templates/service.yaml", "when": {...} },
-    { "type": "template_file", "source": "components/helm/helm-scaffolding/templates-server/templates/ingress.yaml", "dest": "components/helm-charts/<chart-name>/templates/ingress.yaml", "when": {...} },
-    { "type": "package_json_scripts", "scripts": { "<chart-name>:lint": "helm lint components/helm-charts/<chart-name>" } }
+    { "type": "template_file", "source": "...", "dest": "components/helm_charts/<chart-name>/Chart.yaml" },
+    { "type": "template_file", "source": "...", "dest": "components/helm_charts/<chart-name>/values.yaml" },
+    { "type": "template_file", "source": "...", "dest": "components/helm_charts/<chart-name>/templates/_helpers.tpl" },
+    { "type": "template_file", "source": "...", "dest": "components/helm_charts/<chart-name>/templates/configmap.yaml" },
+    { "type": "template_file", "source": "...", "dest": "components/helm_charts/<chart-name>/templates/servicemonitor.yaml" },
+    { "type": "template_file", "source": "...", "dest": "components/helm_charts/<chart-name>/templates/deployment.yaml", "when": [...] },
+    { "type": "template_file", "source": "...", "dest": "components/helm_charts/<chart-name>/templates/service.yaml", "when": {...} },
+    { "type": "template_file", "source": "...", "dest": "components/helm_charts/<chart-name>/templates/ingress.yaml", "when": {...} },
+    { "type": "package_json_scripts", "scripts": { "<chart-name>:lint": "helm lint components/helm_charts/<chart-name>" } }
   ]
 }

+## Output
+
+Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)
+
+Returns the scaffolding engine result: created files, directories, and scripts; skipped paths; errors; and a human-readable summary.
```

---

## 4. [plugin/skills/project-scaffolding/templates/project/CLAUDE.md](plugin/skills/project-scaffolding/templates/project/CLAUDE.md)

Fixed `helm-charts` → `helm_charts` in project template component directory table.

```diff
@@ -18,7 +18,7 @@
 | Server | `components/servers/{name}/` | Backend (CMDO architecture) |
 | Webapp | `components/webapps/{name}/` | React frontend (MVVM) |
 | Database | `components/databases/{name}/` | PostgreSQL migrations and seeds |
-| Helm | `components/helm-charts/{name}/` | Kubernetes deployment |
+| Helm | `components/helm_charts/{name}/` | Kubernetes deployment |
 | Testing | `components/testing/{name}/` | Testkube test definitions |
```

---

## 5. [plugin/commands/sdd-settings.md](plugin/commands/sdd-settings.md)

Fixed `helm-charts` → `helm_charts` in 2 file path references.

```diff
@@ -128,8 +128,8 @@ Result:

 Result:
-- Adds [templates/ingress.yaml](components/helm-charts/main-server-api/templates/ingress.yaml) to the helm chart
-- Updates [values.yaml](components/helm-charts/main-server-api/values.yaml) with ingress configuration
+- Adds [templates/ingress.yaml](components/helm_charts/main-server-api/templates/ingress.yaml) to the helm chart
+- Updates [values.yaml](components/helm_charts/main-server-api/values.yaml) with ingress configuration
```

---

## 6. [plugin/commands/sdd-config.md](plugin/commands/sdd-config.md)

Fixed `helm-charts` → `helm_charts` in Helm deploy example.

```diff
@@ -233,7 +233,7 @@ SDD_CONFIG_PATH=./local-config.yaml npm start
 /sdd-config generate --env production --component task-service --output production-config.yaml

 # 2. Deploy with Helm
-helm install my-release ./components/helm-charts/task-service \
+helm install my-release ./components/helm_charts/task-service \
   -f values-production.yaml \
   --set-file config=production-config.yaml
```

---

## 7. [plugin/agents/devops.md](plugin/agents/devops.md)

Fixed `helm-charts` → `helm_charts` in 2 CI/CD example paths (lines 193, 196). External URL `kubeshop.github.io/helm-charts` correctly left unchanged.

```diff
@@ -190,10 +190,10 @@ jobs:
       - name: Deploy to test namespace
         run: |
           # Check .sdd/sdd-settings.yaml for helm component path
-          helm upgrade --install myapp-${{ github.sha }} ./components/helm-charts/myapp \
+          helm upgrade --install myapp-${{ github.sha }} ./components/helm_charts/myapp \
             --namespace test-${{ github.sha }} \
             --create-namespace \
-            -f ./components/helm-charts/myapp/values-testing.yaml \
+            -f ./components/helm_charts/myapp/values-testing.yaml \
             --set server.image.tag=${{ github.sha }} \
             --set webapp.image.tag=${{ github.sha }}
```

---

## 8. [plugin/system/src/settings/sync.ts](plugin/system/src/settings/sync.ts)

Fixed helm type directory mapping from `helm-charts` to `helm_charts` in `typeDirMap`.

```diff
@@ -132,7 +132,7 @@ export const generateComponentPath = (
   const typeDirMap: Record<ComponentType, string> = {
     server: 'servers',
     webapp: 'webapps',
-    helm: 'helm-charts',
+    helm: 'helm_charts',
     testing: 'testing',
     database: 'databases',
     contract: 'contracts',
```

---

## 9. [plugin/system/src/commands/scaffolding/project.ts](plugin/system/src/commands/scaffolding/project.ts)

Fixed helm type pluralization from `helm-charts` to `helm_charts` in `pluralizeType`.

```diff
@@ -23,7 +23,7 @@ import type { ScaffoldSpec, ScaffoldOperation } from './engine';
 const pluralizeType = (type: string): string => {
   const custom: Readonly<Record<string, string>> = {
-    helm: 'helm-charts',
+    helm: 'helm_charts',
     testing: 'testing',
   };
   return custom[type] ?? `${type}s`;
```

---

## 10. [plugin/skills/component-discovery/SKILL.md](plugin/skills/component-discovery/SKILL.md)

Added clarifying note above Available Components table explaining that scaffolding skill references are informational only.

```diff
@@ -117,6 +117,8 @@ Use the following skills for reference:

 ## Available Components

+The Scaffolding Skill column shows which skill handles scaffolding for each component type. These are informational references — this skill does not invoke them.
+
 | Component | Description | Scaffolding Skill | Multi-Instance |
```

---

## 11. [plugin/skills/spec-writing/SKILL.md](plugin/skills/spec-writing/SKILL.md)

Fixed 5 malformed code block closing fences that had stray language identifiers (e.g., `` ```json `` instead of `` ``` ``).

```diff
@@ -240,12 +240,12 @@ sdd_version: [X.Y.Z]
 **Request:**
 ```json
 { "field": "type" }
-```json
+```

 **Response (2XX):**
 ```json
 { "data": { "field": "type" } }
-```json
+```

@@ -277,7 +277,7 @@ sdd_version: [X.Y.Z]
 ```text
 [Entity A] ──── [relationship] ───→ [Entity B]
-```text
+```

@@ -298,14 +298,14 @@ sdd_version: [X.Y.Z]
 ```text
 specs/
 └── [current structure]
-```text
+```

 ```text
 specs/
 └── [new structure with comments: # NEW, # MODIFIED]
-```text
+```
```

---

## 12-17. Output schemas for scaffolding skills (6 new files)

Added `output.schema.json` to all 6 component scaffolding skills, matching the engine's `EngineResult` type.

- [plugin/skills/components/backend/backend-scaffolding/schemas/output.schema.json](plugin/skills/components/backend/backend-scaffolding/schemas/output.schema.json)
- [plugin/skills/components/config/config-scaffolding/schemas/output.schema.json](plugin/skills/components/config/config-scaffolding/schemas/output.schema.json)
- [plugin/skills/components/contract/contract-scaffolding/schemas/output.schema.json](plugin/skills/components/contract/contract-scaffolding/schemas/output.schema.json)
- [plugin/skills/components/database/database-scaffolding/schemas/output.schema.json](plugin/skills/components/database/database-scaffolding/schemas/output.schema.json)
- [plugin/skills/components/frontend/frontend-scaffolding/schemas/output.schema.json](plugin/skills/components/frontend/frontend-scaffolding/schemas/output.schema.json)
- [plugin/skills/components/helm/helm-scaffolding/schemas/output.schema.json](plugin/skills/components/helm/helm-scaffolding/schemas/output.schema.json)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "<component>-scaffolding output",
  "description": "Result from scaffolding engine execution.",
  "type": "object",
  "properties": {
    "success": { "type": "boolean", "description": "Whether all operations completed without errors" },
    "created": {
      "type": "object",
      "description": "Artifacts created during scaffolding",
      "properties": {
        "files": { "type": "array", "items": { "type": "string" }, "description": "Relative paths of files created" },
        "dirs": { "type": "array", "items": { "type": "string" }, "description": "Relative paths of directories created" },
        "scripts": { "type": "array", "items": { "type": "string" }, "description": "package.json script names added" }
      },
      "required": ["files", "dirs", "scripts"]
    },
    "skipped": { "type": "array", "items": { "type": "string" }, "description": "Paths skipped because they already existed" },
    "errors": { "type": "array", "items": { "type": "string" }, "description": "Error messages for failed operations" },
    "summary": { "type": "string", "description": "Human-readable summary of operations performed" }
  },
  "required": ["success", "created", "skipped", "errors", "summary"]
}
```

---

## 18-22. `## Output` sections added to scaffolding SKILL.md files (5 edits)

Added `## Output` section between `## Input` and `## Related Skills` in each scaffolding skill:

- [plugin/skills/components/backend/backend-scaffolding/SKILL.md](plugin/skills/components/backend/backend-scaffolding/SKILL.md)
- [plugin/skills/components/config/config-scaffolding/SKILL.md](plugin/skills/components/config/config-scaffolding/SKILL.md)
- [plugin/skills/components/contract/contract-scaffolding/SKILL.md](plugin/skills/components/contract/contract-scaffolding/SKILL.md)
- [plugin/skills/components/database/database-scaffolding/SKILL.md](plugin/skills/components/database/database-scaffolding/SKILL.md)
- [plugin/skills/components/frontend/frontend-scaffolding/SKILL.md](plugin/skills/components/frontend/frontend-scaffolding/SKILL.md)

```diff
+## Output
+
+Schema: [`schemas/output.schema.json`](./schemas/output.schema.json)
+
+Returns the scaffolding engine result: created files, directories, and scripts; skipped paths; errors; and a human-readable summary.
+
 ## Related Skills
```

---

## 23. [tests/src/tests/unit/settings/settings-sync.test.ts](tests/src/tests/unit/settings/settings-sync.test.ts)

Updated test expectation to match the `helm_charts` convention.

```diff
@@ -90,8 +90,8 @@ describe('component directory mapping', () => {
     expect(content).toContain("webapp: 'webapps'");
   });

-  it('maps helm type to helm-charts directory', () => {
-    expect(content).toContain("helm: 'helm-charts'");
+  it('maps helm type to helm_charts directory', () => {
+    expect(content).toContain("helm: 'helm_charts'");
   });
```

---

## 24. [plugin/.claude-plugin/plugin.json](plugin/.claude-plugin/plugin.json)

Version bump 6.7.0 → 6.7.1.

```diff
-  "version": "6.7.0",
+  "version": "6.7.1",
```

---

## 25. [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json)

Version bump 6.7.0 → 6.7.1.

```diff
-      "version": "6.7.0"
+      "version": "6.7.1"
```

---

## 26. [changelog/v6.md](changelog/v6.md)

Added 6.7.1 changelog entry.

```diff
+## [6.7.1] - 2026-02-10
+
+### Fixed
+
+- **helm path inconsistency**: Fixed `helm-charts` → `helm_charts` across 7 prompt files and 2 TypeScript source files
+- **spec-writing**: Fixed 5 malformed code block closing fences with stray language identifiers
+
+### Added
+
+- **output schemas**: Added `output.schema.json` to all 6 component scaffolding skills matching `EngineResult` type
+- **component-discovery**: Added clarifying note above Available Components table
```

---

## 27-28. Task management (unrelated to implementation)

- [.tasks/INDEX.md](.tasks/INDEX.md) — Removed #122 entry (task was deleted during implementation)
- `.tasks/1-inbox/122/task.md` — Deleted (consolidated into this task's scope)
