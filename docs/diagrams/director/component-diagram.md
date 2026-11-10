# Campus Director — Component Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Component Diagram  
> **Standard:** UML 2.5 Component Specification

---

## 1. Purpose

The Component Diagram shows the software modules, provided interfaces, and required dependencies within the executive review, verification oversight, and analytics subsystem.

---

## 2. Mermaid Component Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ifaceStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;
    classDef dataComp fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    subgraph PRESENTATION["Presentation Layer"]
        ReviewUI["<<component>><br/>Executive Review Queue View"]:::compStyle
        AnalyticsUI["<<component>><br/>Executive KPI Analytics View"]:::compStyle
        VerifyOversightUI["<<component>><br/>Verification Oversight View"]:::compStyle
        CertEndorseUI["<<component>><br/>Certificate Endorsement View"]:::compStyle
        AnnounceUI["<<component>><br/>Campus Announcement View"]:::compStyle
    end

    subgraph SECURITY["Security Layer"]
        DirectorGuard["<<component>><br/>Director Signatory RBAC Guard"]:::compStyle
    end

    subgraph SERVICES["Executive Review Services"]
        QueueService["<<component>><br/>Review Queue Service"]:::compStyle
        EndorsementService["<<component>><br/>Document Endorsement Engine"]:::compStyle
        RevisionService["<<component>><br/>Revision Feedback Service"]:::compStyle
        VerifyOversightService["<<component>><br/>Verification Oversight Service"]:::compStyle
        AnalyticsService["<<component>><br/>Velocity & SLA Analytics Engine"]:::compStyle
        AnnounceService["<<component>><br/>Announcement Service"]:::compStyle
    end

    subgraph DATA["Data Access"]
        PrismaClient["<<component>><br/>Prisma ORM Client"]:::dataComp
    end

    %% Interfaces
    IDirector(["IDirectorGuard"]):::ifaceStyle
    IQueue(["IReviewQueue"]):::ifaceStyle
    IEndorse(["IEndorsement"]):::ifaceStyle
    IVerifyOversight(["IVerificationOversight"]):::ifaceStyle
    IAnalytics(["IVelocityAnalytics"]):::ifaceStyle
    IAnnounce(["IAnnouncementHub"]):::ifaceStyle
    IData(["IDataAccess"]):::ifaceStyle

    %% Presentation to Security
    ReviewUI --> IDirector
    AnalyticsUI --> IDirector
    VerifyOversightUI --> IDirector
    CertEndorseUI --> IDirector

    IDirector --> DirectorGuard
    DirectorGuard --> QueueService
    DirectorGuard --> EndorsementService
    DirectorGuard --> VerifyOversightService
    DirectorGuard --> AnalyticsService

    %% Services to Interfaces
    QueueService --> IQueue
    EndorsementService --> IEndorse
    VerifyOversightService --> IVerifyOversight
    AnalyticsService --> IAnalytics
    AnnounceService --> IAnnounce

    %% Services to Data Access
    QueueService --> IData
    EndorsementService --> IData
    RevisionService --> IData
    VerifyOversightService --> IData
    AnalyticsService --> IData
    AnnounceService --> IData

    IData --> PrismaClient

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
| `[Component]` | `["<<component>>\nName"]` | Autonomous modular unit with internal logic | Endorsement Engine, Verification Oversight, Velocity Analytics |
| `(Interface)` | `(["IName"])` | Formal contract or API boundary | `IEndorsement`, `IVerificationOversight`, `IVelocityAnalytics` |
| `Solid Arrow` | `-->` | Direct dependency or communication invocation | Review views invoke endorsement operations via interfaces |
| `Data Component` | Gold Tone `#FFF1C2` | Persistence or storage component | Prisma ORM client adapter |

---

## 4. Component Responsibilities

- **Executive Review Queue View (`ReviewUI`)**: Provides 1-click approval and return modals with dynamic PDF previews.
- **Verification Oversight Service (`VerifyOversightService`)**: Permits executive inspection of tripartite matching results and discrepancy metrics before signing.
- **Document Endorsement Engine (`EndorsementService`)**: Applies cryptographic timestamps and transitions documents to `APPROVED`.
- **Velocity & SLA Analytics Engine (`AnalyticsService`)**: Computes campus approval velocities and 48-hour SLA metrics.
