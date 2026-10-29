# Staff Coordinator — Data Flow Diagram (DFD)

> **Role:** `STAFF`  
> **Diagram Type:** Data Flow Diagram (Level 1)  
> **Focus:** Application Evaluation, Document Drafting, Scan Upload, and Transmittal

---

## 1. Purpose

The Data Flow Diagram shows how applicant information and document metadata move through Staff operational processes to database stores and external destinations.

---

## 2. Mermaid Data Flow Diagram (Level 1)

```mermaid
flowchart TD
    %% Styling Classes
    classDef entityStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef processStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef storeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    StaffUser["Staff Coordinator<br/>(External Entity)"]:::entityStyle
    CHEDEntity["CHED / UniFAST<br/>(External Recipient)"]:::entityStyle

    subgraph PROCESSES["Staff Operational Processes"]
        P1["1.0<br/>Configure Applicant Calls"]:::processStyle
        P2["2.0<br/>Evaluate Student Submissions"]:::processStyle
        P3["3.0<br/>Compile & Draft Annex 1"]:::processStyle
        P4["4.0<br/>Upload Signed Physical Scan"]:::processStyle
        P5["5.0<br/>Record Outgoing Transmittal"]:::processStyle
    end

    subgraph DATA_STORES["Data Stores"]
        D1[("D1: applicant_calls Table")]:::storeStyle
        D2[("D2: applications Table")]:::storeStyle
        D3[("D3: documents Table")]:::storeStyle
        D4[("D4: /uploads (Storage Volume)")]:::storeStyle
        D5[("D5: transmittals Table")]:::storeStyle
        D6[("D6: audit_log Table")]:::storeStyle
    end

    %% Staff Interactions
    StaffUser -->|Call Schema & Deadline| P1
    StaffUser -->|Accept / Reject Verdict & Notes| P2
    StaffUser -->|Annex Roster Inputs| P3
    StaffUser -->|Scanned PDF Stream| P4
    StaffUser -->|Courier Details & Drive URL| P5

    P2 -->|Pending Application Queue| StaffUser
    P3 -->|Draft Document Preview| StaffUser
    P5 -->|Transmittal Confirmation| StaffUser

    %% Data Store Movements
    P1 -->|Write New Call Record| D1
    D2 -->|Read Submitted Student Data| P2
    P2 -->|Update Application Status (ACCEPTED)| D2
    D2 -->|Fetch Accepted Grantees| P3
    P3 -->|Write Draft Annex 1 Document| D3

    P4 -->|Store Binary PDF File| D4
    P4 -->|Update Status: UPLOADED| D3

    P5 -->|Insert Transmittal Record| D5
    P5 -->|Update Status: TRANSMITTED| D3
    P5 -->|Write Action Event| D6

    %% External Flow
    P5 -.->|Digital Link & Physical Notice| CHEDEntity

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

## 4. Data Flow Definitions

- **Call Schema & Deadline**: JSON structure describing custom applicant fields and expiration date.
- **Accept / Reject Verdict & Notes**: Staff evaluation results based on COR and grade requirements.
- **Scanned PDF Stream**: Multipart binary stream containing wet-signed university endorsement.
- **Courier Details & Drive URL**: Airway bill tracking number, delivery recipient, and Google Drive folder link.
