# Accounting Officer — Communication Diagram

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Communication Diagram  
> **Scenario:** Annex 6 Fund Utilization Balancing, Excel Export, and Submission  
> **Standard:** UML 2.5 Communication Specification

---

## 1. Purpose

The Communication Diagram shows the structural links and numbered message invocations during financial balancing, native multi-tab Excel generation, and executive submission performed by the Accounting Officer.

---

## 2. Mermaid Communication Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;

    AcctUser["accounting : AccountingOfficer"]:::actorStyle
    AcctUI["acctUI : FinancialFormView"]:::objStyle
    DocCtrl["docCtrl : FinancialDocumentController"]:::objStyle
    FinMath["finMath : ZeroVarianceEngine"]:::objStyle
    ExcelExport["excel : ExcelJSExporter"]:::objStyle
    PrismaDB["db : PrismaClient"]:::objStyle
    AuditLog["audit : AuditService"]:::objStyle
    NotifSvc["notif : NotificationService"]:::objStyle

    %% Object Links and Numbered Messages
    AcctUser ---|1: submitFinancialAnnex(formData)| AcctUI
    AcctUI ---|2: calculateVariance(alloc, disburse)| FinMath
    FinMath ---|3: returnVariance(0.00 PHP)| AcctUI
    AcctUI ---|4: requestWorkbookExport(docId)| ExcelExport
    ExcelExport ---|5: streamExcelWorkbook(Annex6.xlsx)| AcctUI
    AcctUI ---|6: POST /api/documents/:id/submit| DocCtrl
    DocCtrl ---|7: updateDocumentStatus('SUBMITTED')| PrismaDB
    DocCtrl ---|8: logAuditEvent(FINANCIAL_ANNEX_SUBMITTED)| AuditLog
    DocCtrl ---|9: notifyDirector('New Annex 6 Submitted')| NotifSvc
    DocCtrl ---|10: 200 OK (Submission Confirmed)| AcctUI
    AcctUI ---|11: displaySuccessNotice()| AcctUser

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Node["Node : Subsystem Component"]:::legNode
        L_Msg["Link: N: methodName(args)"]:::legMsg
        L_Node -->|Call Sequence| L_Msg
    end
    classDef legNode fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legMsg fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Communication Meaning | MinSU Implementation |
|---|---|---|---|
| `[Object]` | `["instance : Class"]` | Named runtime instance participating in flow | `accounting`, `docCtrl`, `finMath`, `excel : ExcelJSExporter` |
| `---` | Association Line | Structural communication link between objects | Connects UI to calculation engine and controller |
| `N: method()` | Sequence Call Number | Chronological order and message invocation | `1: submit()`, `2: calculateVariance()`, `4: requestExport()` |
| 🟢 Green Tone | `#F1F8F1` / `#1B5E20` | Accounting Actor / Authorized Endpoint | Authenticated Accounting Officer managing financial reports |

---

## 4. Message Invocation Sequence

1. Accounting Officer triggers submission of Annex 6 Fund Utilization in the browser.
2. UI invokes `ZeroVarianceEngine` to compare line item expenditures against grant allocations.
3. Engine confirms exact ₱0.00 variance.
4. Officer requests a native Excel workbook; `ExcelJS` streams the multi-tab spreadsheet.
5. UI submits the verified document to the server.
6. Controller transitions status to `SUBMITTED` in PostgreSQL.
7. Audit service creates an immutable security log entry.
8. Notification service alerts the Campus Director of the pending financial review.
9. UI displays a success confirmation toast to the Accounting Officer.
