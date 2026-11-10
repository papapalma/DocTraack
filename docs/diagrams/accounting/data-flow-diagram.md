# Accounting Officer — Data Flow Diagram (DFD)

> **Role:** `ACCOUNTING_OFFICER`  
> **Diagram Type:** Data Flow Diagram (Level 1)  
> **Focus:** Fiscal Reconciliations, Zero-Variance Calculation, and Multi-Tab Excel Export

---

## 1. Purpose

The Data Flow Diagram shows how financial figures, Landbank debit advices, check registers, and stipend payroll entries move through accounting validation processes to database tables and export streams.

---

## 2. Mermaid Data Flow Diagram (Level 1)

```mermaid
flowchart TD
    %% Styling Classes
    classDef entityStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef processStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef storeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    AccountingUser["Accounting Officer<br/>(External Entity)"]:::entityStyle
    LandBank["LandBank of the Philippines<br/>(External Bank Source)"]:::entityStyle

    subgraph PROCESSES["Financial Management Processes"]
        P1["1.0<br/>Reconcile Fund Utilization (Annex 6)"]:::processStyle
        P2["2.0<br/>Catalog Advice to Debit (Annex 7)"]:::processStyle
        P3["3.0<br/>Catalog Checks Issued (Annex 8)"]:::processStyle
        P4["4.0<br/>Compile Beneficiary Payroll (Annex 9)"]:::processStyle
        P5["5.0<br/>Validate Zero-Variance Balance"]:::processStyle
        P6["6.0<br/>Stream Multi-Tab ExcelJS Workbook"]:::processStyle
    end

    subgraph DATA_STORES["Data Stores"]
        D1[("D1: documents Table")]:::storeStyle
        D2[("D2: status_history Table")]:::storeStyle
        D3[("D3: notifications Table")]:::storeStyle
        D4[("D4: audit_log Table")]:::storeStyle
    end

    %% External Bank Ingestion
    LandBank -->|ADA Notices & Electronic Advices| P2

    %% Accounting Inputs
    AccountingUser -->|Grant Allocation Totals| P1
    AccountingUser -->|Account Numbers & Debit Figures| P2
    AccountingUser -->|MDS Check Numbers & Payees| P3
    AccountingUser -->|Student Stipend Tiers (₱7.5k / ₱10k)| P4
    AccountingUser -->|Request Excel Export| P6

    %% Feedback Flows
    P5 -->|Balanced Confirmation (₱0.00 Variance)| AccountingUser
    P6 -->|Streamed Excel Spreadsheet (.xlsx)| AccountingUser

    %% Inter-Process Movements
    P1 -->|Utilization Line Items| P5
    P2 -->|Debit Advice Entries| P5
    P3 -->|Check Register Totals| P5
    P4 -->|Payroll Stipend Sums| P5

    P5 -->|Populate Form Data & Save Draft| D1
    P5 -->|Format Figures into Worksheets| P6
    P5 -->|Submit to Director (status: SUBMITTED)| D1
    P5 -->|Record Transition Row| D2
    P5 -->|Alert Director of New Submission| D3
    P5 -->|Audit: FINANCIAL_ANNEX_SUBMITTED| D4

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Ent["[Square]: External Entity"]:::entityStyle
        L_Proc["(Circle / Rounded): Process Step"]:::processStyle
        L_Store[("[(Cylinder)]: Data Store")]:::storeStyle
        L_Ent -->|Data Flow| L_Proc -->|Storage Flow| L_Store
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | DFD Concept | MinSU Implementation |
|---|---|---|---|
| `[Entity]` | `["Name"]` | External Source or Sink | Accounting Officer, LandBank of the Philippines |
| `(Process)` | `["N.0\nName"]` | Data transformation logic | Reconcile fund utilization, validate zero-variance |
| `[(Data Store)]` | `[("DN: table")]` | Relational table | PostgreSQL tables (`documents`, `status_history`, `audit_log`) |
| `-->` | Directed Arrow | Flow of financial data | Allocation sums, debit notices, Excel streams |

---

## 4. Data Flow Descriptions

- **1.0 Reconcile Fund Utilization**: Captures CHED grant allotments against campus expenditures for Annex 6.
- **2.0 Catalog Advice to Debit**: Records Landbank electronic debit account notices for Annex 7.
- **3.0 Catalog Checks Issued**: Logs MDS checking numbers and signatories for Annex 8.
- **4.0 Compile Beneficiary Payroll**: Ingests student stipend rosters for Annex 9 across dual-term tiers.
- **5.0 Validate Zero-Variance Balance**: Computes net line item variance; permits submission only when variance is ₱0.00.
- **6.0 Stream Multi-Tab ExcelJS Workbook**: Formats monetary cells in Philippine Peso (`₱#,##0.00`) and streams native `.xlsx` files.
