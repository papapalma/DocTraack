# Accounting Officer — Requirement Diagram (SysML)

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Requirement Diagram (SysML)  
> **Focus:** Fiscal Accuracy, Currency Standards, Zero-Variance Balancing, and Excel Exports

---

## 1. Purpose

The Requirement Diagram maps accounting regulations, currency standards, and zero-variance balancing rules to the software architecture blocks that satisfy them and the test suites that verify them.

---

## 2. Mermaid Requirement Diagram

```mermaid
requirementDiagram

    requirement REQ_ACC_01 {
        id: REQ-ACC-01
        text: All financial figures shall be formatted in Philippine Peso (PHP) with 2 decimal precision.
        risk: Medium
        verifymethod: Test
    }

    requirement REQ_ACC_02 {
        id: REQ-ACC-02
        text: Total disbursements shall balance exactly with CHED grant allocations with 0.00 PHP variance.
        risk: Critical
        verifymethod: Test
    }

    requirement REQ_ACC_03 {
        id: REQ-ACC-03
        text: The system shall stream native multi-tab ExcelJS workbooks with live sum formulas.
        risk: High
        verifymethod: Test
    }

    requirement REQ_ACC_04 {
        id: REQ-ACC-04
        text: Beneficiary payroll shall support dynamic stipend tiers of 7500 PHP, 10000 PHP, or custom amounts.
        risk: High
        verifymethod: Test
    }

    requirement REQ_ACC_05 {
        id: REQ-ACC-05
        text: The system shall catalog Landbank ADA debit notices and MDS check registers.
        risk: Medium
        verifymethod: Test
    }

    requirement REQ_ACC_06 {
        id: REQ-ACC-06
        text: Stamped physical scans shall be persisted to uploads storage with immutable audit logging.
        risk: Low
        verifymethod: Inspection
    }

    element CurrencyFormatter {
        type: block
    }

    element ZeroVarianceValidator {
        type: block
    }

    element ExcelJSExporter {
        type: block
    }

    element StipendTierResolver {
        type: block
    }

    element BankReconciliationModule {
        type: block
    }

    element ScanUploadAuditLogger {
        type: block
    }

    CurrencyFormatter - satisfies -> REQ_ACC_01
    ZeroVarianceValidator - satisfies -> REQ_ACC_02
    ExcelJSExporter - satisfies -> REQ_ACC_03
    StipendTierResolver - satisfies -> REQ_ACC_04
    BankReconciliationModule - satisfies -> REQ_ACC_05
    ScanUploadAuditLogger - satisfies -> REQ_ACC_06
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol / Syntax | SysML Concept | Technical Function | MinSU Domain Meaning |
|---|---|---|---|
| `requirement NAME` | Requirement Block | Declares functional or regulatory constraint | `REQ-ACC-02` (Zero-Variance Balancing) |
| `element NAME` | Architecture Element | Block or component satisfying requirement | `ZeroVarianceValidator`, `ExcelJSExporter` |
| `- satisfies ->` | Satisfy Relationship | Traceability link from component to requirement | Component satisfies explicit business specification |
| `verifymethod` | Verification Attribute | Method of verifying compliance | `Test` (`npm run test:all`), `Inspection` |

---

## 4. Requirements Traceability

- **`REQ-ACC-01`**: Satisfied by `CurrencyFormatter` in `src/lib/formatters.ts`, tested across all table views.
- **`REQ-ACC-02`**: Satisfied by `ZeroVarianceValidator`, blocking submission if variance deviates from 0.00.
- **`REQ-ACC-03`**: Satisfied by `ExcelJSExporter`, verified by automated workbook stream tests.
- **`REQ-ACC-04`**: Satisfied by `StipendTierResolver`, verified by `tests/student-data-integrity.test.ts`.
- **`REQ-ACC-05`**: Satisfied by `BankReconciliationModule`, cataloging ADA entries for Annex 7 and checks for Annex 8.
- **`REQ-ACC-06`**: Satisfied by `ScanUploadAuditLogger`, creating tamper-evident records on signed scan upload.
