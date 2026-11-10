# Student Applicant — Use Case Diagram

> **Role:** `STUDENT`  
> **Diagram Type:** Use Case Diagram  
> **Standard:** UML 2.5 Use Case Specification

---

## 1. Purpose

The Use Case Diagram shows all features accessible to Student Applicants in the MinSU DocTrack Student Portal, including 2FA setup, application submission, profile maintenance, and announcements tracking.

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
        UC_2FA(["Setup Microsoft Authenticator 2FA"]):::ucStyle
        UC_BrowseCalls(["Browse Active TDP Calls"]):::ucStyle
        UC_SubmitApp(["Submit Online Application"]):::ucStyle
        UC_UploadProofs(["Upload Proofs (COR, Indigency, Grades)"]):::inclStyle
        UC_TrackStatus(["Track Application via Tracking Code"]):::ucStyle
        UC_Profile(["Maintain Profile (GWA, Contacts)"]):::ucStyle
        UC_Announce(["View Campus Announcements Feed"]):::ucStyle
        UC_DownloadBlank(["Download Blank Official Template"]):::ucStyle
        UC_DownloadReceipt(["Download Application Receipt Slip"]):::ucStyle
    end

    Student --- UC_Register
    Student --- UC_2FA
    Student --- UC_BrowseCalls
    Student --- UC_SubmitApp
    Student --- UC_TrackStatus
    Student --- UC_Profile
    Student --- UC_Announce
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
        L_UC -.->|<<include>>| L_Audit(["(Sub-Action)"]):::legUC
    end
    classDef legActor fill:#F6F8F6,stroke:#1B5E20,color:#1F2A24;
    classDef legUC fill:#FFFFFF,stroke:#1B5E20,color:#1F2A24;
```

---

## 3. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Style | UML Use Case Concept | MinSU System Implementation |
|---|---|---|---|
| `actor` / `[Actor]` | External Role | Prospective or enrolled student grantee | Student Applicant |
| `usecase` / `(["(Action)"])` | Use Case Unit | Applicant capability or service | Register, Setup 2FA, Apply Online, Track Code, Update Profile |
| `-->` Solid Arrow | Actor Association | User initiates portal action | Student submits intake form, tracks status, updates phone/GWA |
| `..>` / `-.->` Dashed Arrow | Stereotyped Dependency | Relationship between use cases | `<<include>>` (Mandatory proof upload) or `<<extend>>` (Receipt slip download) |

---

## 4. PlantUML Use Case Diagram

```plantuml
@startuml
skinparam actorStyle awesome
skinparam packageBackgroundColor #F6F8F6
skinparam usecaseBackgroundColor #FFFFFF
skinparam usecaseBorderColor #1B5E20

actor "Student Applicant" as Student

rectangle "Student Portal Boundary (/portal)" {
  usecase "Register Student Account" as UC_Reg
  usecase "Verify Email" as UC_Email
  usecase "Setup Microsoft 2FA" as UC_2FA
  usecase "Browse Active Calls" as UC_Browse
  usecase "Submit Application" as UC_Apply
  usecase "Upload Documentary Proofs" as UC_Proofs
  usecase "Track Application Code" as UC_Track
  usecase "Maintain Profile (GWA, Contacts)" as UC_Profile
  usecase "View Announcements" as UC_Announce
  usecase "Download Blank Template" as UC_Blank
  usecase "Download Receipt Slip" as UC_Receipt
}

Student --> UC_Reg
Student --> UC_2FA
Student --> UC_Browse
Student --> UC_Apply
Student --> UC_Track
Student --> UC_Profile
Student --> UC_Announce
Student --> UC_Blank
Student --> UC_Receipt

UC_Reg ..> UC_Email : <<include>>
UC_Apply ..> UC_Proofs : <<include>>
UC_Track ..> UC_Receipt : <<extend>>
@enduml
```
