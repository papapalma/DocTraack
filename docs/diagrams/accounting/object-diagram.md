# Object Diagram: Accounting Officer Domain

## 1. Description
This object diagram shows a runtime instance snapshot of an Accounting Officer compiling and reconciling an Annex 9 Beneficiary Payroll document in MinSU DocTrack. It captures concrete attribute values, financial totals, and object associations at the exact moment of document submission.

## 2. ASD-STE100 Technical Specifications
- Display concrete object instances with explicit identifier values.
- Calculate exact currency sums with zero variance between payroll and allocation.
- Show active audit relationships and status history records.

## 3. Object Diagram (Mermaid)

```mermaid
graph TB
    subgraph Instances ["Runtime Instance Snapshot: Annex 9 Payroll Submission"]
        user1["acctOfficer_1 : User<br/>id = 'usr_acc_881'<br/>name = 'Elena Ramos'<br/>role = 'ACCOUNTING'"]

        doc1["doc_payroll : Document<br/>id = 'doc_annex9_2026_01'<br/>title = 'TDP 1st Sem Beneficiary Payroll'<br/>annexType = 'ANNEX_9'<br/>status = 'SUBMITTED'<br/>createdById = 'usr_acc_881'"]

        meta1["payrollData : FinancialMetadata<br/>allocatedFund = 500000.00 PHP<br/>disbursedAmount = 500000.00 PHP<br/>remainingBalance = 0.00 PHP<br/>beneficiaryCount = 100<br/>checkNumber = 'CHK-2026-9041'<br/>bankAccount = 'LBP-0492-1102'"]

        hist1["status_draft : StatusHistory<br/>id = 'sh_01'<br/>fromStatus = null<br/>toStatus = 'DRAFT'<br/>changedById = 'usr_acc_881'<br/>remarks = 'Initial ledger entry'"]

        hist2["status_submitted : StatusHistory<br/>id = 'sh_02'<br/>fromStatus = 'DRAFT'<br/>toStatus = 'SUBMITTED'<br/>changedById = 'usr_acc_881'<br/>remarks = 'Balanced payroll submitted to Director'"]

        audit1["audit_log_99 : AuditLog<br/>id = 'aud_fin_99'<br/>userId = 'usr_acc_881'<br/>action = 'DOCUMENT_SUBMITTED'<br/>resourceType = 'DOCUMENT'<br/>resourceId = 'doc_annex9_2026_01'"]
    end

    user1 -->|created| doc1
    doc1 -->|contains| meta1
    doc1 -->|appended| hist1
    doc1 -->|transitioned| hist2
    user1 -->|triggered| hist2
    user1 -->|emitted| audit1

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Inst["instanceName : ClassName<br/>attribute1 = value<br/>attribute2 = value"]:::legInst
        L_Link["Link: --predicate-->"]:::legLink
        L_Inst --> L_Link
    end
    classDef legInst fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legLink fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 4. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Format | UML Role | MinSU Instance Context |
|---|---|---|---|
| Instance Node | `instanceName : ClassName` | Concrete runtime instance in memory/DB | Active users, specific scholarship calls, concrete annex documents |
| Attribute Values | `attr = 'value'` | Concrete state of instance properties | `status = 'APPROVED'`, `trackingCode = 'TDP-2026-0192'`, `slotQuota = 250` |
| `-->|predicate|` | Directed Association Link | Concrete relationship between runtime objects | User compiles document, director endorses record, transmittal dispatches |
| Subgraph Boundary | `subgraph GroupName` | Domain grouping boundary | Active Users, Intake Instances, Compiled Annexes, Transmittal Audits |
| 🟢 Green Container | `#F1F8F1` / `#1B5E20` | Operational Domain Entities | Authenticated staff/director records and approved scholarship documents |
| 🟡 Gold Node | `#FFF1C2` / `#B88A00` | Financial & Security Linkages | Ledger documents and audit log event tracking |


## 5. Snapshot State Verification
- **Allocated Fund**: ₱500,000.00 matched exactly with 100 student beneficiaries at ₱5,000.00 each.
- **Variance**: ₱0.00 remaining balance, satisfying zero-variance validation rules.
- **State Transition**: Moved from `DRAFT` to `SUBMITTED`, initiating executive review queue notification.
