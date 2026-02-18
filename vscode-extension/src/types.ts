// Status value constants — match the YAML schema exactly

export const SPEC_STATUSES = [
  'pending',
  'in_progress',
  'ready_for_review',
  'approved',
  'needs_rereview',
] as const;
export type SpecStatus = (typeof SPEC_STATUSES)[number];

export const PLAN_STATUSES = ['pending', 'in_progress', 'approved'] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const IMPL_STATUSES = ['pending', 'in_progress', 'complete'] as const;
export type ImplStatus = (typeof IMPL_STATUSES)[number];

export const REVIEW_STATUSES = [
  'pending',
  'ready_for_review',
  'approved',
  'changes_requested',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const PHASES = ['spec', 'plan', 'implement', 'review'] as const;
export type Phase = (typeof PHASES)[number];

export const ITEM_TYPES = [
  'epic',
  'feature',
  'bugfix',
  'refactor',
  'infrastructure',
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

// Raw YAML types — what comes out of the YAML parser

export type WorkflowProgressYaml = {
  readonly total_items: number;
  readonly specs_completed: number;
  readonly specs_pending: number;
  readonly plans_completed: number;
  readonly plans_pending: number;
  readonly implemented: number;
  readonly reviewed: number;
};

export type RegressionYaml = {
  readonly from_phase: Phase;
  readonly to_phase: Phase;
  readonly reason: string;
  readonly timestamp: string;
  readonly preserved_work?: ReadonlyArray<{
    readonly path: string;
    readonly type: string;
    readonly description: string;
  }>;
};

type WorkflowItemYamlBase = {
  readonly id: string;
  readonly title: string;
  readonly type: ItemType;
  readonly context_sections?: ReadonlyArray<string>;
  readonly depends_on?: ReadonlyArray<string>;
};

// Epic items have children but NO status fields, NO change_id, NO location
export type EpicItemYaml = WorkflowItemYamlBase & {
  readonly type: 'epic';
  readonly children: ReadonlyArray<WorkflowItemYaml>;
};

// Leaf items have status fields, change_id, location, but NO children
export type LeafItemYaml = WorkflowItemYamlBase & {
  readonly type: Exclude<ItemType, 'epic'>;
  readonly change_id: string;
  readonly location: string;
  readonly spec_status: SpecStatus;
  readonly plan_status: PlanStatus;
  readonly impl_status: ImplStatus;
  readonly review_status: ReviewStatus;
  readonly substep?: string;
  readonly regression?: RegressionYaml;
};

export type WorkflowItemYaml = EpicItemYaml | LeafItemYaml;

// Parsed types — display-ready, flattened for tree/status bar

type ParsedItemBase = {
  readonly id: string;
  readonly title: string;
  readonly type: ItemType;
  readonly workflowId: string;
  readonly parentId: string | undefined;
  readonly dependsOn: ReadonlyArray<string>;
};

export type ParsedLeafItem = ParsedItemBase & {
  readonly type: Exclude<ItemType, 'epic'>;
  readonly changeId: string;
  readonly location: string;
  readonly specStatus: SpecStatus;
  readonly planStatus: PlanStatus;
  readonly implStatus: ImplStatus;
  readonly reviewStatus: ReviewStatus;
  readonly substep?: string;
};

export type ParsedEpicItem = ParsedItemBase & {
  readonly type: 'epic';
  readonly childIds: ReadonlyArray<string>;
};

export type ParsedItem = ParsedLeafItem | ParsedEpicItem;

export type ParsedWorkflow = {
  readonly id: string;
  readonly source: 'external' | 'interactive';
  readonly phase: Phase;
  readonly step: string;
  readonly progress: WorkflowProgressYaml;
  readonly items: ReadonlyArray<ParsedItem>;
};

// Result type for parser

export type ParseOk<T> = {
  readonly ok: true;
  readonly data: T;
};

export type ParseError = {
  readonly ok: false;
  readonly error: string;
};

export type ParseResult<T> = ParseOk<T> | ParseError;

// Overall status for leading tree icon

export type OverallItemStatus =
  | 'complete'
  | 'in_progress'
  | 'needs_attention'
  | 'pending';

// Messages between extension and webview

export type ShowItemMessage = {
  readonly type: 'showItem';
  readonly item: ParsedItem;
  readonly allItems: ReadonlyArray<ParsedItem>;
  readonly workflowId: string;
};

export type OpenFileMessage = {
  readonly type: 'openFile';
  readonly filePath: string;
};

export type SelectItemMessage = {
  readonly type: 'selectItem';
  readonly itemId: string;
};

export type ExtensionToWebviewMessage = ShowItemMessage;
export type WebviewToExtensionMessage = OpenFileMessage | SelectItemMessage;

// Notification types for approval gates

export type ApprovalNotification = {
  readonly type:
    | 'spec_ready_for_review'
    | 'all_specs_approved'
    | 'implementation_complete'
    | 'changes_requested'
    | 'workflow_complete';
  readonly workflowId: string;
  readonly itemTitle?: string;
  readonly itemLocation?: string;
};
