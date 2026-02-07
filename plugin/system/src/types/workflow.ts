/**
 * Type definitions for workflow operations.
 */

// Status field types
export type SpecStatus = 'pending' | 'in_progress' | 'ready_for_review' | 'approved' | 'needs_rereview';
export type PlanStatus = 'pending' | 'in_progress' | 'approved';
export type ImplStatus = 'pending' | 'in_progress' | 'complete';
export type ReviewStatus = 'pending' | 'ready_for_review' | 'approved' | 'changes_requested';

// Workflow phases
export type WorkflowPhase = 'spec' | 'plan' | 'implement' | 'review';

// Workflow item with four-field status model
export interface WorkflowItem {
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
export interface WorkflowState {
  readonly id: string;
  readonly source: 'external' | 'interactive';
  readonly created: string;
  readonly current?: string;
  readonly phase: WorkflowPhase;
  readonly step: string;
  readonly progress: WorkflowProgress;
  readonly items: readonly WorkflowItem[];
}

export interface WorkflowProgress {
  readonly total_items: number;
  readonly specs_completed: number;
  readonly specs_pending: number;
  readonly plans_completed: number;
  readonly plans_pending: number;
  readonly implemented: number;
  readonly reviewed: number;
}

// Phase gate check result
export interface PhaseGateResult {
  readonly can_advance: boolean;
  readonly blocking_items: readonly BlockingItem[];
  readonly message: string;
}

export interface BlockingItem {
  readonly change_id: string;
  readonly title: string;
  readonly current_status: string;
  readonly reason: string;
}

// Open question from spec
export interface OpenQuestion {
  readonly id: string;
  readonly question: string;
  readonly status: 'OPEN' | 'ANSWERED' | 'ASSUMED' | 'DEFERRED';
  readonly blocker_for?: string;
}

// Valid status values
export const VALID_SPEC_STATUSES: readonly SpecStatus[] = [
  'pending',
  'in_progress',
  'ready_for_review',
  'approved',
  'needs_rereview',
] as const;

export const VALID_PLAN_STATUSES: readonly PlanStatus[] = ['pending', 'in_progress', 'approved'] as const;

export const VALID_IMPL_STATUSES: readonly ImplStatus[] = ['pending', 'in_progress', 'complete'] as const;

export const VALID_REVIEW_STATUSES: readonly ReviewStatus[] = [
  'pending',
  'ready_for_review',
  'approved',
  'changes_requested',
] as const;

export const VALID_WORKFLOW_PHASES: readonly WorkflowPhase[] = ['spec', 'plan', 'implement', 'review'] as const;
