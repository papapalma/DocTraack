# Accounting Officer — Sequence Diagram

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Sequence Diagram  
> **Scenario:** Financial Verification, Zero-Variance Balancing, and Native Excel Export  
> **Standard:** UML 2.5 Sequence Specification

---

## 1. Purpose

The Sequence Diagram shows the chronological message flow when the Accounting Officer compiles Annex 9 (Beneficiary Payroll), executes zero-variance balancing, exports the native Excel workbook, and submits to executive review. All decision alternatives evaluate strictly to binary Yes and No paths.

---

## 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Accounting as Accounting Officer
    participant UI as Payroll Form UI (Annex 9)
    participant Calc as Math & Variance Engine
    participant Guard as RBAC Guard
    participant API as Document API
    participant ExportAPI as /api/annex-9/export-excel
    participant Prisma as Prisma ORM Client
    participant Notifier as Notification Service
    participant DB as PostgreSQL Database

    %% ─── 📌 VISUAL LEGEND ───
    Note over Accounting,DB: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Rect = Phase Boundary ───

    Accounting->>UI: Enters grantee stipend rows (₱7,500.00 / ₱10,000.00 tiers)
    UI->>Calc: computeGranteePayroll(rows, totalAllocation)
    activate Calc
    Calc->>Calc: Sum line items and compute variance: allocation - disbursements
    Calc-->>UI: Return totals { variance: varianceValue, isBalanced: boolean }
    deactivate Calc

    alt Is Variance == 0.00 PHP? -- Yes
        UI-->>Accounting: Display green checkmark: "Balanced: ₱0.00 Variance"
        Accounting->>UI: Clicks "Export Native Excel (.xlsx)"
        UI->>ExportAPI: GET /api/annex-9/export-excel?docId=:id
        activate ExportAPI
        ExportAPI->>ExportAPI: Generate 3-Tab ExcelJS Workbook (Summary, Payroll, Signatories)
        ExportAPI-->>UI: Stream application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        deactivate ExportAPI
        UI-->>Accounting: Download Annex9_Payroll_Disbursements.xlsx

        Accounting->>UI: Clicks "Submit Annex 9 for Review"
        UI->>Guard: POST /api/documents/:id/submit
        activate Guard
        Guard->>Guard: Verify session token & check role == ACCOUNTING_OFFICER
        Guard->>API: Forward submission action
        activate API
        API->>Prisma: $transaction(UPDATE status = 'SUBMITTED', INSERT status_history)
        activate Prisma
        Prisma->>DB: Commit document status and history row
        DB-->>Prisma: Transaction confirmed
        deactivate Prisma

        API->>Notifier: notifyDirector("New Financial Annex Submitted for Review")
        Notifier->>DB: INSERT INTO notifications
        API-->>UI: 200 OK { success: true, status: "SUBMITTED" }
        deactivate API
        deactivate Guard
        UI-->>Accounting: Display green confirmation toast & update status badge

    else Is Variance == 0.00 PHP? -- No
        UI-->>Accounting: Display red variance alert: "Discrepancy detected; balance required before submission"
        Accounting->>UI: Adjusts check amounts or stipend allocations
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual / Symbol | Element Type | Technical Role | MinSU DocTrack Context |
|---|---|---|---|
| `Actor` | Human User | Initiator of operational procedures | Accounting Officer balancing financial reports |
| `Participant` | System Component | Boundary, controller, or data store | Payroll UI, Math Engine, ExcelJS Exporter, PostgreSQL |
| `->>` | Synchronous Message | Command or method invocation | Compute payroll, export excel, submit to queue |
| `-->>` | Return Message | Response data or confirmation payload | Returns variance calculation, streamed `.xlsx` file |
| `alt / else` | Conditional Frame | Guarded execution path (**Yes** / **No**) | Is Variance == 0.00 PHP? Yes -> submit/export; No -> adjust |

---

## 4. Execution Sequence Steps

1. Accounting Officer inputs stipend disbursements across student grantees.
2. Math engine recalculates total disbursement and compares against grant allocations.
3. If variance equals ₱0.00 (**Yes**), system enables native Excel export and executive submission.
4. If variance deviates from ₱0.00 (**No**), system flags the unbalanced cells in red and halts submission.
5. Officer downloads the native multi-tab `ExcelJS` spreadsheet and submits the draft to the Director.
