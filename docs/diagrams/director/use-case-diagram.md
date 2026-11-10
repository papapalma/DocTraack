# Campus Director — Use Case Diagram

> **Role:** `DIRECTOR`  
> **Diagram Type:** Use Case Diagram  
> **Standard:** UML 2.5 Use Case Specification

---

## 1. Purpose

The Use Case Diagram shows what the Campus Director does in MinSU DocTrack. It defines executive document endorsement, return actions, analytics monitoring, 3-way verification oversight, and campus announcements.

---

## 2. Mermaid Use Case Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ucStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef inclStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:1px,stroke-dasharray: 4 4,color:#1F2A24;

    Director(("Campus Director")):::actorStyle

    subgraph SYSTEM_BOUNDARY["Executive Review, Verification & Analytics Boundary"]
        UC_ReviewQueue(["Access Executive Review Queue"]):::ucStyle
        UC_InspectDoc(["Inspect Annex Details & Tables"]):::ucStyle
        UC_PreviewPdf(["Preview Canvas & ExcelJS Workbooks"]):::inclStyle
        UC_Approve(["Approve Document (1-Click)"]):::ucStyle
        UC_Return(["Return Document with Comments"]):::ucStyle
        UC_NotifyPreparer(["Send In-App Notification"]):::inclStyle
        UC_Analytics(["Inspect Turnaround Velocity KPIs"]):::ucStyle
        UC_ExportReport(["Export Status Summary CSV"]):::inclStyle
        UC_OversightVerify(["Inspect 3-Way Verification Runs"]):::ucStyle
        UC_RosterInspect(["Inspect Student Masterlist Roster"]):::ucStyle
        UC_CertReview(["Review Award Certificate Signatories"]):::ucStyle
        UC_Announce(["Publish Campus Announcements"]):::ucStyle
    end

    Director --- UC_ReviewQueue
    Director --- UC_InspectDoc
    Director --- UC_Approve
    Director --- UC_Return
    Director --- UC_Analytics
    Director --- UC_OversightVerify
    Director --- UC_RosterInspect
    Director --- UC_CertReview
    Director --- UC_Announce

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
        L_UC -.->|<<include>>| L_Audit(["(Sub-Action)"]):::legUC
    end
    classDef legActor fill:#F6F8F6,stroke:#1B5E20,color:#1F2A24;
    classDef legUC fill:#FFFFFF,stroke:#1B5E20,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Use Case Concept | MinSU System Implementation |
|---|---|---|---|
| `actor` / `[Actor]` | External Role | Executive signing authority | Campus Director |
| `usecase` / `(["(Action)"])` | Use Case Unit | Executive goal or inspection capability | 1-Click Approve, Return with Notes, Inspect Verification, KPI Analytics |
| `-->` Solid Arrow | Actor Association | User initiates action | Director approves document, reviews runs, publishes announcements |
| `..>` / `-.->` Dashed Arrow | Stereotyped Dependency | Relationship between use cases | `<<include>>` (Mandatory preview or alert) or `<<extend>>` (Optional CSV export) |

---

## 4. PlantUML Use Case Diagram

```plantuml
@startuml
skinparam actorStyle awesome
skinparam packageBackgroundColor #F6F8F6
skinparam usecaseBackgroundColor #FFFFFF
skinparam usecaseBorderColor #1B5E20

actor "Campus Director" as Director

rectangle "Executive Review & Analytics Portal" {
  usecase "Access Review Queue" as UC_Queue
  usecase "Inspect Annex Details" as UC_Inspect
  usecase "Preview Canvas & Excel" as UC_Preview
  usecase "1-Click Approve" as UC_Approve
  usecase "Return with Comments" as UC_Return
  usecase "Send Notifications" as UC_Notify
  usecase "Inspect KPI Analytics" as UC_KPI
  usecase "Export Summary CSV" as UC_CSV
  usecase "Inspect Verification Runs" as UC_Verify
  usecase "Inspect Student Masterlist" as UC_Roster
  usecase "Review Certificate Templates" as UC_Cert
  usecase "Publish Announcements" as UC_Announce
}

Director --> UC_Queue
Director --> UC_Inspect
Director --> UC_Approve
Director --> UC_Return
Director --> UC_KPI
Director --> UC_Verify
Director --> UC_Roster
Director --> UC_Cert
Director --> UC_Announce

UC_Inspect ..> UC_Preview : <<include>>
UC_Approve ..> UC_Notify : <<include>>
UC_Return ..> UC_Notify : <<include>>
UC_KPI ..> UC_CSV : <<extend>>
@enduml
```
