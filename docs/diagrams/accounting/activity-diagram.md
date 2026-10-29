# Accounting Officer — Activity Diagram

> **Role:** `ACCOUNTING`  
> **Diagram Type:** Activity Diagram  
> **Workflow:** Financial Reconciliation & Fiscal Submission Workflow

---

## 1. Purpose

The Activity Diagram shows the step-by-step workflow followed by the Accounting Officer to reconcile grant disbursements, verify peso totals, and submit financial Annexes.

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

    WaitForReview --> ReviewOutcome{Director Decision?}:::decision

    %% Revision Loop
    ReviewOutcome -- Returned --> ReadNotes[Examine fiscal revision comments]:::action
    ReadNotes --> CorrectDiscrepancy[Adjust entries and recalculate]:::action
    CorrectDiscrepancy --> ResubmitFinancial[Click Resubmit for Review]:::action
    ResubmitFinancial --> WaitForReview

    %% Approval Path
    ReviewOutcome -- Approved --> DocumentLocked[Document locked in APPROVED status]:::action
    DocumentLocked --> LogAudit[Write AuditLog event: FINANCIAL_ANNEX_APPROVED]:::action
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

## 4. Workflow Steps

1. Accounting Officer opens the financial document form.
2. Officer inputs LandBank debit accounts, check numbers, and grantee stipends.
3. System automatically calculates sums and remaining balances.
4. If a variance exists between allocation and disbursement, the system alerts the user.
5. Officer adjusts line items until the balance matches zero variance.
6. System formats all amounts as Philippine Peso (`₱#,##0.00`).
7. Officer submits the Annex to the Director's review queue.
8. If returned, Officer adjusts figures according to feedback and resubmits.
9. Upon approval, the document locks against further modifications.
