# Campus Director — Activity Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Activity Diagram  
> **Workflow:** Executive Review Queue Decision & Endorsement Workflow

---

## 1. Purpose

The Activity Diagram shows the step-by-step workflow when the Campus Director reviews submitted documents. It illustrates inspection, decision branching, approval locking, and return feedback.

---

## 2. Mermaid Activity Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef startEnd fill:#1B5E20,stroke:#123F17,stroke-width:2px,color:#FFFFFF;
    classDef action fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef decision fill:#FFF1C2,stroke:#F2B705,stroke-width:1.5px,color:#1F2A24;

    StartNode(( )):::startEnd --> OpenReviewQueue[Director opens /review queue]:::action
    OpenReviewQueue --> SelectDocument[Select submitted Annex document]:::action
    SelectDocument --> InspectFormData[Inspect grantee roster and financial totals]:::action
    InspectFormData --> PreviewPDF[Preview compiled CHED PDF template]:::action
    
    PreviewPDF --> EvaluationDecision{Meets compliance & accuracy criteria?}:::decision

    %% Approval Path
    EvaluationDecision -- Yes --> ClickApprove[Director clicks Approve Annex]:::action
    ClickApprove --> LockDocument[Lock document data against direct edits]:::action
    LockDocument --> SetStatusApproved[Update status to APPROVED in database]:::action
    SetStatusApproved --> RecordStatusHistoryApprove[Record StatusHistory entry]:::action
    RecordStatusHistoryApprove --> NotifyStaffApproved[Send in-app notification to preparer]:::action
    NotifyStaffApproved --> LogAuditApprove[Log AuditLog event: DOCUMENT_APPROVED]:::action
    LogAuditApprove --> EndNodeApproved((( ))):::startEnd

    %% Return Path
    EvaluationDecision -- No --> ClickReturn[Director clicks Return Document]:::action
    ClickReturn --> OpenReturnModal[Open Return Confirmation dialog]:::action
    OpenReturnModal --> EnterFeedbackNotes[Enter required revision instructions]:::action
    EnterFeedbackNotes --> SetStatusReturned[Update status to RETURNED in database]:::action
    SetStatusReturned --> SaveFeedbackComment[Insert Comment record with feedback]:::action
    SaveFeedbackComment --> NotifyStaffReturned[Send in-app revision alert to preparer]:::action
    NotifyStaffReturned --> LogAuditReturn[Log AuditLog event: DOCUMENT_RETURNED]:::action
    LogAuditReturn --> EndNodeReturned((( ))):::startEnd

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

1. Director navigates to `/review` on the dashboard.
2. Director selects a pending Annex document from the queue.
3. System presents the structured data table and financial calculations.
4. Director verifies grantee eligibility and peso balances against policy.
5. If valid, Director clicks "Approve Annex".
6. System locks the record, marks it `APPROVED`, and alerts the preparer.
7. If errors exist, Director opens the return dialog and provides feedback.
8. System updates the status to `RETURNED`, attaches comments, and alerts the preparer for revision.
