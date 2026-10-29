# Accounting Officer — Requirement Diagram (SysML)

> **Role:** `ACCOUNTING`  
> **Diagram Type:** Requirement Diagram (SysML)  
> **Focus:** Fiscal Accuracy, Currency Standards, and Liquidation Timelines

---

## 1. Purpose

The Requirement Diagram maps accounting regulations and fiscal accuracy rules to the software blocks that implement them and the test cases that verify them.

---

## 2. Mermaid Requirement Diagram

```mermaid
requirementDiagram

    requirement REQ_ACC_01 {
        id: REQ-ACC-01
        text: All currency amounts must be formatted in Philippine Peso (PHP) with 2 decimal places.
        risk: Medium
        verifymethod: Test
    }

    requirement REQ_ACC_02 {
        id: REQ-ACC-02
        text: Total disbursements must balance with the CHED allocation before submission is allowed.
        risk: High
        verifymethod: Test
    }

    requirement REQ_ACC_03 {
        id: REQ-ACC-03
        text: LandBank Advice to Debit Account (ADA) entries must enforce standard account number length.
        risk: Medium
        verifymethod: Test
    }

    requirement REQ_ACC_04 {
        id: REQ-ACC-04
        text: The system must enforce a 14-day liquidation transmittal deadline alert.
        risk: Low
        verifymethod: Analysis
    }

    element CurrencyFormatter {
        type: block
    }

    element AllocationReconciliationEngine {
        type: block
    }

    element BankAccountValidator {
        type: block
    }

    element LiquidationTimerService {
        type: block
    }

    element TestCurrencyPrecision {
        type: testCase
    }

    element TestZeroVarianceCheck {
        type: testCase
    }

    element TestBankAccountFormat {
        type: testCase
    }

    element TestLiquidationAlert {
        type: testCase
    }

    %% Satisfy Relations
    CurrencyFormatter - satisfies -> REQ_ACC_01
    AllocationReconciliationEngine - satisfies -> REQ_ACC_02
    BankAccountValidator - satisfies -> REQ_ACC_03
    LiquidationTimerService - satisfies -> REQ_ACC_04

    %% Verify Relations
    TestCurrencyPrecision - verifies -> REQ_ACC_01
    TestZeroVarianceCheck - verifies -> REQ_ACC_02
    TestBankAccountFormat - verifies -> REQ_ACC_03
    TestLiquidationAlert - verifies -> REQ_ACC_04

    %% ─── 📌 VISUAL LEGEND ───
    element legend_guide {
        type: "LEGEND: -contains-> Hierarchy | -satisfies-> Software Block | -verifies-> Test Suite"
    }
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol / Relationship | SysML Syntax | Engineering Purpose | MinSU Implementation Mapping |
|---|---|---|---|
| `requirement req_id` | Requirement Block | Formal system specification with risk level & verify method | `REQ-SEC-01`, `REQ-AUD-01`, `REQ-FIN-01`, `REQ-DIR-01` |
| `element name { type: block }` | Architecture Block | Implementation software module fulfilling the requirement | `src/lib/rbac.ts`, `src/lib/audit.ts`, `src/lib/validation.ts` |
| `element name { type: testCase }` | Test Case Block | Automated test suite ensuring requirement compliance | Unit & E2E role tests, zero-variance math test suite |
| `- contains ->` | Hierarchy Containment | Decomposes high-level goal into specific domain requirements | Root requirement decomposes into security, audit, finance, and SLA |
| `- satisfies ->` | Satisfaction Link | Proves a software block implements the requirement | Architectural blocks satisfying regulatory and functional constraints |
| `- verifies ->` | Verification Link | Proves a test suite validates the requirement | Automated test suites ensuring requirement verification |


---

## 4. Requirements Traceability Matrix

| Requirement ID | Statement | Satisfying Element | Verification Test Case |
|---|---|---|---|
| `REQ-ACC-01` | Philippine Peso formatting (`₱#,##0.00`). | `src/lib/formatters.ts` (`CurrencyFormatter`) | `TestCurrencyPrecision` |
| `REQ-ACC-02` | Zero-variance check between allocation & stipend. | `src/components/documents` (`ReconciliationEngine`) | `TestZeroVarianceCheck` |
| `REQ-ACC-03` | LandBank account number validation. | `src/lib/validation.ts` (`BankAccountValidator`) | `TestBankAccountFormat` |
| `REQ-ACC-04` | 14-day liquidation deadline alert. | `src/lib/liquidation.ts` (`LiquidationTimerService`) | `TestLiquidationAlert` |
