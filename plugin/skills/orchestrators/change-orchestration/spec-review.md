# Spec Review Actions

Handles `approve spec`, `answer`, and `assume` actions for the change orchestration skill.

---

## Action: approve spec

Approve SPEC.md and trigger PLAN.md creation.

### Usage

```
/sdd-run change approve spec <change-id>
```

### Flow

1. Validate change-id exists
2. Check status is `spec_review`
3. Read SPEC.md
4. Invoke planning skill to create PLAN.md:
   ```yaml
   INVOKE planning skill with:
     spec_path: <path to SPEC.md>
     change_id: <change_id>
   ```
5. Save PLAN.md via workflow-state
6. Update status to `plan_review`

### Output

```
Approving spec for: [user-auth-1](changes/2026/02/05/a1b2c3-user-auth/01-registration/) (Registration)

Reading [SPEC.md](changes/2026/02/05/a1b2c3-user-auth/01-registration/SPEC.md)...
Generating PLAN.md...

PLAN.md created at: [PLAN.md](changes/2026/02/05/a1b2c3-user-auth/01-registration/PLAN.md)

Status: plan_review

NEXT STEPS:
  1. Review the PLAN.md file
  2. When satisfied: /sdd I want to approve the plan
```

---

## Action: answer

Answer an open question to unblock spec approval.

### Usage

```
/sdd-run change answer <change-id> <question-id> "<answer>"
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `change-id` | Yes | The change containing the question |
| `question-id` | Yes | Question ID from SPEC.md (e.g., O1, O2) |
| `answer` | Yes | The answer to the question |

### Flow

1. Find the question in SPEC.md Requirements Discovery section
2. Update status from OPEN to ANSWERED
3. Record answer text
4. Check if any OPEN questions remain

### Output

```
Answering question O1...

Question: What are the password requirements?
Answer: 8+ characters, mixed case, at least one number

Status: ANSWERED

Open questions remaining: 2 (O2, O3)
```

---

## Action: assume

Mark a question as an assumption (when user doesn't know the answer).

### Usage

```
/sdd-run change assume <change-id> <question-id> "<assumption>"
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `change-id` | Yes | The change containing the question |
| `question-id` | Yes | Question ID from SPEC.md (e.g., O1, O2) |
| `assumption` | Yes | The assumption being made |

### Flow

1. Find the question in SPEC.md Requirements Discovery section
2. Update status from OPEN to ASSUMED
3. Record assumption text with "Assumption:" prefix
4. Check if any OPEN questions remain

### Output

```
Recording assumption for O1...

Question: What are the password requirements?
Assumption: Industry standard - 8+ chars, mixed case, number required

Status: ASSUMED

⚠️  Assumptions should be verified before production deployment.

Open questions remaining: 2 (O2, O3)
```
