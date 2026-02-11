# Task #122 — Change Report

**Branch:** `feature/task-122-ts-standards-violations`
**Commits:** 4
**Files changed:** 90 (+3284 / -2866 lines)

---

## Summary

Fixed ~530 TypeScript standards violations across 55+ source files in `plugin/system/src/`. Converted all `interface` declarations to `type` (except `Logger` and `ClusterProviderOps`), replaced `T | null` returns with discriminated unions, eliminated all mutable patterns (`let`, `.push()`, `Object.assign`, bracket mutation, `delete`, `++/--`), applied `Readonly<Record<>>` and `readonly T[]` everywhere, and updated 5 test files with 35+ assertion changes. Additionally, extracted dispatch logic from all 11 command `index.ts` files into separate `handler.ts` and `schema.ts` files, enforcing the standard that index files must contain only re-exports. Final audit pass fixed remaining violations: derived union types from `as const` arrays, `ReadonlySet`/`ReadonlyMap` for all `Set`/`Map` variables, discriminated union for `ValidationResult<T>` (eliminating `!` non-null assertions in all 11 handlers), bracket notation for `process.env`, and `??` over `||`. Version bumped 6.7.2 to 6.7.3.

---

## Files Changed

### Types Layer

#### 1. [`plugin/system/src/types/component.ts`](plugin/system/src/types/component.ts)
Converted 6 `interface` declarations (`ComponentEntry`, `ScaffoldingConfig`, `ScaffoldingResult`, `DomainConfig`, `UserPersona`, `PopulationResult`) to `type`.

```ts
-export interface ComponentEntry {
+export type ComponentEntry = {
   readonly type: string;
```

#### 2. [`plugin/system/src/types/config.ts`](plugin/system/src/types/config.ts)
Converted 8 `interface` declarations to `type` (`VersionInfo`, `PluginJson`, `MarketplaceJson`, `MarketplacePlugin`, `HookInput`, `HookToolInput`, `PreToolUseHookOutput`, `PostToolUseHookOutput`).

```ts
-export interface HookInput {
+export type HookInput = {
   readonly tool: string;
```

#### 3. [`plugin/system/src/types/settings.ts`](plugin/system/src/types/settings.ts)
Converted 21 `interface` declarations to `type`. Changed `extends` inheritance to intersection types (`&`).

```ts
-export interface ServerComponent extends ComponentBase {
+export type ServerComponent = ComponentBase & {
   readonly type: 'server';
```

#### 4. [`plugin/system/src/types/spec.ts`](plugin/system/src/types/spec.ts)
Converted 3 `interface` declarations (`ValidationError`, `SpecEntry`, `ActiveSpec`) to `type`.

```ts
-export interface ValidationError {
+export type ValidationError = {
   readonly file: string;
```

#### 5. [`plugin/system/src/types/workflow.ts`](plugin/system/src/types/workflow.ts)
Converted 6 `interface` declarations (`WorkflowItem`, `WorkflowState`, `WorkflowProgress`, `PhaseGateResult`, `BlockingItem`, `OpenQuestion`) to `type`.

```ts
-export interface PhaseGateResult {
+export type PhaseGateResult = {
   readonly can_advance: boolean;
```

---

### Lib Layer

#### 6. [`plugin/system/src/lib/args.ts`](plugin/system/src/lib/args.ts)
Converted 3 interfaces to types. Replaced imperative `while` loop + `let` + `.push()` in `parseArgs` with recursive `step` function using immutable `ParseState`. Replaced mutable accumulation in `parseNamedArgs` with recursive step. Changed `outputResult` return from `void` to `string`.

```ts
+type ParseState = {
+  readonly namespace: string | undefined;
+  readonly action: string | undefined;
+  readonly args: readonly string[];
+  readonly options: GlobalOptions;
+  readonly index: number;
+};
```

#### 7. [`plugin/system/src/lib/config.ts`](plugin/system/src/lib/config.ts)
Converted `SddConfig` interface to type. Replaced `T | null` returns with discriminated unions (`ConfigResult`, `ProjectRootResult`). Replaced `while` loop + `let` in `findProjectRoot` with recursive `search` function.

```ts
+export type ProjectRootResult =
+  | { readonly found: true; readonly path: string }
+  | { readonly found: false };
```

#### 8. [`plugin/system/src/lib/frontmatter.ts`](plugin/system/src/lib/frontmatter.ts)
Converted 2 interfaces to types. Added `FrontmatterResult` discriminated union replacing `Frontmatter | null`. Changed `ParsedSpec.frontmatter` from `Frontmatter | null` to optional `Frontmatter?`. Replaced mutable `for` loop with `Object.fromEntries` + `.map().filter()`.

```ts
+export type FrontmatterResult =
+  | { readonly found: true; readonly data: Frontmatter }
+  | { readonly found: false };
```

#### 9. [`plugin/system/src/lib/fs.ts`](plugin/system/src/lib/fs.ts)
Changed 4 functions (`writeText`, `writeJson`, `copyFile`, `ensureDir`) from `void`/`Promise<void>` returns to meaningful return values (file path strings).

```ts
-export const writeText = async (filePath: string, content: string): Promise<void> => {
+export const writeText = async (filePath: string, content: string): Promise<string> => {
   await fs.mkdir(path.dirname(filePath), { recursive: true });
   await fs.writeFile(filePath, content);
+  return filePath;
```

#### 10. [`plugin/system/src/lib/logger.ts`](plugin/system/src/lib/logger.ts)
Converted `FileLoggerOptions` interface to type. Changed `success` and `error` helpers from `void` to `string` returns. Added `FileLoggerResult` discriminated union replacing `pino.Logger | null`.

```ts
+export type FileLoggerResult =
+  | { readonly created: true; readonly logger: pino.Logger }
+  | { readonly created: false };
```

#### 11. [`plugin/system/src/lib/schema-validator.ts`](plugin/system/src/lib/schema-validator.ts)
Converted 4 interfaces to types. Added `PropertyValidationResult` discriminated union replacing `ValidationError | null`. Replaced all `for` loops + `.push()` in `validateArgs` with `.filter().map()` and `.flatMap()`. Replaced mutable `lines` array in `generateSchemaHelp` with spread-based composition.

```ts
+const VALID: PropertyValidationResult = { valid: true } as const;
+const invalid = (error: ValidationError): PropertyValidationResult => ({
+  valid: false, error,
+});
```

#### 12. [`plugin/system/src/lib/spec-utils.ts`](plugin/system/src/lib/spec-utils.ts)
Converted `SpecFile` interface to type. Changed `frontmatter` field from `Frontmatter | null` to optional. Updated `findSpecFiles` to use new `FrontmatterResult` discriminated union.

```ts
-  readonly frontmatter: Frontmatter | null;
+  readonly frontmatter?: Frontmatter;
```

---

### Commands: Config

#### 13. [`plugin/system/src/commands/config/diff.ts`](plugin/system/src/commands/config/diff.ts)
Converted `DiffEntry` interface to type. Changed `ConfigObject` to `Readonly<Record<>>`. Replaced mutable `deepMerge` (`delete`, bracket assignment) with `reduce` + spread. Replaced mutable `compareObjects` with `reduce`.

```ts
-const result: ConfigObject = { ...base };
-for (const [key, value] of Object.entries(override)) {
+return Object.entries(override).reduce<ConfigObject>(
+  (acc, [key, value]) => {
```

#### 14. [`plugin/system/src/commands/config/generate.ts`](plugin/system/src/commands/config/generate.ts)
Changed `ConfigObject` to `Readonly<Record<>>`. Replaced mutable `deepMerge` with `reduce`. Replaced `delete schema['$schema']` with destructuring. Wrapped validation/component-extraction in IIFE returning discriminated result.

```ts
-      delete schema['$schema'];
+      const { ['$schema']: _, ...schema } = rawSchema;
```

#### 15. [`plugin/system/src/commands/config/validate.ts`](plugin/system/src/commands/config/validate.ts)
Converted `ValidationResult` interface to type. Replaced `delete schema['$schema']` with destructuring. Replaced mutable `for` loop + `hasErrors` flag with `.map()` + `.some()`.

```ts
-  const results: ValidationResult[] = [];
-  let hasErrors = false;
-  for (const env of envDirs) {
+  const results: ReadonlyArray<ValidationResult> = envDirs.map((env) => {
```

#### 16. [`plugin/system/src/commands/config/index.ts`](plugin/system/src/commands/config/index.ts)
Converted `ConfigArgs` interface to type.

---

### Commands: Contract

#### 17. [`plugin/system/src/commands/contract/generate-types.ts`](plugin/system/src/commands/contract/generate-types.ts)
Updated `findProjectRoot` call site to use `ProjectRootResult` discriminated union.

```ts
-  const projectRoot = await findProjectRoot();
-  if (!projectRoot) {
+  const projectRootResult = await findProjectRoot();
+  if (!projectRootResult.found) {
```

#### 18. [`plugin/system/src/commands/contract/validate.ts`](plugin/system/src/commands/contract/validate.ts)
Updated `findProjectRoot` call site to use `ProjectRootResult` discriminated union.

#### 19. [`plugin/system/src/commands/contract/index.ts`](plugin/system/src/commands/contract/index.ts)
Converted `ContractArgs` interface to type.

---

### Commands: Database

#### 20. [`plugin/system/src/commands/database/migrate.ts`](plugin/system/src/commands/database/migrate.ts)
Updated `findProjectRoot` call site. Replaced mutable `for` loop + `migrationsRun.push()` with recursive `runMigrations` function using immutable accumulation.

```ts
+  const runMigrations = (
+    files: ReadonlyArray<string>,
+    completed: ReadonlyArray<string>
+  ): { readonly completed: ReadonlyArray<string>; readonly error?: string } => {
```

#### 21. [`plugin/system/src/commands/database/seed.ts`](plugin/system/src/commands/database/seed.ts)
Updated `findProjectRoot` call site. Replaced mutable `for` loop + `seedsRun.push()` with recursive `runSeeds` function using immutable accumulation.

#### 22. [`plugin/system/src/commands/database/index.ts`](plugin/system/src/commands/database/index.ts)
Converted `DatabaseArgs` interface to type.

---

### Commands: Environment

#### 23. [`plugin/system/src/commands/env/check-tools.ts`](plugin/system/src/commands/env/check-tools.ts)
Converted 3 interfaces to types. Replaced `T | null` returns with `PackageManagerResult` discriminated union. Changed `readonly T[]` to `ReadonlyArray<T>`. Removed optional `null` fields in favor of truly optional properties.

```ts
+type PackageManagerResult =
+  | { readonly found: true; readonly manager: PackageManager }
+  | { readonly found: false };
```

#### 24. [`plugin/system/src/commands/env/config.ts`](plugin/system/src/commands/env/config.ts)
Converted 2 interfaces to types. Updated `findProjectRoot` call site. Replaced `let dbPort = 5432; dbPort++` with `.map((db, index) => ... 5432 + index)`. Replaced `Object.assign(urls, ...)` with `Object.fromEntries` and declarative construction.

```ts
-    let dbPort = 5432;
-    const dbMutable: Record<string, ...> = {};
-    for (const db of databaseComponents) {
-      dbMutable[db.name] = { host: 'localhost', port: dbPort++ };
+    const databases = Object.fromEntries(
+      databaseComponents.map((db, index) => [
+        db.name, { host: 'localhost', port: 5432 + index },
+      ])
+    );
```

#### 25. [`plugin/system/src/commands/env/create.ts`](plugin/system/src/commands/env/create.ts)
Changed `installInfrastructure` from `Promise<void>` to `Promise<string>` return.

#### 26. [`plugin/system/src/commands/env/deploy.ts`](plugin/system/src/commands/env/deploy.ts)
Converted `SddSettings` interface to type. Updated `findProjectRoot` call site. Changed `waitForDatabase` from `Promise<void>` to `Promise<string>`. Replaced mutable `deployedDbs.push()` with `Promise.all` + `.filter()`. Replaced `let dbPort; dbPort++` with index-based port calculation. Replaced `deployedCharts.push()` with `.reduce()`.

```ts
-    const deployedDbs: string[] = [];
-    if (!skipDb && ...) {
-      for (const db of databaseComponents) {
+    const deployedDbs: ReadonlyArray<string> = await (async () => {
+      const results = await Promise.all(
+        databaseComponents.map(async (db) => {
```

#### 27. [`plugin/system/src/commands/env/destroy.ts`](plugin/system/src/commands/env/destroy.ts)
Minor type annotation update.

#### 28. [`plugin/system/src/commands/env/forward.ts`](plugin/system/src/commands/env/forward.ts)
Converted interfaces to types. Updated `findProjectRoot` call site. Replaced `let portOffset; portOffset++` with index-based port calculation. Replaced mutable `forwards.push()` with `.reduce()`.

#### 29. [`plugin/system/src/commands/env/start.ts`](plugin/system/src/commands/env/start.ts)
Minor type annotation update.

#### 30. [`plugin/system/src/commands/env/status.ts`](plugin/system/src/commands/env/status.ts)
Converted interfaces to types. Updated `findProjectRoot` call site. Replaced mutable service status collection with `.map()`.

#### 31. [`plugin/system/src/commands/env/stop.ts`](plugin/system/src/commands/env/stop.ts)
Minor type annotation update.

#### 32. [`plugin/system/src/commands/env/types.ts`](plugin/system/src/commands/env/types.ts)
Converted 2 interfaces to types. Changed `readonly T[]` to `ReadonlyArray<T>`.

#### 33. [`plugin/system/src/commands/env/undeploy.ts`](plugin/system/src/commands/env/undeploy.ts)
Updated `findProjectRoot` call site. Replaced mutable `undeployedCharts.push()` with `.reduce()`.

#### 34. [`plugin/system/src/commands/env/providers/docker-desktop.ts`](plugin/system/src/commands/env/providers/docker-desktop.ts)
Changed `void` returns to meaningful `string` returns.

#### 35. [`plugin/system/src/commands/env/providers/index.ts`](plugin/system/src/commands/env/providers/index.ts)
Converted interface to type. Replaced mutable provider detection with functional pipeline.

#### 36. [`plugin/system/src/commands/env/providers/kind.ts`](plugin/system/src/commands/env/providers/kind.ts)
Changed `void` returns to meaningful `string` returns.

#### 37. [`plugin/system/src/commands/env/providers/minikube.ts`](plugin/system/src/commands/env/providers/minikube.ts)
Changed `void` returns to meaningful `string` returns.

#### 38. [`plugin/system/src/commands/env/index.ts`](plugin/system/src/commands/env/index.ts)
Converted `EnvArgs` interface to type.

---

### Commands: Hook

#### 39. [`plugin/system/src/commands/hook/prompt-commit.ts`](plugin/system/src/commands/hook/prompt-commit.ts)
Added `MatchingDirResult` discriminated union replacing `string | null`. Replaced `for` loop with `.find()`. Replaced mutable `readStdin` with chunks-array pattern.

```ts
+type MatchingDirResult =
+  | { readonly found: true; readonly dir: string }
+  | { readonly found: false };
```

#### 40. [`plugin/system/src/commands/hook/validate-write.ts`](plugin/system/src/commands/hook/validate-write.ts)
Added `BlockedPatternResult` discriminated union replacing `string | null`. Replaced `for` loop with `.find()`. Replaced mutable `readStdin` with chunks-array pattern.

```ts
+type BlockedPatternResult =
+  | { readonly matched: true; readonly pattern: string }
+  | { readonly matched: false };
```

#### 41. [`plugin/system/src/commands/hook/index.ts`](plugin/system/src/commands/hook/index.ts)
Converted `HookArgs` interface to type.

---

### Commands: Permissions

#### 42. [`plugin/system/src/commands/permissions/configure.ts`](plugin/system/src/commands/permissions/configure.ts)
Converted `PermissionSettings` interface to type. Replaced `Set` mutation loop with spread-based `mergePermissionArrays`. Updated `findProjectRoot` call site. Wrapped fallible reads in IIFE returning discriminated results.

```ts
-  const existingSet = new Set(existing ?? []);
-  for (const item of incomingItems) { existingSet.add(item); }
-  return [...existingSet];
+  return [...new Set([...existingItems, ...incomingItems])];
```

#### 43. [`plugin/system/src/commands/permissions/index.ts`](plugin/system/src/commands/permissions/index.ts)
Converted `PermissionsArgs` interface to type.

---

### Commands: Scaffolding

#### 44. [`plugin/system/src/commands/scaffolding/apply.ts`](plugin/system/src/commands/scaffolding/apply.ts)
Replaced `let _validate` singleton with `Map`-based cache in closure. Wrapped JSON parse in IIFE returning discriminated result. Replaced `for` loop in operation validation with `.reduce()`.

```ts
-let _validate: ReturnType<Ajv['compile']> | undefined;
-const getSchemaValidator = (): ReturnType<Ajv['compile']> => {
+const getSchemaValidator = (() => {
+  const cache = new Map<string, ReturnType<Ajv['compile']>>();
+  return (): ReturnType<Ajv['compile']> => {
```

#### 45. [`plugin/system/src/commands/scaffolding/domain.ts`](plugin/system/src/commands/scaffolding/domain.ts)
Replaced `let content; try { ... } catch { content = default }` with `.catch()`. Changed `updateSnapshot` from `Promise<void>` to `Promise<{ readonly updated: boolean }>`.

```ts
-  let content: string;
-  try { content = await readText(glossaryPath); }
-  catch { content = defaultContent; }
+  const content: string = await readText(glossaryPath).catch(() => defaultContent);
```

#### 46. [`plugin/system/src/commands/scaffolding/engine.ts`](plugin/system/src/commands/scaffolding/engine.ts)
Converted 9 interfaces to types (including `EqualsCondition`, `NotEmptyCondition`, `TemplateDirOp`, `MkdirOp`, `WriteFileOp`, `PackageJsonScriptsOp`, `ScaffoldSpec`, `EngineResult`, `OpResult`). Changed `extends` to `&` intersections. Replaced all mutable `for` loops + `.push()` in `handleTemplateDir`, `handlePackageJsonScripts`, and `executeSpec` with `.reduce()` and spread patterns.

```ts
-export interface TemplateDirOp extends FileOperationBase {
+export type TemplateDirOp = FileOperationBase & {
   readonly type: 'template_dir';
```

#### 47. [`plugin/system/src/commands/scaffolding/project.ts`](plugin/system/src/commands/scaffolding/project.ts)
Updated `findProjectRoot` call site. Replaced multiple mutable `let` + `try/catch` blocks with IIFE discriminated results. Replaced `.push()` accumulation patterns with spread-based immutable operations.

#### 48. [`plugin/system/src/commands/scaffolding/index.ts`](plugin/system/src/commands/scaffolding/index.ts)
Converted `ScaffoldingArgs` interface to type.

---

### Commands: Settings

#### 49. [`plugin/system/src/commands/settings/reconcile.ts`](plugin/system/src/commands/settings/reconcile.ts)
Updated `findProjectRoot` call site. Wrapped `readFileSync` and `readJson` calls in IIFEs returning discriminated results. Replaced emoji characters with unicode escapes.

```ts
-      const icon = c.type === 'removed' ? '✗' : '✓';
+      const icon = c.type === 'removed' ? '\u2717' : '\u2713';
```

#### 50. [`plugin/system/src/commands/settings/index.ts`](plugin/system/src/commands/settings/index.ts)
Converted `SettingsArgs` interface to type.

---

### Commands: Spec

#### 51. [`plugin/system/src/commands/spec/generate-index.ts`](plugin/system/src/commands/spec/generate-index.ts)
Fixed `reduce` type annotation: moved generic parameter from cast to type parameter position.

```ts
-  const byStatus = entries.reduce(
-    (acc, entry) => ({ ... }),
-    {} as Readonly<Record<string, readonly SpecEntry[]>>
+  const byStatus = entries.reduce<Readonly<Record<string, ReadonlyArray<SpecEntry>>>>(
+    (acc, entry) => ({ ... }),
+    {}
```

#### 52. [`plugin/system/src/commands/spec/generate-snapshot.ts`](plugin/system/src/commands/spec/generate-snapshot.ts)
Same `reduce` type annotation fix as generate-index.

#### 53. [`plugin/system/src/commands/spec/validate.ts`](plugin/system/src/commands/spec/validate.ts)
Updated `parseFrontmatter` call site to use `FrontmatterResult` discriminated union. Replaced mutable `errors.push()` accumulation with separate const arrays + spread composition.

```ts
-  const errors: ValidationError[] = [];
-  if (specType && ...) { errors.push({...}); }
+  const specTypeErrors: ReadonlyArray<ValidationError> =
+    specType && ... ? [{...}] : [];
+  return [...specTypeErrors, ...missingFieldErrors, ...changeTypeErrors, ...statusErrors, ...issueErrors];
```

#### 54. [`plugin/system/src/commands/spec/index.ts`](plugin/system/src/commands/spec/index.ts)
Converted `SpecArgs` interface to type.

---

### Commands: Version

#### 55. [`plugin/system/src/commands/version/bump.ts`](plugin/system/src/commands/version/bump.ts)
Added `ParseVersionResult` discriminated union replacing `VersionInfo | null`. Updated call site.

```ts
+type ParseVersionResult =
+  | { readonly parsed: true; readonly version: VersionInfo }
+  | { readonly parsed: false };
```

#### 56. [`plugin/system/src/commands/version/index.ts`](plugin/system/src/commands/version/index.ts)
Converted `VersionArgs` interface to type.

---

### Commands: Workflow

#### 57. [`plugin/system/src/commands/workflow/check-gate.ts`](plugin/system/src/commands/workflow/check-gate.ts)
Replaced imperative `flattenItems` (mutable `result` + `processItem` + `.push()`) with recursive `.flatMap()`. Replaced all 4 gate-check functions' mutable `blockingItems.push()` loops with `.reduce()`.

```ts
-const flattenItems = (items: readonly WorkflowItem[]): readonly WorkflowItem[] => {
-  const result: WorkflowItem[] = [];
-  const processItem = (item: ...): void => { ... result.push(item); };
-  items.forEach(processItem);
-  return result;
-};
+const flattenItems = (items: readonly WorkflowItem[]): readonly WorkflowItem[] =>
+  items.flatMap((item) =>
+    item.type === 'epic' && item.children ? flattenItems(item.children) : [item]
+  );
```

#### 58. [`plugin/system/src/commands/workflow/index.ts`](plugin/system/src/commands/workflow/index.ts)
Converted `WorkflowArgs` interface to type.

---

### CLI Entry

#### 59. [`plugin/system/src/cli.ts`](plugin/system/src/cli.ts)
Converted `RawLoggingConfig` interface to type. Added `LoadLoggingConfigResult` discriminated union. Updated all `findProjectRoot`, `loadLoggingConfig`, and `createFileLogger` call sites to use discriminated union results. Replaced unsafe `as Record<string, unknown>` casts with narrowing type checks.

```ts
-  const projectRoot = await findProjectRoot();
-  const fileLogger = createFileLogger({
-    enabled: loggingConfig.enabled && projectRoot !== null,
+  const projectRootResult: ProjectRootResult = await findProjectRoot();
+  const projectRoot = projectRootResult.found ? projectRootResult.path : undefined;
+  const logResult: FileLoggerResult = createFileLogger({
+    enabled: loggingConfig.enabled && projectRoot !== undefined,
```

---

### Settings System

#### 60. [`plugin/system/src/settings/reconcile.ts`](plugin/system/src/settings/reconcile.ts)
Converted 3 interfaces (`ReconciliationChange`, `ReconciliationWarning`, `ReconciliationResult`) to types. Eliminated all `let` declarations and mutable `changes.push()`/`warnings.push()` accumulation. Replaced with per-section immutable change arrays (`initVersionChanges`, `updateVersionChanges`, `initAtChanges`, etc.) composed via spread at the end. Replaced mutable `reconciledComponents` loop with `.reduce()`. Replaced filesystem warning loops with `.filter().map()` and `.flatMap()`.

```ts
-  const changes: ReconciliationChange[] = [];
-  const warnings: ReconciliationWarning[] = [];
   ...
+  const changes: readonly ReconciliationChange[] = [
+    ...initVersionChanges,
+    ...updateVersionChanges,
+    ...initAtChanges,
+    ...updatedAtChanges,
+    ...removedFieldChanges,
+    ...deprecatedProjectChanges,
+    ...componentChanges,
+    ...systemChanges,
+  ];
```

#### 61. [`plugin/system/src/settings/sync-helm.ts`](plugin/system/src/settings/sync-helm.ts)
Converted `HelmTemplateSet` interface to type. Replaced all `conditional.push()` with declarative spread arrays. Replaced mutable `values[key] = ...` bracket assignment in `generateServerHelmValues` and `generateWebappHelmValues` with spread composition of `baseValues`, `modeValues`, `serviceValues`, `ingressValues`.

```ts
-  const conditional: string[] = [];
-  if (deployModes.includes('api')) { conditional.push('deployment-api.yaml'); }
+  const deployTemplates: readonly string[] =
+    deployModes.length > 1
+      ? [...(deployModes.includes('api') ? ['deployment-api.yaml'] : []),
+         ...(deployModes.includes('worker') ? ['deployment-worker.yaml'] : []),
+         ...(deployModes.includes('cron') ? ['cronjob.yaml'] : [])]
```

#### 62. [`plugin/system/src/settings/sync.ts`](plugin/system/src/settings/sync.ts)
Replaced all mutable `for` loops + `.push()` in settings sync operations with `.map()`, `.flatMap()`, and `.reduce()`. Changed `Record<K,V>` to `Readonly<Record<K,V>>`. Replaced `void` returns with meaningful values.

#### 63. [`plugin/system/src/settings/validate.ts`](plugin/system/src/settings/validate.ts)
Replaced all mutable `errors.push()` accumulation patterns with `const` arrays composed via spread. Replaced `for` loops with `.flatMap()` and `.filter().map()`.

---

### Command Index Files

#### 64-72. All `index.ts` files
Converted `*Args` interface to type in all 11 command namespace index files: `config`, `contract`, `database`, `env`, `hook`, `permissions`, `scaffolding`, `settings`, `spec`, `version`, `workflow`.

---

### Tests

#### 73. [`plugin/system/src/tests/unit/commands/env/check-tools.test.ts`](plugin/system/src/tests/unit/commands/env/check-tools.test.ts)
Updated 4 assertions to reflect removal of `null` fields (`version: null` and `installHint: null`) and change to optional properties.

```ts
-        version: null,
-        installHint: 'brew install kubectl',
+        installHint: 'brew install kubectl',
```

#### 74. [`plugin/system/src/tests/unit/settings/settings-reconcile.test.ts`](plugin/system/src/tests/unit/settings/settings-reconcile.test.ts)
Updated 4 assertions checking emoji characters to use unicode escapes.

```ts
-      expect(formatted).toContain('✓');
+      expect(formatted).toContain('\u2713');
```

#### 75. [`plugin/system/src/tests/unit/settings/settings-sync.test.ts`](plugin/system/src/tests/unit/settings/settings-sync.test.ts)
Updated 6 assertions to match new `Readonly<Record<>>` return types and adjusted expected values.

#### 76. [`plugin/system/src/tests/unit/settings/settings-types.test.ts`](plugin/system/src/tests/unit/settings/settings-types.test.ts)
Updated 14 assertions checking source file content. Changed expected patterns from `interface` to `type` for data shapes. Kept `interface` expectations for `Logger` and `ClusterProviderOps`.

```ts
-      expect(content).toMatch(/^export interface SettingsFile/m);
+      expect(content).toMatch(/^export type SettingsFile/m);
```

#### 77. [`plugin/system/src/tests/unit/settings/settings-validation.test.ts`](plugin/system/src/tests/unit/settings/settings-validation.test.ts)
Updated 2 assertions for minor formatting changes in validation output.

---

### Version & Changelog

#### 78. [`plugin/.claude-plugin/plugin.json`](plugin/.claude-plugin/plugin.json)
Version bump: `6.7.2` to `6.7.3`.

#### 79. [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)
Version bump: `6.7.2` to `6.7.3`.

#### 80. [`changelog/v6.md`](changelog/v6.md)
Added `[6.7.3]` changelog entry documenting all violation categories fixed with counts.

---

### Command Handler Extraction (index.ts -> handler.ts + schema.ts)

All 11 command namespaces had their dispatch logic extracted from `index.ts` into separate `handler.ts` and `schema.ts` files. Each `index.ts` now contains only pure re-exports.

#### Pattern Applied to All 11 Commands

**New `schema.ts`:** Exports `ACTIONS` constant, `CommandSchema`, and `Args` type.
**New `handler.ts`:** Exports `handleX` function with validation + switch dispatch.
**Modified `index.ts`:** Pure re-exports only (e.g., `export { handleConfig } from './handler'`).

Commands: `config`, `contract`, `database`, `env`, `hook`, `permissions`, `scaffolding`, `settings`, `spec`, `version`, `workflow` (22 new files + 11 modified index.ts files).

---

### Test Fix

#### 82. [`tests/src/tests/unit/commands/env/check-tools.test.ts`](tests/src/tests/unit/commands/env/check-tools.test.ts)
Updated test to check `handler.ts` instead of `index.ts` for action registration (dispatch logic moved).

---

### Plan Update

#### 83. [`.tasks/4-implementing/122/plan.md`](.tasks/4-implementing/122/plan.md)
Updated plan with corrected file counts and provider-layer violations.

---

### Final Audit Pass — Remaining Violations

Exhaustive file-by-file audit of all 95 `.ts` files caught additional violations missed in the initial batch fixes.

#### 84. [`plugin/system/src/types/spec.ts`](plugin/system/src/types/spec.ts)
Derived union types from `as const` arrays instead of manual duplication.

```ts
-export type SpecType = 'product' | 'tech';
-export type ChangeType = 'feature' | 'bugfix' | 'refactor' | 'epic';
+export type SpecType = (typeof VALID_SPEC_TYPES)[number];
+export type ChangeType = (typeof VALID_CHANGE_TYPES)[number];
```

#### 85. [`plugin/system/src/types/workflow.ts`](plugin/system/src/types/workflow.ts)
Derived 5 union types from `as const` arrays + removed redundant type annotations on const arrays.

```ts
-export type SpecStatus = 'pending' | 'in_progress' | 'ready_for_review' | 'approved' | 'needs_rereview';
-export const VALID_SPEC_STATUSES: readonly SpecStatus[] = [...] as const;
+export const VALID_SPEC_STATUSES = [...] as const;
+export type SpecStatus = (typeof VALID_SPEC_STATUSES)[number];
```

#### 86. [`plugin/system/src/lib/logger.ts`](plugin/system/src/lib/logger.ts)
Bracket notation for `process.env` + `??` instead of `||`.

```ts
-sessionId: process.env.CLAUDE_SESSION_ID || undefined,
+sessionId: process.env['CLAUDE_SESSION_ID'] ?? undefined,
```

#### 87. [`plugin/system/src/lib/schema-validator.ts`](plugin/system/src/lib/schema-validator.ts)
Converted `ValidationResult<T>` to discriminated union + `ReadonlySet` for `requiredSet`.

```ts
-export type ValidationResult<T> = {
-  readonly valid: boolean;
-  readonly data?: T;
-  readonly errors?: readonly ValidationError[];
-}
+export type ValidationResult<T> =
+  | { readonly valid: true; readonly data: T }
+  | { readonly valid: false; readonly errors: readonly ValidationError[] };

-const requiredSet = new Set(schema.required ?? []);
+const requiredSet: ReadonlySet<string> = new Set(schema.required ?? []);
```

#### 88. [`plugin/system/src/commands/config/diff.ts`](plugin/system/src/commands/config/diff.ts)
`ReadonlySet` for `allKeys`.

```ts
-const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
+const allKeys: ReadonlySet<string> = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
```

#### 89. [`plugin/system/src/commands/settings/reconcile.ts`](plugin/system/src/commands/settings/reconcile.ts) (command)
`ReadonlySet` for `trackedPaths`.

#### 90. [`plugin/system/src/settings/sync.ts`](plugin/system/src/settings/sync.ts)
`ReadonlyMap` for `oldByKey`/`newByKey` + `ReadonlySet` for `allKeys`.

#### 91. [`plugin/system/src/settings/validate.ts`](plugin/system/src/settings/validate.ts)
`ReadonlySet` (x6) for name sets + `ReadonlyMap` (x2) for settings maps with proper value types (`ServerSettings`, `{ readonly helm?: boolean }`).

#### 92-102. All 11 `handler.ts` files
Removed `!` non-null assertions — now unnecessary due to `ValidationResult<T>` discriminated union enabling TypeScript narrowing.

```ts
-formatValidationErrors(validation.errors!)
-const validatedArgs = validation.data!;
+formatValidationErrors(validation.errors)
+const validatedArgs = validation.data;
```

Commands affected: `config`, `contract`, `database`, `env`, `hook`, `permissions`, `scaffolding`, `settings`, `spec`, `version`, `workflow`.
