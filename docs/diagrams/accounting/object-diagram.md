# Accounting Officer — Object Diagram

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Object Diagram  
> **Scenario:** Runtime Snapshot of Annex 9 Payroll Submission & Zero-Variance Reconciliation  
> **Standard:** UML 2.5 Object Specification

---

## 1. Purpose

The Object Diagram shows a concrete runtime snapshot of objects, attribute values, and links created when an Accounting Officer balances an Annex 9 Beneficiary Payroll and submits it to executive review.

---

## 2. Mermaid Object Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;

    user1["<u>acctOfficer : User</u><br/>id = 'usr_acc_881'<br/>name = 'Elena Ramos'<br/>role = ACCOUNTING_OFFICER<br/>twoFactorEnabled = true"]:::objStyle

    doc1["<u>doc_payroll : Document</u><br/>id = 'doc_annex9_2026_01'<br/>title = 'TDP 1st Sem Beneficiary Payroll'<br/>annexType = ANNEX_9<br/>status = SUBMITTED<br/>createdById = 'usr_acc_881'"]:::objStyle

    meta1["<u>payrollTotals : FinancialSummary</u><br/>allocatedFund = 500000.00 PHP<br/>totalDisbursed = 500000.00 PHP<br/>variance = 0.00 PHP<br/>beneficiaryCount = 50<br/>checkNumber = 'CHK-2026-9041'"]:::objStyle

    excelObj["<u>payrollWorkbook : ExcelWorkbook</u><br/>fileName = 'Annex9_Payroll_2026.xlsx'<br/>tabCount = 3<br/>formattedCurrency = true"]:::objStyle

    histObj["<u>statusHistory : StatusHistory</u><br/>id = 'sh_02'<br/>fromStatus = DRAFT<br/>toStatus = SUBMITTED<br/>actorId = 'usr_acc_881'<br/>remarks = 'Zero variance verified against CHED allocation'"]:::objStyle

    audit1["<u>auditLog : AuditLog</u><br/>id = 'aud_fin_99'<br/>actorId = 'usr_acc_881'<br/>action = 'FINANCIAL_ANNEX_SUBMITTED'<br/>entity = 'DOCUMENT'<br/>entityId = 'doc_annex9_2026_01'"]:::objStyle

    user1 ---|prepares| doc1
    doc1 ---|summarized by| meta1
    doc1 ---|exported as| excelObj
    doc1 ---|transitioned by| histObj
    user1 ---|submits| histObj
    user1 ---|triggers| audit1
    audit1 ---|logs| doc1

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Inst["<u>instanceName : ClassName</u><br/>attribute1 = value<br/>attribute2 = value"]:::legInst
        L_Link["Link: ---predicate---"]:::legLink
        L_Inst --> L_Link
    end
    classDef legInst fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legLink fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Format | UML Role | MinSU Instance Context |
|---|---|---|---|
| `<u>instance : Class</u>` | Underlined Identifier | Concrete runtime object in memory | Accounting Officer, active payroll document, Excel file |
| `attr = 'value'` | Key-Value Assignment | Concrete state of instance properties | `variance = 0.00 PHP`, `status = SUBMITTED` |
| `---predicate---` | Undirected Semantic Link | Association relationship at runtime | Officer prepares document, exports workbook |
| 🟢 Green Container | `#1B5E20` / `#F1F8F1` | Verified Financial Entity | Balanced payroll with zero variance ready for endorsement |

---

## 4. Runtime Object Attributes

- `acctOfficer`: Authenticated accounting user with verified two-factor authentication.
- `doc_payroll`: Official Annex 9 payroll document transitioned to `SUBMITTED`.
- `payrollTotals`: Reconciled figures showing exact ₱0.00 variance between allocation and disbursements.
- `payrollWorkbook`: Native 3-tab `ExcelJS` spreadsheet generated from live grantee line items.
- `auditLog`: Immutable security entry documenting the submission event.
