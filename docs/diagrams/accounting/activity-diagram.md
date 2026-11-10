# Accounting Officer — Activity Diagram

> **Role:** `ACCOUNTING`  
> **Diagram Type:** Activity Diagram  
> **Workflow:** Financial Reconciliation, Fiscal Submission & Native Excel Export

---

## 1. Purpose

The Activity Diagram shows the step-by-step workflow followed by the Accounting Officer to reconcile grant disbursements, verify peso totals, submit financial Annexes, and export native multi-tab Excel workbooks.

---

## 2. Mermaid Activity Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef startEnd fill:#1B5E20,stroke:#123F17,stroke-width:2px,color:#FFFFFF;
    classDef action fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef decision fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    StartNode(( )):::startEnd --> SelectAnnex[Accounting selects financial Annex 6, 7, 8, or 9]:::action
    SelectAnnex --> InputFinancialData[Enter allocation amounts, check numbers, and grantee stipends]:::action
    InputFinancialData --> AutoCalculateTotals[System calculates total disbursements in real time]:::action
    
    AutoCalculateTotals --> CheckBalance{Do line items balance with CHED grant allocation?}:::decision

    CheckBalance -- No --> HighlightDiscrepancy[Display red variance alert]:::action
    HighlightDiscrepancy --> AdjustLineItems[Review check numbers and stipend amounts]:::action
    AdjustLineItems --> AutoCalculateTotals

    CheckBalance -- Yes --> FormatCurrency[Format all figures in Philippine Peso: ₱#,##0.00]:::action
    FormatCurrency --> SubmitToDirector[Submit financial Annex to Director review queue]:::action
    SubmitToDirector --> WaitForReview[Wait for Campus Director review]:::action

    WaitForReview --> ReviewOutcome{Does Director Approve Document?}:::decision

    %% Revision Loop
    ReviewOutcome -- No --> ReadNotes[Examine fiscal revision comments]:::action
    ReadNotes --> CorrectDiscrepancy[Adjust entries and recalculate]:::action
    CorrectDiscrepancy --> ResubmitFinancial[Click Resubmit for Review]:::action
    ResubmitFinancial --> WaitForReview

    %% Approval Path
    ReviewOutcome -- Yes --> DocumentLocked[Document locked in APPROVED status]:::action
    DocumentLocked --> ExportExcel[Export native multi-tab Excel .xlsx via /api/annex-*/export-excel]:::action
    ExportExcel --> UploadSignedScan[Upload stamped wet-signed scan at /documents/id/upload]:::action
    UploadSignedScan --> LogAudit[Write AuditLog event: FINANCIAL_ANNEX_APPROVED]:::action
    LogAudit --> EndNode((( ))):::startEnd

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Start(["([Pill / Circle]): Start / End Node"]):::legStart
        L_Act["[Rectangle]: Operational Action"]:::legAct
        L_Dec{"{Diamond}: Guard Decision"}:::legDec
        L_App["Approved / Success Flow"]:::legApp
        L_Ret["Returned / Revision Flow"]:::legRet
        L_Start -.-> L_Act -.-> L_Dec
        L_Dec -.->|Yes| L_App
        L_Dec -.->|No| L_Ret
    end
    classDef legStart fill:#1B5E20,color:#fff;
    classDef legAct fill:#FFFFFF,stroke:#1B5E20,color:#1F2A24;
    classDef legDec fill:#FFF1C2,stroke:#F2B705,color:#1F2A24;
    classDef legApp fill:#DCEFDD,stroke:#1B5E20,color:#123F17;
    classDef legRet fill:#FEE2E2,stroke:#DC2626,color:#991B1B;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Activity Concept | MinSU System Implementation |
|---|---|---|---|
| `Start / End` | `(( ))` / `((( )))` | Initial / Final State | Financial workflow begins at Annex selection and ends at signed audit logging |
| `Action` | `[Rectangle]` | Accounting Procedure | Input Data, Calculate Totals, Format Currency, Submit, Export Excel |
| `Decision` | `{Diamond}` | Guard Evaluation | Zero-variance check against grant allocation; Director endorsement decision |

---

## 4. PlantUML Activity Diagram

```plantuml
@startuml
skinparam activityBackgroundColor #FFFFFF
skinparam activityBorderColor #1B5E20

start
:Select Financial Annex (6, 7, 8, 9);
:Input Disbursed Totals & Bank Advice;
:Calculate Line Items in Real Time;

if (Variance == ₱0.00?) then (yes)
  :Format in Currency (₱#,##0.00);
  :Submit to Campus Director;
else (no)
  :Highlight Variance in Red;
  :Adjust Entries;
  detach
endif

if (Does Director Approve Document?) then (yes)
  :Document Locked in APPROVED State;
  :Export Multi-Tab Excel Workbook (.xlsx);
  :Upload Stamped Scanned PDF;
  :Emit Financial Audit Event;
  stop
else (no)
  :Inspect Fiscal Comments;
  :Resubmit for Review;
  detach
endif
@enduml
```
