# Accounting Officer — Component Diagram

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Component Diagram  
> **Standard:** UML 2.5 Component Specification

---

## 1. Purpose

The Component Diagram shows the software components, provided interfaces, and required dependencies within the Accounting Officer subsystem, managing Annexes 6, 7, 8, and 9 with zero-variance balancing and native multi-tab Excel generation.

---

## 2. Mermaid Component Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ifaceStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;
    classDef dataComp fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    subgraph PRESENTATION["Presentation Layer"]
        FinancialUI["<<component>><br/>Financial Annex Form Builder"]:::compStyle
        PayrollUI["<<component>><br/>Beneficiary Payroll Table View"]:::compStyle
        DebitAdviceUI["<<component>><br/>Debit Advice Reconciler View"]:::compStyle
    end

    subgraph SECURITY["Security Layer"]
        AccountingGuard["<<component>><br/>Accounting RBAC Guard"]:::compStyle
    end

    subgraph SERVICES["Financial Services Layer"]
        VarianceEngine["<<component>><br/>Zero-Variance Math Engine"]:::compStyle
        ExcelExporter["<<component>><br/>Native ExcelJS Exporter"]:::compStyle
        ReconcileService["<<component>><br/>Bank & Fund Reconciliation Service"]:::compStyle
        AuditService["<<component>><br/>Audit Event Logger"]:::compStyle
    end

    subgraph STORAGE["Storage Subsystem"]
        PrismaClient["<<component>><br/>Prisma ORM Client"]:::dataComp
        DiskStorage["<<component>><br/>Local File Storage (/uploads/scans)"]:::dataComp
    end

    %% Interfaces
    IAccounting(["IAccountingGuard"]):::ifaceStyle
    IFinancialMath(["IFinancialMath"]):::ifaceStyle
    IExcelExport(["IExcelExport"]):::ifaceStyle
    IReconcile(["IReconciliation"]):::ifaceStyle
    IData(["IDataAccess"]):::ifaceStyle

    %% Connections
    FinancialUI --> IAccounting
    PayrollUI --> IAccounting
    DebitAdviceUI --> IAccounting

    IAccounting --> AccountingGuard
    AccountingGuard --> ReconcileService
    AccountingGuard --> VarianceEngine

    FinancialUI --> IFinancialMath
    PayrollUI --> IFinancialMath
    VarianceEngine --> IFinancialMath

    FinancialUI --> IExcelExport
    PayrollUI --> IExcelExport
    ExcelExporter --> IExcelExport

    ReconcileService --> IReconcile
    ReconcileService --> IData
    AuditService --> IData

    IData --> PrismaClient
    ReconcileService --> DiskStorage

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Comp["[Component Box]: Software Module"]:::compStyle
        L_Iface(["(Round Pin): Provided Interface"]):::ifaceStyle
        L_Data["[Gold Box]: Data Store / Storage"]:::dataComp
        L_Comp --> L_Iface --> L_Data
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Component Meaning | MinSU Implementation |
|---|---|---|---|
| `[Component]` | `["<<component>>\nName"]` | Autonomous modular unit with internal logic | Zero-Variance Math Engine, ExcelJS Exporter, Reconciliation Service |
| `(Interface)` | `(["IName"])` | Formal contract or API boundary | `IFinancialMath`, `IExcelExport`, `IReconciliation` |
| `Solid Arrow` | `-->` | Direct dependency or invocation | Financial UI invokes calculation and export services |
| `Data Component` | Gold Tone `#FFF1C2` | Persistence or storage component | Prisma ORM client adapter |

---

## 4. Component Responsibilities

- **Financial Annex Form Builder (`FinancialUI`)**: Renders dynamic ledgers for Annexes 6, 7, 8, and 9 with real-time currency formatting.
- **Zero-Variance Math Engine (`VarianceEngine`)**: Compares line items against official grant allocations down to 0.00 Philippine Pesos.
- **Native ExcelJS Exporter (`ExcelExporter`)**: Compiles disbursement rosters into native multi-tab `.xlsx` workbooks with dynamic sum formulas.
- **Bank & Fund Reconciliation Service (`ReconcileService`)**: Reconciles Landbank electronic debit advices and MDS check numbers.
