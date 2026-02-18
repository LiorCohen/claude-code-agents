import type {
  ParsedWorkflow,
  ParsedLeafItem,
  ApprovalNotification,
} from '../types';

const getLeafItems = (
  workflow: ParsedWorkflow,
): ReadonlyArray<ParsedLeafItem> =>
  workflow.items.filter(
    (item): item is ParsedLeafItem => item.type !== 'epic',
  );

const findLeafById = (
  workflows: ReadonlyArray<ParsedWorkflow>,
  workflowId: string,
  itemId: string,
): ParsedLeafItem | undefined => {
  const workflow = workflows.find((w) => w.id === workflowId);
  if (!workflow) return undefined;
  return getLeafItems(workflow).find((i) => i.id === itemId);
};

export const detectTransitions = (
  previous: ReadonlyArray<ParsedWorkflow>,
  current: ReadonlyArray<ParsedWorkflow>,
): ReadonlyArray<ApprovalNotification> =>
  current.flatMap((currWorkflow): ReadonlyArray<ApprovalNotification> => {
    const prevWorkflow = previous.find((w) => w.id === currWorkflow.id);
    if (!prevWorkflow) return [];

    const currLeaves = getLeafItems(currWorkflow);
    const prevLeaves = getLeafItems(prevWorkflow);

    const itemTransitions = currLeaves.flatMap(
      (currItem): ReadonlyArray<ApprovalNotification> => {
        const prevItem = findLeafById(previous, currWorkflow.id, currItem.id);
        if (!prevItem) return [];

        return [
          ...(prevItem.specStatus !== 'ready_for_review' &&
          currItem.specStatus === 'ready_for_review'
            ? [
                {
                  type: 'spec_ready_for_review' as const,
                  workflowId: currWorkflow.id,
                  itemTitle: currItem.title,
                  itemLocation: currItem.location,
                },
              ]
            : []),
          ...(prevItem.implStatus !== 'complete' &&
          currItem.implStatus === 'complete'
            ? [
                {
                  type: 'implementation_complete' as const,
                  workflowId: currWorkflow.id,
                  itemTitle: currItem.title,
                  itemLocation: currItem.location,
                },
              ]
            : []),
          ...(prevItem.reviewStatus !== 'changes_requested' &&
          currItem.reviewStatus === 'changes_requested'
            ? [
                {
                  type: 'changes_requested' as const,
                  workflowId: currWorkflow.id,
                  itemTitle: currItem.title,
                  itemLocation: currItem.location,
                },
              ]
            : []),
        ];
      },
    );

    const prevAllSpecsApproved =
      prevLeaves.length > 0 &&
      prevLeaves.every((i) => i.specStatus === 'approved');
    const currAllSpecsApproved =
      currLeaves.length > 0 &&
      currLeaves.every((i) => i.specStatus === 'approved');

    const prevAllReviewApproved =
      prevLeaves.length > 0 &&
      prevLeaves.every((i) => i.reviewStatus === 'approved');
    const currAllReviewApproved =
      currLeaves.length > 0 &&
      currLeaves.every((i) => i.reviewStatus === 'approved');

    return [
      ...itemTransitions,
      ...(!prevAllSpecsApproved && currAllSpecsApproved
        ? [{ type: 'all_specs_approved' as const, workflowId: currWorkflow.id }]
        : []),
      ...(!prevAllReviewApproved && currAllReviewApproved
        ? [{ type: 'workflow_complete' as const, workflowId: currWorkflow.id }]
        : []),
    ];
  });
