# Sequence Diagram: MinSU DocTrack Whole System

## 1. Description
This sequence diagram illustrates the chronological message exchange between actors, user interfaces, backend controllers, validation engines, database adapters, and external storage across a full document lifecycle, including student validation, 3-way verification, executive approval, and multi-tab Excel export.

## 2. ASD-STE100 Technical Specifications
- Order participants from left to right according to execution initiation.
- Draw synchronous calls with solid arrows and returns with dashed arrows.
- Enforce audit event emission for every status modification.
- Handle decision branches with `alt` and `opt` frames.

---

## 3. End-to-End System Sequence Diagram (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    actor Staff as Staff Coordinator
    actor Director as Campus Director
    actor Acct as Accounting Officer
    participant WebUI as Next.js Web App
    participant Engine as WorkflowEngine
    participant Verify as VerificationEngine
    participant DB as Prisma (PostgreSQL)
    participant Storage as File / Blob Store

    %% ─── 📌 VISUAL LEGEND ───
    Note over Student,Storage: ─── 📌 DIAGRAM LEGEND: Solid Line (->>) = Request/Command | Dashed Line (-->>) = Response/Data | Green = Intake/Liquidation | Gold = Review Queue | Neutral = Staff Operations ───

    %% Step 1: Student Registration & Application
    rect rgb(241, 248, 241)
        Student->>WebUI: Submit Application Form & Scanned Proofs
        WebUI->>Storage: Store PDF attachments (<= 5MB)
        Storage-->>WebUI: attachmentUrls
        WebUI->>Engine: createApplication(studentData, attachmentUrls)
        Engine->>DB: INSERT INTO Application (status='SUBMITTED')
        DB-->>Engine: applicationRecord
        Engine-->>WebUI: trackingCode ("TDP-2026-XXXX")
        WebUI-->>Student: Display Confirmation Slip & Code
    end

    %% Step 2: Staff Validation Queue & 3-Way Verification
    rect rgb(255, 255, 255)
        Staff->>WebUI: Open /registrations & Mark Applicants ACCEPTED
        WebUI->>Engine: validateApplicant(id, 'ACCEPTED')
        Engine->>DB: UPDATE Application SET status='ACCEPTED'
        DB-->>Engine: accepted
        Staff->>WebUI: Upload CHED & Registrar CSV Datasets to /verification
        WebUI->>Verify: run3WayCrossMatch(chedCsv, registrarCsv)
        Verify->>DB: Query Accepted System Applicants
        DB-->>Verify: systemRoster
        Verify->>Verify: Compute Jaro-Winkler Fuzzy Match & Classify
        Verify->>DB: INSERT INTO VerificationRun & VerificationResults
        DB-->>Verify: runSuccess
        Verify-->>WebUI: Display Confidence Scores & Discrepancies
    end

    %% Step 3: Staff Compiles Billing Package (Annex 4)
    rect rgb(255, 255, 255)
        Staff->>WebUI: Click "Import Verified Roster" into Annex 4
        WebUI->>Engine: submitDocument(ANNEX_4, verifiedStudentIds)
        Engine->>DB: INSERT INTO Document (status='SUBMITTED')
        Engine->>DB: INSERT INTO AuditLog (DOCUMENT_SUBMITTED)
        DB-->>Engine: docSuccess
        Engine-->>WebUI: notifyDirector(docId)
        WebUI-->>Staff: Display "Submitted to Director" Badge
    end

    %% Step 4: Director Endorsement
    rect rgb(255, 241, 194)
        Director->>WebUI: Open Executive Queue & Review Annex 4
        alt [Director Approves Document? -- Yes]
            Director->>WebUI: Click "1-Click Approve"
            WebUI->>Engine: approveDocument(docId, digitalSignature)
            Engine->>DB: UPDATE Document SET status='APPROVED'
            Engine->>DB: INSERT INTO AuditLog (DOCUMENT_APPROVED)
            DB-->>Engine: updateSuccess
            Engine-->>WebUI: Display "Approved" Badge & Unlock Export
        else [Director Approves Document? -- No]
            Director->>WebUI: Enter Rejection Comment & Click "Return"
            WebUI->>Engine: returnDocument(docId, commentText)
            Engine->>DB: UPDATE Document SET status='RETURNED'
            Engine->>DB: INSERT INTO StatusHistory & AuditLog
            DB-->>Engine: returnSuccess
            Engine-->>WebUI: Send In-App Notification to Staff
        end
    end

    %% Step 5: Native Excel Export & Disbursement Handover
    rect rgb(241, 248, 241)
        Staff->>WebUI: Click "Export 3-Tab Excel (.xlsx)"
        WebUI->>Engine: /api/annex-4/export-excel?documentId=id
        Engine-->>Staff: Stream Formatted Multi-Tab Excel Workbook
        Acct->>WebUI: Prepare General Payroll (Annex 9) & Reconcile
        Acct->>Engine: exportExcelPayroll(docId)
        Engine-->>Acct: Stream Annex 9 Official Excel Workbook
    end
```

---

## 4. PlantUML System Sequence Diagram

```plantuml
@startuml
autonumber
actor Student
actor Staff
actor Director
actor Accounting
participant WebUI
participant WorkflowEngine
participant VerificationEngine
database PostgreSQL

Student -> WebUI: Submit Application
WebUI -> WorkflowEngine: createApplication()
WorkflowEngine -> PostgreSQL: INSERT Application
WorkflowEngine --> Student: Tracking Code

Staff -> WebUI: Validate Registrations (ACCEPT)
Staff -> WebUI: Upload CSVs & Run 3-Way Cross Match
WebUI -> VerificationEngine: run3WayCrossMatch()
VerificationEngine -> PostgreSQL: Query & Store Results
VerificationEngine --> WebUI: Discrepancy Matrix

Staff -> WebUI: Import Verified Roster into Annex 4
WebUI -> WorkflowEngine: submitDocument(ANNEX_4)
WorkflowEngine -> PostgreSQL: INSERT Document & AuditLog

Director -> WebUI: 1-Click Approve Document
WebUI -> WorkflowEngine: approveDocument()
WorkflowEngine -> PostgreSQL: UPDATE Document (APPROVED)

Staff -> WebUI: Request Excel Export
WebUI -> WorkflowEngine: Stream ExcelJS Workbook (.xlsx)
WorkflowEngine --> Staff: Download Annex 4 Workbook

Accounting -> WebUI: Prepare Annex 9 Payroll & Export
WebUI -> WorkflowEngine: Stream Annex 9 Payroll (.xlsx)
WorkflowEngine --> Accounting: Download Payroll Workbook
@enduml
```
