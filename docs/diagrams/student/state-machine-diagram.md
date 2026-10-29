# Student Applicant — State Machine Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** State Machine Diagram  
> **Entity:** `Application`  
> **Standard:** UML 2.5 State Machine Specification

---

## 1. Purpose

The State Machine Diagram shows the evaluation states of a student's scholarship application, from initial submission to final acceptance or rejection.

---

## 2. Mermaid State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : submitOnline() [form valid & files uploaded]

    SUBMITTED --> UNDER_REVIEW : beginEvaluation() [staff opens student documents]

    UNDER_REVIEW --> ACCEPTED : acceptGrantee() [meets GPA & indigency criteria]
    UNDER_REVIEW --> REJECTED : rejectApplication() [fails eligibility or missing proofs]

    ACCEPTED --> [*]
    REJECTED --> [*]

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

## 4. State Definitions & Transitions

| State | Student Portal Display | Description & Staff Permissions |
|---|---|---|
| `SUBMITTED` | "Application Received" (Blue) | Application stored in database. Staff has not opened review modal. |
| `UNDER_REVIEW` | "Evaluation in Progress" (Gold) | Staff coordinator is verifying attached grades and COR files. |
| `ACCEPTED` | "Congratulations! Qualified Grantee" (Green) | Grantee approved for inclusion in official Annex 1 master roster. |
| `REJECTED` | "Application Unsuccessful" (Red) | Student does not meet academic or socio-economic criteria. Feedback provided. |

---

## 5. STE Rules Applied

- State names use past participles (for example, `Submitted`, `Accepted`).
- Transitions have event labels and guard conditions.
- Each terminal state connects cleanly to a final node.
