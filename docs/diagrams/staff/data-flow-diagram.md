# Staff Coordinator — Data Flow Diagram (DFD)

> **Role:** `STAFF`  
> **Diagram Type:** Data Flow Diagram (Level 1)  
> **Focus:** Student Validation, 3-Way Verification, Annex Drafting, Certificate Design, and Transmittal

---

## 1. Purpose

The Data Flow Diagram shows how student records, CSV verification datasets, and document metadata move through Staff operational processes to data stores and external recipients.

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
        P1["1.0<br/>Validate Student Registrations"]:::processStyle
        P2["2.0<br/>Execute 3-Way Tripartite Verification"]:::processStyle
        P3["3.0<br/>Resolve Student Discrepancies"]:::processStyle
        P4["4.0<br/>Compile Verified Roster into Annex 4"]:::processStyle
        P5["5.0<br/>Design Certificate Templates & Export"]:::processStyle
        P6["6.0<br/>Record Outgoing Transmittal"]:::processStyle
    end

    subgraph DATA_STORES["Data Stores"]
        D1[("D1: registrations Table")]:::storeStyle
        D2[("D2: verification_runs Table")]:::storeStyle
        D3[("D3: verification_results Table")]:::storeStyle
        D4[("D4: documents Table")]:::storeStyle
        D5[("D5: certificate_templates Table")]:::storeStyle
        D6[("D6: transmittals Table")]:::storeStyle
        D7[("D7: audit_log Table")]:::storeStyle
    end

    %% Staff Inputs
    StaffUser -->|Validation Decision: ACCEPT / REJECT| P1
    StaffUser -->|Upload CHED & Registrar CSV Datasets| P2
    StaffUser -->|Resolution Action: CONFIRM / DISMISS| P3
    StaffUser -->|Sync Verified Roster to Billing| P4
    StaffUser -->|Signatories & Paper Dimensions| P5
    StaffUser -->|Courier Metadata & Scanned PDF| P6

    %% Feedback Flows
    P1 -->|Pending Applicant Profiles| StaffUser
    P2 -->|Cross-Match Summary Metrics| StaffUser
    P3 -->|Resolved Discrepancy Rows| StaffUser
    P4 -->|Multi-Tab ExcelJS Workbook (.xlsx)| StaffUser
    P5 -->|Annex 10 Word Document (.doc)| StaffUser

    %% Process to Data Store Flows
    P1 -->|Update Status & Lock Identity| D1
    D1 -->|Read Validated Student Masterlist| P2
    P2 -->|Create Verification Run| D2
    P2 -->|Write Discrepancy Records| D3
    P3 -->|Update Resolution Notes & Flags| D3
    D3 -->|Read Fully Verified Grantees| P4
    P4 -->|Save Annex 4 Document Draft| D4
    P5 -->|Save Layout & Signatories| D5
    P6 -->|Save Transmittal Record| D6
    P6 -->|Upload Stamped Hardcopy PDF| CHEDEntity

    %% Audit Log Sinks
    P1 -->|Audit: REGISTRATION_ACCEPTED| D7
    P2 -->|Audit: VERIFICATION_RUN_EXECUTED| D7
    P3 -->|Audit: DISCREPANCY_RESOLVED| D7
    P6 -->|Audit: TRANSMITTAL_LOGGED| D7

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

| Visual Symbol | Syntax / Style | DFD Concept | MinSU Operational Implementation |
|---|---|---|---|
| `[Entity]` | `["Name"]` | External Source or Sink | Staff Coordinator, External CHED/UniFAST office |
| `(Process)` | `["N.0\nName"]` | Logical transformation of data | Registration validation, tripartite matching, Excel generation |
| `[(Data Store)]` | `[("DN: table")]` | Passive repository of persisted data | PostgreSQL tables (`registrations`, `verification_runs`, `documents`) |
| `-->` | Solid Directed Flow | Flow of information packets | Transmitting CSV datasets, applicant profiles, and Excel streams |

---

## 4. Data Flow Descriptions

- **1.0 Validate Student Registrations**: Receives online student submissions, validates attachments, marks `ACCEPTED`, and locks student identity under RA 10173.
- **2.0 Execute 3-Way Tripartite Verification**: Ingests CHED and Registrar CSV datasets, applies Jaro-Winkler fuzzy matching against `registrations`, and stores findings in `verification_results`.
- **3.0 Resolve Student Discrepancies**: Enables manual review of flagged variances with mandatory coordinator justification.
- **4.0 Compile Verified Roster into Annex 4**: Transfers verified scholars directly into Form 2 and outputs native multi-tab `ExcelJS` files.
- **5.0 Design Certificate Templates & Export**: Persists layout dimensions, paper size, and signatories for Annex 10 Word notices of awards.
- **6.0 Record Outgoing Transmittal**: Dispatches physical documents and archives digital verification proof.
