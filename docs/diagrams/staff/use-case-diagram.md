# Staff Coordinator — Use Case Diagram

> **Role:** `STAFF`  
> **Diagram Type:** Use Case Diagram  
> **Standard:** UML 2.5 Use Case Specification

---

## 1. Purpose

The Use Case Diagram shows all primary operational goals of the Staff Coordinator, including document preparation, call management, application evaluation, and transmittal logging.

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
        UC_PrepareAnnex(["Prepare Annex Documents (1 to 10)"]):::ucStyle
        UC_ValidateSchema(["Validate Dynamic Schema"]):::inclStyle
        UC_SubmitReview(["Submit Document for Director Review"]):::ucStyle
        UC_BuildCalls(["Configure Dynamic Applicant Calls"]):::ucStyle
        UC_EvaluateApps(["Evaluate Student Applications"]):::ucStyle
        UC_CompileAnnex1(["Compile Accepted Grantees into Annex 1"]):::inclStyle
        UC_UploadScan(["Upload Wet-Signed Physical PDF Scan"]):::ucStyle
        UC_RecordTransmittal(["Record External Agency Transmittal"]):::ucStyle
        UC_OutgoingRegistry(["Manage Outgoing Documents Registry"]):::ucStyle
    end

    Staff --- UC_PrepareAnnex
    Staff --- UC_SubmitReview
    Staff --- UC_BuildCalls
    Staff --- UC_EvaluateApps
    Staff --- UC_UploadScan
    Staff --- UC_RecordTransmittal
    Staff --- UC_OutgoingRegistry

    UC_PrepareAnnex -.->|<<include>>| UC_ValidateSchema
    UC_EvaluateApps -.->|<<extend>>| UC_CompileAnnex1
    UC_RecordTransmittal -.->|<<include>>| UC_OutgoingRegistry

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

actor "Staff Coordinator" as Staff

rectangle "MinSU Staff Operational Subsystem" {
  usecase "Prepare Annexes (1-10)" as UC_Prep
  usecase "Validate Form Schema" as UC_Valid
  usecase "Submit for Director Review" as UC_Sub
  usecase "Configure Applicant Calls" as UC_Calls
  usecase "Evaluate Student Applications" as UC_Eval
  usecase "Compile Annex 1 Roster" as UC_Comp
  usecase "Upload Signed Scan" as UC_Upload
  usecase "Record Transmittal" as UC_Trans
  usecase "View Outgoing Registry" as UC_Reg
}

Staff --> UC_Prep
Staff --> UC_Sub
Staff --> UC_Calls
Staff --> UC_Eval
Staff --> UC_Upload
Staff --> UC_Trans
Staff --> UC_Reg

UC_Prep ..> UC_Valid : <<include>>
UC_Eval ..> UC_Comp : <<extend>>
UC_Trans ..> UC_Reg : <<include>>

@enduml
```

---

## 5. Use Case Specifications

- **Prepare Annex Documents**: Staff enters student names, scholarship grants, and academic terms into form builders.
- **Configure Applicant Calls**: Staff defines eligibility guidelines, deadlines, and dynamic form fields for online applicants.
- **Evaluate Student Applications**: Staff verifies student uploaded CORs, grades, and indigency certificates.
- **Upload Wet-Signed Physical PDF Scan**: Staff uploads the approved, wet-ink signed, and university-stamped hardcopy.
- **Record External Agency Transmittal**: Staff logs delivery date, recipient (CHED/UniFAST), courier details, and Google Drive links.
