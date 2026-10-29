# Campus Director — System Architecture Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** System Architecture Diagram  
> **Focus:** Executive Review Subsystem, Analytics Engine & Endorsement Boundaries

---

## 1. Purpose

The System Architecture Diagram shows the components of the executive review subsystem used by the Campus Director. It illustrates the Director browser, review queue cache, endorsement transactions, and analytics engine.

---

## 2. Mermaid System Architecture Diagram

```mermaid
flowchart TB
    %% Styling Classes
    classDef clientStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef edgeStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;
    classDef appStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef dataStyle fill:#DCEFDD,stroke:#123F17,stroke-width:2px,color:#123F17;

    subgraph CLIENT_TIER["Executive Client Tier"]
        DirectorBrowser["Campus Director<br/>(Desktop Browser /review)"]:::clientStyle
    end

    subgraph EDGE_TIER["Edge Security & Routing"]
        NginxProxy["Reverse Proxy / TLS 1.3"]:::edgeStyle
        DirectorRBAC["Director Signatory Guard<br/>(Verifies role == DIRECTOR)"]:::edgeStyle
    end

    subgraph APP_TIER["Executive Review Subsystem"]
        ReviewQueueController["Review Queue Controller<br/>(Fetches SUBMITTED & RESUBMITTED)"]:::appStyle
        EndorsementEngine["Endorsement Transaction Manager<br/>(1-Click Approval & State Lock)"]:::appStyle
        RevisionEngine["Revision & Return Manager<br/>(Attaches Feedback Comments)"]:::appStyle
        PdfPreviewer["Puppeteer PDF Previewer<br/>(Dynamic Visual Inspection)"]:::appStyle
        VelocityAnalytics["Turnaround Velocity Analytics<br/>(Calculates SLA & Processing Speed)"]:::appStyle
        NotificationDispatcher["Signatory Notification Dispatcher<br/>(Alerts Preparers Instantly)"]:::appStyle
    end

    subgraph DATA_TIER["Persistence Tier (PostgreSQL)"]
        DocTable[("documents Table<br/>(Annexes 1 to 10)")]:::dataStyle
        HistoryTable[("status_history Table<br/>(State Transitions)")]:::dataStyle
        CommentTable[("comments Table<br/>(Director Feedback)")]:::dataStyle
        AuditTable[("audit_log Table<br/>(Executive Endorsement Events)")]:::dataStyle
    end

    %% Connections
    DirectorBrowser -->|HTTPS TLS 1.3| NginxProxy
    NginxProxy -->|HTTP 3000| DirectorRBAC
    DirectorRBAC --> ReviewQueueController
    DirectorRBAC --> EndorsementEngine
    DirectorRBAC --> RevisionEngine
    DirectorRBAC --> VelocityAnalytics

    ReviewQueueController --> DocTable
    ReviewQueueController --> PdfPreviewer

    EndorsementEngine --> DocTable
    EndorsementEngine --> HistoryTable
    EndorsementEngine --> NotificationDispatcher
    EndorsementEngine --> AuditTable

    RevisionEngine --> DocTable
    RevisionEngine --> CommentTable
    RevisionEngine --> HistoryTable
    RevisionEngine --> NotificationDispatcher
    RevisionEngine --> AuditTable

    VelocityAnalytics --> HistoryTable
    VelocityAnalytics --> DocTable

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

- The `Director Signatory Guard` rejects any approval or return requests from non-director roles.
- `Endorsement Transaction Manager` updates document status and logs status history atomically.
- `Velocity Analytics` computes turnaround metrics using timestamps from `status_history`.
