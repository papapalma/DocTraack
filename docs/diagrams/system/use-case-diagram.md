# Use Case Diagram: MinSU DocTrack Whole System

## 1. Description
This comprehensive Use Case diagram models the system boundaries, actors, goals, and interactions across the entire MinSU DocTrack application. It captures how internal staff, students, executives, accounting officers, administrators, and external agencies collaborate across the document lifecycle.

## 2. ASD-STE100 Technical Specifications
- Position actors outside the system boundary rectangle.
- Name each use case with a verb and a noun.
- Connect use cases with `<<include>>` and `<<extend>>` relationship stereotypes.
- Avoid direct associations between two actor instances.

---

## 3. System Use Case Diagram (PlantUML)

```plantuml
@startuml
skinparam actorStyle awesome
skinparam packageBackgroundColor #F6F8F6
skinparam usecaseBackgroundColor #FFFFFF
skinparam usecaseBorderColor #1B5E20
skinparam arrowColor #123F17

left to right direction

actor "Student Applicant" as Student
actor "Staff Coordinator" as Staff
actor "Campus Director" as Director
actor "Accounting Officer" as Accounting
actor "System Administrator" as Admin
actor "CHED / UniFAST" as Agency

rectangle "MinSU DocTrack System Boundary" {

  ' Student Use Cases
  usecase "Browse Published Calls" as UC_Browse
  usecase "Submit Scholarship Application" as UC_Apply
  usecase "Track Application Status" as UC_Track
  usecase "Download Receipt Slip" as UC_Receipt

  ' Staff Coordinator Use Cases
  usecase "Publish Annex 2 Call" as UC_PubCall
  usecase "Evaluate Student Applications" as UC_EvalApp
  usecase "Draft Operational Annex (1-5, 10)" as UC_DraftAnnex
  usecase "Upload Wet-Signed Scan" as UC_UploadScan
  usecase "Dispatch Transmittal" as UC_Dispatch

  ' Director Use Cases
  usecase "Inspect Executive Review Queue" as UC_ReviewQueue
  usecase "Approve Document (1-Click)" as UC_Approve
  usecase "Return with Comments" as UC_Return

  ' Accounting Use Cases
  usecase "Draft Financial Annex (6-9)" as UC_DraftFin
  usecase "Reconcile Zero Variance" as UC_Reconcile
  usecase "Compile Beneficiary Payroll" as UC_Payroll

  ' Admin Use Cases
  usecase "Provision User Accounts" as UC_Users
  usecase "Configure Public Landing CMS" as UC_CMS
  usecase "Inspect Security Audit Logs" as UC_Audit

  ' Shared / System Core
  usecase "Authenticate & Guard RBAC" as UC_Auth
  usecase "Record Immutable Audit Log" as UC_LogAudit
  usecase "Export Printable PDF" as UC_ExportPDF
}

' Student Links
Student --> UC_Browse
Student --> UC_Apply
Student --> UC_Track
UC_Apply ..> UC_Receipt : <<include>>
UC_Apply ..> UC_LogAudit : <<include>>

' Staff Links
Staff --> UC_PubCall
Staff --> UC_EvalApp
Staff --> UC_DraftAnnex
Staff --> UC_UploadScan
Staff --> UC_Dispatch
UC_DraftAnnex ..> UC_Auth : <<include>>
UC_Dispatch ..> UC_LogAudit : <<include>>
UC_Dispatch --> Agency

' Director Links
Director --> UC_ReviewQueue
Director --> UC_Approve
Director --> UC_Return
UC_Approve ..> UC_LogAudit : <<include>>
UC_Return ..> UC_LogAudit : <<include>>
UC_ReviewQueue ..> UC_Auth : <<include>>

' Accounting Links
Accounting --> UC_DraftFin
Accounting --> UC_Payroll
UC_DraftFin ..> UC_Reconcile : <<include>>
UC_DraftFin ..> UC_Auth : <<include>>
UC_Payroll ..> UC_ExportPDF : <<extend>>

' Admin Links
Admin --> UC_Users
Admin --> UC_CMS
Admin --> UC_Audit
UC_Users ..> UC_LogAudit : <<include>>
UC_CMS ..> UC_LogAudit : <<include>>

@enduml
```

---

## 4. Use Case Overview (Mermaid)

```mermaid
graph LR
    subgraph Actors ["System Actors"]
        Student["Student Applicant"]
        Staff["Staff Coordinator"]
        Director["Campus Director"]
        Acct["Accounting Officer"]
        Admin["System Administrator"]
        Agency["CHED / UniFAST"]
    end

    subgraph PortalCore ["Public Portal & Intake"]
        UC1["Browse Active Calls"]
        UC2["Submit Application & Proofs"]
        UC3["Inquire Tracking Code"]
    end

    subgraph DocumentEngine ["Document & Operations Engine"]
        UC4["Draft Operational Annex (1-5, 10)"]
        UC5["Executive Queue & 1-Click Endorsement"]
        UC6["Reconcile Financials & Payroll (6-9)"]
        UC7["Upload Signed Scan & Dispatch"]
    end

    subgraph SecurityGovernance ["Governance & Security"]
        UC8["Manage User Roles & CMS"]
        UC9["Immutable Audit Logging"]
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3

    Staff --> UC4
    Staff --> UC7
    UC7 --> Agency

    Director --> UC5
    Acct --> UC6

    Admin --> UC8

    UC2 -.->|include| UC9
    UC4 -.->|include| UC9
    UC5 -.->|include| UC9
    UC6 -.->|include| UC9
    UC7 -.->|include| UC9
    UC8 -.->|include| UC9

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

## 5. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Use Case Concept | MinSU System Implementation |
|---|---|---|---|
| `actor` / `[Actor]` | External Role | User or external system triggering use cases | Student, Staff Coordinator, Campus Director, Accounting, Admin, CHED Agency |
| `usecase` / `(["(Action)"])` | Use Case Unit | Distinct capability or user goal | `Browse Calls`, `Submit Application`, `1-Click Endorsement`, `Reconcile Financials` |
| `-->` Solid Arrow | Actor Association | User initiates or receives data from the use case | `Student --> UC_Apply`, `Director --> UC_Approve`, `Staff --> UC_Dispatch` |
| `..>` / `-.->` Dashed Arrow | Stereotyped Dependency | Relationship between two use cases | `<<include>>` (Mandatory invocation) or `<<extend>>` (Optional augmentation) |
| `<<include>>` | Mandatory Inclusion | Always executed as part of base use case | Every mutation includes `Record Immutable Audit Log` & `Authenticate` |
| `<<extend>>` | Optional Extension | Conditionally extends base use case | Payroll compilation optionally triggers `Export Printable PDF` |

---

## 6. Use Case Descriptions
- **Submit Scholarship Application**: Allows students to provide demographic information and upload PDF/image proofs within active deadlines.
- **Draft Operational Annex**: Allows staff coordinators to aggregate student records into CHED-compliant masterlists.
- **Executive Queue & 1-Click Endorsement**: Gives campus directors an accelerated approval workflow with electronic verification.
- **Reconcile Financials & Payroll**: Enforces zero variance between disbursements and CHED fund allocations for accounting officers.
- **Dispatch Transmittal**: Packages approved annexes, attaches courier tracking metadata, and delivers records to external oversight agencies.
