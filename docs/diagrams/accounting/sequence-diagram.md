# Accounting Officer — Sequence Diagram

> **Role:** `ACCOUNTING`  
> **Diagram Type:** Sequence Diagram  
> **Scenario:** Financial Verification & Payroll Submission Sequence

---

## 1. Purpose

The Sequence Diagram shows the messages exchanged when the Accounting Officer compiles Annex 9 (Beneficiary Payroll), verifies stipend calculations, and submits the document to the Director.

---

## 2. Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Accounting as Accounting Officer
    participant UI as Payroll Form UI (Annex 9)
    participant Calc as Math & Formatting Engine
    participant Guard as RBAC Middleware
    participant API as Document API
    participant Prisma as Prisma ORM Client
    participant Notifier as Notification Service
    participant DB as PostgreSQL Database

    %% ─── 📌 VISUAL LEGEND ───
    Note over Accounting,DB: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Rect = Phase Boundary ───


    Accounting->>UI: Enters 50 grantee stipend rows (₱10,000.00 each)
    UI->>Calc: computeGranteePayroll(rows, totalAllocation: 500000)
    activate Calc
    Calc->>Calc: Sum line items: totalDisbursed = ₱500,000.00
    Calc->>Calc: Calculate balance: 500,000.00 - 500,000.00 = ₱0.00
    Calc-->>UI: Return validated totals { variance: 0.00, isValid: true }
    deactivate Calc

    UI-->>Accounting: Display green checkmark: "Balanced: ₱500,000.00"
    Accounting->>UI: Clicks "Submit Annex 9 for Review"
    
    UI->>Guard: POST /api/documents/doc_902/submit { formData: { ... } }
    activate Guard
    Guard->>Guard: Verify session & role in [ACCOUNTING, STAFF]
    Guard->>API: Forward request
    activate API
    
    API->>Prisma: $transaction(Update Document to SUBMITTED & record StatusHistory)
    activate Prisma
    Prisma->>DB: UPDATE documents SET status = 'SUBMITTED', formData = jsonPayload WHERE id = 'doc_902'
    Prisma->>DB: INSERT INTO status_history (doc_902, 'DRAFT', 'SUBMITTED', accountingId)
    Prisma-->>API: Transaction committed
    deactivate Prisma
    
    API->>Notifier: notifyRole("DIRECTOR", "New Financial Annex Submitted for Review")
    Notifier->>DB: INSERT INTO notifications (...)
    
    API-->>UI: 200 OK { success: true, status: "SUBMITTED" }
    deactivate API
    deactivate Guard
    
    UI-->>Accounting: Display toast: "Annex 9 submitted to Director review queue"

```

---

## 3. Diagram Legend & Symbol Guide

| Visual / Symbol | Element Type | Technical Role | MinSU DocTrack Context |
|---|---|---|---|
| 👤 `actor` | Human Actor | External user role triggering system operations | Student Applicant, Staff Coordinator, Campus Director, Accounting Officer |
| 🔲 `participant` | System Component | Internal software subsystem or persistence boundary | Web UI, API Endpoint, Workflow Engine, Prisma/PostgreSQL, PDF Compiler |
| ──▶ `->>` | Solid Arrow | Synchronous invocation or command message | Submitting forms, verifying tokens, invoking database writes |
| - - ▷ `-->>` | Dashed Arrow | Return response or data payload | Confirmation slips, tracking codes, PDF binary buffers, query results |
| 🔲 `activate / deactivate` | Activation Lifeline | Period during which a component executes logic | Active request execution on API controllers or PDF engines |
| 🔲 `alt / else` | Conditional Fragment | Decision tree handling alternative workflow paths | Approval vs. Return branching, SLA compliance checks |


---

## 4. Sequence Details

1. Accounting Officer enters stipend rows for student beneficiaries.
2. The client-side math engine verifies that line items balance against the grant allocation.
3. Accounting Officer submits the completed Annex 9.
4. RBAC guard confirms that the user is an authorized `ACCOUNTING` officer.
5. API locks the document and transitions status from `DRAFT` to `SUBMITTED`.
6. System notifies the Campus Director of the pending review.
