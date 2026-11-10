# Student Applicant — Component Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** Component Diagram  
> **Standard:** UML 2.5 Component Specification

---

## 1. Purpose

The Component Diagram shows the software components, provided interfaces, and required dependencies within the student portal subsystem, supporting scholarship applications, 2FA authentication, RA 10173 profile locks, tracking lookups, and announcement feeds.

---

## 2. Mermaid Component Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ifaceStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;
    classDef dataComp fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    subgraph PRESENTATION["Student Portal Presentation Layer"]
        CallListUI["<<component>><br/>Scholarship Calls Browser"]:::compStyle
        ApplyFormUI["<<component>><br/>Online Application Modal"]:::compStyle
        TrackerUI["<<component>><br/>Tracking Code Status Widget"]:::compStyle
        ProfileUI["<<component>><br/>Student Profile Editor"]:::compStyle
        AnnounceUI["<<component>><br/>Student Announcements View"]:::compStyle
    end

    subgraph SECURITY["Security & Privacy Layer"]
        TwoFactorModule["<<component>><br/>2FA Authenticator Module"]:::compStyle
        IdorGuard["<<component>><br/>Anti-IDOR Ownership Guard"]:::compStyle
        IdentityLocker["<<component>><br/>RA 10173 Identity Lock Filter"]:::compStyle
    end

    subgraph SERVICES["Portal Application Services"]
        ApplyService["<<component>><br/>Application Intake Service"]:::compStyle
        TrackerService["<<component>><br/>Tracking Code Service"]:::compStyle
        ProfileService["<<component>><br/>Profile Maintenance Service"]:::compStyle
        AttachmentService["<<component>><br/>Proof Document Processor"]:::compStyle
    end

    subgraph STORAGE["Storage Subsystem"]
        PrismaClient["<<component>><br/>Prisma ORM Client"]:::dataComp
        ProofStorage["<<component>><br/>Local Disk Volume (/uploads/proofs)"]:::dataComp
    end

    %% Interfaces
    I2FA(["I2FAAuth"]):::ifaceStyle
    IApply(["IApplicationIntake"]):::ifaceStyle
    ITracker(["ITrackingLookup"]):::ifaceStyle
    IProfile(["IStudentProfile"]):::ifaceStyle
    IData(["IDataAccess"]):::ifaceStyle

    %% Connections
    CallListUI --> IApply
    ApplyFormUI --> I2FA
    ApplyFormUI --> IApply
    TrackerUI --> ITracker
    ProfileUI --> IProfile

    I2FA --> TwoFactorModule
    IApply --> IdorGuard
    IdorGuard --> ApplyService
    IProfile --> IdentityLocker
    IdentityLocker --> ProfileService

    ApplyService --> TrackerService
    ApplyService --> AttachmentService
    ApplyService --> IData
    TrackerService --> IData
    ProfileService --> IData

    IData --> PrismaClient
    AttachmentService --> ProofStorage

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
| `[Component]` | `["<<component>>\nName"]` | Autonomous modular unit with internal logic | Application Intake Service, 2FA Authenticator, Identity Lock Filter |
| `(Interface)` | `(["IName"])` | Formal contract or API boundary | `I2FAAuth`, `IApplicationIntake`, `ITrackingLookup` |
| `Solid Arrow` | `-->` | Direct dependency or invocation | Portal views invoke application and tracking services |
| `Data Component` | Gold Tone `#FFF1C2` | Persistence or storage component | Prisma client and uploaded applicant proofs storage |

---

## 4. Component Responsibilities

- **Online Application Modal (`ApplyFormUI`)**: Guides student through biodata entry, dynamic call requirements, and proof attachments.
- **RA 10173 Identity Lock Filter (`IdentityLocker`)**: Enforces that `studentIdNumber` and `fullName` are read-only once accepted, while allowing GWA and contact updates.
- **2FA Authenticator Module (`TwoFactorModule`)**: Validates Microsoft Authenticator TOTP codes before permitting session access.
- **Tracking Code Service (`TrackerService`)**: Issues cryptographically secure identifiers (`TDP-YYYY-XXXX`) and returns public evaluation progress.
