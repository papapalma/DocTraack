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
    end

    subgraph SECURITY_LAYER["Security & Access Layer"]
        AuthService["<<component>><br/>Auth & Session Service"]:::compStyle
        RBACMiddleware["<<component>><br/>RBAC Middleware"]:::compStyle
    end

    subgraph BUSINESS_LAYER["Core Business Services"]
        DocumentService["<<component>><br/>Document Management Service"]:::compStyle
        CallService["<<component>><br/>Applicant Call Service"]:::compStyle
        TransmittalService["<<component>><br/>Transmittal Registry Service"]:::compStyle
        PdfService["<<component>><br/>PDF Compilation Service"]:::compStyle
        AuditService["<<component>><br/>Audit Log Service"]:::compStyle
        NotificationService["<<component>><br/>Notification Center Service"]:::compStyle
    end

    subgraph DATA_LAYER["Persistence Layer"]
        PrismaService["<<component>><br/>Prisma ORM Access Client"]:::dataComp
        FileSystemService["<<component>><br/>Local Disk Storage Service"]:::dataComp
    end

    %% Interfaces
    IAuth(["IAuthSession"]):::ifaceStyle
    IRBAC(["IRBACGuard"]):::ifaceStyle
    IDoc(["IDocumentWorkflow"]):::ifaceStyle
    ICall(["ICallApplication"]):::ifaceStyle
    IPdf(["IPdfRenderer"]):::ifaceStyle
    IAudit(["IAuditLogger"]):::ifaceStyle
    IData(["IDataAccess"]):::ifaceStyle

    %% Connections
    DashboardUI --> IRBAC
    StudentPortalUI --> IAuth
    StudentPortalUI --> ICall

    RBACMiddleware -- provides --> IRBAC
    RBACMiddleware --> IAuth
    AuthService -- provides --> IAuth

    DashboardUI --> IDoc
    DocumentService -- provides --> IDoc
    DocumentService --> IPdf
    DocumentService --> IAudit
    DocumentService --> IData

    CallService -- provides --> ICall
    CallService --> IData
    CallService --> IAudit

    PdfService -- provides --> IPdf
    PdfService --> FileSystemService

    AuditService -- provides --> IAudit
    AuditService --> IData

    TransmittalService --> IDoc
    TransmittalService --> IData

    PrismaService -- provides --> IData

    %% ─── 📌 VISUAL LEGEND ───
    subgraph LEGEND ["📌 Diagram Legend"]
        direction TB
        L_Comp["<<component>><br/>Software Subsystem"]:::compStyle
        L_Iface(["(Iface): Interface Contract"]):::ifaceStyle
        L_Data["<<component>><br/>Persistence Adapter"]:::dataComp
        L_Comp -- "depends on" --> L_Iface
        L_Data -- "provides" --> L_Iface
    end
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | Technical Role | MinSU Architecture Mapping |
|---|---|---|---|
| `<<component>>` Box | `fill:#FFFFFF, stroke:#1B5E20` | Architectural subsystem or service module | Next.js Views, AuthService, DocumentService, AuditService |
| `([Interface Circle])` | `fill:#DCEFDD, stroke:#123F17` | Provided / Required Interface Contract | `IAuthSession`, `IRBACGuard`, `IDocumentWorkflow`, `IDataAccess` |
| 🟨 Data Component | `fill:#FFF1C2, stroke:#F2B705` | Persistence & Storage adapter component | Prisma ORM Client, Local Disk / Cloud Blob Storage |
| `-->` Solid Arrow | Dependency / Consumer | Module calls or requires the interface | `DashboardUI --> IRBAC`, `CallService --> IData` |
| `-- provides -->` | Realization / Provider | Module implements or provides the interface | `DocumentService -- provides --> IDoc`, `PrismaService -- provides --> IData` |
| Boundary Subgraph | `subgraph LAYER` | Architectural tier / layer grouping | Presentation, Security, Core Business, and Persistence Layers |

---

## 4. PlantUML Component Diagram

```plantuml
@startuml
skinparam componentStyle uml2
skinparam backgroundColor #FFFFFF
skinparam componentBackgroundColor #F1F8F1
skinparam componentBorderColor #1B5E20
skinparam interfaceBackgroundColor #DCEFDD
skinparam interfaceBorderColor #123F17

package "Presentation Subsystem" {
  [Dashboard Client Views] as Dashboard
  [Student Portal Views] as Portal
}

package "Security Subsystem" {
  [Auth & Session Service] as Auth
  [RBAC Enforcement Filter] as RBAC
  interface "ISessionVerify" as ISession
  interface "IRoleCheck" as IRole
}

package "Core Workflow Services" {
  [Document Management Engine] as DocEngine
  [Applicant Call Service] as CallEngine
  [PDF Compilation Engine] as PdfEngine
  [Audit Log Service] as Audit
  
  interface "IDocumentLifecycle" as IDocLifecycle
  interface "ICallFormEngine" as ICallEngine
  interface "IPdfCompile" as IPdf
  interface "IAuditEvent" as IAudit
}

package "Storage Subsystem" {
  [Prisma Database Adapter] as Prisma
  [Local Disk Storage] as Storage
  interface "IDatabaseClient" as IDB
}

Auth - ISession
RBAC - IRole
DocEngine - IDocLifecycle
CallEngine - ICallEngine
PdfEngine - IPdf
Audit - IAudit
Prisma - IDB

Dashboard ..> IRole
Dashboard ..> IDocLifecycle
Portal ..> ISession
Portal ..> ICallEngine

DocEngine ..> IPdf
DocEngine ..> IAudit
DocEngine ..> IDB
CallEngine ..> IAudit
CallEngine ..> IDB
PdfEngine ..> Storage
Audit ..> IDB

@enduml
```

---

## 5. Component Rules & Coupling

- Modules communicate through explicit TypeScript interfaces and function boundaries.
- No circular dependencies exist between business services.
- The `Audit Log Service` records every status modification without coupling to UI components.
- The `PDF Compilation Engine` accepts pure JSON input data and produces standards-compliant PDF streams.
