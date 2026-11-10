# Campus Director — System Architecture Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** System Architecture Diagram  
> **Focus:** Executive Review Subsystem, Analytics Engine, 2FA Gate & Verification Oversight

---

## 1. Purpose

The System Architecture Diagram shows the multi-tier architecture used by the Campus Director, including client presentation, edge security with 2FA verification, endorsement transaction controllers, and PostgreSQL persistence.

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
        DirectorBrowser["Campus Director Workstation / Tablet<br/>• /review (Executive Queue)<br/>• /analytics (Turnaround KPIs)<br/>• /announcements (Broadcasts)"]:::clientStyle
    end

    subgraph EDGE_TIER["Edge Security & Routing"]
        NginxProxy["Reverse Proxy / Nginx<br/>(TLS 1.3 & Rate Limiting)"]:::edgeStyle
        TwoFactorGuard["Microsoft Authenticator 2FA Guard<br/>(RFC 6238 TOTP Validator)"]:::edgeStyle
        DirectorRBAC["Director Signatory Guard<br/>(Verifies role == CAMPUS_DIRECTOR)"]:::edgeStyle
    end

    subgraph APP_TIER["Executive Review Subsystem"]
        ReviewQueueController["Review Queue Controller<br/>(Fetches SUBMITTED & Urgency Badges)"]:::appStyle
        EndorsementEngine["Endorsement Transaction Manager<br/>(1-Click Approval & State Lock)"]:::appStyle
        RevisionEngine["Revision & Return Manager<br/>(Attaches Mandatory Feedback)"]:::appStyle
        VerifyOversight["Verification Oversight Controller<br/>(3-Way Matching Sign-Off)"]:::appStyle
        VelocityAnalytics["Turnaround Velocity Analytics<br/>(Computes 48h SLA Compliance)"]:::appStyle
        NotificationDispatcher["Executive Notification Dispatcher<br/>(Alerts Preparers Instantly)"]:::appStyle
    end

    subgraph DATA_TIER["Persistence Tier (PostgreSQL)"]
        DocTable[("documents Table<br/>(Annexes 1 to 10)")]:::dataStyle
        VerifyTable[("verification_runs Table<br/>(Cohort Statistics)")]:::dataStyle
        HistoryTable[("status_history Table<br/>(State Transitions)")]:::dataStyle
        CommentTable[("comments Table<br/>(Director Feedback)")]:::dataStyle
        AuditTable[("audit_log Table<br/>(Append-Only Endorsement Events)")]:::dataStyle
    end

    %% Connections
    DirectorBrowser -->|HTTPS TLS 1.3| NginxProxy
    NginxProxy -->|HTTP 3000| TwoFactorGuard
    TwoFactorGuard --> DirectorRBAC
    DirectorRBAC --> ReviewQueueController
    DirectorRBAC --> EndorsementEngine
    DirectorRBAC --> RevisionEngine
    DirectorRBAC --> VerifyOversight
    DirectorRBAC --> VelocityAnalytics

    ReviewQueueController --> DocTable
    VerifyOversight --> VerifyTable
    EndorsementEngine --> DocTable
    EndorsementEngine --> HistoryTable
    RevisionEngine --> DocTable
    RevisionEngine --> CommentTable

    EndorsementEngine --> NotificationDispatcher
    RevisionEngine --> NotificationDispatcher
    EndorsementEngine --> AuditTable
    RevisionEngine --> AuditTable
    VelocityAnalytics --> HistoryTable

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Client["[Green Box]: Executive Presentation"]:::clientStyle
        L_Edge["[Gold Box]: Gateway, 2FA & RBAC"]:::edgeStyle
        L_App["[White Box]: Application Logic"]:::appStyle
        L_Data[("[(Cylinder)]: Relational Store")]:::dataStyle
        L_Client --> L_Edge --> L_App --> L_Data
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | Tier Concept | MinSU Implementation |
|---|---|---|---|
| Client Tier | `#F1F8F1` Box | User Workstation Presentation | Next.js browser views for executive review |
| Edge Tier | `#FFF1C2` Box | Gateway, 2FA & Authorization | Reverse proxy, TOTP validator, `DirectorRBAC` |
| Application Tier | `#FFFFFF` Box | Domain Services | Endorsement manager, verification oversight, analytics |
| Persistence Tier | Cylinder Shape | Relational Storage | PostgreSQL database (`documents`, `verification_runs`) |

---

## 4. Tier Responsibilities

- **Client Tier**: Renders the director review queue, responsive PDF document previews, and SLA compliance gauges.
- **Edge Tier**: Validates Microsoft Authenticator TOTP session tokens and blocks non-director users with HTTP 403 Forbidden.
- **Application Tier**: Executes atomic approval transactions, calculates average turnaround duration, and triggers real-time alerts.
- **Persistence Tier**: Records immutable timestamps on `status_history` and `audit_log` tables for audit defense.
