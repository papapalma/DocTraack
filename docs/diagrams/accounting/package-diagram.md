# Accounting Officer — Package Diagram

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Package Diagram  
> **Standard:** UML 2.5 Package Specification

---

## 1. Purpose

The Package Diagram shows the organization of codebase packages, UI modules, calculation utilities, and export libraries that build the Accounting Officer subsystem.

---

## 2. Mermaid Package Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef routeStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef libStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef typeStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;

    subgraph ROUTE_PKG["Package: src/app (Financial Routing & APIs)"]
        DOCS_PAGE["app/(dashboard)/documents (Annexes 6-9)"]:::routeStyle
        NEW_PAGE["app/(dashboard)/documents/new (Financial Creator)"]:::routeStyle
        API_EXCEL["app/api/annex-[6-9]/export-excel (ExcelJS Routes)"]:::routeStyle
        API_SUBMIT["app/api/documents/[id]/submit"]:::routeStyle
    end

    subgraph COMP_PKG["Package: src/components (Financial Views)"]
        FIN_TABLE["components/documents/FinancialTable.tsx"]:::compStyle
        ANNEX6_FORM["components/documents/Annex6FundUtilization.tsx"]:::compStyle
        ANNEX7_FORM["components/documents/Annex7AdviceDebit.tsx"]:::compStyle
        ANNEX8_FORM["components/documents/Annex8ChecksIssued.tsx"]:::compStyle
        ANNEX9_FORM["components/documents/Annex9BeneficiaryPayroll.tsx"]:::compStyle
    end

    subgraph LIB_PKG["Package: src/lib (Core Financial Logic)"]
        EXCEL_LIB["lib/excel.ts (ExcelJS Multi-Tab Workbooks)"]:::libStyle
        VALIDATION_LIB["lib/validation.ts (Zero-Variance Assertions)"]:::libStyle
        FORMAT_LIB["lib/formatters.ts (PHP Currency Formatter)"]:::libStyle
        RBAC_LIB["lib/rbac.ts (Accounting Signatory Guard)"]:::libStyle
        PRISMA_LIB["lib/prisma.ts (Database Client)"]:::libStyle
    end

    subgraph TYPES_PKG["Package: src/types (Financial Contracts)"]
        DOC_TYPES["types/document.ts (DocumentStatus Enums)"]:::typeStyle
        FIN_TYPES["types/financial.ts (LedgerRow, BankCheck)"]:::typeStyle
    end

    %% Dependencies
    ROUTE_PKG --> COMP_PKG
    ROUTE_PKG --> LIB_PKG
    ROUTE_PKG --> TYPES_PKG

    COMP_PKG --> LIB_PKG
    COMP_PKG --> TYPES_PKG

    LIB_PKG --> TYPES_PKG
    LIB_PKG --> PRISMA_LIB

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Route["subgraph: Routing & API Layer"]:::routeStyle
        L_Comp["subgraph: Presentation Components"]:::compStyle
        L_Lib["subgraph: Business Logic & ExcelJS"]:::libStyle
        L_Type["subgraph: Domain Types"]:::typeStyle
        L_Route --> L_Comp --> L_Lib --> L_Type
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Package Concept | MinSU Implementation |
|---|---|---|---|
| `subgraph Pkg` | Folder Container | Architectural Namespace or Directory | `src/app`, `src/components`, `src/lib`, `src/types` |
| `[Module]` | Rectangle with border | Concrete file or sub-package | `excel.ts`, `validation.ts`, `FinancialTable.tsx` |
| `-->` | Directed Dependency | Import or invocation relationship | Financial routes import calculation helpers and components |
| 🟢 Green Tone | `#F1F8F1` / `#1B5E20` | Financial Routing Layer | App router pages and Excel export route handlers |

---

## 4. Package Organization & Separation of Concerns

- **`src/app`**: Exposes financial document drafting views and Excel export routes streaming native `.xlsx` files.
- **`src/components`**: Houses modular ledger views for Annexes 6, 7, 8, and 9 with zero-variance visual indicators.
- **`src/lib`**: Encapsulates `ExcelJS` multi-tab formatting, Philippine Peso currency formatters (`₱#,##0.00`), and role guards.
- **`src/types`**: Declares TypeScript discriminating unions for financial document types and bank check models.
