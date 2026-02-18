import { parse as parseYaml } from 'yaml';
import type {
  WorkflowItemYaml,
  EpicItemYaml,
  LeafItemYaml,
  ParsedWorkflow,
  ParsedItem,
  ParsedLeafItem,
  ParsedEpicItem,
  ParseResult,
  SpecStatus,
  PlanStatus,
  ImplStatus,
  ReviewStatus,
  ItemType,
  Phase,
} from './types';
import {
  SPEC_STATUSES,
  PLAN_STATUSES,
  IMPL_STATUSES,
  REVIEW_STATUSES,
  ITEM_TYPES,
  PHASES,
} from './types';

const isValidStatus = <T extends string>(
  value: unknown,
  valid: ReadonlyArray<T>,
): value is T =>
  typeof value === 'string' && valid.includes(value as T);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validateLeafItem = (
  raw: Record<string, unknown>,
): ParseResult<LeafItemYaml> => {
  if (typeof raw.change_id !== 'string') {
    return { ok: false, error: `Item "${raw.id}" missing change_id` };
  }
  if (typeof raw.location !== 'string') {
    return { ok: false, error: `Item "${raw.id}" missing location` };
  }
  if (!isValidStatus(raw.spec_status, SPEC_STATUSES)) {
    return {
      ok: false,
      error: `Item "${raw.id}" has invalid spec_status: "${String(raw.spec_status)}"`,
    };
  }
  if (!isValidStatus(raw.plan_status, PLAN_STATUSES)) {
    return {
      ok: false,
      error: `Item "${raw.id}" has invalid plan_status: "${String(raw.plan_status)}"`,
    };
  }
  if (!isValidStatus(raw.impl_status, IMPL_STATUSES)) {
    return {
      ok: false,
      error: `Item "${raw.id}" has invalid impl_status: "${String(raw.impl_status)}"`,
    };
  }
  if (!isValidStatus(raw.review_status, REVIEW_STATUSES)) {
    return {
      ok: false,
      error: `Item "${raw.id}" has invalid review_status: "${String(raw.review_status)}"`,
    };
  }

  return {
    ok: true,
    data: {
      id: raw.id as string,
      title: raw.title as string,
      type: raw.type as Exclude<ItemType, 'epic'>,
      change_id: raw.change_id,
      location: raw.location,
      spec_status: raw.spec_status as SpecStatus,
      plan_status: raw.plan_status as PlanStatus,
      impl_status: raw.impl_status as ImplStatus,
      review_status: raw.review_status as ReviewStatus,
      substep:
        raw.substep === undefined || raw.substep === null
          ? undefined
          : (raw.substep as string),
      context_sections: Array.isArray(raw.context_sections)
        ? (raw.context_sections as ReadonlyArray<string>)
        : undefined,
      depends_on: Array.isArray(raw.depends_on)
        ? (raw.depends_on as ReadonlyArray<string>)
        : undefined,
      regression: isRecord(raw.regression)
        ? (raw.regression as unknown as LeafItemYaml['regression'])
        : undefined,
    },
  };
};

const validateItem = (
  raw: unknown,
): ParseResult<WorkflowItemYaml> => {
  if (!isRecord(raw)) {
    return { ok: false, error: 'Item is not an object' };
  }
  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    return { ok: false, error: 'Item missing id' };
  }
  if (typeof raw.title !== 'string' || raw.title.length === 0) {
    return { ok: false, error: `Item "${raw.id}" missing title` };
  }
  if (!isValidStatus(raw.type, ITEM_TYPES)) {
    return {
      ok: false,
      error: `Item "${raw.id}" has invalid type: "${String(raw.type)}"`,
    };
  }

  if (raw.type === 'epic') {
    const childResults = Array.isArray(raw.children)
      ? (raw.children as ReadonlyArray<unknown>).map(validateItem)
      : [];
    const firstError = childResults.find((r) => !r.ok);
    if (firstError && !firstError.ok) return firstError;

    const children = childResults
      .filter((r): r is { readonly ok: true; readonly data: WorkflowItemYaml } => r.ok)
      .map((r) => r.data);

    const epic: EpicItemYaml = {
      id: raw.id as string,
      title: raw.title as string,
      type: 'epic',
      children,
      context_sections: Array.isArray(raw.context_sections)
        ? (raw.context_sections as ReadonlyArray<string>)
        : undefined,
      depends_on: Array.isArray(raw.depends_on)
        ? (raw.depends_on as ReadonlyArray<string>)
        : undefined,
    };
    return { ok: true, data: epic };
  }

  return validateLeafItem(raw);
};

const flattenLeaf = (
  leaf: LeafItemYaml,
  workflowId: string,
  parentId: string | undefined,
): ParsedLeafItem => ({
  id: leaf.id,
  title: leaf.title,
  type: leaf.type,
  workflowId,
  parentId,
  dependsOn: leaf.depends_on ?? [],
  changeId: leaf.change_id,
  location: leaf.location,
  specStatus: leaf.spec_status,
  planStatus: leaf.plan_status,
  implStatus: leaf.impl_status,
  reviewStatus: leaf.review_status,
  substep: leaf.substep ?? undefined,
});

const flattenItems = (
  items: ReadonlyArray<WorkflowItemYaml>,
  workflowId: string,
): ReadonlyArray<ParsedItem> =>
  items.flatMap((item): ReadonlyArray<ParsedItem> => {
    if (item.type === 'epic') {
      const epicItem = item as EpicItemYaml;
      const childIds = epicItem.children.map((c) => c.id);

      const parsedEpic: ParsedEpicItem = {
        id: epicItem.id,
        title: epicItem.title,
        type: 'epic',
        workflowId,
        parentId: undefined,
        dependsOn: epicItem.depends_on ?? [],
        childIds,
      };

      const flatChildren = epicItem.children.flatMap(
        (child): ReadonlyArray<ParsedItem> => {
          if (child.type === 'epic') {
            const nested = flattenItems([child], workflowId);
            return nested.map((n) =>
              n.id === child.id ? { ...n, parentId: epicItem.id } : n,
            );
          }
          return [flattenLeaf(child as LeafItemYaml, workflowId, epicItem.id)];
        },
      );

      return [parsedEpic, ...flatChildren];
    }

    return [flattenLeaf(item as LeafItemYaml, workflowId, undefined)];
  });

export const parseWorkflowYaml = (
  content: string,
): ParseResult<ParsedWorkflow> => {
  if (!content || content.trim().length === 0) {
    return { ok: false, error: 'Empty workflow file' };
  }

  const raw = (() => {
    try {
      return { ok: true as const, data: parseYaml(content) as unknown };
    } catch (e) {
      return {
        ok: false as const,
        error: `Invalid YAML: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  })();

  if (!raw.ok) return raw;

  if (!isRecord(raw.data)) {
    return { ok: false, error: 'Workflow YAML root is not an object' };
  }

  const doc = raw.data;

  if (typeof doc.id !== 'string' || doc.id.length === 0) {
    return { ok: false, error: 'Workflow missing id' };
  }
  if (!isValidStatus(doc.phase, PHASES)) {
    return {
      ok: false,
      error: `Workflow has invalid phase: "${String(doc.phase)}"`,
    };
  }

  const itemResults = Array.isArray(doc.items)
    ? (doc.items as ReadonlyArray<unknown>).map(validateItem)
    : [];
  const firstError = itemResults.find((r) => !r.ok);
  if (firstError && !firstError.ok) return firstError;

  const items = itemResults
    .filter((r): r is { readonly ok: true; readonly data: WorkflowItemYaml } => r.ok)
    .map((r) => r.data);

  const progress = isRecord(doc.progress)
    ? {
        total_items: Number(doc.progress.total_items) || 0,
        specs_completed: Number(doc.progress.specs_completed) || 0,
        specs_pending: Number(doc.progress.specs_pending) || 0,
        plans_completed: Number(doc.progress.plans_completed) || 0,
        plans_pending: Number(doc.progress.plans_pending) || 0,
        implemented: Number(doc.progress.implemented) || 0,
        reviewed: Number(doc.progress.reviewed) || 0,
      }
    : {
        total_items: 0,
        specs_completed: 0,
        specs_pending: 0,
        plans_completed: 0,
        plans_pending: 0,
        implemented: 0,
        reviewed: 0,
      };

  return {
    ok: true,
    data: {
      id: doc.id as string,
      source: doc.source === 'interactive' ? 'interactive' : 'external',
      phase: doc.phase as Phase,
      step: typeof doc.step === 'string' ? doc.step : '',
      progress,
      items: flattenItems(items, doc.id as string),
    },
  };
};
