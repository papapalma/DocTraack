# System Admin — Data Flow Diagram (DFD)

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Data Flow Diagram (Level 1)  
> **Focus:** Account Management, Audit Ingestion, and CMS Operations

---

## 1. Purpose

The Data Flow Diagram shows how administrative data enters the system, changes through processes, and reaches persistent data stores. It does not show control flow or execution time.

---

## 2. Mermaid Data Flow Diagram (Level 1)

```mermaid
flowchart TD
    %% Styling Classes
    classDef entityStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef processStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef storeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    AdminEntity["Admin User<br/>(External Entity)"]:::entityStyle

    subgraph PROCESSES["Administrative Processes"]
        P1["1.0<br/>Manage User Accounts"]:::processStyle
        P2["2.0<br/>Inspect Audit Logs"]:::processStyle
        P3["3.0<br/>Manage Landing CMS"]:::processStyle
    end

    subgraph DATA_STORES["Data Stores (PostgreSQL)"]
        D1[("D1: users Table")]:::storeStyle
        D2[("D2: audit_log Table")]:::storeStyle
        D3[("D3: landing_page_config Table")]:::storeStyle
    end

    %% Flows from Admin
    AdminEntity -->|Account Credentials & Role| P1
    AdminEntity -->|Filter Query & Date Range| P2
    AdminEntity -->|Draft Section Content & Images| P3

    %% Flows to Admin
    P1 -->|User Roster & Status Codes| AdminEntity
    P2 -->|Filtered Log Records & Diffs| AdminEntity
    P3 -->|Publication Confirmation| AdminEntity

    %% Data Store Interactions
    P1 -->|Write New User & Updated Role| D1
    D1 -->|Read User Credentials| P1
    P1 -->|Dispatch USER_ACTION Event| D2

    D2 -->|Stream Chronological Events| P2

    P3 -->|Write Draft & Published JSON| D3
    D3 -->|Read Current Landing Config| P3
    P3 -->|Dispatch CMS_PUBLISHED Event| D2

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

- **Account Credentials & Role**: Full name, institutional email address, initial password, and selected Role enum.
- **Filter Query & Date Range**: Search terms for actor ID, target entity, or timestamp intervals.
- **Filtered Log Records & Diffs**: List of action verbs, actor names, affected UUIDs, and field change payloads.
- **Draft Section Content & Images**: Landing page banners, announcement headlines, and scholarship guidelines.
