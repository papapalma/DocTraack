# System Admin — System Architecture Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** System Architecture Diagram  
> **Focus:** Administrative Governance, Rate Limiting, Audit Stores & Split-Screen CMS

---

## 1. Purpose

The System Architecture Diagram shows the multi-tier architecture used by the System Administrator, covering client presentation, edge rate limiting and RBAC gates, application governance services, and persistent storage tiers.

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
        AdminBrowser["System Administrator Workstation<br/>• /users (User & 2FA Admin)<br/>• /audit-logs (Forensics Explorer)<br/>• /landing-editor (Split-Screen CMS)<br/>• Branding & Rate Limit Panel"]:::clientStyle
    end

    subgraph EDGE_TIER["Edge Gateway & Security"]
        NginxProxy["Reverse Proxy / Nginx<br/>(HTTPS Port 443 / TLS 1.3)"]:::edgeStyle
        RateLimitShield["Rate Limit Shield<br/>(Anti-Brute-Force Guard)"]:::edgeStyle
        AdminRBAC["Admin RBAC Guard<br/>(Requires role == SYSTEM_ADMIN)"]:::edgeStyle
    end

    subgraph APP_TIER["Admin Subsystem Layer"]
        UserProvisioner["User Provisioning Service<br/>(CRUD & Role Assignment)"]:::appStyle
        TwoFactorAdmin["2FA Management Service<br/>(TOTP Secret Resets)"]:::appStyle
        AuditInspector["Audit Forensics Service<br/>(Immutable Logs & CSV Stream)"]:::appStyle
        CMSManager["Landing Page CMS Manager<br/>(Draft Staging & Live Publish)"]:::appStyle
        BrandingManager["Institutional Branding Service<br/>(SVG Sanitization & Logos)"]:::appStyle
        RateLimitManager["Rate Limit Controller<br/>(Global Override Toggle)"]:::appStyle
    end

    subgraph DATA_TIER["Persistence Tier (PostgreSQL & Disk)"]
        UserTable[("users Table<br/>(Credentials & 2FA Flags)")]:::dataStyle
        AuditTable[("audit_log Table<br/>(Append-Only Log)")]:::dataStyle
        CMSTable[("landing_page_config Table<br/>(Draft & Published JSON)")]:::dataStyle
        LogosVolume[("Local Disk Volume<br/>(/uploads/logos & /uploads/landing)")]:::dataStyle
    end

    %% Connections
    AdminBrowser -->|HTTPS TLS 1.3| NginxProxy
    NginxProxy -->|HTTP 3000| RateLimitShield
    RateLimitShield --> AdminRBAC
    AdminRBAC --> UserProvisioner
    AdminRBAC --> TwoFactorAdmin
    AdminRBAC --> AuditInspector
    AdminRBAC --> CMSManager
    AdminRBAC --> BrandingManager
    AdminRBAC --> RateLimitManager

    UserProvisioner --> UserTable
    TwoFactorAdmin --> UserTable
    UserProvisioner -->|Emit USER_MUTATED| AuditInspector
    TwoFactorAdmin -->|Emit 2FA_RESET| AuditInspector
    CMSManager --> CMSTable
    CMSManager -->|Emit CMS_PUBLISHED| AuditInspector
    BrandingManager --> LogosVolume
    BrandingManager -->|Emit BRANDING_UPDATED| AuditInspector
    AuditInspector --> AuditTable

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Client["[Green Box]: Admin Presentation"]:::clientStyle
        L_Edge["[Gold Box]: Gateway, Shield & RBAC"]:::edgeStyle
        L_App["[White Box]: Application Services"]:::appStyle
        L_Data[("[(Cylinder)]: Persistent Relational / Disk")]:::dataStyle
        L_Client --> L_Edge --> L_App --> L_Data
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | Tier Concept | MinSU Implementation |
|---|---|---|---|
| Client Tier | `#F1F8F1` Box | User Workstation Presentation | Next.js browser views for administrative governance |
| Edge Tier | `#FFF1C2` Box | Gateway, Shield & Authorization | Reverse proxy, IP rate limiter, `AdminRBAC` |
| Application Tier | `#FFFFFF` Box | Domain Services | User provisioning, 2FA management, CMS staging |
| Persistence Tier | Cylinder Shape | Relational & Disk Storage | PostgreSQL database and mounted logos file volume |

---

## 4. Tier Responsibilities

- **Client Tier**: Renders administrative dashboards, account creation modals, and the split-screen landing page editor.
- **Edge Tier**: Filters requests through IP-based brute-force tracking and verifies `SYSTEM_ADMIN` privilege.
- **Application Tier**: Enforces bcrypt credential hashing, handles TOTP secret resets, and writes immutable audit entries.
- **Persistence Tier**: Persists user profiles, audit logs, and sanitized SVG logos on secure host-mounted volumes.
