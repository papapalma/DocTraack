# Component Diagram

> **System:** MinSU DocTrack  
> **Diagram Type:** Component Diagram  
> **Standard:** UML 2.5 Component Specification

---

## 1. Purpose

The Component Diagram shows the software subsystems, modules, and interfaces within MinSU DocTrack. It shows how modules depend on interfaces to process requests.

---

## 2. Mermaid Component Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ifaceStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;
    classDef dataComp fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    subgraph CLIENT_COMPONENTS["Frontend Presentation Layer"]
        DashboardUI["<<component>><br/>Admin & Review Dashboard"]:::compStyle
        StudentPortalUI["<<component>><br/>Student Application Portal"]:::compStyle
        EditorUI["<<component>><br/>CMS & Certificate Editor"]:::compStyle
    end

    subgraph SECURITY_LAYER["Security & Access Layer"]
        AuthService["<<component>><br/>Auth & 2FA Service"]:::compStyle
        RBACMiddleware["<<component>><br/>RBAC & Rate Limit Shield"]:::compStyle
    end

    subgraph BUSINESS_LAYER["Core Business Services"]
        DocumentService["<<component>><br/>Document Management Service"]:::compStyle
        VerifyService["<<component>><br/>3-Way Verification Engine"]:::compStyle
        CertService["<<component>><br/>Certificate Designer Service"]:::compStyle
        CallService["<<component>><br/>Applicant Call Service"]:::compStyle
        ExportService["<<component>><br/>ExcelJS & Docx Exporter"]:::compStyle
        AnnouncementService["<<component>><br/>Announcements Hub Service"]:::compStyle
        TransmittalService["<<component>><br/>Transmittal Registry Service"]:::compStyle
        AuditService["<<component>><br/>Audit Log Service"]:::compStyle
    end

    subgraph DATA_LAYER["Persistence Layer"]
        PrismaService["<<component>><br/>Prisma ORM Access Client"]:::dataComp
        FileSystemService["<<component>><br/>Local Disk Storage Service"]:::dataComp
    end

    %% Interfaces
    IAuth(["IAuthSession & TOTP"]):::ifaceStyle
    IRBAC(["IRBACGuard"]):::ifaceStyle
    IDoc(["IDocumentWorkflow"]):::ifaceStyle
    IVerify(["IVerificationEngine"]):::ifaceStyle
    ICert(["ICertificateDesigner"]):::ifaceStyle
    IExport(["IDocumentExporter"]):::ifaceStyle
    IAnnounce(["IAnnouncementHub"]):::ifaceStyle
    IAudit(["IAuditLogger"]):::ifaceStyle
    IData(["IDataAccess"]):::ifaceStyle

    %% Connections
    DashboardUI --> IRBAC
    EditorUI --> IRBAC
    StudentPortalUI --> IAuth

    IRBAC --> DocumentService
    IRBAC --> VerifyService
    IRBAC --> CertService
    IRBAC --> AnnouncementService

    DocumentService --> IDoc
    VerifyService --> IVerify
    CertService --> ICert
    ExportService --> IExport
    AnnouncementService --> IAnnounce

    DocumentService --> IExport
    VerifyService --> IExport
    DocumentService --> IAudit
    VerifyService --> IAudit
    CertService --> IAudit

    DocumentService --> IData
    VerifyService --> IData
    AuthService --> IData
    AnnouncementService --> IData
    PrismaService -.-> IData

    DocumentService --> FileSystemService
    EditorUI --> FileSystemService

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Comp["[Component]: Subsystem Unit"]:::compStyle
        L_Iface(["(Interface): Service Contract"]):::ifaceStyle
        L_DataComp["[Data Component]: Storage Driver"]:::dataComp
        L_Comp --> L_Iface
        L_DataComp -.-> L_Iface
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Component Concept | MinSU Application |
|---|---|---|---|
| `Component` | `["<<component>> Name"]` | Software module | Verification Engine, Document Service, Auth Service, Exporter |
| `Interface` | `(["IName"])` | Service API contract | `IVerificationEngine`, `IDocumentWorkflow`, `IAuthSession` |
| `Dependency` | `-->` / `-.->` | Module dependency | Dashboard relies on RBAC; Document Engine invokes Audit Logger |

---

## 4. PlantUML Component Diagram

```plantuml
@startuml
skinparam componentStyle uml2
skinparam componentBackgroundColor #FFFFFF
skinparam componentBorderColor #1B5E20

package "Presentation Layer" {
  [Dashboard UI] as Dashboard
  [Student Portal UI] as Portal
  [Visual Designers] as Designers
}

package "Security Layer" {
  [Auth & 2FA Service] as Auth
  [RBAC & Rate Limit Shield] as RBAC
}

package "Business Services" {
  [Document Service] as Docs
  [3-Way Verification Engine] as Verify
  [Certificate Designer Service] as Certs
  [ExcelJS & Docx Exporter] as Exporter
  [Announcements Hub] as Announce
  [Audit Log Service] as Audit
}

database "Prisma Data Layer" as Prisma
folder "Secure File Storage" as Storage

Dashboard --> RBAC
Portal --> Auth
Designers --> RBAC

RBAC --> Docs
RBAC --> Verify
RBAC --> Certs
RBAC --> Announce

Docs --> Exporter
Verify --> Exporter
Docs --> Audit
Verify --> Audit
Certs --> Audit

Docs --> Prisma
Verify --> Prisma
Auth --> Prisma
Announce --> Prisma
Docs --> Storage
@enduml
```
