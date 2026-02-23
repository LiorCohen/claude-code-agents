# Outline Modes

## Chunked Outline Extraction

**Always** extract the spec outline before full analysis. This prevents context overflow for large specs.

### Mode: "outline"

Extract markdown headers without processing prose content. This is a pure parsing operation (no LLM reasoning needed).

**Algorithm (Single File):**

1. Read spec content (can be done in chunks for very large files)
2. Use regex to find headers: `/^(#{1,6})\s+(.+)$/gm`
3. Track line numbers for each header
4. Calculate `end_line` for each header (next header's start_line - 1, or total lines)
5. Return flat list of sections with line ranges

**Algorithm (Directory with Multiple Files):**

1. For each file in `spec_files`:
   - Read file content
   - Extract headers with line numbers
   - Prefix each section with `source_file` field
2. Combine all sections into unified outline
3. Each section includes which file it came from

**Output (OutlineResult) - Single File:**

```yaml
mode: "outline"
is_directory: false
sections:
  - level: 1
    header: "Product Requirements"
    start_line: 1
    end_line: 9
  - level: 2
    header: "User Authentication"
    start_line: 10
    end_line: 50
  - level: 3
    header: "Login Flow"
    start_line: 15
    end_line: 30
  - level: 3
    header: "Registration"
    start_line: 31
    end_line: 50
  - level: 2
    header: "Dashboard"
    start_line: 51
    end_line: 120
total_lines: 120
has_headers: true
```

**Output (OutlineResult) - Directory:**

```yaml
mode: "outline"
is_directory: true
files:
  - path: "README.md"
    total_lines: 50
  - path: "auth/authentication.md"
    total_lines: 120
  - path: "dashboard/overview.md"
    total_lines: 80
sections:
  - level: 1
    header: "Product Overview"
    source_file: "README.md"
    start_line: 1
    end_line: 50
  - level: 1
    header: "User Authentication"
    source_file: "auth/authentication.md"
    start_line: 1
    end_line: 60
  - level: 2
    header: "Login Flow"
    source_file: "auth/authentication.md"
    start_line: 10
    end_line: 40
  - level: 1
    header: "Dashboard"
    source_file: "dashboard/overview.md"
    start_line: 1
    end_line: 80
total_files: 3
has_headers: true
```

If no headers found:

```yaml
mode: "outline"
sections: []
total_lines: 500
has_headers: false
```

### Mode: "section"

Analyze a single section's content. Use this after outline extraction to process one section at a time.

**Input:**

```yaml
mode: "section"
spec_content: <content of ONE section only>
section_header: "## User Authentication"
default_domain: "Identity"
```

**Output:**

Returns a single `DecomposedChange` for that section, using the standard algorithm (Phase 1-5) applied to the section content only.

### Mode: "hierarchical"

Two-level decomposition for large external specs. Creates numbered epics from H1 sections and numbered features from H2/H3 sections within each epic.

**Input:**

```yaml
mode: "hierarchical"
spec_outline: <pre-extracted outline with line ranges>
spec_content: <full spec content>
default_domain: <primary domain>
include_thinking: true  # Enable comprehensive domain analysis

# NEW: Accept transformation and discovery output
classified_transformation:  # From external-spec-integration transformation step
  domain_knowledge: {...}
  constraints: {...}
  requirements: {...}
  design_details: {...}
  gaps: {...}
  clarifications: [...]
  assumptions: [...]

discovered_components:  # From component-discovery skill
  - type: <type-from-tech-pack>
    reason: "..."
  - type: <type-from-tech-pack>
    reason: "..."
```

**Algorithm:**

1. Group sections by H1 headers (each H1 becomes an epic)
2. Within each H1, H2/H3 sections become features
3. **Use transformation output** (if provided):
   - Pre-classified requirements inform decomposition
   - Gaps identify areas needing solicitation focus
   - Assumptions document what was pre-determined
4. **Thinking Step** (if include_thinking=true):
   - Domain Analysis (entities, relationships, glossary, bounded contexts)
   - Specs Impact Analysis (before/after, new vs modified)
   - Gap Analysis (what's missing or assumed)
   - Component Mapping (which components affected - use discovered_components)
5. **Build dependency graph**:
   - Features depend on other features (based on concept/API references)
   - Epics depend on other epics (if any feature depends on another epic's feature)
   - **Store dependencies in decomposition output for workflow.yaml**
6. **Contract-First Ordering** (topological sort with priority):
   - Contracts / Interfaces first
   - Data Layer / Persistence second
   - Business Logic / Services third
   - User-Facing Components fourth
   - Infrastructure last
7. Assign numbers: 01, 02, 03, etc.

**Numbering Rules:**
- Epics: `01-epic-name`, `02-epic-name`, etc.
- Features within epics: `01-feature-name`, `02-feature-name`, etc.
- Numbers based on topological sort of dependency graph
- Independent items can share the same "phase" but get sequential numbers

**When to use hierarchical mode:**
- Spec has 2+ H1 sections
- At least one H1 has 2+ H2 subsections
- Large external specs being imported

### Default Mode (Full Analysis)

If `mode` is omitted, perform full analysis on the entire `spec_content`. This is the legacy behavior, suitable only for small specs that fit in context.

**Warning:** For specs > ~50KB, always use outline mode first, then section mode per-section.
