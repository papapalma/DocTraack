# Object Diagram: MinSU DocTrack Whole System

## 1. Description
This object diagram captures a runtime instance snapshot of the MinSU DocTrack system during mid-semester operations. It displays concrete instances of authenticated users across all roles, active scholarship calls, student applications, 3-way verification runs, campus announcements, financial ledgers, transmittals, and security audit logs.

## 2. ASD-STE100 Technical Specifications
- Show concrete object instances with explicit identity attributes.
- Include instances from all five system roles in an operational state.
- Trace links between student applications, 3-way verification runs, compiled annexes, and agency transmittals.
- Connect mutating operations directly to immutable audit log instances.

---

## 3. Object Diagram (Mermaid)

```mermaid
graph TB
    subgraph Users ["Active User Instances"]
        adminUser["admin_1 : User<br/>id = 'usr_adm_01'<br/>role = 'SYSTEM_ADMIN'<br/>rateLimitEnabled = true"]
        dirUser["dir_1 : User<br/>id = 'usr_dir_02'<br/>name = 'Dr. Manuel Santos'<br/>role = 'CAMPUS_DIRECTOR'"]
        staffUser["staff_1 : User<br/>id = 'usr_stf_03'<br/>name = 'Sarah Dela Cruz'<br/>role = 'STAFF_COORDINATOR'"]
        acctUser["acct_1 : User<br/>id = 'usr_acc_04'<br/>name = 'Elena Ramos'<br/>role = 'ACCOUNTING_OFFICER'"]
        studentUser["student_1 : User<br/>id = 'usr_stu_05'<br/>name = 'Juan Dela Rosa'<br/>role = 'STUDENT'<br/>twoFactorEnabled = true"]
    end

    subgraph AcademicCycle ["Scholarship Cycle & Verification Instances"]
        callObj["call_2026_s1 : ApplicantCall<br/>id = 'call_tdp_2026_1'<br/>batchNumber = 1<br/>isActive = true"]

        appObj["app_juan : Application<br/>id = 'app_88201'<br/>studentId = 'usr_stu_05'<br/>trackingCode = 'TDP-2026-0192'<br/>status = 'ACCEPTED'"]

        verifyRunObj["verify_run_01 : VerificationRun<br/>id = 'vrun_101'<br/>runNumber = 1<br/>chedFileName = 'ched_mimaropa_2026.csv'<br/>fullyVerifiedCount = 148<br/>systemDiscrepancyCount = 2"]

        verifyResultObj["verify_res_juan : VerificationResult<br/>id = 'vres_01'<br/>studentIdNo = 'MBC-2024-0192'<br/>confidenceScore = 0.98<br/>status = 'FULLY_VERIFIED'"]
    end

    subgraph AnnexesCert ["Compiled Documents & Announcements"]
        annex4["doc_annex4 : Document<br/>id = 'doc_anx4_101'<br/>title = 'Annex 4 New Billing Statement'<br/>status = 'APPROVED'<br/>createdById = 'usr_stf_03'"]

        announcementObj["ann_01 : Announcement<br/>id = 'ann_901'<br/>title = 'TDP First Tranche Verification'<br/>category = 'URGENT'<br/>isPinned = true"]

        annex9["doc_annex9 : Document<br/>id = 'doc_anx9_201'<br/>title = 'Annex 9 Beneficiary Payroll'<br/>status = 'SUBMITTED'<br/>createdById = 'usr_acc_04'"]
    end

    subgraph TransmittalAudit ["Dispatches & Audit Records"]
        trnObj["transmittal_ched : Transmittal<br/>id = 'trn_2026_044'<br/>recipient = 'CHED Regional Office MIMAROPA'<br/>driveLink = 'https://drive.google.com/...'"]

        auditObj["audit_rec : AuditLog<br/>id = 'aud_99812'<br/>actorId = 'usr_dir_02'<br/>action = 'DOCUMENT_APPROVED'<br/>entity = 'Document'<br/>entityId = 'doc_anx4_101'"]
    end

    %% Structural Links
    staffUser -->|publishes| callObj
    callObj -->|contains| appObj
    studentUser -->|submits| appObj
    staffUser -->|executes| verifyRunObj
    verifyRunObj -->|produces| verifyResultObj
    staffUser -->|posts| announcementObj
    staffUser -->|compiles| annex4
    annex4 -->|aggregates| appObj
    dirUser -->|endorses| annex4
    dirUser -->|triggers| auditObj
    annex4 -->|attaches to| trnObj
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

| Element | Format / Syntax | Technical Meaning | MinSU Implementation Context |
|---|---|---|---|
| Object Box | `[name : Class<br/>fields]` | Runtime instance in RAM/DB | `admin_1 : User`, `doc_annex4 : Document`, `verify_run_01 : VerificationRun` |
| Link Predicate | `-->\|predicate\|` | Concrete runtime association | `staffUser -->|executes| verifyRunObj` |
| State Snapshot | `status = 'APPROVED'` | Value of an instance variable | Mid-cycle point where verification is complete and billing approved |
