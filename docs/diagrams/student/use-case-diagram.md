# Student Applicant — Use Case Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** Use Case Diagram  
> **Standard:** UML 2.5 Use Case Specification

---

## 1. Purpose

The Use Case Diagram shows all features accessible to Student Applicants in the MinSU DocTrack Student Portal.

---

## 2. Mermaid Use Case Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ucStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef inclStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:1px,stroke-dasharray: 4 4,color:#1F2A24;

    Student(("Student Applicant")):::actorStyle

    subgraph SYSTEM_BOUNDARY["MinSU Student Portal Boundary (/portal)"]
        UC_Register(["Register Student Account"]):::ucStyle
        UC_VerifyEmail(["Verify University Email"]):::inclStyle
        UC_BrowseCalls(["Browse Active TDP Calls"]):::ucStyle
        UC_SubmitApp(["Submit Online Application"]):::ucStyle
        UC_UploadProofs(["Upload Documentary Proofs (COR, Grades)"]):::inclStyle
        UC_TrackStatus(["Track Application via Tracking Code"]):::ucStyle
        UC_DownloadBlank(["Download Blank Official Template"]):::ucStyle
        UC_DownloadReceipt(["Download Application Receipt Slip"]):::ucStyle
    end

    Student --- UC_Register
    Student --- UC_BrowseCalls
    Student --- UC_SubmitApp
    Student --- UC_TrackStatus
    Student --- UC_DownloadBlank
    Student --- UC_DownloadReceipt

    UC_Register -.->|<<include>>| UC_VerifyEmail
    UC_SubmitApp -.->|<<include>>| UC_UploadProofs
    UC_TrackStatus -.->|<<extend>>| UC_DownloadReceipt

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

actor "Student Applicant" as Student

rectangle "MinSU Student Portal Subsystem" {
  usecase "Register Account" as UC_Reg
  usecase "Verify Email" as UC_Email
  usecase "Browse Active Calls" as UC_Browse
  usecase "Submit Application" as UC_Submit
  usecase "Upload Documents" as UC_Upload
  usecase "Track Status by Code" as UC_Track
  usecase "Download Blank Template" as UC_Blank
  usecase "Download Receipt Slip" as UC_Receipt
}

Student --> UC_Reg
Student --> UC_Browse
Student --> UC_Submit
Student --> UC_Track
Student --> UC_Blank
Student --> UC_Receipt

UC_Reg ..> UC_Email : <<include>>
UC_Submit ..> UC_Upload : <<include>>
UC_Track ..> UC_Receipt : <<extend>>

@enduml
```

---

## 5. Use Case Specifications

- **Register Student Account**: Student creates an account using institutional credentials.
- **Browse Active TDP Calls**: Student reviews eligibility rules, stipends, and deadlines for open calls.
- **Submit Online Application**: Student inputs family background and uploads Certificate of Registration (COR) and grade slip.
- **Track Application via Tracking Code**: Student inputs code (for example, `TDP-2026-X9B2`) to inspect evaluation progress.
- **Download Application Receipt Slip**: Student generates an official timestamped receipt of submission.
