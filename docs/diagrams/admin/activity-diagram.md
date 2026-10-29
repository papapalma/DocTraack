# System Admin — Activity Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Activity Diagram  
> **Workflow:** User Account Provisioning & Role Assignment

---

## 1. Purpose

The Activity Diagram shows the step-by-step workflow for provisioning new institutional accounts. It shows validation checks, error handling, password hashing, and audit record generation.

---

## 2. Mermaid Activity Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef startEnd fill:#1B5E20,stroke:#123F17,stroke-width:2px,color:#FFFFFF;
    classDef action fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef decision fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    StartNode(( )):::startEnd --> OpenUserModal[Admin clicks New User button]:::action
    OpenUserModal --> InputDetails[Input Name, Email, Password, and Role]:::action
    InputDetails --> ValidateFormat{Is input data valid?}:::decision

    ValidateFormat -- No --> ShowValidationError[Display input validation error]:::action
    ShowValidationError --> InputDetails

    ValidateFormat -- Yes --> CheckEmailExistence{Does email already exist in DB?}:::decision

    CheckEmailExistence -- Yes --> ShowDuplicateError[Display Duplicate Email alert]:::action
    ShowDuplicateError --> InputDetails

    CheckEmailExistence -- No --> HashPassword[Hash password with Bcrypt 10 salt rounds]:::action
    HashPassword --> InsertUserRecord[Insert User row in PostgreSQL]:::action
    InsertUserRecord --> WriteAuditLog[Write AuditLog event: USER_CREATED]:::action
    WriteAuditLog --> RefreshUserList[Refresh active user roster view]:::action
    RefreshUserList --> EndNode((( ))):::startEnd

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Start(["([Pill / Circle]): Start / End Node"]):::legStart
        L_Act["[Rectangle]: Operational Action"]:::legAct
        L_Dec{"{Diamond}: Guard Decision"}:::legDec
        L_App["Approved / Success Flow"]:::legApp
        L_Ret["Returned / Revision Flow"]:::legRet
        L_Start -.-> L_Act -.-> L_Dec
        L_Dec -.->|Condition Met| L_App
        L_Dec -.->|Revision Needed| L_Ret
    end
    classDef legStart fill:#123F17,stroke:#1B5E20,color:#fff;
    classDef legAct fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legDec fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
    classDef legApp fill:#DCEFDD,stroke:#1B5E20,color:#123F17;
    classDef legRet fill:#FEE2E2,stroke:#DC2626,color:#991B1B;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Node Type | Technical Role | MinSU Domain Meaning |
|---|---|---|---|
| `([Pill / Circle])` | `([Start / End])` / `(( ))` | Initial or terminal workflow boundary | Workflow entry point, queue initiation, terminal archive closure |
| `[Rectangle]` | `["Action"]` | Operational task or software routine | Inspecting forms, computing sums, generating receipt, updating status |
| `{Diamond}` | `{"Decision"}` | Mutually exclusive condition / guard | "Compliance verified?", "Variance == 0.00?", "Quota available?" |
| `──▶` | Solid Line `-->` | Sequential flow transition | Standard forward progression between operational activities |
| `-->|Label|` | Guarded Branch | Conditional execution path | "Yes / Approved", "No / Return with Remarks" |
| 🔲 Subgraph | `subgraph Lane` | Departmental Swimlane Boundary | Segregates duties across roles and authority boundaries |
| 🟢 Green Tone | `#DCEFDD` / `#1B5E20` | Approved State / Forward Flow | Validated submissions, executive approvals, zero-variance checks |
| 🟡 Gold Tone | `#FFF1C2` / `#B88A00` | Evaluation / Inspection Gate | Review queues, quota verification, decision checkpoints |
| 🔴 Red / Rose Tone | `#FEE2E2` / `#DC2626` | Return / Discrepancy Alert | Ineligible applications, returned documents, ledger adjustments |


---

## 4. Workflow Procedure

1. Admin clicks the "New User" button on `/users`.
2. Admin enters account name, email address, password, and institutional role.
3. System validates email format and password complexity.
4. If invalid, the system displays validation feedback.
5. If valid, the system verifies email uniqueness in PostgreSQL.
6. If the email already exists, the system halts with an alert.
7. System generates a secure bcrypt hash of the password.
8. System creates the `User` record in the database.
9. System creates an immutable `AuditLog` entry documenting the creation.
10. System closes the modal and refreshes the user roster.
