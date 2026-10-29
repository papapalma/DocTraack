# Object Diagram: MinSU DocTrack Whole System

## 1. Description
This object diagram captures a runtime instance snapshot of the MinSU DocTrack system during mid-semester operations. It displays concrete instances of authenticated users across all roles, active scholarship calls, student applications, financial ledgers, transmittals, and security audit logs.

## 2. ASD-STE100 Technical Specifications
- Show concrete object instances with explicit identity attributes.
- Include instances from all five system roles in an operational state.
- Trace links between student applications, compiled annexes, and agency transmittals.
- Connect mutating operations directly to immutable audit log instances.

## 3. Object Diagram (Mermaid)

```mermaid
graph TB
    subgraph Users ["Active User Instances"]
        adminUser["admin_1 : User<br/>id = 'usr_adm_01'<br/>name = 'Admin Reyes'<br/>role = 'SYSTEM_ADMIN'"]
        dirUser["dir_1 : User<br/>id = 'usr_dir_02'<br/>name = 'Dr. Manuel Santos'<br/>role = 'CAMPUS_DIRECTOR'"]
        staffUser["staff_1 : User<br/>id = 'usr_stf_03'<br/>name = 'Sarah Dela Cruz'<br/>role = 'STAFF_COORDINATOR'"]
        acctUser["acct_1 : User<br/>id = 'usr_acc_04'<br/>name = 'Elena Ramos'<br/>role = 'ACCOUNTING_OFFICER'"]
        studentUser["student_1 : User<br/>id = 'usr_stu_05'<br/>name = 'Juan Dela Rosa'<br/>role = 'STUDENT'"]
    end

    subgraph AcademicCycle ["Scholarship Cycle & Intake Instances"]
        callObj["call_2026_s1 : ApplicantCall<br/>id = 'call_tdp_2026_1'<br/>academicYear = '2026-2027'<br/>semester = '1ST'<br/>slotQuota = 250<br/>isActive = true"]

        appObj["app_juan : Application<br/>id = 'app_88201'<br/>studentNumber = 'MBC-2024-0192'<br/>fullName = 'Juan Dela Rosa'<br/>trackingCode = 'TDP-2026-0192'<br/>status = 'QUALIFIED'"]
    end

    subgraph Annexes ["Compiled Documents & Ledgers"]
        annex2["doc_annex2 : Document<br/>id = 'doc_anx2_101'<br/>title = 'Annex 2 TDP Masterlist'<br/>annexType = 'ANNEX_2'<br/>status = 'APPROVED'<br/>createdById = 'usr_stf_03'"]

        annex9["doc_annex9 : Document<br/>id = 'doc_anx9_201'<br/>title = 'Annex 9 Beneficiary Payroll'<br/>annexType = 'ANNEX_9'<br/>status = 'SUBMITTED'<br/>createdById = 'usr_acc_04'"]
    end

    subgraph TransmittalAudit ["Dispatches & Audit Records"]
        trnObj["transmittal_ched : Transmittal<br/>id = 'trn_2026_044'<br/>controlNumber = 'TRN-2026-0044'<br/>recipientAgency = 'CHED Region IV-B'<br/>status = 'SENT'"]

        auditObj["audit_rec : AuditLog<br/>id = 'aud_99812'<br/>userId = 'usr_dir_02'<br/>action = 'DOCUMENT_APPROVED'<br/>resourceType = 'DOCUMENT'<br/>resourceId = 'doc_anx2_101'"]
    end

    %% Structural Links
    staffUser -->|publishes| callObj
    callObj -->|contains| appObj
    studentUser -->|submits| appObj
    staffUser -->|compiles| annex2
    annex2 -->|aggregates| appObj
    dirUser -->|endorses| annex2
    dirUser -->|triggers| auditObj
    annex2 -->|attaches to| trnObj
    staffUser -->|dispatches| trnObj
    acctUser -->|prepares| annex9

    %% ─── 📌 VISUAL LEGEND ───
    subgraph Legend ["📌 Diagram Legend"]
        direction TB
        L_Inst["instanceName : ClassName<br/>attribute1 = value<br/>attribute2 = value"]:::legInst
        L_Link["Link: --predicate-->"]:::legLink
        L_Inst --> L_Link
    end
    classDef legInst fill:#F1F8F1,stroke:#1B5E20,color:#1F2A24;
    classDef legLink fill:#FFF1C2,stroke:#B88A00,color:#1F2A24;
```

---

## 4. Diagram Legend & Symbol Guide

| Visual Symbol | Syntax / Format | UML Role | MinSU Instance Context |
|---|---|---|---|
| Instance Node | `instanceName : ClassName` | Concrete runtime instance in memory/DB | `dir_1 : User`, `call_2026_s1 : ApplicantCall`, `doc_annex2 : Document` |
| Attribute Values | `attr = 'value'` | Concrete state of instance properties | `status = 'APPROVED'`, `trackingCode = 'TDP-2026-0192'`, `slotQuota = 250` |
| `-->\|predicate\|` | Directed Association Link | Concrete relationship between runtime objects | `staffUser -->\|compiles\| annex2`, `dirUser -->\|endorses\| annex2` |
| Subgraph Boundary | `subgraph GroupName` | Domain grouping boundary | Active Users, Intake Instances, Compiled Annexes, Transmittal Audits |
| 🟢 Green Container | `#F1F8F1` / `#1B5E20` | Operational Domain Entities | Authenticated staff/director records and approved scholarship documents |
| 🟡 Gold Node | `#FFF1C2` / `#B88A00` | Financial & Security Linkages | Ledger documents and audit log event tracking |

---

## 5. PlantUML Alternative Syntax

```plantuml
@startuml
skinparam objectBackgroundColor #F6F8F6
skinparam objectBorderColor #1B5E20
skinparam objectFontSize 11

object "admin_1 : User" as admin {
  id = "usr_adm_01"
  name = "Admin Reyes"
  role = "SYSTEM_ADMIN"
}

object "dir_1 : User" as director {
  id = "usr_dir_02"
  name = "Dr. Manuel Santos"
  role = "CAMPUS_DIRECTOR"
}

object "staff_1 : User" as staff {
  id = "usr_stf_03"
  name = "Sarah Dela Cruz"
  role = "STAFF_COORDINATOR"
}

object "acct_1 : User" as acct {
  id = "usr_acc_04"
  name = "Elena Ramos"
  role = "ACCOUNTING_OFFICER"
}

object "student_1 : User" as student {
  id = "usr_stu_05"
  name = "Juan Dela Rosa"
  role = "STUDENT"
}

object "call_2026_s1 : ApplicantCall" as call {
  id = "call_tdp_2026_1"
  academicYear = "2026-2027"
  slotQuota = 250
  isActive = true
}

object "app_juan : Application" as app {
  id = "app_88201"
  trackingCode = "TDP-2026-0192"
  status = "QUALIFIED"
}

object "doc_annex2 : Document" as doc2 {
  id = "doc_anx2_101"
  title = "Annex 2 Masterlist"
  status = "APPROVED"
}

object "trn_2026_044 : Transmittal" as trn {
  controlNumber = "TRN-2026-0044"
  recipientAgency = "CHED"
  status = "SENT"
}

staff --> call : publishes
call --> app : includes
student --> app : submits
staff --> doc2 : compiles
doc2 --> app : verifies
director --> doc2 : approves
staff --> trn : dispatches
trn --> doc2 : packages
@enduml
```

---

## 6. Snapshot Integrity Verification
- **User Collaboration**: The staff coordinator compiles student applications into Annex 2, while the campus director approves the record.
- **Relational Integrity**: The transmittal record references the approved document ID.
- **Audit Consistency**: Every executive endorsement creates a linked audit log with the user identifier and resource timestamp.
