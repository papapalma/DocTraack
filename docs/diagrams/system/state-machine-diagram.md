# State Machine Diagram: MinSU DocTrack Whole System

## 1. Description
This state machine diagram details the state transitions, triggers, guard conditions, and actions governing both the TDP Document lifecycle and the Student Scholarship Application lifecycle within MinSU DocTrack.

## 2. ASD-STE100 Technical Specifications
- Define separate state regions for documents and student applications.
- Enforce explicit guard conditions on all transitions.
- Lock documents against edits once they reach the `Approved` or `Sent to Agency` state.
- Transition records to `Archived` at the conclusion of the academic cycle.

---

## 3. Unified State Machine Diagram (Mermaid)

```mermaid
stateDiagram-v2
    direction TB

    [*] --> SystemInitialized

    state SystemInitialized {
        direction LR

        %% Document Lifecycle Region
        state "Document Lifecycle Region" as DocRegion {
            [*] --> Doc_Draft : Create Annex (1-10)

            state Doc_Draft {
                [*] --> InputtingData
                InputtingData --> CalculatingSums : Ledger Update
                CalculatingSums --> InputtingData : Edit Row
            }

            Doc_Draft --> Doc_Submitted : Submit [hasPermission && zeroVariance]
            
            state Doc_Submitted {
                [*] --> InExecutiveQueue
                InExecutiveQueue --> UnderReview : Director Opens
            }

            Doc_Submitted --> Doc_Returned : Return [with revision remarks]
            Doc_Returned --> Doc_Draft : Author Re-edits

            Doc_Submitted --> Doc_Approved : 1-Click Approve [directorSignatureVerified]

            state Doc_Approved {
                [*] --> LockedForEdit
                LockedForEdit --> AttachSignedScan : Coordinator Uploads PDF
            }

            Doc_Approved --> Doc_SentToAgency : Dispatch Transmittal [scannedPdfAttached]

            Doc_SentToAgency --> Doc_Archived : Academic Year Concluded
            Doc_Archived --> [*]
        }

        --

        %% Student Application Lifecycle Region
        state "Student Application Lifecycle Region" as AppRegion {
            [*] --> App_Submitted : Submit Application & Scanned Proofs

            App_Submitted --> App_UnderReview : Coordinator Opens Application

            state App_UnderReview {
                [*] --> CheckingGrades
                CheckingGrades --> CheckingIndigency
            }

            App_UnderReview --> App_Disqualified : Reject [ineligibleCriteria]
            App_UnderReview --> App_Qualified : Accept [withinQuota && verified]

            App_Qualified --> App_Awarded : Annex 9 Payroll Approved
            App_Disqualified --> [*]
            App_Awarded --> [*]
        }
    }

    %% ─── 📌 VISUAL LEGEND ───
    note right of SystemInitialized
        <b>📌 DIAGRAM LEGEND</b>
        ● [*] : Initial / Terminal Boundary
        [StateName] : Active Lifecycle Status
        --> : Trigger Event Transition
        [guard] : Mandatory Guard Rule
        -- : Orthogonal Region Split
    end note
```

---

## 4. Diagram Legend & Symbol Guide

| Visual Symbol / Syntax | UML State Machine Concept | Technical Meaning | MinSU Document & Student Lifecycle |
|---|---|---|---|
| `● [*]` | Initial State Node | Point of entry into a lifecycle region | Annex creation begins or student application submitted |
| `◎ [*]` | Terminal State Node | Final conclusion of lifecycle | Document permanently archived or student awarded/disqualified |
| `state "Name"` | Composite State | Container holding nested sub-states | `Doc_Draft`, `Doc_Submitted`, `Doc_Approved`, `App_UnderReview` |
| `-->` | Transition Arrow | Movement from one state to another triggered by an event | `Director Opens`, `Author Re-edits`, `1-Click Approve` |
| `[guardCondition]` | Transition Guard | Boolean condition that must evaluate to TRUE | `[zeroVariance]`, `[directorSignatureVerified]`, `[scannedPdfAttached]` |
| `--` | Concurrent Regions | Orthogonal regions running in parallel | Document Lifecycle runs concurrently with Student Application Lifecycle |

---

## 5. State Transition Rules & Guards
- **`[hasPermission && zeroVariance]`**: Required to transition a document from `Draft` to `Submitted`. Financial annexes must balance to ₱0.00 discrepancy.
- **`[directorSignatureVerified]`**: Required to transition from `Submitted` to `Approved`. Locks the document metadata against further modifications.
- **`[scannedPdfAttached]`**: Required to move an approved document to `Sent to Agency`. Guarantees that wet-signed physical copies are digitized before courier dispatch.
- **`[withinQuota && verified]`**: Moves student applications from `Under Review` to `Qualified`, indexing them for inclusion in the official Annex 2 TDP Masterlist.
