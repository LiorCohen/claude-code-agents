/**
 * Type definitions for component-related operations.
 */

export type ComponentEntry = {
  readonly type: string;
  readonly name: string;
  readonly depends_on?: readonly string[];
}

export type ScaffoldingConfig = {
  readonly project_name: string;
  readonly project_description: string;
  readonly primary_domain: string;
  readonly target_dir: string;
  readonly components: readonly ComponentEntry[];
  readonly skills_dir: string;
}

export type ScaffoldingResult = {
  readonly success: boolean;
  readonly target_dir: string;
  readonly created_dirs: number;
  readonly created_files: number;
  readonly files: readonly string[];
  readonly error?: string;
}

export type DomainConfig = {
  readonly target_dir: string;
  readonly primary_domain: string;
  readonly product_description: string;
  readonly user_personas: readonly UserPersona[];
  readonly core_workflows: readonly string[];
  readonly domain_entities: readonly string[];
}

export type UserPersona = {
  readonly type: string;
  readonly actions: string;
}

export type PopulationResult = {
  readonly success: boolean;
  readonly files_updated: readonly string[];
  readonly entity_definitions_created: number;
  readonly use_cases_created: number;
  readonly glossary_entries_added: number;
  readonly error?: string;
}
