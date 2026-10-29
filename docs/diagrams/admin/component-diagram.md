# System Admin — Component Diagram

> **Role:** `SYSTEM_ADMIN`  
> **Diagram Type:** Component Diagram  
> **Standard:** UML 2.5 Component Specification

---

## 1. Purpose

The Component Diagram shows the software components, provided interfaces, and required dependencies within the administrative subsystem.

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
        CMSUI["<<component>><br/>Landing Page Editor View"]:::compStyle
    end

    subgraph SECURITY["Security Layer"]
        RBACFilter["<<component>><br/>Admin RBAC Guard"]:::compStyle
        BcryptModule["<<component>><br/>Bcrypt Password Hasher"]:::compStyle
    end

    subgraph BUSINESS["Admin Domain Services"]
        UserService["<<component>><br/>User Account Service"]:::compStyle
        AuditService["<<component>><br/>Audit Logging Service"]:::compStyle
        CMSService["<<component>><br/>CMS Publishing Service"]:::compStyle
    end

    subgraph DATA["Data Access"]
        PrismaClient["<<component>><br/>Prisma ORM Adapter"]:::dataComp
    end

    %% Interfaces
    IAdminAuth(["IAdminAuth"]):::ifaceStyle
    IUserCRUD(["IUserCRUD"]):::ifaceStyle
    IAuditLog(["IAuditLog"]):::ifaceStyle
    ICMSPublish(["ICMSPublish"]):::ifaceStyle
    IPassword(["IPasswordHash"]):::ifaceStyle
    IData(["IDataAccess"]):::ifaceStyle

    %% Connections
    UsersUI --> IAdminAuth
    UsersUI --> IUserCRUD
    AuditUI --> IAuditLog
    CMSUI --> ICMSPublish

    RBACFilter -- provides --> IAdminAuth
    UserService -- provides --> IUserCRUD
    AuditService -- provides --> IAuditLog
    CMSService -- provides --> ICMSPublish
    BcryptModule -- provides --> IPassword

    UserService --> IPassword
    UserService --> IAuditLog
    UserService --> IData
    AuditService --> IData
    CMSService --> IData
    CMSService --> IAuditLog

    PrismaClient -- provides --> IData

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
| `<<component>>` Box | `fill:#FFFFFF, stroke:#1B5E20` | Architectural subsystem or service module | Views, Controllers, Auth Services, Document Engines |
| `([Interface Circle])` | `fill:#DCEFDD, stroke:#123F17` | Provided / Required Interface Contract | `IAuthSession`, `IRBACGuard`, `IDocumentWorkflow`, `IDataAccess` |
| 🟨 Data Component | `fill:#FFF1C2, stroke:#F2B705` | Persistence & Storage adapter component | Prisma ORM Client, Local Storage Volume, Google Drive Client |
| `-->` Solid Arrow | Dependency / Consumer | Module calls or requires the interface | View components requiring workflow and auth interfaces |
| `-- provides -->` | Realization / Provider | Module implements or provides the interface | Service layer realizing database or workflow contracts |
| Boundary Subgraph | `subgraph LAYER` | Architectural tier / layer grouping | Presentation, Security, Domain Logic, and Persistence Layers |


---

## 4. PlantUML Component Diagram

```plantuml
@startuml
skinparam componentStyle uml2
skinparam backgroundColor #FFFFFF
skinparam componentBackgroundColor #F1F8F1
skinparam componentBorderColor #1B5E20
skinparam interfaceBackgroundColor #DCEFDD

package "Admin Views" {
  [Users View] as UsersUI
  [Audit Log View] as AuditUI
  [CMS Editor View] as CMSUI
}

package "Security Module" {
  [Admin RBAC Guard] as RBAC
  [Bcrypt Hasher] as Crypto
  interface "IAdminGuard" as IGuard
  interface "IHasher" as IHash
}

package "Admin Services" {
  [User Account Service] as UserSvc
  [Audit Service] as AuditSvc
  [CMS Service] as CMSSvc
  interface "IUserOps" as IUser
  interface "IAuditOps" as IAudit
  interface "ICMSOps" as ICMS
}

package "Persistence" {
  [Prisma DB Adapter] as Prisma
  interface "IDBAccess" as IDB
}

RBAC - IGuard
Crypto - IHash
UserSvc - IUser
AuditSvc - IAudit
CMSSvc - ICMS
Prisma - IDB

UsersUI ..> IGuard
UsersUI ..> IUser
AuditUI ..> IAudit
CMSUI ..> ICMS

UserSvc ..> IHash
UserSvc ..> IAudit
UserSvc ..> IDB
CMSSvc ..> IDB
AuditSvc ..> IDB

@enduml
```

---

## 5. Component Rules

- The `Admin RBAC Guard` checks that the user role equals `SYSTEM_ADMIN` before routing to business services.
- The `User Account Service` depends on `Bcrypt Hasher` for credential encryption.
- All mutating admin operations invoke `Audit Logging Service`.
