# Campus Director — Component Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Component Diagram  
> **Standard:** UML 2.5 Component Specification

---

## 1. Purpose

The Component Diagram shows the software modules, provided interfaces, and required dependencies within the executive review subsystem.

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
        AnalyticsUI["<<component>><br/>Executive Analytics Dashboard"]:::compStyle
    end

    subgraph SECURITY["Security Layer"]
        SignatoryGuard["<<component>><br/>Signatory RBAC Guard"]:::compStyle
    end

    subgraph SERVICES["Executive Review Services"]
        QueueService["<<component>><br/>Review Queue Service"]:::compStyle
        EndorsementService["<<component>><br/>Document Endorsement Engine"]:::compStyle
        RevisionService["<<component>><br/>Revision Comment Service"]:::compStyle
        AnalyticsService["<<component>><br/>Velocity Analytics Aggregator"]:::compStyle
    end

    subgraph DATA["Data Access"]
        PrismaClient["<<component>><br/>Prisma ORM Adapter"]:::dataComp
    end

    %% Interfaces
    ISignatory(["ISignatoryGuard"]):::ifaceStyle
    IQueue(["IReviewQueue"]):::ifaceStyle
    IEndorse(["IEndorsement"]):::ifaceStyle
    IAnalytics(["IVelocityAnalytics"]):::ifaceStyle
    IData(["IDataAccess"]):::ifaceStyle

    %% Connections
    ReviewUI --> ISignatory
    ReviewUI --> IQueue
    ReviewUI --> IEndorse
    AnalyticsUI --> IAnalytics

    SignatoryGuard -- provides --> ISignatory
    QueueService -- provides --> IQueue
    EndorsementService -- provides --> IEndorse
    AnalyticsService -- provides --> IAnalytics

    QueueService --> IData
    EndorsementService --> IData
    RevisionService --> IData
    AnalyticsService --> IData

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

package "Executive Presentation" {
  [Review Queue Page] as QueueUI
  [Analytics Page] as AnalyticsUI
}

package "Executive Guards" {
  [Signatory Guard] as Guard
  interface "ISignatory" as ISig
}

package "Review Services" {
  [Queue Service] as QueueSvc
  [Endorsement Engine] as EndorseEngine
  [Analytics Aggregator] as AnalyticsSvc
  interface "IQueue" as IQ
  interface "IEndorse" as IEnd
  interface "IAnalytics" as IAna
}

package "Database" {
  [Prisma Adapter] as Prisma
  interface "IDB" as IDB
}

Guard - ISig
QueueSvc - IQ
EndorseEngine - IEnd
AnalyticsSvc - IAna
Prisma - IDB

QueueUI ..> ISig
QueueUI ..> IQ
QueueUI ..> IEnd
AnalyticsUI ..> IAna

QueueSvc ..> IDB
EndorseEngine ..> IDB
AnalyticsSvc ..> IDB

@enduml
```

---

## 5. Component Rules

- The `Signatory RBAC Guard` enforces executive permissions before processing approval or return actions.
- The `Velocity Analytics Aggregator` parses historical timestamps without performing mutating operations.
- The `Document Endorsement Engine` updates status and emits notifications within an atomic transaction.
