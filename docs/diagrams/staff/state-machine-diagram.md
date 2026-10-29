# Staff Coordinator — State Machine Diagram

> **Role:** `STAFF`  
> **Diagram Type:** State Machine Diagram  
> **Entity:** `ApplicantCall` (Annex 2 TDP Call for Applications)  
> **Standard:** UML 2.5 State Machine Specification

---

## 1. Purpose

The State Machine Diagram shows the lifecycle states of an `ApplicantCall` entity, from initial dynamic form configuration by Staff to compilation into Annex 1.

---

## 2. Mermaid State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> DRAFT : createCall() [staff defines formSchema]

    DRAFT --> PUBLISHED : publishCall() [deadline set in future]

    PUBLISHED --> EVALUATION : closeSubmissions() [deadline reached or manual close]

    EVALUATION --> COMPILED : compileAnnex1() [grantees accepted]

    COMPILED --> ARCHIVED : archiveCall() [academic year finalized]

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

## 4. State Details & Behavioral Constraints

| State | Portal Visibility | Accepting Student Applications | Staff Actions Permitted |
|---|---|---|---|
| `DRAFT` | Hidden | No | Add/remove custom form fields, adjust deadlines. |
| `PUBLISHED` | Public (`/portal`) | Yes | View applicant velocity, edit description. |
| `EVALUATION` | Read-only | No | Evaluate student CORs, accept/reject grantees. |
| `COMPILED` | Read-only | No | Generate Annex 1 master roster from accepted records. |
| `ARCHIVED` | Historic | No | Export historical records to CSV. |

---

## 5. STE Rules Applied

- State names use past participles or adjectives.
- Each transition has an event trigger and a guard condition.
- The diagram has one initial state and one final state.
