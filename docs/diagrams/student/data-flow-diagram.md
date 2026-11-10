# Student Applicant — Data Flow Diagram (DFD)

> **Role:** `STUDENT`  
> **Diagram Type:** Data Flow Diagram (Level 1)  
> **Focus:** 2FA Setup, Application Intake, Tracking Codes, and Profile Maintenance

---

## 1. Purpose

The Data Flow Diagram shows how student biodata, 2FA credentials, proof attachments, and tracking queries flow through portal processes to database tables and persistent storage volumes.

---

## 2. Mermaid Data Flow Diagram (Level 1)

```mermaid
flowchart TD
    %% Styling Classes
    classDef entityStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef processStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef storeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    Student["Student Applicant<br/>(External Entity)"]:::entityStyle

    subgraph PROCESSES["Portal Processes"]
        P1["1.0<br/>Setup Microsoft Authenticator 2FA"]:::processStyle
        P2["2.0<br/>Browse Active Calls & Announcements"]:::processStyle
        P3["3.0<br/>Submit Application & Upload Proofs"]:::processStyle
        P4["4.0<br/>Inquire Application Status via Code"]:::processStyle
        P5["5.0<br/>Maintain Profile (RA 10173 Locked)"]:::processStyle
    end

    subgraph DATA_STORES["Data Stores"]
        D1[("D1: users Table (2FA Secrets)")]:::storeStyle
        D2[("D2: registrations Table")]:::storeStyle
        D3[("D3: applicant_calls Table")]:::storeStyle
        D4[("D4: applications Table")]:::storeStyle
        D5[("D5: /uploads/proofs Volume")]:::storeStyle
        D6[("D6: announcements Table")]:::storeStyle
    end

    %% Flows from Student
    Student -->|Scan QR & Verify 6-digit TOTP| P1
    Student -->|Query Open Quotas & Updates| P2
    Student -->|Biodata, Academic Info & Attachments| P3
    Student -->|Input Tracking Code (TDP-YYYY-XXXX)| P4
    Student -->|Updated GWA, Address, Contacts| P5

    %% Flows to Student
    P1 -->|2FA Activation Status| Student
    P2 -->|Active Call Listings & Broadcasts| Student
    P3 -->|Issued Tracking Code & PDF Receipt| Student
    P4 -->|Real-Time Evaluation Milestone| Student
    P5 -->|Locked Identity Fields & Updated Profile| Student

    %% Data Store Interactions
    P1 -->|Save TOTP Secret Hash| D1
    D3 -->|Fetch Open Calls| P2
    D6 -->|Fetch Student Announcements| P2

    P3 -->|Write Application Packet| D4
    P3 -->|Write Profile Baseline| D2
    P3 -->|Store Proof Attachments| D5

    D4 -->|Read Status & Remarks| P4
    P5 -->|Assert Identity Locked (RA 10173)| D2
    P5 -->|Update Dynamic Contacts & GWA| D2

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
| `[Entity]` | `["Name"]` | External Source or Sink | Student Applicant |
| `(Process)` | `["N.0\nName"]` | Data transformation logic | 2FA setup, application intake, profile maintenance |
| `[(Data Store)]` | `[("DN: table")]` | Relational table or storage volume | PostgreSQL tables (`registrations`, `applications`), proof storage |
| `-->` | Directed Arrow | Flow of applicant information | TOTP tokens, tracking codes, downloadable receipts |

---

## 4. Data Flow Descriptions

- **1.0 Setup Microsoft Authenticator 2FA**: Generates RFC 6238 TOTP secrets and saves encrypted keys in `users`.
- **2.0 Browse Active Calls & Announcements**: Delivers open TDP application forms and student announcements.
- **3.0 Submit Application & Upload Proofs**: Stores attachments in `./storage/uploads/proofs/` and issues a unique tracking code.
- **4.0 Inquire Application Status via Code**: Resolves `trackingCode` without exposing other students' private data.
- **5.0 Maintain Profile (RA 10173 Locked)**: Prevents modification of official Student ID and legal name once marked `ACCEPTED`, while saving current contacts and GWA.
