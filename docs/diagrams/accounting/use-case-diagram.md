# Accounting Officer — Use Case Diagram

> **Role:** `ACCOUNTING`  
> **Diagram Type:** Use Case Diagram  
> **Standard:** UML 2.5 Use Case Specification

---

## 1. Purpose

The Use Case Diagram shows all financial operations executed by the Accounting Officer for Annexes 6, 7, 8, and 9.

---

## 2. Mermaid Use Case Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ucStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef inclStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:1px,stroke-dasharray: 4 4,color:#1F2A24;

    Accounting(("Accounting Officer")):::actorStyle

    subgraph SYSTEM_BOUNDARY["MinSU DocTrack Financial Operations Boundary"]
        UC_Annex6(["Prepare Annex 6: Fund Utilization"]):::ucStyle
        UC_Annex7(["Prepare Annex 7: Advice to Debit (ADA)"]):::ucStyle
        UC_Annex8(["Prepare Annex 8: Checks Issued (RCI)"]):::ucStyle
        UC_Annex9(["Compile Annex 9: Beneficiary Payroll"]):::ucStyle
        UC_ValidateBank(["Validate LandBank Account Numbers"]):::inclStyle
        UC_ReconcileTotals(["Reconcile Grant Allocation & Balance"]):::inclStyle
        UC_SubmitReview(["Submit Financial Report for Review"]):::ucStyle
        UC_ReviewHistory(["Inspect Fiscal Revision History"]):::ucStyle
    end

    Accounting --- UC_Annex6
    Accounting --- UC_Annex7
    Accounting --- UC_Annex8
    Accounting --- UC_Annex9
    Accounting --- UC_SubmitReview
    Accounting --- UC_ReviewHistory

    UC_Annex6 -.->|<<include>>| UC_ReconcileTotals
    UC_Annex7 -.->|<<include>>| UC_ValidateBank
    UC_Annex9 -.->|<<include>>| UC_ReconcileTotals

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Actor["[Actor]: User Role"]:::legActor
        L_UC(["(Use Case Action)"]):::legUC
        L_Actor --> L_UC
        L_UC -.->|<<include>>| L_Audit(["(Audit Logging)"]):::legUC
    end
    classDef legActor fill:#F6F8F6,stroke:#1B5E20,color:#1F2A24;
    classDef legUC fill:#FFFFFF,stroke:#1B5E20,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Use Case Concept | MinSU System Implementation |
|---|---|---|---|
| `actor` / `[Actor]` | External Role | User or external system triggering use cases | Student, Staff Coordinator, Campus Director, Accounting, Admin, CHED Agency |
| `usecase` / `(["(Action)"])` | Use Case Unit | Distinct capability or user goal | Browse Calls, Submit Application, 1-Click Endorsement, Reconcile Financials |
| `-->` Solid Arrow | Actor Association | User initiates or receives data from the use case | Student initiates application, Director approves, Staff dispatches |
| `..>` / `-.->` Dashed Arrow | Stereotyped Dependency | Relationship between two use cases | `<<include>>` (Mandatory invocation) or `<<extend>>` (Optional augmentation) |
| `<<include>>` | Mandatory Inclusion | Always executed as part of base use case | Every mutation includes `Record Immutable Audit Log` & `Authenticate` |
| `<<extend>>` | Optional Extension | Conditionally extends base use case | Payroll compilation optionally triggers `Export Printable PDF` |


---

## 4. PlantUML Use Case Diagram

```plantuml
@startuml
skinparam actorStyle awesome
skinparam packageBackgroundColor #F6F8F6
skinparam usecaseBackgroundColor #FFFFFF
skinparam usecaseBorderColor #1B5E20

actor "Accounting Officer" as Accounting

rectangle "MinSU Financial Operations Subsystem" {
  usecase "Prepare Annex 6 (Fund Utilization)" as UC_A6
  usecase "Prepare Annex 7 (ADA Debit Register)" as UC_A7
  usecase "Prepare Annex 8 (Checks Issued)" as UC_A8
  usecase "Compile Annex 9 (Beneficiary Payroll)" as UC_A9
  usecase "Reconcile Peso Balances" as UC_Reconcile
  usecase "Validate Bank Numbers" as UC_Bank
  usecase "Submit Financial Annex" as UC_Submit
  usecase "View Revision History" as UC_History
}

Accounting --> UC_A6
Accounting --> UC_A7
Accounting --> UC_A8
Accounting --> UC_A9
Accounting --> UC_Submit
Accounting --> UC_History

UC_A6 ..> UC_Reconcile : <<include>>
UC_A7 ..> UC_Bank : <<include>>
UC_A9 ..> UC_Reconcile : <<include>>

@enduml
```

---

## 5. Use Case Specifications

- **Prepare Annex 6**: Records subsidy allocations received from CHED against total disbursements made to students.
- **Prepare Annex 7**: Catalogs LandBank Advice to Debit Account (ADA) entries with account numbers and debit dates.
- **Prepare Annex 8**: Logs physical checks issued to unbanked student grantees with serial numbers and amounts.
- **Compile Annex 9**: Aggregates grantee payroll sheets with individual grant stipends (`₱#,##0.00`) and student signatures.
- **Submit Financial Report**: Submits the verified fiscal document to the Campus Director's review queue.
