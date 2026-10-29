# Accounting Officer — Data Flow Diagram (DFD)

> **Role:** `ACCOUNTING`  
> **Diagram Type:** Data Flow Diagram (Level 1)  
> **Focus:** Fiscal Reconciliations, Bank Debit Audits, and Payroll Submissions

---

## 1. Purpose

The Data Flow Diagram shows how financial metrics, debit notices, and check registers flow from the Accounting Officer through calculation processes to database tables.

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
        P5["5.0<br/>Submit Financial Annex"]:::processStyle
    end

    subgraph DATA_STORES["Data Stores"]
        D1[("D1: annex_types Table")]:::storeStyle
        D2[("D2: documents Table")]:::storeStyle
        D3[("D3: status_history Table")]:::storeStyle
        D4[("D4: audit_log Table")]:::storeStyle
    end

    %% Bank Ingestion
    LandBank -->|ADA Debit Notices & Bank Statements| P2

    %% Accounting Flows
    AccountingUser -->|CHED Grant Allocation Sums| P1
    AccountingUser -->|Account Numbers & Debit Amounts| P2
    AccountingUser -->|Check Serial Numbers & Payees| P3
    AccountingUser -->|Grantee Stipend Roster| P4
    AccountingUser -->|Submission Action Trigger| P5

    P1 -->|Calculated Utilization Balance| AccountingUser
    P4 -->|Balanced Payroll Summary| AccountingUser

    %% Process Interactions
    D1 -->|Read Fiscal Form Schema| P1
    D1 -->|Read Fiscal Form Schema| P2
    D1 -->|Read Fiscal Form Schema| P3
    D1 -->|Read Fiscal Form Schema| P4

    P1 -->|Draft Annex 6 Document| D2
    P2 -->|Draft Annex 7 Document| D2
    P3 -->|Draft Annex 8 Document| D2
    P4 -->|Draft Annex 9 Document| D2

    D2 -->|Fetch Draft Document Record| P5
    P5 -->|Update Status: SUBMITTED| D2
    P5 -->|Insert Status Transition| D3
    P5 -->|Write Financial Action Event| D4

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Ent["[Square]: External Entity"]:::legEnt
        L_Proc["1.0 [Box]: Process"]:::legProc
        L_Store[("[(Cylinder)]: Data Store")]:::legStore
        L_Ent -->|Data Flow Payload| L_Proc
        L_Proc -->|Data Mutation| L_Store
    end
    classDef legEnt fill:#FFFFFF,stroke:#123F17,color:#1F2A24;
    classDef legProc fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legStore fill:#FFF1C2,stroke:#F2B705,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| DFD Element Shape | Gane & Sarson / Yourdon Notation | Technical Role | MinSU System Implementation |
|---|---|---|---|
| `[Rectangle]` | External Entity | Source or sink outside the process boundary | Students, Staff Coordinator, Campus Director, Accounting, CHED Agency |
| `(("((Double Circle))"))` | Context Process (Level 0) | Top-level system boundary | Entire MinSU DocTrack system |
| `["1.0 Process"]` | Operational Process (Level 1) | Data transformation or business logic step | Intake Applications, Validate Annexes, Executive Review, Financials |
| `[("[(Cylinder)]")]` | Persistent Data Store | Relational table or permanent data repository | Users & Sessions, Applications, Documents, Transmittals, Audit Logs |
| `-->|Data Flow|` | Named Flow Arrow | In-transit data packet or payload | Forms, tracking codes, financial records, audit rows |
| 🟢 Green Box | Process Node | Active workflow processing unit | Core backend services and transaction coordinators |
| 🟨 Gold Cylinder | Data Store Node | Persistent PostgreSQL / File store | Secure database tables with RLS and foreign key integrity |


---

## 4. Data Dictionary

- **CHED Grant Allocation Sums**: Total monetary grant transferred to MinSU for TDP scholarship coverage.
- **ADA Debit Notices & Bank Statements**: Official bank confirmations indicating digital account credits.
- **Check Serial Numbers & Payees**: Registry entries for manual checks issued to unbanked student grantees.
- **Grantee Stipend Roster**: Individual student stipend records (`₱10,000.00` per grantee).
- **Balanced Payroll Summary**: Complete verified payroll total matching the bank debit authorization.
