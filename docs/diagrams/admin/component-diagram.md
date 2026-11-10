# System Admin — Component Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Component Diagram  
> **Standard:** UML 2.5 Component Specification

---

## 1. Purpose

The Component Diagram shows the software components, provided interfaces, and required dependencies within the administrative subsystem, covering user governance, 2FA management, audit log forensics, Landing Page CMS, branding, and rate limiting controls.

---

## 2. Mermaid Component Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ifaceStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;
    classDef dataComp fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    subgraph PRESENTATION["Presentation Layer"]
        UsersUI["<<component>><br/>Users Management View"]:::compStyle
        AuditUI["<<component>><br/>Audit Log Explorer View"]:::compStyle
        CMSUI["<<component>><br/>Landing Page CMS View"]:::compStyle
        BrandingUI["<<component>><br/>Branding & Logos View"]:::compStyle
        AnnounceUI["<<component>><br/>System Announcements View"]:::compStyle
    end

    subgraph SECURITY["Security Layer"]
        RBACFilter["<<component>><br/>Admin RBAC Guard"]:::compStyle
        BcryptModule["<<component>><br/>Bcrypt Password Hasher"]:::compStyle
        RateLimiter["<<component>><br/>Anti-Brute-Force Rate Limiter"]:::compStyle
    end

    subgraph BUSINESS["Admin Domain Services"]
        UserService["<<component>><br/>User Account Service"]:::compStyle
        AuditService["<<component>><br/>Audit Forensics Service"]:::compStyle
        CMSService["<<component>><br/>Landing CMS Publishing Service"]:::compStyle
        BrandingService["<<component>><br/>Institutional Branding Service"]:::compStyle
        AnnounceService["<<component>><br/>Announcement Service"]:::compStyle
    end

    subgraph DATA["Data Access"]
        PrismaClient["<<component>><br/>Prisma ORM Client"]:::dataComp
        DiskStorage["<<component>><br/>Local Disk Volume (/uploads)"]:::dataComp
    end

    %% Interfaces
    IAdminAuth(["IAdminAuthGuard"]):::ifaceStyle
    IUserCRUD(["IUserOperations"]):::ifaceStyle
    IAuditLog(["IAuditForensics"]):::ifaceStyle
    ICMSPublish(["ICMSPublishing"]):::ifaceStyle
    IBranding(["IBrandingOperations"]):::ifaceStyle
    IRateLimit(["IRateLimitControls"]):::ifaceStyle
    IData(["IDataAccess"]):::ifaceStyle

    %% Presentation to Security
    UsersUI --> IAdminAuth
    AuditUI --> IAdminAuth
    CMSUI --> IAdminAuth
    BrandingUI --> IAdminAuth

    IAdminAuth --> RBACFilter
    RBACFilter --> UserService
    RBACFilter --> AuditService
    RBACFilter --> CMSService
    RBACFilter --> BrandingService
    RBACFilter --> RateLimiter

    %% Services to Interfaces
    UserService --> IUserCRUD
    AuditService --> IAuditLog
    CMSService --> ICMSPublish
    BrandingService --> IBranding
    RateLimiter --> IRateLimit

    UserService --> BcryptModule
    UserService --> IData
    AuditService --> IData
    CMSService --> IData
    BrandingService --> IData
    AnnounceService --> IData

    IData --> PrismaClient
    BrandingService --> DiskStorage

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Comp["[Component Box]: Software Module"]:::compStyle
        L_Iface(["(Round Pin): Provided Interface"]):::ifaceStyle
        L_Data["[Gold Box]: Data Store / Storage"]:::dataComp
        L_Comp --> L_Iface --> L_Data
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Component Meaning | MinSU Implementation |
|---|---|---|---|
| `[Component]` | `["<<component>>\nName"]` | Autonomous modular unit with internal logic | User Account Service, CMS Service, Rate Limiter |
| `(Interface)` | `(["IName"])` | Formal contract or API boundary | `IUserOperations`, `IAuditForensics`, `ICMSPublishing` |
| `Solid Arrow` | `-->` | Direct dependency or invocation | Views invoke domain operations through guarded interfaces |
| `Data Component` | Gold Tone `#FFF1C2` | Persistence or storage component | Prisma client and uploaded logo storage volume |

---

## 4. Component Responsibilities

- **Users Management View (`UsersUI`)**: Renders active accounts, role assignment modals, and 2FA reset tools.
- **Audit Forensics Service (`AuditService`)**: Ingests chronological security logs and streams forensic CSV exports.
- **Landing CMS Publishing Service (`CMSService`)**: Manages draft and published landing sections with split-screen live preview.
- **Institutional Branding Service (`BrandingService`)**: Validates SVG/PNG logo uploads and updates global headers.
- **Anti-Brute-Force Rate Limiter (`RateLimiter`)**: Tracks failed IP attempts and allows global override toggling.
