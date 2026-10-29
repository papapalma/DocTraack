# Data Flow Diagram (DFD): MinSU DocTrack Whole System

## 1. Description
This Data Flow Diagram documents the flow of information across the entire MinSU DocTrack system. It contains the Level 0 Context Diagram and the Level 1 System Data Flow Diagram, mapping data pipelines between external entities, business processes, and data stores.

## 2. ASD-STE100 Technical Specifications
- Connect external entities to processes only.
- Do not connect external entities directly to data stores.
- Give each data flow arrow an explicit noun label.
- Provide matching process numbers across diagram levels.

---

## 3. Level 0: System Context Diagram

```mermaid
graph LR
    subgraph ExternalEntities ["External Actors & Systems"]
        Student["Student Applicant"]
        Staff["Staff Coordinator"]
        Director["Campus Director"]
        Accounting["Accounting Officer"]
        Admin["System Administrator"]
        Agency["CHED / UniFAST Regional Office"]
    end

    System(("0.0<br/>MinSU DocTrack<br/>TDP Annex System"))

    Student -->|Online Application & Proof Scans| System
    System -->|Tracking Code & Printable Receipt| Student

    Staff -->|Draft Annexes & Transmittals| System
    System -->|Document Status & Applicant Records| Staff

    Director -->|Approval & Revision Comments| System
    System -->|Pending Executive Review Queue| Director

    Accounting -->|Financial Annexes 6-9 & Payroll| System
    System -->|Verified Beneficiary Lists| Accounting

    Admin -->|User Accounts & Role Permissions| System
    System -->|Security Audit Logs & System Health| Admin

    System -->|Formal Transmittal Packages & Signed Scans| Agency
    Agency -->|Transmittal Acknowledgment Receipt| System
```

---

## 4. Level 1: System Data Flow Diagram

```mermaid
graph TD
    subgraph Entities ["External Entities"]
        E_Student["Student Applicant"]
        E_Staff["Staff Coordinator"]
        E_Director["Campus Director"]
        E_Acct["Accounting Officer"]
        E_Agency["CHED / UniFAST"]
        E_Admin["System Admin"]
    end

    subgraph Processes ["Operational Processes"]
        P1["1.0<br/>Manage Users & Roles"]
        P2["2.0<br/>Intake Student Applications"]
        P3["3.0<br/>Compile & Validate Annexes"]
        P4["4.0<br/>Execute Executive Review"]
        P5["5.0<br/>Reconcile Financials & Payroll"]
        P6["6.0<br/>Dispatch Transmittals"]
    end

    subgraph Stores ["Data Stores"]
        DS_Users[("D1: Users & Sessions")]
        DS_Apps[("D2: Applications & Attachments")]
        DS_Docs[("D3: Documents & Status History")]
        DS_Trn[("D4: Transmittals Registry")]
        DS_Audit[("D5: Security Audit Logs")]
    end

    %% Process 1.0
    E_Admin -->|User Registration Details| P1
    P1 -->|Credentials & Roles| DS_Users
    P1 -->|Log Auth Event| DS_Audit

    %% Process 2.0
    E_Student -->|Application Form & Proof Scans| P2
    P2 -->|Save Application Records| DS_Apps
    P2 -->|Tracking Code| E_Student

    %% Process 3.0
    DS_Apps -->|Student Records| P3
    E_Staff -->|Annex Inputs & Drive Links| P3
    P3 -->|Store Draft / Submitted Annex| DS_Docs
    P3 -->|Log Annex Mutation| DS_Audit

    %% Process 4.0
    DS_Docs -->|Pending Review Records| P4
    E_Director -->|Approval / Return Remarks| P4
    P4 -->|Update Status to Approved| DS_Docs
    P4 -->|Log Executive Event| DS_Audit

    %% Process 5.0
    DS_Docs -->|Approved Student Masterlist| P5
    E_Acct -->|Fund Utilization & Checks Data| P5
    P5 -->|Persist Financial Annexes 6-9| DS_Docs
    P5 -->|Log Fiscal Mutation| DS_Audit

    %% Process 6.0
    DS_Docs -->|Approved Annexes| P6
    E_Staff -->|Transmittal Metadata| P6
    P6 -->|Save Dispatched Package| DS_Trn
    P6 -->|Deliver Transmittal Package| E_Agency
    E_Agency -->|Acknowledgment Data| P6
    P6 -->|Update Status to Sent to Agency| DS_Docs

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

## 5. Diagram Legend & Symbol Guide

| DFD Element Shape | Gane & Sarson / Yourdon Notation | Technical Role | MinSU System Implementation |
|---|---|---|---|
| `[Rectangle]` | External Entity | Source or sink outside the process boundary | Students, Staff, Director, Accounting, CHED Agency |
| `(("((Double Circle))"))` | Context Process (Level 0) | Top-level system boundary | Entire MinSU DocTrack system |
| `["1.0 Process"]` | Operational Process (Level 1) | Data transformation or business logic step | `Intake Applications`, `Validate Annexes`, `Executive Review` |
| `[("[(Cylinder)]")]` | Persistent Data Store | Relational table or permanent data repository | `D1: Users`, `D2: Applications`, `D3: Documents`, `D5: Audits` |
| `-->\|Data Flow\|` | Named Flow Arrow | In-transit data packet or payload | Application forms, tracking codes, financial ledgers, audit rows |
| 🟢 Green Box | Process Node | Active workflow processing unit | Core backend services and transaction coordinators |
| 🟨 Gold Cylinder | Data Store Node | Persistent PostgreSQL / File store | Secure database tables with RLS and foreign key integrity |

---

## 6. Data Store Descriptions
- **D1: Users & Sessions**: Stores accounts, hashed passwords, roles, and session tokens.
- **D2: Applications & Attachments**: Stores student personal information, academic data, and uploaded proof documents.
- **D3: Documents & Status History**: Stores all operational and financial Annexes (1–10) with complete version logs.
- **D4: Transmittals Registry**: Stores external agency control numbers, courier details, and scanned delivery receipts.
- **D5: Security Audit Logs**: Holds immutable records of every privileged operation across the university system.
