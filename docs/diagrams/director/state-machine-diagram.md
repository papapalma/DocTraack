# Campus Director — State Machine Diagram

> **Role:** `DIRECTOR` (Signatory Lifecycle Authority)  
> **Diagram Type:** State Machine Diagram  
> **Entity:** `Document`  
> **Standard:** UML 2.5 State Machine Specification

---

## 1. Purpose

The State Machine Diagram shows the lifecycle states of a TDP Annex document and the events that cause transitions between them.

---

## 2. Mermaid State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> DRAFT : createDocument()

    DRAFT --> SUBMITTED : submit() [all mandatory fields filled]
    
    SUBMITTED --> APPROVED : approve() [director accepts roster]
    SUBMITTED --> RETURNED : return() [director requests revisions]

    RETURNED --> DRAFT : edit() [preparer unlocks form]
    DRAFT --> RESUBMITTED : resubmit() [corrections completed]

    RESUBMITTED --> APPROVED : approve() [director accepts corrected data]
    RESUBMITTED --> RETURNED : return() [further revisions needed]

    APPROVED --> UPLOADED : uploadSignedScan() [hardcopy signed and stamped]

    UPLOADED --> TRANSMITTED : transmit() [dispatched to CHED / Google Drive link logged]

    TRANSMITTED --> ARCHIVED : archive() [retention period triggered]
    APPROVED --> ARCHIVED : archive() [internal archive]

    ARCHIVED --> [*]

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

## 3. Diagram Legend & Symbol Guide

| Visual Symbol / Syntax | UML State Machine Concept | Technical Meaning | MinSU Document & Student Lifecycle |
|---|---|---|---|
| `● [*]` | Initial State Node | Point of entry into a lifecycle region | Annex creation begins or student application submitted |
| `◎ [*]` | Terminal State Node | Final conclusion of lifecycle | Document permanently archived or student awarded/disqualified |
| `state "Name"` | Composite State | Container holding nested sub-states | Draft, Submitted, Approved, Returned, Under Review |
| `-->` | Transition Arrow | Movement from one state to another triggered by an event | Director Opens, Author Re-edits, 1-Click Approve |
| `[guardCondition]` | Transition Guard | Boolean condition that must evaluate to TRUE | `[zeroVariance]`, `[directorSignatureVerified]`, `[scannedPdfAttached]` |
| `--` | Concurrent Regions | Orthogonal regions running in parallel | Document Lifecycle runs concurrently with Student Application Lifecycle |


---

## 4. State Definitions & Transition Rules

| State | Entry Condition | Mutable by Preparer | Visible to Director |
|---|---|---|---|
| `DRAFT` | Preparer initializes document form. | Yes | No |
| `SUBMITTED` | Preparer finishes data entry and submits. | No (Locked) | Yes (In Queue) |
| `RETURNED` | Director rejects with feedback comments. | Yes (Unlocked) | History view only |
| `RESUBMITTED` | Preparer updates fields and resubmits. | No (Locked) | Yes (In Queue) |
| `APPROVED` | Director grants endorsement. | No (Locked) | Yes (Endorsed) |
| `UPLOADED` | Staff uploads wet-signed physical PDF scan. | No (Locked) | Yes |
| `TRANSMITTED` | Staff logs external courier / GDrive dispatch. | No (Locked) | Outgoing Registry |
| `ARCHIVED` | Formal retention milestone reached. | No | Read-only Archive |

---

## 5. STE Rules Applied

- State names use adjectives or past participles (for example, `Approved`, `Transmitted`).
- Transition labels follow standard format: `event [guard] / action`.
- Each state can be reached from the initial state and flows to completion.
