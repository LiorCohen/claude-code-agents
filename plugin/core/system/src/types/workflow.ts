/**
 * Type definitions for workflow operations.
 */

// Status field types — derived from const arrays below
export type SpecStatus = (typeof VALID_SPEC_STATUSES)[number];
export type PlanStatus = (typeof VALID_PLAN_STATUSES)[number];
export type ImplStatus = (typeof VALID_IMPL_STATUSES)[number];
export type ReviewStatus = (typeof VALID_REVIEW_STATUSES)[number];

// Workflow phases
export type WorkflowPhase = (typeof VALID_WORKFLOW_PHASES)[number];

// Workflow item with four-field status model
export type WorkflowItem = {
  readonly id: string;
  readonly change_id: string;
  readonly title: string;
  readonly type: 'feature' | 'bugfix' | 'refactor' | 'epic';
  readonly spec_status: SpecStatus;
  readonly plan_status: PlanStatus;
  readonly impl_status: ImplStatus;
  readonly review_status: ReviewStatus;
  readonly depends_on: readonly string[];
  readonly location?: string;
}

// Workflow state from workflow.yaml
export type WorkflowState = {
  readonly id: string;
  readonly name: string;
  readonly source: 'external' | 'interactive';
  readonly created: string;
  readonly current?: string;
  readonly phase: WorkflowPhase;
  readonly step: string;
  readonly progress: WorkflowProgress;
  readonly items: readonly WorkflowItem[];
}

export type WorkflowProgress = {
  readonly total_items: number;
  readonly specs_completed: number;
  readonly specs_pending: number;
  readonly plans_completed: number;
  readonly plans_pending: number;
  readonly implemented: number;
  readonly reviewed: number;
}

// Phase gate check result
export type PhaseGateResult = {
  readonly can_advance: boolean;
  readonly blocking_items: readonly BlockingItem[];
  readonly message: string;
}

export type BlockingItem = {
  readonly change_id: string;
  readonly title: string;
  readonly current_status: string;
  readonly reason: string;
}

// Open question from spec
export type OpenQuestion = {
  readonly id: string;
  readonly question: string;
  readonly status: 'OPEN' | 'ANSWERED' | 'ASSUMED' | 'DEFERRED';
  readonly blocker_for?: string;
}

// Valid status values
export const VALID_SPEC_STATUSES = [
  'pending',
  'in_progress',
  'ready_for_review',
  'approved',
  'needs_rereview',
] as const;

export const VALID_PLAN_STATUSES = ['pending', 'in_progress', 'approved'] as const;

export const VALID_IMPL_STATUSES = ['pending', 'in_progress', 'complete'] as const;

export const VALID_REVIEW_STATUSES = [
  'pending',
  'ready_for_review',
  'approved',
  'changes_requested',
] as const;

export const VALID_WORKFLOW_PHASES = ['spec', 'plan', 'implement', 'review'] as const;
