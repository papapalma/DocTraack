# System Admin — State Machine Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** State Machine Diagram  
> **Entity:** `User` (User Account Lifecycle)  
> **Standard:** UML 2.5 State Machine Specification

---

## 1. Purpose

The State Machine Diagram shows the lifecycle states of a `User` account under administrative management, from provisioning through active usage and deactivation.

---

## 2. Mermaid State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> PROVISIONED : createUser() [unique email & valid role]

    PROVISIONED --> ACTIVE : firstLogin() [password authenticated]

    ACTIVE --> ROLE_CHANGED : updateRole() [admin assigns new role]
    ROLE_CHANGED --> ACTIVE : acknowledge()

    ACTIVE --> DEACTIVATED : deactivateUser() [admin suspends account]
    DEACTIVATED --> ACTIVE : reactivateUser() [admin restores access]

    DEACTIVATED --> ARCHIVED : archiveAccount() [retention policy elapsed]

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

## 4. State Definitions & Transitions

| State | Login Allowed | Administrative Options |
|---|---|---|
| `PROVISIONED` | Yes (Initial) | Modify role, re-send invite, delete. |
| `ACTIVE` | Yes | Change role, assign department, deactivate. |
| `DEACTIVATED` | No (Blocked) | Reactivate, permanently archive. |
| `ARCHIVED` | No (Purged) | Historic audit inspection only. |

---

## 5. STE Rules Applied

- State names use adjectives or past participles (for example, `Active`, `Deactivated`).
- Guard conditions specify email uniqueness and role assignment.
- Each transition records an audit log event.
