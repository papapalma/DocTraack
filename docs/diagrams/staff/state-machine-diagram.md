# Staff Coordinator — State Machine Diagram

> **Role:** `STAFF`  
> **Diagram Type:** State Machine Diagram  
> **Entities:** `Application` & `VerificationRun` Lifecycle  
> **Standard:** UML 2.5 State Machine Specification

---

## 1. Purpose

The State Machine Diagram shows the lifecycle states of student applications during intake validation and verification runs during tripartite cross-matching. All decision choices evaluate strictly to binary Yes and No paths.

---

## 2. Mermaid State Machine Diagram

```mermaid
stateDiagram-v2
    direction TB

    state "Application Intake Lifecycle" as APP_LIFECYCLE {
        [*] --> SUBMITTED : Student submits application

        state check_docs <<choice>>
        SUBMITTED --> check_docs : Staff reviews profile & documents

        check_docs --> ACCEPTED : [Documents Valid? -- Yes]
        check_docs --> REJECTED : [Documents Valid? -- No]

        state ACCEPTED {
            [*] --> IdentityLocked : RA 10173 lock applied
            IdentityLocked --> EligibleForVerification : Profile stored in masterlist
        }

        REJECTED --> [*]
        EligibleForVerification --> [*]
    }

    --

    state "3-Way Tripartite Verification Lifecycle" as VERIFY_LIFECYCLE {
        [*] --> INITIALIZED : Staff uploads CHED & Registrar CSVs

        INITIALIZED --> CROSS_MATCHING : Execute Jaro-Winkler fuzzy match

        state check_discrepancy <<choice>>
        CROSS_MATCHING --> check_discrepancy : Evaluate cross-match results

        check_discrepancy --> DISCREPANCY_FLAGGED : [Discrepancies Found? -- Yes]
        check_discrepancy --> FULLY_VERIFIED : [Discrepancies Found? -- No]

        DISCREPANCY_FLAGGED --> RESOLVED : Staff manually resolves (CONFIRM / DISMISS)
        RESOLVED --> FULLY_VERIFIED : All discrepancies settled

        FULLY_VERIFIED --> IMPORTED_INTO_ANNEX4 : 1-click sync into billing Form 2
        IMPORTED_INTO_ANNEX4 --> [*]
    }

    %% ─── 📌 VISUAL LEGEND ───
    note right of APP_LIFECYCLE
        <b>📌 DIAGRAM LEGEND</b>
        ● [*] : Initial / Terminal Boundary
        [StateName] : Active Lifecycle Status
        <<choice>> : Mutually Exclusive Decision Point
        --> : Trigger Event Transition
        [guard] : Guard Rule (Strictly Yes / No)
        -- : Orthogonal Region Split
    end note
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol / Syntax | UML State Machine Concept | Technical Meaning | MinSU Document & Student Lifecycle |
|---|---|---|---|
| `● [*]` | Initial State Node | Point of entry into a lifecycle region | Intake begins or CSV verification upload initiated |
| `◎ [*]` | Terminal State Node | Final conclusion of lifecycle | Application rejected or verified roster imported into billing |
| `state "Name"` | Composite State | Container holding nested sub-states | `ACCEPTED` (holds `IdentityLocked` and `EligibleForVerification`) |
| `<<choice>>` | Decision Pseudostate | Dynamic evaluation of runtime guard | Decision gate evaluating strictly to **Yes** or **No** |
| `-->` | Transition Arrow | Movement from one state to another | Ingest, evaluate, resolve, import |
| `[guard]` | Transition Guard | Boolean condition that must evaluate to TRUE | `[Documents Valid? -- Yes]`, `[Discrepancies Found? -- No]` |
| `--` | Concurrent Regions | Orthogonal regions running in parallel | Application Intake runs concurrently with Tripartite Verification |

---

## 4. State Details & Behavioral Constraints

- **`SUBMITTED`**: Initial state of student registration; documents are pending coordinator review.
- **`check_docs` Choice**: If documents are valid (**Yes**), application moves to `ACCEPTED`. If invalid (**No**), application moves to `REJECTED`.
- **`ACCEPTED`**: Triggers permanent locking of `studentIdNumber` and `fullName` under RA 10173.
- **`CROSS_MATCHING`**: Executes automated cross-check across CHED, Registrar, and System datasets.
- **`check_discrepancy` Choice**: If variances exist (**Yes**), run enters `DISCREPANCY_FLAGGED`. If zero variances (**No**), run transitions directly to `FULLY_VERIFIED`.
- **`FULLY_VERIFIED`**: Authorizes 1-click synchronization into Annex 4 New Billing Statement.
