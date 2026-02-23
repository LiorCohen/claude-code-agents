export type { ComponentEntry, ScaffoldingConfig, ScaffoldingResult, DomainConfig, UserPersona, PopulationResult } from './component';

export type { PluginJson, HookInput, HookToolInput, PreToolUseHookOutput, PostToolUseHookOutput } from './config';

// settings: types
export type { ServerMode, ServerType, ServerSettings, WebappSettings, HelmAssets, HelmServerSettings, HelmWebappSettings, HelmSettings, DatabaseProvider, DatabaseSettings, ContractVisibility, ContractSettings, ConfigSettings, TestingSettings, CicdSettings, LogLevel, LoggingSettings, SystemSettings, ComponentType, ComponentSettingsMap, ComponentSettings, ComponentBase, ServerComponent, WebappComponent, HelmComponent, DatabaseComponent, ContractComponent, ConfigComponent, TestingComponent, CicdComponent, Component, SddMetadata, ProjectMetadata, SettingsFile } from './settings';
// settings: runtime type guards (NOT export type)
export { isServerComponent, isWebappComponent, isHelmComponent, isDatabaseComponent, isContractComponent, isConfigComponent, isTestingComponent, isCicdComponent, isHelmServerSettings, isHelmWebappSettings } from './settings';

// spec: types
export type { ValidationError, SpecEntry, ActiveSpec, SpecType, ChangeType } from './spec';
// spec: runtime values
export { PRODUCT_SPEC_REQUIRED_FIELDS, TECH_SPEC_REQUIRED_FIELDS, REQUIRED_FIELDS, VALID_SPEC_TYPES, VALID_CHANGE_TYPES, VALID_STATUSES, PLACEHOLDER_ISSUES } from './spec';

// workflow: types
export type { SpecStatus, PlanStatus, ImplStatus, ReviewStatus, WorkflowPhase, WorkflowItem, WorkflowState, WorkflowProgress, PhaseGateResult, BlockingItem, OpenQuestion } from './workflow';
// workflow: runtime values
export { VALID_SPEC_STATUSES, VALID_PLAN_STATUSES, VALID_IMPL_STATUSES, VALID_REVIEW_STATUSES, VALID_WORKFLOW_PHASES } from './workflow';
