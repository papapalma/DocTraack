# Campus Director — Use Case Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Use Case Diagram  
> **Standard:** UML 2.5 Use Case Specification

---

## 1. Purpose

The Use Case Diagram shows what the Campus Director does in MinSU DocTrack. It defines executive document endorsement, return actions, and analytics monitoring.

---

## 2. Mermaid Use Case Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ucStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef inclStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:1px,stroke-dasharray: 4 4,color:#1F2A24;

    Director(("Campus Director")):::actorStyle

    subgraph SYSTEM_BOUNDARY["Executive Review & Analytics Boundary"]
        UC_ReviewQueue(["Access Executive Review Queue"]):::ucStyle
        UC_InspectDoc(["Inspect Annex Details & Tables"]):::ucStyle
        UC_PreviewPdf(["Preview Compiled PDF Template"]):::inclStyle
        UC_Approve(["Approve Document (1-Click)"]):::ucStyle
        UC_Return(["Return Document with Comments"]):::ucStyle
        UC_NotifyPreparer(["Send In-App Notification"]):::inclStyle
        UC_Analytics(["Inspect Turnaround Velocity KPIs"]):::ucStyle
        UC_ExportReport(["Export Status Summary CSV"]):::inclStyle
    end

    Director --- UC_ReviewQueue
    Director --- UC_InspectDoc
    Director --- UC_Approve
    Director --- UC_Return
    Director --- UC_Analytics

    UC_InspectDoc -.->|<<include>>| UC_PreviewPdf
    UC_Approve -.->|<<include>>| UC_NotifyPreparer
    UC_Return -.->|<<include>>| UC_NotifyPreparer
    UC_Analytics -.->|<<extend>>| UC_ExportReport

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Actor["[Actor]: User Role"]:::legActor
        L_UC(["(Use Case Action)"]):::legUC
        L_Actor --> L_UC
        L_UC -.->|<<include>>| L_Audit(["(Audit Logging)"]):::legUC
    end
    classDef legActor fill:#F6F8F6,stroke:#1B5E20,color:#1F2A24;
    classDef legUC fill:#FFFFFF,stroke:#1B5E20,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Use Case Concept | MinSU System Implementation |
|---|---|---|---|
| `actor` / `[Actor]` | External Role | User or external system triggering use cases | Student, Staff Coordinator, Campus Director, Accounting, Admin, CHED Agency |
| `usecase` / `(["(Action)"])` | Use Case Unit | Distinct capability or user goal | Browse Calls, Submit Application, 1-Click Endorsement, Reconcile Financials |
| `-->` Solid Arrow | Actor Association | User initiates or receives data from the use case | Student initiates application, Director approves, Staff dispatches |
| `..>` / `-.->` Dashed Arrow | Stereotyped Dependency | Relationship between two use cases | `<<include>>` (Mandatory invocation) or `<<extend>>` (Optional augmentation) |
| `<<include>>` | Mandatory Inclusion | Always executed as part of base use case | Every mutation includes `Record Immutable Audit Log` & `Authenticate` |
| `<<extend>>` | Optional Extension | Conditionally extends base use case | Payroll compilation optionally triggers `Export Printable PDF` |


---

## 4. PlantUML Use Case Diagram

```plantuml
@startuml
skinparam actorStyle awesome
skinparam packageBackgroundColor #F6F8F6
skinparam usecaseBackgroundColor #FFFFFF
skinparam usecaseBorderColor #1B5E20

actor "Campus Director" as Director

rectangle "MinSU Executive Review Subsystem" {
  usecase "Access Review Queue" as UC_Queue
  usecase "Inspect Annex Details" as UC_Inspect
  usecase "Preview PDF Template" as UC_PDF
  usecase "Approve Document" as UC_Approve
  usecase "Return with Comments" as UC_Return
  usecase "Notify Preparer" as UC_Notify
  usecase "View Velocity Analytics" as UC_KPI
  usecase "Export CSV Report" as UC_Export
}

Director --> UC_Queue
Director --> UC_Inspect
Director --> UC_Approve
Director --> UC_Return
Director --> UC_KPI

UC_Inspect ..> UC_PDF : <<include>>
UC_Approve ..> UC_Notify : <<include>>
UC_Return ..> UC_Notify : <<include>>
UC_KPI ..> UC_Export : <<extend>>

@enduml
```

---

## 5. Use Case Specifications

- **Access Executive Review Queue**: Director views all documents currently in `SUBMITTED` or `RESUBMITTED` status.
- **Inspect Annex Details**: Director examines structured student rosters, financial totals, or billing line items.
- **Approve Document**: Director grants executive endorsement, locking the record and transitioning it to `APPROVED`.
- **Return Document with Comments**: Director returns defective documents with feedback notes, notifying the preparer.
- **View Velocity Analytics**: Director monitors turnaround time metrics and status distribution charts.
