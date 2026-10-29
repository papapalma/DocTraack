# System Admin — System Architecture Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** System Architecture Diagram  
> **Focus:** Administrative Governance Subsystem, Audit Stores & CMS Boundaries

---

## 1. Purpose

The System Architecture Diagram shows the main components of the administration subsystem. It shows the Admin browser, authentication layer, user provisioning services, immutable audit logger, and landing page CMS engine.

---

## 2. Mermaid System Architecture Diagram

```mermaid
flowchart TB
    %% Styling Classes
    classDef clientStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef edgeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef appStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef dataStyle fill:#DCEFDD,stroke:#123F17,stroke-width:2px,color:#123F17;

    subgraph CLIENT_TIER["Admin Client Tier"]
        AdminBrowser["System Administrator<br/>(Desktop Web Browser)"]:::clientStyle
    end

    subgraph EDGE_TIER["Edge Gateway & Security"]
        NginxProxy["Reverse Proxy / Nginx<br/>(HTTPS Port 443)"]:::edgeStyle
        AdminRBAC["Admin RBAC Guard<br/>(Requires role == SYSTEM_ADMIN)"]:::edgeStyle
    end

    subgraph APP_TIER["Admin Subsystem Layer"]
        UserProvisioner["User Provisioning Service<br/>(CRUD & Role Assignment)"]:::appStyle
        CryptoEngine["Password Crypto Engine<br/>(Bcrypt 10 Salt Rounds)"]:::appStyle
        AuditInspector["Audit Ingestion & Query Service<br/>(Immutable Event Log)"]:::appStyle
        CMSManager["Landing Page CMS Manager<br/>(Draft & Publish Engine)"]:::appStyle
        SessionManager["Admin Session Controller<br/>(Secure Cookie Parser)"]:::appStyle
    end

    subgraph DATA_TIER["Persistence Tier (PostgreSQL)"]
        UserTable[("users Table<br/>(Roles & Credentials)")]:::dataStyle
        AuditTable[("audit_log Table<br/>(Append-Only Log)")]:::dataStyle
        CMSTable[("landing_page_config Table<br/>(Draft & Published JSON)")]:::dataStyle
        SessionTable[("sessions Table<br/>(Active Tokens)")]:::dataStyle
    end

    %% Connections
    AdminBrowser -->|HTTPS TLS 1.3| NginxProxy
    NginxProxy -->|HTTP 3000| AdminRBAC
    AdminRBAC --> SessionManager
    AdminRBAC --> UserProvisioner
    AdminRBAC --> AuditInspector
    AdminRBAC --> CMSManager

    UserProvisioner --> CryptoEngine
    UserProvisioner --> UserTable
    UserProvisioner -->|Emit USER_MUTATION| AuditInspector

    AuditInspector --> AuditTable
    CMSManager --> CMSTable
    CMSManager -->|Emit CMS_PUBLISHED| AuditInspector
    SessionManager --> SessionTable

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Client["Client Tier Actor / UI"]:::clientStyle
        L_Edge["Edge / Gateway Tier"]:::edgeStyle
        L_App["Application Tier Service"]:::appStyle
        L_Data[("Data Tier Persistence")]:::dataStyle
        L_Ext["External Stakeholder"]:::extStyle
        L_Client -->|Network Protocol| L_Edge
        L_Edge --> L_App
        L_App --> L_Data
        L_App -.->|External Sync| L_Ext
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | Architectural Tier | MinSU System Implementation |
|---|---|---|---|
| 🟩 Soft Green Box | `fill:#F1F8F1, stroke:#1B5E20` | Client Presentation Tier | Browser clients for Student, Staff, Director, Accounting, and Admin |
| 🟨 Gold Box | `fill:#FFF1C2, stroke:#F2B705` | Edge & Security Gateway Tier | Nginx TLS termination reverse-proxy and Next.js edge RBAC middleware |
| ⬜ White Box | `fill:#FFFFFF, stroke:#1B5E20` | Core Application Tier | Next.js Server Components, Document Engine, Auth Controller, PDF Compiler |
| 🟩 Dark Green Cylinder | `fill:#DCEFDD, stroke:#123F17` | Persistent Data Tier | PostgreSQL 16 relational database (Port 5432) and local storage volumes |
| ◻️ Dashed Border Box | `stroke-dasharray: 5 5` | External Stakeholder / Boundary | CHED/UniFAST regional office and external Google Drive transmittal archive |
| `-->` Solid Arrow | Network & Internal Call | Synchronous HTTPS, WSS, HTTP (port 3000), or TCP (port 5432) |
| `-.->` Dashed Arrow | Out-of-Band Integration | Physical courier shipment or external cloud drive URL synchronization |


---

## 4. Architecture Rules

- Only authenticated administrators with the `SYSTEM_ADMIN` role can reach administrative routes.
- The `Password Crypto Engine` hashes plain-text credentials before writing to the database.
- Administrative mutations must write an immutable audit log entry.
