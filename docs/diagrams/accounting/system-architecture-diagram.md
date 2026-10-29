# Accounting Officer — System Architecture Diagram

> **Role:** `ACCOUNTING`  
> **Diagram Type:** System Architecture Diagram  
> **Focus:** Financial Subsystem, Bank Reconciliations, and Disbursement Audits

---

## 1. Purpose

The System Architecture Diagram shows the financial subsystem used by the Accounting Officer to compile Annexes 6, 7, 8, and 9, verify LandBank account debits, and enforce zero-variance reconciliation.

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
        AccountingBrowser["Accounting Officer<br/>(Desktop Browser /documents)"]:::clientStyle
    end

    subgraph EDGE_TIER["Edge Security & Routing"]
        NginxProxy["Reverse Proxy / Nginx"]:::edgeStyle
        AccountingRBAC["Accounting Guard<br/>(Verifies role in [ACCOUNTING, STAFF])"]:::edgeStyle
    end

    subgraph APP_TIER["Financial Subsystem Layer"]
        PayrollCompiler["Beneficiary Payroll Compiler<br/>(Annex 9 Stipend Aggregator)"]:::appStyle
        FundUtilizationEngine["Fund Utilization Engine<br/>(Annex 6 Allocation Reconciliation)"]:::appStyle
        DebitRegisterEngine["Advice to Debit Engine<br/>(Annex 7 ADA Account Verification)"]:::appStyle
        ChecksRegisterEngine["Checks Issued Manager<br/>(Annex 8 Check Serial Registry)"]:::appStyle
        CurrencyValidator["Currency & Math Validator<br/>(PHP ₱#,##0.00 Precision Engine)"]:::appStyle
    end

    subgraph DATA_TIER["Data Persistence Tier"]
        PostgresDB[("PostgreSQL Database<br/>(documents, annex_types, status_history)")]:::dataStyle
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

    PayrollCompiler --> CurrencyValidator
    FundUtilizationEngine --> CurrencyValidator
    DebitRegisterEngine --> CurrencyValidator
    ChecksRegisterEngine --> CurrencyValidator

    PayrollCompiler --> PostgresDB
    FundUtilizationEngine --> PostgresDB
    DebitRegisterEngine --> PostgresDB
    ChecksRegisterEngine --> PostgresDB

    LandBank -.->|Monthly Bank Vouchers| AccountingBrowser

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Client["Client Tier Actor / UI"]:::clientStyle
        L_Edge["Edge / Gateway Tier"]:::edgeStyle
        L_App["Application Tier Service"]:::appStyle
        L_Data[("Data Tier Persistence")]:::dataStyle
        L_Ext["External Stakeholder"]:::extStyle
        L_Client -->|Network Protocol| L_Edge
        L_Edge --> L_App
        L_App --> L_Data
        L_App -.->|External Sync| L_Ext
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | Architectural Tier | MinSU System Implementation |
|---|---|---|---|
| 🟩 Soft Green Box | `fill:#F1F8F1, stroke:#1B5E20` | Client Presentation Tier | Browser clients for Student, Staff, Director, Accounting, and Admin |
| 🟨 Gold Box | `fill:#FFF1C2, stroke:#F2B705` | Edge & Security Gateway Tier | Nginx TLS termination reverse-proxy and Next.js edge RBAC middleware |
| ⬜ White Box | `fill:#FFFFFF, stroke:#1B5E20` | Core Application Tier | Next.js Server Components, Document Engine, Auth Controller, PDF Compiler |
| 🟩 Dark Green Cylinder | `fill:#DCEFDD, stroke:#123F17` | Persistent Data Tier | PostgreSQL 16 relational database (Port 5432) and local storage volumes |
| ◻️ Dashed Border Box | `stroke-dasharray: 5 5` | External Stakeholder / Boundary | CHED/UniFAST regional office and external Google Drive transmittal archive |
| `-->` Solid Arrow | Network & Internal Call | Synchronous HTTPS, WSS, HTTP (port 3000), or TCP (port 5432) |
| `-.->` Dashed Arrow | Out-of-Band Integration | Physical courier shipment or external cloud drive URL synchronization |


---

## 4. Architecture Rules

- Access to financial Annex creation endpoints is restricted to `ACCOUNTING` and authorized `STAFF`.
- The `Currency & Math Validator` guarantees that line items balance to zero variance against grant allocations.
- All monetary records require two decimal digits of precision in Philippine Peso (`₱#,##0.00`).
