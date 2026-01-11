---
name: implement-plan
description: Implement a feature by executing its implementation plan.
---

# /project:implement-plan

Implement a feature by executing its implementation plan.

## Usage

```
/project:implement-plan [path-to-plan]
```

Example:
```
/project:implement-plan specs/features/2026/01/11/user-auth/PLAN.md
```

## Flow

### 1. Load Spec and Plan (REQUIRED FIRST STEP)

**CRITICAL**: Before starting ANY implementation work, you MUST:

- Read the ENTIRE PLAN.md from start to finish
- Read the ENTIRE SPEC.md referenced in the plan (same directory: `./SPEC.md`)
- Understand ALL requirements and acceptance criteria
- Verify all prerequisites are met (dependencies, environment, etc.)
- Create a mental model of the complete implementation
- Display comprehensive summary of ALL work to be done
- Identify any missing information or ambiguities

**DO NOT proceed to Phase 2 until you fully understand the complete scope.**

### 2. Update Domain Documentation (REQUIRED BEFORE IMPLEMENTATION)

**CRITICAL**: Before implementing ANY code, you MUST update the domain documentation to reflect the feature's impact:

1. **Glossary Updates** (`specs/domain/glossary.md`):
   - Read the spec's "Domain Concepts" section
   - Identify any new terms, entities, or concepts introduced
   - Add or update definitions in the glossary
   - Ensure all domain-specific terminology is properly documented
   - If no new concepts: explicitly note "No glossary updates needed"

2. **Entity Documentation** (`specs/domain/entities/`):
   - Identify new entities introduced by the feature
   - Create entity spec files for new domain entities (e.g., `specs/domain/entities/user.md`)
   - Update existing entity specs if properties/relationships change
   - Document entity properties, relationships, business rules, and lifecycle
   - If no entity changes: explicitly note "No entity updates needed"

3. **Architecture Documentation** (`specs/architecture/`):
   - Review if the feature introduces new architectural patterns
   - Update `specs/architecture/overview.md` if components are affected
   - Document new integration points or service dependencies
   - Update API contracts documentation if endpoints change
   - If no architecture changes: explicitly note "No architecture updates needed"

**Verification checklist:**
- [ ] Read spec's "Domain Concepts" section
- [ ] Updated `specs/domain/glossary.md` with new terms
- [ ] Created/updated entity specs in `specs/domain/entities/`
- [ ] Updated architecture docs if needed
- [ ] Confirmed all domain changes from spec are documented

**DO NOT proceed to Phase 3 until domain documentation is complete and verified.**

### 3. Execute Implementation Phases

For each phase in the plan:

#### Phase: API Contract
- Invoke `api-designer` agent
- Update OpenAPI spec
- Generate types
- Verify types generated successfully

#### Phase: Backend Implementation
- Invoke `backend-dev` agent
- Implement model use-cases
- Add DAL methods
- Wire up controller
- Add server routes

#### Phase: Frontend Implementation
- Invoke `frontend-dev` agent
- Create React components
- Add hooks for API calls
- Integrate with UI

#### Phase: Infrastructure (if needed)
- Invoke `devops` agent
- Update Helm charts
- Add environment variables
- Create Testkube test definitions

#### Phase: Testing
- Invoke `tester` agent
- Create unit tests for all new code
- Create integration tests
- Create E2E tests
- Verify all acceptance criteria covered by tests
- **RUN all tests and ensure 100% pass**
- If tests fail, fix the implementation or tests until they pass
- Do NOT proceed to Review phase until all tests pass

#### Phase: Review
- Invoke `reviewer` agent
- Check spec compliance
- Invoke `db-advisor` if database changes present
- Report findings

### 4. Track Progress

- Mark each phase as complete when done
- Report any blockers or issues
- Update PLAN.md with actual progress

### 5. Final Verification (MANDATORY - DO NOT SKIP)

Before declaring implementation complete, you MUST:

1. **Full Spec Review**
   - Re-read the entire SPEC.md
   - Re-read the entire PLAN.md
   - Verify every requirement is addressed
   - Check all acceptance criteria are implemented

2. **Comprehensive Testing**
   - Run ALL unit tests (`npm test` or equivalent)
   - Run ALL integration tests (via Testkube or locally)
   - Run ALL E2E tests
   - Ensure 100% of tests pass
   - If ANY test fails, fix it before proceeding

3. **Functionality Verification**
   - Verify each acceptance criterion manually if needed
   - Confirm all API endpoints work as specified
   - Validate frontend components match requirements
   - Check database schema matches design
   - Test error handling paths

4. **Code Review**
   - Re-invoke `reviewer` agent for final check
   - If database changes: invoke `db-advisor` agent
   - Address ALL findings before completion
   - Ensure no spec violations

5. **Documentation Check**
   - Verify all code is properly documented
   - Ensure telemetry is properly configured
   - Check that all required log fields are present
   - Validate OpenTelemetry spans are correct

6. **Final Report**
   - Generate implementation summary
   - List all files created/modified
   - Confirm all acceptance criteria met
   - Note any deviations from plan (with justification)

**CRITICAL**: Do NOT declare implementation complete until ALL of the above steps are finished and ALL tests pass. If you encounter ANY issues, resolve them before finishing.

## Important Notes

- **Domain docs first**: Domain documentation (glossary, entities, architecture) MUST be updated before writing any code
- **Mandatory step**: Phase 2 (Update Domain Documentation) cannot be skipped, even if changes seem minor
- **Verification required**: Explicitly confirm each documentation area (glossary, entities, architecture) is updated or doesn't need updates
- **Traceability**: Domain documentation serves as the bridge between specs and implementation
- **Single source of truth**: Ensures domain knowledge is centralized and accessible to all team members

## Example

```
User: /project:implement-plan specs/features/2026/01/11/user-auth/PLAN.md

Agent: Step 1: Loading spec and plan...
Agent: ✓ Read PLAN.md
Agent: ✓ Read SPEC.md
Agent: [Displays comprehensive summary of work]

Agent: Step 2: Updating domain documentation...
Agent: Reading spec's "Domain Concepts" section...
Agent: Found new concepts: User, Session, AuthToken
Agent:
Agent: Updating specs/domain/glossary.md:
Agent: - Added "User" definition
Agent: - Added "Session" definition
Agent: - Added "AuthToken" definition
Agent: ✓ Glossary updated
Agent:
Agent: Creating entity specs:
Agent: - Created specs/domain/entities/user.md
Agent: - Created specs/domain/entities/session.md
Agent: ✓ Entity specs created
Agent:
Agent: Reviewing architecture impact:
Agent: - Feature adds new authentication service
Agent: - Updated specs/architecture/overview.md with auth service
Agent: ✓ Architecture docs updated
Agent:
Agent: Domain documentation verification:
Agent: ✓ Read spec's "Domain Concepts" section
Agent: ✓ Updated specs/domain/glossary.md with new terms
Agent: ✓ Created entity specs in specs/domain/entities/
Agent: ✓ Updated architecture docs
Agent: ✓ All domain changes from spec are documented
Agent:
Agent: Step 3: Beginning implementation phases...
Agent: Phase: API Contract
Agent: [Invokes api-designer agent...]

[Implementation continues...]
```