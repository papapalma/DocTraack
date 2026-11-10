# Accounting Officer — System Architecture Diagram

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** System Architecture Diagram  
> **Focus:** Financial Subsystem, Zero-Variance Balancing, ExcelJS Exports & Bank Reconciliations

---

## 1. Purpose

The System Architecture Diagram shows the multi-tier architecture used by the Accounting Officer, including financial ledger views, edge authorization, zero-variance math engines, native ExcelJS workbook generators, and PostgreSQL storage.

---

## 2. Mermaid System Architecture Diagram

```mermaid
flowchart TB
    %% Styling Classes
    classDef clientStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef edgeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef appStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef dataStyle fill:#DCEFDD,stroke:#123F17,stroke-width:2px,color:#123F17;
    classDef bankStyle fill:#F6F8F6,stroke:#55645B,stroke-width:2px,stroke-dasharray: 5 5,color:#1F2A24;

    subgraph CLIENT_TIER["Accounting Client Tier"]
        AccountingBrowser["Accounting Officer Workstation<br/>• /documents (Annexes 6, 7, 8, 9)<br/>• Real-Time Ledger Tables<br/>• Zero-Variance Status Pill"]:::clientStyle
    end

    subgraph EDGE_TIER["Edge Security & Routing"]
        NginxProxy["Reverse Proxy / Nginx<br/>(TLS 1.3 Termination & Port 443)"]:::edgeStyle
        AccountingRBAC["Accounting RBAC Guard<br/>(Verifies role == ACCOUNTING_OFFICER)"]:::edgeStyle
    end

    subgraph APP_TIER["Financial Subsystem Layer"]
        PayrollCompiler["Beneficiary Payroll Compiler<br/>(Annex 9 Stipend Tier Aggregator)"]:::appStyle
        FundUtilizationEngine["Fund Utilization Engine<br/>(Annex 6 Allocation Reconciliation)"]:::appStyle
        DebitRegisterEngine["Advice to Debit Engine<br/>(Annex 7 ADA Account Verification)"]:::appStyle
        ChecksRegisterEngine["Checks Issued Manager<br/>(Annex 8 Check Serial Registry)"]:::appStyle
        ZeroVarianceEngine["Zero-Variance Engine<br/>(0.00 PHP Balance Assertion)"]:::appStyle
        ExcelExportEngine["Native ExcelJS Exporter<br/>(Multi-Tab Workbooks & Formulas)"]:::appStyle
    end

    subgraph DATA_TIER["Data Persistence Tier"]
        PostgresDB[("PostgreSQL Database<br/>(documents, status_history, audit_log)")]:::dataStyle
        UploadsStorage[("Local Disk Storage Volume<br/>(/uploads/scans/financial/)")]:::dataStyle
    end

    subgraph EXTERNAL_TIER["External Financial Institutions"]
        LandBank["LandBank of the Philippines<br/>(Debit Advices & Bank Statements)"]:::bankStyle
    end

    %% Connections
    AccountingBrowser -->|HTTPS TLS 1.3| NginxProxy
    NginxProxy -->|HTTP 3000| AccountingRBAC
    AccountingRBAC --> PayrollCompiler
    AccountingRBAC --> FundUtilizationEngine
    AccountingRBAC --> DebitRegisterEngine
    AccountingRBAC --> ChecksRegisterEngine

    PayrollCompiler --> ZeroVarianceEngine
    FundUtilizationEngine --> ZeroVarianceEngine
    DebitRegisterEngine --> ZeroVarianceEngine
    ChecksRegisterEngine --> ZeroVarianceEngine

    ZeroVarianceEngine --> ExcelExportEngine
    ExcelExportEngine --> PostgresDB
    ZeroVarianceEngine --> PostgresDB
    ZeroVarianceEngine --> UploadsStorage
    DebitRegisterEngine -.-> LandBank

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Client["[Green Box]: Client Presentation"]:::clientStyle
        L_Edge["[Gold Box]: Gateway & RBAC"]:::edgeStyle
        L_App["[White Box]: Financial Logic"]:::appStyle
        L_Data[("[(Cylinder)]: Relational / Disk Store")]:::dataStyle
        L_Client --> L_Edge --> L_App --> L_Data
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | Tier Concept | MinSU Implementation |
|---|---|---|---|
| Client Tier | `#F1F8F1` Box | User Workstation Presentation | Next.js browser views for financial management |
| Edge Tier | `#FFF1C2` Box | Gateway & Authorization | Reverse proxy and `AccountingRBAC` validator |
| Application Tier | `#FFFFFF` Box | Financial Domain Logic | Zero-variance math engine, ExcelJS exporter |
| Persistence Tier | Cylinder Shape | Relational & Disk Storage | PostgreSQL database and mounted scans volume |

---

## 4. Tier Responsibilities

- **Client Tier**: Renders currency fields in Philippine Peso (`₱#,##0.00`) and highlights unbalanced rows in red.
- **Edge Tier**: Restricts financial annex authoring strictly to `ACCOUNTING_OFFICER` sessions.
- **Application Tier**: Calculates allocation sums, validates zero-variance equality, and streams multi-tab Excel workbooks.
- **Persistence Tier**: Records immutable financial audit records and stores wet-signed scanned copies.
