# Staff Coordinator — System Architecture Diagram

> **Role:** `STAFF`  
> **Diagram Type:** System Architecture Diagram  
> **Focus:** Operations Subsystem, Dynamic Call Builder, Scan Upload & Registry

---

## 1. Purpose

The System Architecture Diagram shows the operational subsystem used by the Staff Coordinator, including document preparation forms, applicant call engines, disk file volumes, and outgoing transmittal registries.

---

## 2. Mermaid System Architecture Diagram

```mermaid
flowchart TB
    %% Styling Classes
    classDef clientStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef edgeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef appStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef dataStyle fill:#DCEFDD,stroke:#123F17,stroke-width:2px,color:#123F17;
    classDef extStyle fill:#F6F8F6,stroke:#55645B,stroke-width:2px,stroke-dasharray: 5 5,color:#1F2A24;

    subgraph CLIENT_TIER["Staff Client Tier"]
        StaffBrowser["Staff Coordinator<br/>(Desktop Browser /documents)"]:::clientStyle
    end

    subgraph EDGE_TIER["Edge Gateway & Security"]
        NginxProxy["Reverse Proxy / Nginx"]:::edgeStyle
        StaffRBAC["Staff RBAC Guard<br/>(Verifies role == STAFF)"]:::edgeStyle
    end

    subgraph APP_TIER["Staff Operations Subsystem"]
        DocBuilder["Annex Form Builder<br/>(Annexes 1 to 10 Forms)"]:::appStyle
        CallBuilder["Dynamic Call Form Builder<br/>(Annex 2 Applicant Calls)"]:::appStyle
        AppEvaluator["Student Application Reviewer<br/>(COR & Grade Validation)"]:::appStyle
        ScanUploader["Signed Scan Upload Handler<br/>(PDF Validation & Disk Storage)"]:::appStyle
        RegistryManager["Outgoing Transmittal Manager<br/>(Courier Logging & Archive)"]:::appStyle
    end

    subgraph DATA_TIER["Storage & Persistence Tier"]
        PostgresDB[("PostgreSQL Database<br/>(documents, calls, transmittals)")]:::dataStyle
        UploadsStorage[("Local Disk Volume<br/>(/uploads/scans/)")]:::dataStyle
    end

    subgraph EXTERNAL_TIER["External Services"]
        GoogleDrive["External Google Drive Storage<br/>(Transmittal Package Links)"]:::extStyle
        CHEDUniFAST["CHED / UniFAST Regional Office<br/>(Physical Transmittal Delivery)"]:::extStyle
    end

    %% Connections
    StaffBrowser -->|HTTPS TLS 1.3| NginxProxy
    NginxProxy -->|HTTP 3000| StaffRBAC
    StaffRBAC --> DocBuilder
    StaffRBAC --> CallBuilder
    StaffRBAC --> AppEvaluator
    StaffRBAC --> ScanUploader
    StaffRBAC --> RegistryManager

    DocBuilder --> PostgresDB
    CallBuilder --> PostgresDB
    AppEvaluator --> PostgresDB
    RegistryManager --> PostgresDB
    ScanUploader --> PostgresDB
    ScanUploader -->|Stream PDF Binary| UploadsStorage

    RegistryManager -.->|Logs Shared Link| GoogleDrive
    StaffBrowser -.->|Uploads Scanned PDF| GoogleDrive
    StaffBrowser -.->|Dispatches Hardcopy| CHEDUniFAST

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

- The `Staff Operations Subsystem` controls preparation for all 10 TDP Annexes.
- Wet-ink signed PDF scans stream directly into the local `/uploads` volume.
- The `Outgoing Transmittal Manager` logs courier tracking numbers and Google Drive links.
