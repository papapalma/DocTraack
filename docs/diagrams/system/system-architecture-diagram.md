# System Architecture Diagram

> **System:** MinSU DocTrack — Document Tracking & Annex Management  
> **Diagram Type:** System Architecture Diagram  
> **Standard:** C4 / Informal Architecture Model

---

## 1. Purpose

The System Architecture Diagram shows the main components of MinSU DocTrack. It shows user clients, the application server, the database, and external agency links.

---

## 2. Architecture Diagram

```mermaid
flowchart TB
    %% Styling Classes
    classDef clientStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef edgeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef appStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef dataStyle fill:#DCEFDD,stroke:#123F17,stroke-width:2px,color:#123F17;
    classDef extStyle fill:#F6F8F6,stroke:#55645B,stroke-width:2px,stroke-dasharray: 5 5,color:#1F2A24;

    subgraph CLIENT_TIER["Client Tier (Web Browsers)"]
        DirectorUser["Campus Director<br/>(Desktop Browser)"]:::clientStyle
        StaffUser["Staff Coordinator<br/>(Desktop Browser)"]:::clientStyle
        AccountingUser["Accounting Officer<br/>(Desktop Browser)"]:::clientStyle
        AdminUser["System Admin<br/>(Desktop Browser)"]:::clientStyle
        StudentUser["Student Applicant<br/>(Mobile / Desktop)"]:::clientStyle
    end

    subgraph EDGE_TIER["Edge & Reverse Proxy Tier"]
        NginxProxy["Reverse Proxy / TLS Termination<br/>(Nginx / HTTPS 443)"]:::edgeStyle
        NextMiddleware["Edge Middleware<br/>(RBAC & Security Headers)"]:::edgeStyle
    end

    subgraph APP_TIER["Application Tier (Node.js / Next.js Fullstack Engine)"]
        subgraph RSC_LAYER["React Server Components Layer"]
            DashboardPages["Admin & Review Dashboards"]:::appStyle
            PortalPages["Public Landing & Student Portal"]:::appStyle
        end

        subgraph API_LAYER["Route Handlers & Server Actions"]
            AuthModule["Auth & Session Controller<br/>(Bcrypt & HTTP-Only Cookie)"]:::appStyle
            DocController["Document Engine<br/>(Annexes 1 to 10 CRUD)"]:::appStyle
            AppController["Application & Calls Engine<br/>(Annex 2 Form Builder)"]:::appStyle
            AuditService["Audit Log Service<br/>(Immutable Action History)"]:::appStyle
            PdfRenderer["Puppeteer PDF Compiler<br/>(Official Annex Templates)"]:::appStyle
        end
    end

    subgraph DATA_TIER["Data & Storage Tier"]
        PrismaClient["Prisma ORM Client"]:::dataStyle
        PostgresDB[("PostgreSQL Database<br/>(Port 5432)")]:::dataStyle
        LocalStorage[("Local Secure Volume<br/>(/uploads/signed-scans)")]:::dataStyle
    end

    subgraph EXTERNAL_TIER["External Stakeholders & Services"]
        GoogleDrive["External Google Drive<br/>(Transmittal Repositories)"]:::extStyle
        CHEDUniFAST["CHED / UniFAST Regional Office<br/>(Hardcopy & Transmittal Registry)"]:::extStyle
    end

    %% Client to Edge Connections
    DirectorUser -->|HTTPS / WSS| NginxProxy
    StaffUser -->|HTTPS / WSS| NginxProxy
    AccountingUser -->|HTTPS / WSS| NginxProxy
    AdminUser -->|HTTPS / WSS| NginxProxy
    StudentUser -->|HTTPS| NginxProxy

    NginxProxy -->|HTTP / 3000| NextMiddleware
    NextMiddleware --> RSC_LAYER
    NextMiddleware --> API_LAYER

    %% Internal Application Connections
    DashboardPages --> DocController
    DashboardPages --> AuthModule
    PortalPages --> AppController
    DocController --> AuditService
    DocController --> PdfRenderer
    DocController --> PrismaClient
    AppController --> PrismaClient
    AuthModule --> PrismaClient
    AuditService --> PrismaClient

    %% Data Connections
    PrismaClient -->|Prisma Engine / TCP 5432| PostgresDB
    PdfRenderer -->|Binary Stream Write| LocalStorage
    DocController -->|Store Scans| LocalStorage

    %% External Connections
    StaffUser -.->|Uploads Scanned Annex 1| GoogleDrive
    DocController -.->|Logs Shared Link| GoogleDrive
    StaffUser -.->|Physical Dispatch & Manifest| CHEDUniFAST

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

## 4. Component Descriptions

- **Client Tier**: Web browsers connect over secure HTTPS.
- **Edge Tier**: Nginx terminates TLS connections. Next.js middleware verifies session tokens and role permissions.
- **Application Tier**: Next.js combines React Server Components and server routes.
- **Data Tier**: Prisma ORM executes typed queries against PostgreSQL. Local file volumes hold signed document scans.
- **External Tier**: Staff upload approved Annex 1 packages to external Google Drive storage and notify CHED.

---

## 5. STE Rules Applied

- The diagram shows high-level parts only.
- Each connection shows the data protocol.
- Component names are singular and clear.
- Paragraphs contain six sentences or fewer.
