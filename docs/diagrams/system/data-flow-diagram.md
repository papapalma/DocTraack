# Data Flow Diagram (DFD): MinSU DocTrack Whole System

## 1. Description
This Data Flow Diagram documents the flow of information across the entire MinSU DocTrack system. It contains the Level 0 Context Diagram and the Level 1 System Data Flow Diagram, mapping data pipelines between external entities, business processes, and data stores including 3-way verification and multi-format document generation.

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

    Student -->|Online Application & 2FA Setup| System
    System -->|Tracking Code & Announcements Feed| Student

    Staff -->|Draft Annexes & CSV Verification Datasets| System
    System -->|3-Way Verification Reports & Status Badges| Staff

    Director -->|Approval, Returns & Template Signoffs| System
    System -->|Pending Review Queue & Analytics Metrics| Director

    Accounting -->|Financial Annexes 6-9 & Payroll| System
    System -->|Multi-Tab Excel (.xlsx) Workbooks| Accounting

    Admin -->|User Roles, Rate Limits & CMS Configs| System
    System -->|Security Audit Logs & Platform Telemetry| Admin

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
        P1["1.0<br/>Manage Users & 2FA Auth"]
        P2["2.0<br/>Intake Applications & Validate Queue"]
        P3["3.0<br/>Execute 3-Way Tripartite Verification"]
        P4["4.0<br/>Compile & Validate Annexes"]
        P5["5.0<br/>Execute Executive Review"]
        P6["6.0<br/>Reconcile Financials & Payroll"]
        P7["7.0<br/>Dispatch Transmittals"]
        P8["8.0<br/>Broadcast Campus Announcements"]
        P9["9.0<br/>Design Certificates & Export Docs"]
    end

    subgraph Stores ["Data Stores"]
        DS_Users[("D1: Users, 2FA & Sessions")]
        DS_Apps[("D2: Applications & Validated Roster")]
        DS_Docs[("D3: Documents & Status History")]
        DS_Trn[("D4: Transmittals Registry")]
        DS_Audit[("D5: Security Audit Logs")]
        DS_Verify[("D6: Verification Runs & Results")]
        DS_Announce[("D7: Announcements & CMS Config")]
    end

    %% Process 1.0
    E_Admin -->|User Credentials & Role Grants| P1
    E_Student -->|2FA TOTP Verification Code| P1
    P1 -->|Credentials, TOTP Secret & Roles| DS_Users
    P1 -->|Log Auth Event| DS_Audit

    %% Process 2.0
    E_Student -->|Application Form & Proof Scans| P2
    E_Staff -->|Validation Decision: ACCEPT/REJECT| P2
    P2 -->|Save Validated Application Records| DS_Apps
    P2 -->|Tracking Code & Locked Profile| E_Student

    %% Process 3.0
    E_Staff -->|Upload CHED & Registrar CSVs| P3
    DS_Apps -->|Query Accepted System Applicants| P3
    P3 -->|Tripartite Cross-Match Results| DS_Verify
    P3 -->|Stream Discrepancy Excel Report| E_Staff
    P3 -->|Log Verification Run| DS_Audit

    %% Process 4.0
    DS_Apps -->|Verified Student Masterlist| P4
    E_Staff -->|Annex Inputs & Form Data| P4
    P4 -->|Store Draft / Submitted Annex| DS_Docs
    P4 -->|Log Annex Mutation| DS_Audit

    %% Process 5.0
    DS_Docs -->|Pending Review Records| P5
    E_Director -->|Approval / Return Remarks| P5
    P5 -->|Update Status to Approved| DS_Docs
    P5 -->|Log Executive Event| DS_Audit

    %% Process 6.0
    DS_Docs -->|Approved Student Masterlist| P6
    E_Acct -->|Fund Utilization & Checks Data| P6
    P6 -->|Persist Financial Annexes 6-9| DS_Docs
    P6 -->|Log Fiscal Mutation| DS_Audit

    %% Process 7.0
    DS_Docs -->|Approved Annexes| P7
    E_Staff -->|Transmittal Metadata & Drive URL| P7
    P7 -->|Save Dispatched Package| DS_Trn
    P7 -->|Deliver Transmittal Package| E_Agency
    E_Agency -->|Acknowledgment Data| P7
    P7 -->|Update Status to Transmitted| DS_Docs

    %% Process 8.0
    E_Staff -->|Post Announcement Payload| P8
    E_Admin -->|Broadcast IT Emergency Notice| P8
    P8 -->|Store Announcement Record| DS_Announce
    P8 -->|Deliver Feed Notifications| E_Student

    %% Process 9.0
    E_Staff -->|Customize Layout & Signatories| P9
    DS_Docs -->|Extract Roster Data| P9
    P9 -->|Stream ExcelJS Workbook & Word Docx| E_Staff
    P9 -->|Stream Excel Payroll Workbook| E_Acct

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
| `[Rectangle]` | External Entity | Source or sink outside the process boundary | Students, Staff, Director, Accounting, Admin, CHED Agency |
| `(("((Double Circle))"))` | Context Process (Level 0) | Top-level system boundary | Entire MinSU DocTrack system |
| `["1.0 Process"]` | Operational Process (Level 1) | Data transformation or business logic step | `Intake Applications`, `3-Way Verification`, `Executive Review`, `Export Docs` |
| `[("[(Cylinder)]")]` | Persistent Data Store | Relational table or permanent data repository | `D1: Users`, `D2: Applications`, `D3: Documents`, `D6: Verification`, `D7: Announcements` |
| `-->|Data Flow|` | Named Flow Arrow | In-transit data packet or payload | CSV datasets, tracking codes, Excel workbooks, audit rows |

---

## 6. Data Store Descriptions
- **D1: Users, 2FA & Sessions**: Stores accounts, hashed passwords, roles, TOTP secrets, recovery backup codes, and session tokens.
- **D2: Applications & Validated Roster**: Stores student personal information, academic data, validated intake queue records, and uploaded proof documents.
- **D3: Documents & Status History**: Stores all operational and financial Annexes (1–10) with complete version logs.
- **D4: Transmittals Registry**: Stores external agency control numbers, courier details, and scanned delivery receipts.
- **D5: Security Audit Logs**: Holds immutable records of every privileged operation across the university system.
- **D6: Verification Runs & Results**: Stores tripartite cross-matching runs, Jaro-Winkler confidence scores, and discrepancy resolution states.
- **D7: Announcements & CMS Config**: Stores categorized campus announcements, priority pins, audience filters, and landing page section arrays.
