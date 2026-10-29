# Data Flow Diagram (DFD): Student Applicant Domain

## 1. Description
This Level 1 Data Flow Diagram traces information flow through the student portal subsystem. It maps how student applicants submit application data, upload documentary proofs, generate tracking codes, retrieve application statuses, and download official receipt slips.

## 2. ASD-STE100 Technical Specifications
- Trace all input data flows from the external student entity.
- Store submission records in secure application and file data stores.
- Provide tracking code resolution with read-only access.
- Restrict student modification once an application enters the submitted state.

## 3. Data Flow Diagram (Mermaid)

```mermaid
graph TD
    Student[("External Entity:<br/>Student Applicant")]

    subgraph Processes ["Portal Processes"]
        P1["1.0<br/>Browse Active Calls"]
        P2["2.0<br/>Submit Application & Upload Proofs"]
        P3["3.0<br/>Generate Tracking Code & Receipt"]
        P4["4.0<br/>Inquire Application Status"]
    end

    subgraph DataStores ["Data Stores"]
        DS_Calls[("D1: Applicant Calls Store")]
        DS_Apps[("D2: Applications Store")]
        DS_Files[("D3: Proof Attachments Store")]
    end

    DS_Calls -->|Published Call Details| P1
    P1 -->|Call Listings & Deadlines| Student

    Student -->|Personal Data, Academic Info| P2
    Student -->|Scanned Documents| P2
    P2 -->|Save Scanned Proofs| DS_Files
    P2 -->|Validated Application Data| P3
    
    P3 -->|Persist New Application| DS_Apps
    P3 -->|Tracking Code & Printable Receipt| Student

    Student -->|Input Tracking Code| P4
    DS_Apps -->|Read Status & Remarks| P4
    P4 -->|Current Review Status & Milestone| Student

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

## 4. Diagram Legend & Symbol Guide

| DFD Element Shape | Gane & Sarson / Yourdon Notation | Technical Role | MinSU System Implementation |
|---|---|---|---|
| `[Rectangle]` | External Entity | Source or sink outside the process boundary | Students, Staff Coordinator, Campus Director, Accounting, CHED Agency |
| `(("((Double Circle))"))` | Context Process (Level 0) | Top-level system boundary | Entire MinSU DocTrack system |
| `["1.0 Process"]` | Operational Process (Level 1) | Data transformation or business logic step | Intake Applications, Validate Annexes, Executive Review, Financials |
| `[("[(Cylinder)]")]` | Persistent Data Store | Relational table or permanent data repository | Users & Sessions, Applications, Documents, Transmittals, Audit Logs |
| `-->|Data Flow|` | Named Flow Arrow | In-transit data packet or payload | Forms, tracking codes, financial records, audit rows |
| 🟢 Green Box | Process Node | Active workflow processing unit | Core backend services and transaction coordinators |
| 🟨 Gold Cylinder | Data Store Node | Persistent PostgreSQL / File store | Secure database tables with RLS and foreign key integrity |


## 5. Flow Details
- **Process 1.0 (Browse Active Calls)**: Delivers active scholarship announcements, quotas, and deadline timetables to prospective applicants.
- **Process 2.0 (Submit Application & Upload Proofs)**: Ingests student profiles and scans, validating format compliance before dispatching.
- **Process 3.0 (Generate Tracking Code & Receipt)**: Issues a verified unique token (`TDP-YYYY-XXXX`) and produces a confirmation slip.
- **Process 4.0 (Inquire Application Status)**: Queries the database using the unique token and displays current qualification status without requiring a login account.
