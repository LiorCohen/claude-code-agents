# Spec Sections

Required sections, structure, and examples for generated SPEC.md files.

## Required Sections

After all questions answered, generate SPEC.md with:

1. **Standard frontmatter** (title, type, status, etc.)
2. **Overview** with Background and Current State
3. **Original Requirements** (if from external spec - embed full context)
4. **User Stories**
5. **Functional Requirements**
6. **Non-Functional Requirements**
7. **Technical Design** (Architecture, Data Model, Algorithms)
8. **API Contract** (if applicable)
9. **Security Considerations**
10. **Error Handling**
11. **Observability**
12. **Acceptance Criteria** (Given/When/Then format)

13. **Domain Model**
    - Entities table (Entity, Definition, Spec Path, Status)
    - Relationships diagram
    - Glossary table (Term, Definition, First Defined In)
    - Bounded Contexts list

14. **Specs Directory Changes** (MANDATORY for traceability)
    - Before/After directory tree
    - Changes Summary table (Path, Action, Description)

15. **Components**
    - Note: "New components will be scaffolded during implementation"
    - New Components table (Component, Type, Settings, Purpose)
    - Modified Components table (Component, Changes)

16. **System Analysis**
    - Inferred Requirements
    - Gaps & Assumptions
    - Dependencies

17. **Requirements Discovery** (CRITICAL - full Q&A trail, never delete)
    - **Transformation Phase** table (if from external spec)
      | # | Question | Answer | Source |
    - **Component Discovery Phase** table (if from external spec)
      | # | Question | Answer | Source |
    - **Solicitation Phase** table
      | # | Question | Answer | Source |
      - Include follow-up questions as threaded exchanges
    - **User Feedback & Corrections** (with timestamps)
    - **Open Questions (BLOCKING)** table
      | # | Question | Status | Blocker For |
      - Status: OPEN | ANSWERED | ASSUMED | DEFERRED
      - Specs CANNOT be approved while OPEN questions remain

18. **Testing Strategy**
    - Unit Tests table
    - Integration Tests table
    - E2E Tests table
    - Test Data requirements

19. **Dependencies** (Internal and External)
20. **Migration / Rollback**
21. **Out of Scope**
22. **Open Questions**
23. **References**
