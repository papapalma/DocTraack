# System Admin — Object Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Object Diagram  
> **Scenario:** Runtime Snapshot of Staff Account Creation, CMS Configuration, and Audit Logging  
> **Standard:** UML 2.5 Object Specification

---

## 1. Purpose

The Object Diagram shows a concrete runtime snapshot of objects, attribute values, and links created when an administrator provisions a staff account and updates landing page configurations.

---

## 2. Mermaid Object Diagram

```mermaid
flowchart TD
    %% Styling Classes
    classDef objStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;

    adminObj["<u>adminUser : User</u><br/>id = 'usr_admin_01'<br/>name = 'Admin Juan Dela Cruz'<br/>email = 'admin@minsu.edu.ph'<br/>role = SYSTEM_ADMIN<br/>twoFactorEnabled = true"]:::objStyle

    sessionObj["<u>adminSession : Session</u><br/>id = 'sess_9918'<br/>token = 'sec_tok_8f91a...'<br/>expiresAt = '2026-11-05T08:00:00Z'"]:::objStyle

    newStaffObj["<u>newStaff : User</u><br/>id = 'usr_staff_102'<br/>name = 'Elena Ramos'<br/>email = 'elena.ramos@minsu.edu.ph'<br/>passwordHash = '$2b$10$wK1...'<br/>role = STAFF<br/>active = true"]:::objStyle

    auditObj["<u>auditRecord : AuditLog</u><br/>id = 'log_3091'<br/>actorId = 'usr_admin_01'<br/>action = 'USER_CREATED'<br/>entity = 'USER'<br/>entityId = 'usr_staff_102'<br/>createdAt = '2026-10-29T20:15:00Z'"]:::objStyle

    cmsConfig["<u>landingConfig : LandingPageConfig</u><br/>id = 'default'<br/>hasUnpublishedChanges = false<br/>publishedAt = '2026-10-29T20:00:00Z'<br/>updatedById = 'usr_admin_01'"]:::objStyle

    brandingConfig["<u>branding : SystemBranding</u><br/>institutionName = 'Mindoro State University'<br/>primaryLogoUrl = '/api/media/logo/minsu_seal.png'"]:::objStyle

    adminObj ---|holds| sessionObj
    adminObj ---|provisions| newStaffObj
    adminObj ---|triggers| auditObj
    auditObj ---|documents| newStaffObj
    adminObj ---|publishes| cmsConfig
    adminObj ---|maintains| brandingConfig

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Inst["<u>instanceName : ClassName</u><br/>attribute1 = value<br/>attribute2 = value"]:::legInst
        L_Link["Link: ---predicate---"]:::legLink
        L_Inst --> L_Link
    end
    classDef legInst fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legLink fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Format | UML Role | MinSU Instance Context |
|---|---|---|---|
| `<u>instance : Class</u>` | Underlined Identifier | Concrete runtime object in memory | System Administrator, active session, new staff account |
| `attr = 'value'` | Key-Value Assignment | Concrete state of instance properties | `role = SYSTEM_ADMIN`, `twoFactorEnabled = true` |
| `---predicate---` | Undirected Semantic Link | Association relationship at runtime | Admin provisions account, publishes CMS config |
| 🟢 Green Container | `#1B5E20` / `#F1F8F1` | Verified Administrative Entity | Authenticated administrative user with valid session |

---

## 4. Runtime Object Attributes

- `adminUser`: Authenticated administrator account with active two-factor authentication.
- `adminSession`: Cryptographic 32-byte session token stored in PostgreSQL and httpOnly cookie.
- `newStaff`: Newly provisioned coordinator account hashed with bcrypt 10 salt rounds.
- `auditRecord`: Immutable security log capturing actor ID, timestamp, and entity diff.
- `landingConfig`: Split-screen CMS state synchronized to production with zero unpublished drafts.
- `branding`: Institutional crest URL serving sanitized SVGs with script-prevention headers.
