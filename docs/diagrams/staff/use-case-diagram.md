# Staff Coordinator — Use Case Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Use Case Diagram  
> **Standard:** UML 2.5 Use Case Specification

---

## 1. Purpose

The Use Case Diagram shows all primary operational goals of the Staff Coordinator, including document preparation, student validation, 3-way verification, certificate design, call management, announcements, and transmittal logging.

---

## 2. Mermaid Use Case Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ucStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef inclStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:1px,stroke-dasharray: 4 4,color:#1F2A24;

    Staff(("Staff Coordinator")):::actorStyle

    subgraph SYSTEM_BOUNDARY["MinSU DocTrack Staff Operations Boundary"]
        UC_PrepareAnnex(["Prepare Annex Documents (1-5, 10)"]):::ucStyle
        UC_ValidateSchema(["Validate Dynamic Schema"]):::inclStyle
        UC_SubmitReview(["Submit Document for Director Review"]):::ucStyle
        UC_BuildCalls(["Configure Dynamic Applicant Calls"]):::ucStyle
        UC_ValReg(["Validate Student Registrations in Queue"]):::ucStyle
        UC_Verify3Way(["Execute 3-Way Tripartite Verification"]):::ucStyle
        UC_ResolveDisc(["Resolve Verification Discrepancies"]):::inclStyle
        UC_CertDesign(["Design Award Certificate Templates"]):::ucStyle
        UC_Announce(["Create & Pin Campus Announcements"]):::ucStyle
        UC_ExportDocs(["Export Native Multi-Tab Excel & Word Docs"]):::ucStyle
        UC_UploadScan(["Upload Wet-Signed Physical PDF Scan"]):::ucStyle
        UC_RecordTransmittal(["Record External Agency Transmittal"]):::ucStyle
        UC_OutgoingRegistry(["Manage Outgoing Documents Registry"]):::ucStyle
    end

    Staff --- UC_PrepareAnnex
    Staff --- UC_SubmitReview
    Staff --- UC_BuildCalls
    Staff --- UC_ValReg
    Staff --- UC_Verify3Way
    Staff --- UC_CertDesign
    Staff --- UC_Announce
    Staff --- UC_ExportDocs
    Staff --- UC_UploadScan
    Staff --- UC_RecordTransmittal
    Staff --- UC_OutgoingRegistry

    UC_PrepareAnnex -.->|<<include>>| UC_ValidateSchema
    UC_Verify3Way -.->|<<extend>>| UC_ResolveDisc
    UC_RecordTransmittal -.->|<<include>>| UC_OutgoingRegistry

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
| `actor` / `[Actor]` | External Role | Operational user executing tasks | Staff Coordinator |
| `usecase` / `(["(Action)"])` | Use Case Unit | Operational goal or procedure | Validate Registrations, Execute 3-Way Match, Design Certificates, Prepare Annex |
| `-->` Solid Arrow | Actor Association | User initiates action | Staff prepares annexes, uploads CSVs, configures calls |
| `..>` / `-.->` Dashed Arrow | Stereotyped Dependency | Relationship between use cases | `<<include>>` (Mandatory validation) or `<<extend>>` (Discrepancy resolution) |

---

## 4. PlantUML Use Case Diagram

```plantuml
@startuml
skinparam actorStyle awesome
skinparam packageBackgroundColor #F6F8F6
skinparam usecaseBackgroundColor #FFFFFF
skinparam usecaseBorderColor #1B5E20

actor "Staff Coordinator" as Staff

rectangle "Staff Operations Boundary" {
  usecase "Prepare Annex Documents" as UC_Prep
  usecase "Validate Dynamic Schema" as UC_Schema
  usecase "Submit to Director" as UC_Submit
  usecase "Configure Applicant Calls" as UC_Calls
  usecase "Validate Student Registrations" as UC_Val
  usecase "Execute 3-Way Tripartite Match" as UC_3Way
  usecase "Resolve Discrepancies" as UC_Resolve
  usecase "Design Award Certificates" as UC_Cert
  usecase "Publish Announcements" as UC_Announce
  usecase "Export Excel & Word Docs" as UC_Export
  usecase "Upload Signed PDF Scan" as UC_Scan
  usecase "Record Transmittal" as UC_Trans
  usecase "Manage Outgoing Registry" as UC_Registry
}

Staff --> UC_Prep
Staff --> UC_Submit
Staff --> UC_Calls
Staff --> UC_Val
Staff --> UC_3Way
Staff --> UC_Cert
Staff --> UC_Announce
Staff --> UC_Export
Staff --> UC_Scan
Staff --> UC_Trans
Staff --> UC_Registry

UC_Prep ..> UC_Schema : <<include>>
UC_3Way ..> UC_Resolve : <<extend>>
UC_Trans ..> UC_Registry : <<include>>
@enduml
```
