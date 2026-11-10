# System Admin — Data Flow Diagram (DFD)

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Data Flow Diagram (Level 1)  
> **Focus:** Account Governance, Audit Ingestion, CMS, Branding & Rate Limiting

---

## 1. Purpose

The Data Flow Diagram shows how administrative inputs move through governance processes to persistent data stores, logo volumes, and audit sinks.

---

## 2. Mermaid Data Flow Diagram (Level 1)

```mermaid
flowchart TD
    %% Styling Classes
    classDef entityStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef processStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef storeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    AdminEntity["System Administrator<br/>(External Entity)"]:::entityStyle

    subgraph PROCESSES["Administrative Processes"]
        P1["1.0<br/>Manage User Accounts & 2FA"]:::processStyle
        P2["2.0<br/>Filter & Export Audit Forensics"]:::processStyle
        P3["3.0<br/>Manage Landing CMS Content"]:::processStyle
        P4["4.0<br/>Configure Institutional Branding"]:::processStyle
        P5["5.0<br/>Control Rate Limiting Rules"]:::processStyle
    end

    subgraph DATA_STORES["Data Stores"]
        D1[("D1: users Table")]:::storeStyle
        D2[("D2: audit_log Table")]:::storeStyle
        D3[("D3: landing_page_config Table")]:::storeStyle
        D4[("D4: /uploads/logos Volume")]:::storeStyle
        D5[("D5: system_branding Table")]:::storeStyle
    end

    %% Flows from Admin
    AdminEntity -->|Credentials, Role, 2FA Reset| P1
    AdminEntity -->|Forensic Filter & Export Query| P2
    AdminEntity -->|Draft Sections & Hero Images| P3
    AdminEntity -->|SVG Logos & Header Styles| P4
    AdminEntity -->|Rate Limit Toggle Flag| P5

    %% Flows to Admin
    P1 -->|User Roster & Status Codes| AdminEntity
    P2 -->|Filtered Log Records & Forensic CSV| AdminEntity
    P3 -->|Live Preview & Publish Acknowledgment| AdminEntity
    P4 -->|Branding Preview & Logo URLs| AdminEntity
    P5 -->|Active IP Block Status| AdminEntity

    %% Data Store Interactions
    P1 -->|Upsert User & Reset TOTP| D1
    D1 -->|Read Account Records| P1
    P1 -->|Log: USER_UPDATED| D2

    D2 -->|Stream Chronological Events| P2

    P3 -->|Write Draft & Published JSON| D3
    D3 -->|Read Active CMS Config| P3
    P3 -->|Log: LANDING_CMS_PUBLISHED| D2

    P4 -->|Store Image Files| D4
    P4 -->|Update Header Config| D5
    P4 -->|Log: BRANDING_UPDATED| D2

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
| `[Entity]` | `["Name"]` | External Source or Sink | System Administrator |
| `(Process)` | `["N.0\nName"]` | Transformation of data packets | Account management, audit forensics, CMS editing |
| `[(Data Store)]` | `[("DN: table")]` | Relational table or storage volume | PostgreSQL tables (`users`, `audit_log`), `/uploads/logos` |
| `-->` | Directed Arrow | Flow of data packets | User credentials, forensic CSV stream, SVG buffers |

---

## 4. Data Flow Descriptions

- **1.0 Manage User Accounts & 2FA**: Provisions institutional accounts, updates RBAC roles, and resets user 2FA TOTP secrets.
- **2.0 Filter & Export Audit Forensics**: Queries the append-only `audit_log` table by actor and date range and streams forensic CSV exports.
- **3.0 Manage Landing CMS Content**: Allows drafting, previewing, and publishing landing page sections.
- **4.0 Configure Institutional Branding**: Validates uploaded logos, stores them in `./storage/uploads/logos`, and saves branding styles.
- **5.0 Control Rate Limiting Rules**: Enables administrators to temporarily disable anti-brute-force rate limiting during mass registration drives.
