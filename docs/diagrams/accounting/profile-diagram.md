# Accounting Officer — Profile Diagram

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Profile Diagram  
> **Target Domain:** Financial Compliance, Zero-Variance Balancing, and ExcelJS Workbooks

---

## 1. Purpose

The Profile Diagram defines domain-specific UML stereotypes and constraints governing financial annex operations, currency precision rules, zero-variance balancing, and native Excel export configurations.

---

## 2. Mermaid Profile Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef metaStyle fill:#F6F8F6,stroke:#55645B,stroke-width:1.5px,color:#1F2A24;
    classDef stereoStyle fill:#DCEFDD,stroke:#1B5E20,stroke-width:2px,color:#123F17;

    subgraph METACLASSES["UML Metaclasses"]
        MetaClass["<<metaclass>><br/>Class"]:::metaStyle
        MetaProp["<<metaclass>><br/>Property"]:::metaStyle
        MetaOp["<<metaclass>><br/>Operation"]:::metaStyle
    end

    subgraph PROFILE["<<profile>> MinSU_Accounting_Profile"]
        FinancialAnnex["<<stereotype>><br/>FinancialAnnex<br/>+annexNumbers: List~Int~ = [6,7,8,9]<br/>+requiresZeroVariance: Boolean = true"]:::stereoStyle

        CurrencyPrecision["<<stereotype>><br/>CurrencyPrecision<br/>+currencyCode: String = 'PHP'<br/>+decimalPlaces: Int = 2<br/>+allowNegative: Boolean = false"]:::stereoStyle

        ZeroVarianceRule["<<stereotype>><br/>ZeroVarianceRule<br/>+tolerancePHP: Float = 0.00<br/>+enforceOnSubmit: Boolean = true"]:::stereoStyle

        ExportableWorkbook["<<stereotype>><br/>ExportableWorkbook<br/>+library: String = 'ExcelJS'<br/>+tabCount: Int = 3<br/>+formulaValidation: Boolean = true"]:::stereoStyle

        AccountingSignatory["<<stereotype>><br/>AccountingSignatory<br/>+role: Role = ACCOUNTING_OFFICER<br/>+requires2FA: Boolean = true"]:::stereoStyle
    end

    FinancialAnnex -- "<<extension>>" --> MetaClass
    CurrencyPrecision -- "<<extension>>" --> MetaProp
    ZeroVarianceRule -- "<<extension>>" --> MetaOp
    ExportableWorkbook -- "<<extension>>" --> MetaClass
    AccountingSignatory -- "<<extension>>" --> MetaClass

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Meta["<<metaclass>><br/>UML Foundation"]:::metaStyle
        L_Stereo["<<stereotype>><br/>Domain Extension<br/>+taggedValue: Type"]:::stereoStyle
        L_Stereo -- "<<extension>>" --> L_Meta
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Profile Mechanism | MinSU Governance Application |
|---|---|---|---|
| `<<metaclass>>` Box | `fill:#F6F8F6, stroke:#55645B` | Core UML base meta-element | Standard UML `Class`, `Property`, or `Operation` |
| `<<stereotype>>` Box | `fill:#DCEFDD, stroke:#1B5E20` | Domain-specific extension | `<<FinancialAnnex>>`, `<<ZeroVarianceRule>>`, `<<CurrencyPrecision>>` |
| `+taggedValue: Type` | Tagged Value Attribute | Metadata property attached to stereotype | `currencyCode = 'PHP'`, `tolerancePHP = 0.00`, `library = 'ExcelJS'` |
| `-- "<<extension>>" -->` | Extension Relationship | Extends metaclass semantics | Connects custom accounting stereotype to standard UML metaclass |

---

## 4. Stereotype Tagged Values & Rules

- **`<<FinancialAnnex>>`**: Restricts authoring permissions exclusively to the `ACCOUNTING_OFFICER` role.
- **`<<CurrencyPrecision>>`**: Formats all numeric amounts in Philippine Peso (`₱#,##0.00`) aligned to two decimal places.
- **`<<ZeroVarianceRule>>`**: Enforces strict equality between grant allocation sums and line item disbursements before submission.
- **`<<ExportableWorkbook>>`**: Directs the generation of native multi-tab `.xlsx` workbooks with live Excel sum formulas.
- **`<<AccountingSignatory>>`**: Enforces two-factor authentication on financial submission and scan upload operations.
