# System Admin — Use Case Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Use Case Diagram  
> **Standard:** UML 2.5 Use Case Specification

---

## 1. Purpose

The Use Case Diagram shows what the System Administrator can do in MinSU DocTrack. It sets the boundary for user management, audit review, landing page CMS configuration, branding, rate limiting, and emergency announcements.

---

## 2. Mermaid Use Case Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ucStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef inclStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:1px,stroke-dasharray: 4 4,color:#1F2A24;

    Admin(("System Administrator")):::actorStyle

    subgraph SYSTEM_BOUNDARY["MinSU DocTrack Administration Boundary"]
        UC_CreateUser(["Create User Account"]):::ucStyle
        UC_AssignRole(["Assign Role and Department"]):::ucStyle
        UC_Deactivate(["Deactivate User Account"]):::ucStyle
        UC_AuditLogs(["Inspect Immutable Audit Logs"]):::ucStyle
        UC_FilterAudit(["Filter Logs by Entity and Date"]):::inclStyle
        UC_LandingCMS(["Edit Landing Page Content"]):::ucStyle
        UC_PublishCMS(["Publish CMS Draft Changes"]):::inclStyle
        UC_Branding(["Upload Institutional Logos"]):::ucStyle
        UC_RateLimit(["Toggle Rate Limiting Shield"]):::ucStyle
        UC_Announce(["Broadcast Emergency IT Notice"]):::ucStyle
        UC_VerifyEmail(["Verify University Email"]):::inclStyle
    end

    Admin --- UC_CreateUser
    Admin --- UC_AssignRole
    Admin --- UC_Deactivate
    Admin --- UC_AuditLogs
    Admin --- UC_LandingCMS
    Admin --- UC_Branding
    Admin --- UC_RateLimit
    Admin --- UC_Announce

    UC_CreateUser -.->|<<include>>| UC_VerifyEmail
    UC_AuditLogs -.->|<<extend>>| UC_FilterAudit
    UC_LandingCMS -.->|<<include>>| UC_PublishCMS

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Actor["[Actor]: User Role"]:::legActor
        L_UC(["(Use Case Action)"]):::legUC
        L_Actor --> L_UC
        L_UC -.->|<<include>>| L_Audit(["(Mandatory Sub-Action)"]):::legUC
    end
    classDef legActor fill:#F6F8F6,stroke:#1B5E20,color:#1F2A24;
    classDef legUC fill:#FFFFFF,stroke:#1B5E20,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Use Case Concept | MinSU System Implementation |
|---|---|---|---|
| `actor` / `[Actor]` | External Role | User triggering administrative actions | System Administrator |
| `usecase` / `(["(Action)"])` | Use Case Unit | Distinct capability or administrative goal | Create User, Toggle Rate Limits, Edit CMS, Inspect Audits |
| `-->` Solid Arrow | Actor Association | User initiates or receives data | Admin configures rate limits, manages logos, provisions users |
| `..>` / `-.->` Dashed Arrow | Stereotyped Dependency | Relationship between use cases | `<<include>>` (Mandatory invocation) or `<<extend>>` (Optional filter) |

---

## 4. PlantUML Use Case Diagram

```plantuml
@startuml
skinparam actorStyle awesome
skinparam packageBackgroundColor #F6F8F6
skinparam usecaseBackgroundColor #FFFFFF
skinparam usecaseBorderColor #1B5E20

actor "System Administrator" as Admin

rectangle "MinSU DocTrack Administrative Portal" {
  usecase "Create User Account" as UC_Create
  usecase "Assign Role & Department" as UC_Role
  usecase "Deactivate User" as UC_Deact
  usecase "Inspect Audit Logs" as UC_Audit
  usecase "Filter Logs" as UC_Filter
  usecase "Manage Landing CMS" as UC_CMS
  usecase "Publish CMS Changes" as UC_Publish
  usecase "Upload Logos & Branding" as UC_Brand
  usecase "Toggle Rate Limiting" as UC_Rate
  usecase "Broadcast IT Announcement" as UC_Announce
  usecase "Verify Email Syntax" as UC_Email
}

Admin --> UC_Create
Admin --> UC_Role
Admin --> UC_Deact
Admin --> UC_Audit
Admin --> UC_CMS
Admin --> UC_Brand
Admin --> UC_Rate
Admin --> UC_Announce

UC_Create ..> UC_Email : <<include>>
UC_Audit ..> UC_Filter : <<extend>>
UC_CMS ..> UC_Publish : <<include>>
@enduml
```
