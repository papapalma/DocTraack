# Use Case Diagram: MinSU DocTrack Whole System

## 1. Description
This comprehensive Use Case diagram models the system boundaries, actors, goals, and interactions across the entire MinSU DocTrack application. It captures how internal staff, students, executives, accounting officers, administrators, and external agencies collaborate across the document lifecycle, 3-way verification, certificate design, and announcements.

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
  usecase "Configure 2FA Authenticator" as UC_2FA
  usecase "Maintain Student Profile" as UC_Profile
  usecase "View Campus Announcements" as UC_ViewAnnounce

  ' Staff Coordinator Use Cases
  usecase "Publish Annex 2 Call" as UC_PubCall
  usecase "Validate Student Registrations" as UC_ValReg
  usecase "Execute 3-Way Tripartite Verification" as UC_3Way
  usecase "Resolve Verification Discrepancies" as UC_ResolveDisc
  usecase "Design Award Certificates" as UC_CertDesign
  usecase "Draft Operational Annex (1-5, 10)" as UC_DraftAnnex
  usecase "Publish University Announcement" as UC_PostAnnounce
  usecase "Upload Wet-Signed Scan" as UC_UploadScan
  usecase "Dispatch Transmittal" as UC_Dispatch

  ' Director Use Cases
  usecase "Inspect Executive Review Queue" as UC_ReviewQueue
  usecase "Approve Document (1-Click)" as UC_Approve
  usecase "Return with Comments" as UC_Return
  usecase "Inspect Executive KPI Analytics" as UC_Analytics
  usecase "Review 3-Way Verification Runs" as UC_ReviewVerify

  ' Accounting Use Cases
  usecase "Draft Financial Annex (6-9)" as UC_DraftFin
  usecase "Reconcile Zero Variance" as UC_Reconcile
  usecase "Compile Beneficiary Payroll" as UC_Payroll
  usecase "Export Multi-Tab Excel Workbook" as UC_ExcelExport

  ' Admin Use Cases
  usecase "Provision User Accounts" as UC_Users
  usecase "Configure Public Landing CMS" as UC_CMS
  usecase "Upload Branding & Logos" as UC_Branding
  usecase "Toggle Anti-Brute-Force Rate Limits" as UC_RateLimit
  usecase "Inspect Tamper-Resistant Audit Logs" as UC_AuditLogs

  ' Shared / Included Use Cases
  usecase "Authenticate with Session & 2FA" as UC_Auth
  usecase "Write Immutable Audit Log" as UC_AuditWrite
}

' Student connections
Student --> UC_Browse
Student --> UC_Apply
Student --> UC_Track
Student --> UC_2FA
Student --> UC_Profile
Student --> UC_ViewAnnounce

' Staff connections
Staff --> UC_PubCall
Staff --> UC_ValReg
Staff --> UC_3Way
Staff --> UC_CertDesign
Staff --> UC_DraftAnnex
Staff --> UC_PostAnnounce
Staff --> UC_UploadScan
Staff --> UC_Dispatch

' Director connections
Director --> UC_ReviewQueue
Director --> UC_Approve
Director --> UC_Return
Director --> UC_Analytics
Director --> UC_ReviewVerify

' Accounting connections
Accounting --> UC_DraftFin
Accounting --> UC_Reconcile
Accounting --> UC_Payroll
Accounting --> UC_ExcelExport

' Admin connections
Admin --> UC_Users
Admin --> UC_CMS
Admin --> UC_Branding
Admin --> UC_RateLimit
Admin --> UC_AuditLogs

' Inclusions and extensions
UC_3Way ..> UC_ResolveDisc : <<extend>>
UC_DraftAnnex ..> UC_Auth : <<include>>
UC_DraftFin ..> UC_Auth : <<include>>
UC_Approve ..> UC_AuditWrite : <<include>>
UC_Return ..> UC_AuditWrite : <<include>>
UC_Dispatch ..> Agency : notifies
UC_ExcelExport ..> UC_DraftFin : <<extend>>

@enduml
```

---

## 4. Mermaid System Use Case Diagram

```mermaid
flowchart LR
    %% Styling Classes
    classDef actorStyle fill:#F1F8F1,stroke:#1B5E20,stroke-width:2px,color:#1F2A24;
    classDef ucStyle fill:#FFFFFF,stroke:#1B5E20,stroke-width:1.5px,color:#1F2A24;
    classDef inclStyle fill:#FFF1C2,stroke:#F2B705,stroke-width:1px,stroke-dasharray: 4 4,color:#1F2A24;

    Student(("Student Applicant")):::actorStyle
    Staff(("Staff Coordinator")):::actorStyle
    Director(("Campus Director")):::actorStyle
    Accounting(("Accounting Officer")):::actorStyle
    Admin(("System Administrator")):::actorStyle

    subgraph SYSTEM_BOUNDARY["MinSU DocTrack System Boundary"]
        UC_Apply(["Apply Online & Track Code"]):::ucStyle
        UC_2FA(["Setup 2FA Authenticator"]):::ucStyle
        UC_ValReg(["Validate Student Registrations"]):::ucStyle
        UC_3Way(["Execute 3-Way Tripartite Match"]):::ucStyle
        UC_Cert(["Design Award Certificate Template"]):::ucStyle
        UC_DocDraft(["Prepare Annex Documents (1-10)"]):::ucStyle
        UC_Review(["Executive Review & 1-Click Approval"]):::ucStyle
        UC_Analytics(["Inspect KPI Turnaround Analytics"]):::ucStyle
        UC_FinExport(["Export Multi-Tab Excel Workbook"]):::ucStyle
        UC_CMS(["Edit & Publish Landing Page CMS"]):::ucStyle
        UC_RateLimit(["Toggle Anti-Brute-Force Rate Limits"]):::ucStyle
        UC_Audit(["Inspect Tamper-Resistant Audit Logs"]):::ucStyle
        UC_Announce(["Publish Campus Announcements"]):::ucStyle
    end

    Student --- UC_Apply
    Student --- UC_2FA
    Staff --- UC_ValReg
    Staff --- UC_3Way
    Staff --- UC_Cert
    Staff --- UC_DocDraft
    Staff --- UC_Announce
    Director --- UC_Review
    Director --- UC_Analytics
    Accounting --- UC_DocDraft
    Accounting --- UC_FinExport
    Admin --- UC_CMS
    Admin --- UC_RateLimit
    Admin --- UC_Audit
```

---

## 5. Diagram Legend & Symbol Guide

| Visual Symbol | UML Concept | MinSU Domain Meaning |
|---|---|---|
| `Actor` | External Human User | Student, Staff, Campus Director, Accounting Officer, System Admin |
| `Use Case` | Functional Capability | 3-Way Verification, Certificate Design, Registration Validation, Excel Export |
| `<<include>>` | Mandatory Sub-action | Authenticate with session and write immutable audit trail |
| `<<extend>>` | Optional Flow | Resolve discrepancies, export multi-tab Excel workbooks |
