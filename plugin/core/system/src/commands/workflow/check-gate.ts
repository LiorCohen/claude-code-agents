/**
 * Workflow phase gate check command.
 *
 * Validates that all prerequisites are met before advancing to a target phase.
 *
 * Usage:
 *   sdd-system workflow check-gate --target plan --workflow-file sdd/workflows/a1b2c3-user-auth/workflow.yaml
 *   sdd-system workflow check-gate --target implement --workflow-file sdd/workflows/a1b2c3-user-auth/workflow.yaml
 */

import type { CommandResult } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { exists, readText } from '@/lib/fs';
import { parse as parseYaml } from 'yaml';
import type {
  WorkflowState,
  WorkflowItem,
  WorkflowPhase,
  PhaseGateResult,
  BlockingItem,
} from '@/types/workflow';
import { VALID_WORKFLOW_PHASES } from '@/types/workflow';

/**
 * Check if an item's spec is approved (for phase gating).
 */
const isSpecApproved = (item: WorkflowItem): boolean => item.spec_status === 'approved';

/**
 * Check if an item's plan is approved (for phase gating).
 */
const isPlanApproved = (item: WorkflowItem): boolean => item.plan_status === 'approved';

/**
 * Check if an item's implementation is complete (for phase gating).
 */
const isImplComplete = (item: WorkflowItem): boolean => item.impl_status === 'complete';

/**
 * Check if an item's review is approved (for workflow completion).
 */
const isReviewApproved = (item: WorkflowItem): boolean => item.review_status === 'approved';

/**
 * Check if spec has stale dependencies (needs re-review).
 */
const hasStaleDepdendencies = (item: WorkflowItem): boolean => item.spec_status === 'needs_rereview';

/**
 * Flatten hierarchical items (extract children from epics).
 */
const flattenItems = (items: readonly WorkflowItem[]): readonly WorkflowItem[] =>
  items.flatMap((item: WorkflowItem & { children?: readonly WorkflowItem[] }) =>
    item.type === 'epic' && item.children
      ? flattenItems(item.children)
      : [item]
  );

/**
 * Check phase gate for plan phase (all specs must be approved).
 */
const checkPlanGate = (items: readonly WorkflowItem[]): PhaseGateResult => {
  const flatItems = flattenItems(items);
  const blockingItems: readonly BlockingItem[] = flatItems.reduce<readonly BlockingItem[]>(
    (acc, item) => {
      if (hasStaleDepdendencies(item)) {
        return [
          ...acc,
          {
            change_id: item.change_id,
            title: item.title,
            current_status: item.spec_status,
            reason: 'Spec needs re-review (upstream dependency changed)',
          },
        ];
      }
      if (!isSpecApproved(item)) {
        return [
          ...acc,
          {
            change_id: item.change_id,
            title: item.title,
            current_status: item.spec_status,
            reason: `Spec not approved (status: ${item.spec_status})`,
          },
        ];
      }
      return acc;
    },
    []
  );

  if (blockingItems.length > 0) {
    return {
      can_advance: false,
      blocking_items: blockingItems,
      message: `Cannot start planning - ${blockingItems.length} spec(s) not approved`,
    };
  }

  return {
    can_advance: true,
    blocking_items: [],
    message: 'All specs approved - ready for planning phase',
  };
};

/**
 * Check phase gate for implement phase (all plans must be approved).
 */
const checkImplementGate = (items: readonly WorkflowItem[]): PhaseGateResult => {
  const flatItems = flattenItems(items);
  const blockingItems: readonly BlockingItem[] = flatItems.reduce<readonly BlockingItem[]>(
    (acc, item) =>
      !isPlanApproved(item)
        ? [
            ...acc,
            {
              change_id: item.change_id,
              title: item.title,
              current_status: item.plan_status,
              reason: `Plan not approved (status: ${item.plan_status})`,
            },
          ]
        : acc,
    []
  );

  if (blockingItems.length > 0) {
    return {
      can_advance: false,
      blocking_items: blockingItems,
      message: `Cannot start implementation - ${blockingItems.length} plan(s) not approved`,
    };
  }

  return {
    can_advance: true,
    blocking_items: [],
    message: 'All plans approved - ready for implementation phase',
  };
};

/**
 * Check phase gate for review phase (all implementations must be complete).
 */
const checkReviewGate = (items: readonly WorkflowItem[]): PhaseGateResult => {
  const flatItems = flattenItems(items);
  const blockingItems: readonly BlockingItem[] = flatItems.reduce<readonly BlockingItem[]>(
    (acc, item) =>
      !isImplComplete(item)
        ? [
            ...acc,
            {
              change_id: item.change_id,
              title: item.title,
              current_status: item.impl_status,
              reason: `Implementation not complete (status: ${item.impl_status})`,
            },
          ]
        : acc,
    []
  );

  if (blockingItems.length > 0) {
    return {
      can_advance: false,
      blocking_items: blockingItems,
      message: `Cannot start review - ${blockingItems.length} implementation(s) not complete`,
    };
  }

  return {
    can_advance: true,
    blocking_items: [],
    message: 'All implementations complete - ready for review phase',
  };
};

/**
 * Check workflow completion gate (all reviews must be approved).
 */
const checkCompletionGate = (items: readonly WorkflowItem[]): PhaseGateResult => {
  const flatItems = flattenItems(items);
  const blockingItems: readonly BlockingItem[] = flatItems.reduce<readonly BlockingItem[]>(
    (acc, item) =>
      !isReviewApproved(item)
        ? [
            ...acc,
            {
              change_id: item.change_id,
              title: item.title,
              current_status: item.review_status,
              reason: `Review not approved (status: ${item.review_status})`,
            },
          ]
        : acc,
    []
  );

  if (blockingItems.length > 0) {
    return {
      can_advance: false,
      blocking_items: blockingItems,
      message: `Cannot complete workflow - ${blockingItems.length} review(s) not approved`,
    };
  }

  return {
    can_advance: true,
    blocking_items: [],
    message: 'All reviews approved - workflow can be completed',
  };
};

/**
 * Check phase gate for a target phase.
 */
const checkPhaseGate = (workflow: WorkflowState, targetPhase: WorkflowPhase): PhaseGateResult => {
  switch (targetPhase) {
    case 'plan':
      return checkPlanGate(workflow.items);
    case 'implement':
      return checkImplementGate(workflow.items);
    case 'review':
      return checkReviewGate(workflow.items);
    case 'spec':
      // Can always be in spec phase
      return {
        can_advance: true,
        blocking_items: [],
        message: 'Spec phase has no prerequisites',
      };
    default:
      return {
        can_advance: false,
        blocking_items: [],
        message: `Unknown target phase: ${targetPhase}`,
      };
  }
};

export const checkGate = async (args: readonly string[]): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  const targetPhase = named['target'] as WorkflowPhase | undefined;
  const workflowFile = named['workflow-file'];
  const checkCompletion = named['check-completion'] === 'true';

  if (!workflowFile) {
    return {
      success: false,
      error: 'Missing --workflow-file argument. Usage: sdd-system workflow check-gate --target plan --workflow-file <path>',
    };
  }

  if (!targetPhase && !checkCompletion) {
    return {
      success: false,
      error: 'Missing --target argument. Must be one of: spec, plan, implement, review. Or use --check-completion.',
    };
  }

  if (targetPhase && !(VALID_WORKFLOW_PHASES as readonly string[]).includes(targetPhase)) {
    return {
      success: false,
      error: `Invalid target phase '${targetPhase}'. Must be one of: ${VALID_WORKFLOW_PHASES.join(', ')}`,
    };
  }

  if (!(await exists(workflowFile))) {
    return {
      success: false,
      error: `Workflow file not found: ${workflowFile}`,
    };
  }

  const content = await readText(workflowFile);
  const workflow = parseYaml(content) as WorkflowState;

  if (!workflow.items || !Array.isArray(workflow.items)) {
    return {
      success: false,
      error: 'Invalid workflow.yaml: missing items array',
    };
  }

  const result = checkCompletion
    ? checkCompletionGate(workflow.items)
    : checkPhaseGate(workflow, targetPhase!);

  if (!result.can_advance) {
    const blockingList = result.blocking_items
      .map((item) => `  - ${item.change_id} (${item.title}): ${item.reason}`)
      .join('\n');

    return {
      success: false,
      error: `Phase gate check failed:\n${result.message}\n\nBlocking items:\n${blockingList}`,
      data: result,
    };
  }

  return {
    success: true,
    message: result.message,
    data: result,
  };
};
