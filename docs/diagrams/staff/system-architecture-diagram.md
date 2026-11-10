# Staff Coordinator — System Architecture Diagram

> **Role:** `STAFF`  
> **Diagram Type:** System Architecture Diagram  
> **Focus:** Operations Subsystem, 3-Way Matcher, Validation Queue, and Certificate Designer

---

## 1. Purpose

The System Architecture Diagram shows the multi-tier architecture used by the Staff Coordinator, including client interfaces, edge routing, application services, persistence layers, and external agency links.

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
        StaffBrowser["Staff Coordinator Workstation<br/>• /documents (Annexes 1-5, 10)<br/>• /registrations (Validation Queue)<br/>• /verification (3-Way Matching)<br/>• /certificate-editor (Designer)"]:::clientStyle
    end

    subgraph EDGE_TIER["Edge Gateway & Security"]
        NginxProxy["Reverse Proxy / Nginx<br/>(TLS 1.3 Termination & Static Buffers)"]:::edgeStyle
        StaffRBAC["Staff RBAC Guard<br/>(Verifies role == STAFF_COORDINATOR)"]:::edgeStyle
    end

    subgraph APP_TIER["Staff Operations Subsystem"]
        DocBuilder["Annex Form Builder<br/>(Annexes 1 to 5, 10 Forms)"]:::appStyle
        VerifyEngine["3-Way Verification Engine<br/>(Jaro-Winkler Matching & Discrepancies)"]:::appStyle
        RegValidator["Student Validation Service<br/>(Profile Reviews & RA 10173 Lock)"]:::appStyle
        CertDesigner["Certificate Designer Engine<br/>(Layout Canvas & Word Docx Exporter)"]:::appStyle
        ExcelExporter["Native ExcelJS Exporter<br/>(3-Tab Workbooks & Management Fees)"]:::appStyle
        RegistryManager["Outgoing Transmittal Manager<br/>(Courier Logging & Hardcopy Scans)"]:::appStyle
    end

    subgraph DATA_TIER["Storage & Persistence Tier"]
        PostgresDB[("PostgreSQL Database<br/>(documents, verification_runs, registrations)")]:::dataStyle
        UploadsStorage[("Local Disk Volume<br/>(/uploads/scans/ & /uploads/logos/)")]:::dataStyle
    end

    subgraph EXTERNAL_TIER["External Services"]
        GoogleDrive["External Google Drive Storage<br/>(Transmittal Backup Folders)"]:::extStyle
        CHEDUniFAST["CHED / UniFAST Regional Office<br/>(Physical Transmittal Delivery)"]:::extStyle
    end

    %% Network Connections
    StaffBrowser -->|HTTPS TLS 1.3| NginxProxy
    NginxProxy -->|HTTP 3000| StaffRBAC
    StaffRBAC --> DocBuilder
    StaffRBAC --> VerifyEngine
    StaffRBAC --> RegValidator
    StaffRBAC --> CertDesigner
    StaffRBAC --> RegistryManager

    DocBuilder --> ExcelExporter
    VerifyEngine --> ExcelExporter
    CertDesigner --> PostgresDB

    DocBuilder --> PostgresDB
    VerifyEngine --> PostgresDB
    RegValidator --> PostgresDB
    RegistryManager --> PostgresDB

    RegistryManager --> UploadsStorage
    CertDesigner --> UploadsStorage
    RegistryManager --> GoogleDrive
    RegistryManager --> CHEDUniFAST

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Client["[Green Box]: Client Presentation"]:::clientStyle
        L_Edge["[Gold Box]: Gateway & RBAC"]:::edgeStyle
        L_App["[White Box]: Application Logic"]:::appStyle
        L_Data[("[(Cylinder)]: Persistence Store")]:::dataStyle
        L_Client --> L_Edge --> L_App --> L_Data
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | Tier Concept | MinSU Implementation |
|---|---|---|---|
| Client Tier | `#F1F8F1` Box | User Workstation Presentation | Next.js browser views for staff operations |
| Edge Tier | `#FFF1C2` Box | Gateway & Authorization | Reverse proxy and `StaffRBAC` token validator |
| Application Tier | `#FFFFFF` Box | Domain Services | 3-Way Matcher, ExcelJS exporter, Word docx engine |
| Persistence Tier | Cylinder Shape | Relational & Disk Storage | PostgreSQL database and host-mounted uploads volume |

---

## 4. Tier Responsibilities

- **Client Tier**: Delivers responsive forms, interactive discrepancy tables, and drag-and-drop certificate signatory editors.
- **Edge Tier**: Blocks unauthenticated requests and restricts execution strictly to `STAFF_COORDINATOR` sessions.
- **Application Tier**: Processes multipart CSV uploads, executes cross-matching algorithms, and compiles Annex billing statements.
- **Persistence Tier**: Ensures ACID compliance for registration records and saves wet-signed PDF scans.
