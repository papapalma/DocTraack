# Staff Coordinator — Component Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Component Diagram  
> **Standard:** UML 2.5 Component Specification

---

## 1. Purpose

The Component Diagram shows the software components, provided interfaces, and required dependencies within the Staff operational subsystem.

---

## 2. Mermaid Component Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef compStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ifaceStyle fill:#DCEFDD,stroke:#123F17,stroke-width:1.5px,color:#123F17;
    classDef dataComp fill:#FFF1C2,stroke:#F2B705,stroke-width:2px,color:#1F2A24;

    subgraph PRESENTATION["Presentation Layer"]
        DocUI["<<component>><br/>Document Preparation Form"]:::compStyle
        CallUI["<<component>><br/>Call Form Builder View"]:::compStyle
        EvalUI["<<component>><br/>Application Review Modal"]:::compStyle
        RegistryUI["<<component>><br/>Outgoing Registry View"]:::compStyle
    end

    subgraph SECURITY["Security Layer"]
        StaffGuard["<<component>><br/>Staff RBAC Guard"]:::compStyle
    end

    subgraph SERVICES["Staff Operations Services"]
        DocService["<<component>><br/>Annex Document Service"]:::compStyle
        CallService["<<component>><br/>Call Management Service"]:::compStyle
        UploadService["<<component>><br/>PDF Scan Ingestion Service"]:::compStyle
        TransmittalService["<<component>><br/>Transmittal Registry Service"]:::compStyle
    end

    subgraph STORAGE["Storage Subsystem"]
        PrismaClient["<<component>><br/>Prisma ORM Client"]:::dataComp
        DiskStorage["<<component>><br/>Local File Storage (/uploads)"]:::dataComp
    end

    %% Interfaces
    IStaff(["IStaffGuard"]):::ifaceStyle
    IDocOps(["IDocOperations"]):::ifaceStyle
    ICallOps(["ICallOperations"]):::ifaceStyle
    IUpload(["IScanUpload"]):::ifaceStyle
    ITransmit(["ITransmittalRegistry"]):::ifaceStyle
    IDB(["IDataAccess"]):::ifaceStyle

    %% Connections
    DocUI --> IStaff
    DocUI --> IDocOps
    CallUI --> ICallOps
    EvalUI --> ICallOps
    DocUI --> IUpload
    RegistryUI --> ITransmit

    StaffGuard -- provides --> IStaff
    DocService -- provides --> IDocOps
    CallService -- provides --> ICallOps
    UploadService -- provides --> IUpload
    TransmittalService -- provides --> ITransmit

    DocService --> IDB
    CallService --> IDB
    TransmittalService --> IDB
    UploadService --> IDB
    UploadService --> DiskStorage

    PrismaClient -- provides --> IDB

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

package "Staff Presentation" {
  [Document Form UI] as DocUI
  [Call Builder UI] as CallUI
  [Application Evaluation UI] as EvalUI
  [Outgoing Registry UI] as RegUI
}

package "Staff Services" {
  [Document Service] as DocSvc
  [Call Service] as CallSvc
  [Upload Service] as UploadSvc
  [Transmittal Service] as TransmitSvc
  
  interface "IDocOps" as IDoc
  interface "ICallOps" as ICall
  interface "IScanUpload" as IUp
  interface "ITransmittal" as ITx
}

package "Storage" {
  [Prisma Adapter] as DB
  [Disk /uploads] as Disk
}

DocSvc - IDoc
CallSvc - ICall
UploadSvc - IUp
TransmitSvc - ITx

DocUI ..> IDoc
CallUI ..> ICall
EvalUI ..> ICall
DocUI ..> IUp
RegUI ..> ITx

DocSvc ..> DB
CallSvc ..> DB
UploadSvc ..> DB
UploadSvc ..> Disk
TransmitSvc ..> DB

@enduml
```

---

## 5. Component Rules

- The `PDF Scan Ingestion Service` handles streaming multipart binary uploads directly to disk.
- The `Annex Document Service` ensures form payloads conform to the Zod schema for that Annex number.
