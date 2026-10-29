# State Machine Diagram: Accounting Officer Domain

## 1. Description
This state machine diagram details the lifecycle states, transitions, guard conditions, and actions of a financial annex document (Annexes 6, 7, 8, and 9) managed by the Accounting Officer.

## 2. ASD-STE100 Technical Specifications
- Start document records in the `Draft` state.
- Transition documents to `Submitted` only when balance calculations equal zero variance.
- Permit revision and re-submission when a document enters the `Returned` state.
- Move documents to `Archived` after formal completion.

## 3. State Machine Diagram (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> Draft : Create Financial Annex

    state Draft {
        [*] --> EnteringLedger
        EnteringLedger --> CalculatingTotals : Update Row / Amount
        CalculatingTotals --> BalanceValidated : Validate Zero Variance
        BalanceValidated --> EnteringLedger : Edit Values
    }

    Draft --> Submitted : Submit Document [variance == 0.00]
    
    state Submitted {
        [*] --> InExecutiveQueue
        InExecutiveQueue --> UnderReview : Director Opens
    }

    Submitted --> Returned : Director Returns [with revision comments]
    Submitted --> Approved : Director Approves [signatures verified]

    Returned --> Draft : Accounting Officer Edits Ledger
    
    Approved --> Archived : Archive Document Record
    Archived --> [*]

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
| `state "Name"` | Composite State | Container holding nested sub-states | Draft, Submitted, Approved, Returned, Under Review |
| `-->` | Transition Arrow | Movement from one state to another triggered by an event | Director Opens, Author Re-edits, 1-Click Approve |
| `[guardCondition]` | Transition Guard | Boolean condition that must evaluate to TRUE | `[zeroVariance]`, `[directorSignatureVerified]`, `[scannedPdfAttached]` |
| `--` | Concurrent Regions | Orthogonal regions running in parallel | Document Lifecycle runs concurrently with Student Application Lifecycle |


## 5. State Transition Rules
- **Draft to Submitted**: Guard condition checks that total disbursements equal allocated funding with 0.00 variance.
- **Submitted to Returned**: Triggered by Campus Director review. Reopens editing capabilities for the Accounting Officer.
- **Submitted to Approved**: Finalizes the financial ledger and locks document content against modifications.
- **Approved to Archived**: Concludes the academic year cycle and preserves read-only access.
