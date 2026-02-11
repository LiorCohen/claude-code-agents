/**
 * Type definitions for spec-related operations.
 */

export type ValidationError = {
  readonly file: string;
  readonly message: string;
}

export type SpecEntry = {
  readonly title: string;
  readonly type: string;
  readonly path: string;
  readonly domain: string;
  readonly issue: string;
  readonly created: string;
  readonly status: string;
  readonly spec_type?: SpecType;
}

export type ActiveSpec = {
  readonly title: string;
  readonly path: string;
  readonly domain: string;
  readonly issue: string;
  readonly overview: string;
}

// Spec types: product specs (external, WHAT/WHY) vs tech specs (internal, HOW)
export type SpecType = (typeof VALID_SPEC_TYPES)[number];

// Change types for tech specs
export type ChangeType = (typeof VALID_CHANGE_TYPES)[number];

// Required fields vary by spec_type
export const PRODUCT_SPEC_REQUIRED_FIELDS = [
  'title',
  'spec_type',
  'status',
  'domain',
  'created',
  'updated',
] as const;

export const TECH_SPEC_REQUIRED_FIELDS = [
  'title',
  'spec_type',
  'type', // change type: feature, bugfix, refactor, epic
  'status',
  'domain',
  'issue',
  'created',
  'updated',
  'sdd_version',
] as const;

// Legacy: fields required when spec_type is not specified (backwards compatibility)
export const REQUIRED_FIELDS = ['title', 'status', 'domain', 'issue', 'created', 'updated'] as const;

export const VALID_SPEC_TYPES = ['product', 'tech'] as const;
export const VALID_CHANGE_TYPES = ['feature', 'bugfix', 'refactor', 'epic'] as const;
export const VALID_STATUSES = ['active', 'deprecated', 'superseded', 'archived', 'draft'] as const;
export const PLACEHOLDER_ISSUES = ['PROJ-XXX', '[PROJ-XXX]', 'TODO', '', '{{ISSUE}}'] as const;
