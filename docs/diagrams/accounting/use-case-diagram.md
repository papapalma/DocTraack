# Accounting Officer — Use Case Diagram

> **Role:** `ACCOUNTING`  
> **Diagram Type:** Use Case Diagram  
> **Standard:** UML 2.5 Use Case Specification

---

## 1. Purpose

The Use Case Diagram shows all financial operations executed by the Accounting Officer for Annexes 6, 7, 8, and 9, including balance reconciliation and multi-tab native ExcelJS export.

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
        UC_ReconcileTotals(["Reconcile Grant Allocation & Zero Variance"]):::inclStyle
        UC_SubmitReview(["Submit Financial Report for Review"]):::ucStyle
        UC_ReviewHistory(["Inspect Fiscal Revision History"]):::ucStyle
        UC_ExportExcel(["Export Native Multi-Tab Excel (.xlsx)"]):::ucStyle
        UC_UploadScans(["Upload Scanned Signed Financial PDF"]):::ucStyle
    end

    Accounting --- UC_Annex6
    Accounting --- UC_Annex7
    Accounting --- UC_Annex8
    Accounting --- UC_Annex9
    Accounting --- UC_SubmitReview
    Accounting --- UC_ReviewHistory
    Accounting --- UC_ExportExcel
    Accounting --- UC_UploadScans

    UC_Annex6 -.->|<<include>>| UC_ReconcileTotals
    UC_Annex7 -.->|<<include>>| UC_ValidateBank
    UC_Annex9 -.->|<<include>>| UC_ReconcileTotals
    UC_Annex6 -.->|<<extend>>| UC_ExportExcel
    UC_Annex7 -.->|<<extend>>| UC_ExportExcel
    UC_Annex8 -.->|<<extend>>| UC_ExportExcel
    UC_Annex9 -.->|<<extend>>| UC_ExportExcel

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Actor["[Actor]: User Role"]:::legActor
        L_UC(["(Use Case Action)"]):::legUC
        L_Actor --> L_UC
        L_UC -.->|<<include>>| L_Audit(["(Sub-Action)"]):::legUC
    end
    classDef legActor fill:#F6F8F6,stroke:#1B5E20,color:#1F2A24;
    classDef legUC fill:#FFFFFF,stroke:#1B5E20,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Use Case Concept | MinSU System Implementation |
|---|---|---|---|
| `actor` / `[Actor]` | External Role | Financial officer responsible for accounts | Accounting Officer |
| `usecase` / `(["(Action)"])` | Use Case Unit | Financial operation or report | Prepare Annex 6/7/8/9, Reconcile Totals, Export Excel |
| `-->` Solid Arrow | Actor Association | User initiates financial action | Accounting submits reports, exports workbooks, uploads scans |
| `..>` / `-.->` Dashed Arrow | Stereotyped Dependency | Relationship between use cases | `<<include>>` (Mandatory reconciliation) or `<<extend>>` (Optional Excel export) |

---

## 4. PlantUML Use Case Diagram

```plantuml
@startuml
skinparam actorStyle awesome
skinparam packageBackgroundColor #F6F8F6
skinparam usecaseBackgroundColor #FFFFFF
skinparam usecaseBorderColor #1B5E20

actor "Accounting Officer" as Accounting

rectangle "Financial Operations Boundary" {
  usecase "Prepare Annex 6: FUR" as UC_6
  usecase "Prepare Annex 7: RADAI" as UC_7
  usecase "Prepare Annex 8: RCI" as UC_8
  usecase "Compile Annex 9: Payroll" as UC_9
  usecase "Validate LandBank Accounts" as UC_Bank
  usecase "Reconcile Zero Variance" as UC_Zero
  usecase "Submit Financial Report" as UC_Submit
  usecase "Export Native Excel (.xlsx)" as UC_Excel
  usecase "Upload Signed Scan" as UC_Scan
}

Accounting --> UC_6
Accounting --> UC_7
Accounting --> UC_8
Accounting --> UC_9
Accounting --> UC_Submit
Accounting --> UC_Excel
Accounting --> UC_Scan

UC_6 ..> UC_Zero : <<include>>
UC_7 ..> UC_Bank : <<include>>
UC_9 ..> UC_Zero : <<include>>
UC_6 ..> UC_Excel : <<extend>>
UC_9 ..> UC_Excel : <<extend>>
@enduml
```
